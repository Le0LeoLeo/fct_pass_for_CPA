// Supabase Edge Function: Interview Evaluation
// 使用 DeepSeek API 生成面试评分

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/v1/chat/completions";

interface EvaluationRequest {
  conversation: Array<{ role: string; content: string }>;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get DeepSeek API key from database
    const { data: apiConfig, error: configError } = await supabase
      .from("api_configs")
      .select("key_value")
      .eq("key_name", "deepseek_api_key")
      .single();

    if (configError || !apiConfig) {
      throw new Error("Failed to get DeepSeek API key from database");
    }

    const DEEPSEEK_API_KEY = apiConfig.key_value;

    // Parse request body
    const { conversation } = (await req.json()) as EvaluationRequest;

    if (!conversation || !Array.isArray(conversation) || conversation.length === 0) {
      return new Response(
        JSON.stringify({ error: "conversation is required and must be a non-empty array" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // 构建对话历史文本
    const conversationText = conversation
      .map(msg => `${msg.role === 'user' ? '面试者' : '面试官'}: ${msg.content}`)
      .join('\n\n');

    // 构建评分提示词 - 超严格评分标准
    const evaluationPrompt = `你是一位**极其严格**的大学面试评估专家，以高标准、严要求著称。请根据以下面试对话，对面试者进行**严格评估**。

面试对话记录：
${conversationText}

**严格评分标准**：
1. **表达能力（0-25分）**：
   - 如果回答模糊、不具体、没有实质内容：直接给 0-5 分
   - 如果回答完整、逻辑清晰、表达流畅：15-25 分
   - 如果回答部分切题但不够完整：6-14 分

2. **专业素养（0-25分）**：
   - 如果完全没有展现专业认知或相关知识：直接给 0 分
   - 如果对专业有基本理解：10-15 分
   - 如果展现深入的专业认知：20-25 分

3. **沟通能力（0-25分）**：
   - 如果回答"怎么说？"、"不知道"等无意义回应：直接给 0-5 分
   - 如果能够理解问题并给出回应：10-15 分
   - 如果能够深入交流、主动提问：20-25 分

4. **综合素质（0-25分）**：
   - 如果态度不认真、不尊重面试场合：直接给 0-5 分
   - 如果态度端正但表现一般：10-15 分
   - 如果展现自信、应变能力强：20-25 分

**严格评分原则**：
- **零容忍原则**：如果面试者没有答到点子上、回答无意义、态度不认真，相关维度直接给 0 分
- **不给予同情分**：不要因为"可能紧张"等原因给予额外分数
- **严格标准**：只有真正展现能力才能得分，模糊回答不给分
- **总分计算**：四个维度分数相加，不要额外加分

请以 JSON 格式返回评估结果：
{
  "score": 总分（0-100的整数，严格计算，不要给同情分）,
  "feedback": "总体评价（200-300字，要指出具体不足）",
  "strengths": ["优势1", "优势2"]（如果没有优势，返回空数组）,
  "improvements": ["需要改进的地方1", "需要改进的地方2", "需要改进的地方3"],
  "details": {
    "expression": 表达能力分数（0-25，严格评分）,
    "professional": 专业素养分数（0-25，严格评分）,
    "communication": 沟通能力分数（0-25，严格评分）,
    "comprehensive": 综合素质分数（0-25，严格评分）
  }
}

**重要**：
- 如果面试者回答"怎么说？"、"不知道"等无意义回应，相关维度必须给 0 分
- 如果面试者没有提供实质性内容，专业素养必须给 0 分
- 如果面试者态度不认真，综合素质必须给低分（0-5分）
- 只返回 JSON，不要添加其他文字`;

    // Call DeepSeek API
    const payload = {
      model: "deepseek-chat",
      messages: [{ role: "user", content: evaluationPrompt }],
      temperature: 0.7,
    };

    const response = await fetch(DEEPSEEK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content ?? "";

    // Extract JSON from response
    let evaluation: any;
    try {
      // 尝试提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法找到 JSON 格式的响应');
      }
    } catch (parseError) {
      console.error("Failed to parse evaluation:", parseError);
      console.error("Raw content:", content);
      throw new Error(`无法解析 DeepSeek 响应: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

    // 验证和格式化结果
    const formattedEvaluation = {
      score: Math.round(evaluation.score || 0),
      feedback: evaluation.feedback || '暂无评价',
      strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
      improvements: Array.isArray(evaluation.improvements) ? evaluation.improvements : [],
      details: evaluation.details || {},
    };

    return new Response(
      JSON.stringify({
        ...result,
        evaluation: formattedEvaluation,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Interview Evaluation Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return new Response(
      JSON.stringify({
        error: errorMessage || "Evaluation failed",
        detail: errorStack || error.toString(),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});

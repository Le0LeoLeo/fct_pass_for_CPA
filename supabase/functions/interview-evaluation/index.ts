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
      .map(msg => `${msg.role === 'user' ? '面試者' : '面試官'}: ${msg.content}`)
      .join('\n\n');

    // 构建评分提示词 - 超严格评分标准
    const evaluationPrompt = `你是一位**極其嚴格**的大学面試評估專家，以高標準、嚴要求著稱。請根據以下面試對話，對面試者進行**嚴格評估**。

面試對話記錄：
${conversationText}

**嚴格評分標準**：
1. **表達能力（0-25分）**：
   - 如果回答模糊、不具體、沒有實質內容：直接給 0-5 分
   - 如果回答完整、邏輯清晰、表達流暢：15-25 分
   - 如果回答部分切題但不夠完整：6-14 分

2. **專業素養（0-25分）**：
   - 如果完全沒有展現專業認知或相關知識：直接給 0 分
   - 如果對專業有基本理解：10-15 分
   - 如果展現深入的專業認知：20-25 分

3. **溝通能力（0-25分）**：
   - 如果回答"怎麼說？"、"不知道"等無意義回應：直接給 0-5 分
   - 如果能夠理解問題並給出回應：10-15 分
   - 如果能夠深入交流、主動提問：20-25 分

4. **綜合素質（0-25分）**：
   - 如果態度不認真、不尊重面試場合：直接給 0-5 分
   - 如果態度端正但表現一般：10-15 分
   - 如果展現自信、應變能力強：20-25 分

**嚴格評分原則**：
- **零容忍原則**：如果面試者沒有答到點子上、回答無意義、態度不認真，相關維度直接給 0 分
- **不給予同情分**：不要因為"可能緊張"等原因給予額外分數
- **嚴格標準**：只有真正展現能力才能得分，模糊回答不給分
- **總分計算**：四個維度分數相加，不要額外加分

請以 JSON 格式回傳評估結果：
{
  "score": 總分（0-100的整數，嚴格計算，不要給同情分）,
  "feedback": "總體評價（200-300字，要指出具體不足）",
  "strengths": ["優勢1", "優勢2"]（如果沒有優勢，回傳空陣列）,
  "improvements": ["需要改進的地方1", "需要改進的地方2", "需要改進的地方3"],
  "sample_answer": "示範回答（120-200字，總結一段高分回答）",
  "details": {
    "expression": 表達能力分數（0-25，嚴格評分）,
    "professional": 專業素養分數（0-25，嚴格評分）,
    "communication": 溝通能力分數（0-25，嚴格評分）,
    "comprehensive": 綜合素質分數（0-25，嚴格評分）
  }
}

**重要**：
- 如果面試者回答"怎麼說？"、"不知道"等無意義回應，相關維度必須給 0 分
- 如果面試者沒有提供實質性內容，專業素養必須給 0 分
- 如果面試者態度不認真，綜合素質必須給低分（0-5分）
- 只回傳 JSON，不要添加其他文字
- 請用繁體中文輸出所有文字內容
- sample_answer 請以繁體中文撰寫`;

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
      sample_answer: evaluation.sample_answer || '',
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

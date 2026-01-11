// Supabase Edge Function: Baidu API Proxy
// 代理百度 API 调用以解决 CORS 问题

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface BaiduApiRequest {
  action: 'get_token' | 'speech_to_text' | 'text_to_speech' | 'ernie_chat';
  apiKey?: string;
  secretKey?: string;
  accessToken?: string;
  // For speech_to_text
  audioData?: string; // base64 encoded audio
  // For text_to_speech
  text?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  person?: number;
  // For ernie_chat
  userInput?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  model?: string;
}

// CORS headers helper
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
    // Verify request is from Supabase client by checking apikey header
    // This allows anonymous access without requiring JWT validation
    const apikey = req.headers.get("apikey");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    // Verify apikey matches (optional but recommended for security)
    // For now, we'll allow any request with apikey header to proceed
    // In production, you might want to verify it matches SUPABASE_ANON_KEY
    if (!apikey) {
      return new Response(
        JSON.stringify({ error: "Missing apikey header" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
    
    // Get Supabase client with service role key for database access
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let requestBody: BaiduApiRequest;
    try {
      const bodyText = await req.text();
      if (!bodyText) {
        throw new Error("Request body is empty");
      }
      requestBody = JSON.parse(bodyText) as BaiduApiRequest;
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body", detail: String(e) }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
    const { action } = requestBody;

    if (!action) {
      return new Response(
        JSON.stringify({ error: "action is required" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Get API keys from database if not provided
    let apiKey = requestBody.apiKey;
    let secretKey = requestBody.secretKey;

    if (!apiKey || !secretKey) {
      const [apiKeyConfig, secretKeyConfig] = await Promise.all([
        supabase.from("api_configs").select("key_value").eq("key_name", "baidu_api_key").single(),
        supabase.from("api_configs").select("key_value").eq("key_name", "baidu_secret_key").single(),
      ]);

      if (apiKeyConfig.error || !apiKeyConfig.data) {
        throw new Error("Failed to get baidu_api_key from database");
      }
      if (secretKeyConfig.error || !secretKeyConfig.data) {
        throw new Error("Failed to get baidu_secret_key from database");
      }

      apiKey = apiKeyConfig.data.key_value;
      secretKey = secretKeyConfig.data.key_value;
    }

    // Handle different actions
    switch (action) {
      case 'get_token': {
        const response = await fetch(
          `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(apiKey!)}&client_secret=${encodeURIComponent(secretKey!)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to get access token: ${response.statusText}`);
        }

        const data = await response.json();
        return new Response(
          JSON.stringify({ access_token: data.access_token }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      case 'speech_to_text': {
        const { accessToken, audioData } = requestBody;
        if (!accessToken || !audioData) {
          return new Response(
            JSON.stringify({ error: "accessToken and audioData are required" }),
            {
              status: 400,
              headers: { 
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }

        // Convert base64 to bytes
        // Remove data URL prefix if present
        const base64Data = audioData.includes(',') ? audioData.split(',')[1] : audioData;
        const binaryString = atob(base64Data);
        const audioBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          audioBytes[i] = binaryString.charCodeAt(i);
        }
        
        const params = new URLSearchParams({
          dev_pid: '1537', // 1537=普通话(纯中文识别)
          cuid: 'web_interview_client',
        });

        const response = await fetch(
          `https://vop.baidu.com/server_api?${params.toString()}&token=${accessToken}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'audio/pcm;rate=16000',
            },
            body: audioBytes,
          }
        );

        if (!response.ok) {
          throw new Error(`Speech recognition failed: ${response.statusText}`);
        }

        const result = await response.json();
        return new Response(
          JSON.stringify({ 
            text: result.err_no === 0 && result.result && result.result.length > 0 
              ? result.result[0] 
              : '' 
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      case 'text_to_speech': {
        const { accessToken, text, speed = 5, pitch = 5, volume = 5, person = 4 } = requestBody;
        if (!accessToken || !text) {
          return new Response(
            JSON.stringify({ error: "accessToken and text are required" }),
            {
              status: 400,
              headers: { 
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }

        // 使用 POST 方法避免 URL 过长（414 错误）
        // 百度 TTS API 支持 POST，参数放在 body 中
        const params = new URLSearchParams({
          tex: text,
          tok: accessToken,
          cuid: 'web_interview_client',
          ctp: '1',
          lan: 'zh',
          per: person.toString(),
          spd: speed.toString(),
          pit: pitch.toString(),
          vol: volume.toString(),
          aue: '3', // mp3格式
        });

        // 使用 POST 方法，参数放在 body 中，避免 URL 过长
        const response = await fetch('https://tsn.baidu.com/text2audio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`TTS failed: ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(`TTS API error: ${JSON.stringify(errorData)}`);
        }

        const audioBlob = await response.blob();
        const audioArrayBuffer = await audioBlob.arrayBuffer();
        const audioUint8Array = new Uint8Array(audioArrayBuffer);
        // Convert to base64
        let binaryString = '';
        for (let i = 0; i < audioUint8Array.length; i++) {
          binaryString += String.fromCharCode(audioUint8Array[i]);
        }
        const audioBase64 = btoa(binaryString);

        return new Response(
          JSON.stringify({ audioData: audioBase64 }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      case 'ernie_chat': {
        const { accessToken, userInput, conversationHistory = [], model = 'ernie-4.5-turbo-128k' } = requestBody;
        if (!accessToken || !userInput) {
          return new Response(
            JSON.stringify({ error: "accessToken and userInput are required" }),
            {
              status: 400,
              headers: { 
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }

        const systemPrompt = `你是一位专业的AI面试官，负责技术岗位（如前端开发、后端开发、全栈开发等）面试。要求：
1. 提问简洁明了，每次只问一个问题
2. 根据候选人的回答进行深入追问，展现专业水平
3. 语气自然友好
4. 回复控制在30-60字之间，口语化表达，避免书面语
5. 如果候选人回答不完整，可以适当引导`;

        // 构建消息列表
        // 根据参考项目，百度Ernie API支持system role
        const messages = [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...conversationHistory.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
          })),
          {
            role: 'user',
            content: userInput,
          },
        ];

        // 根据参考项目，使用旧版API端点（支持system role）
        // 对于文心4.5T，可以尝试使用 ernie-4.5-8k 或 ernie-4.5-128k
        // 如果模型名称包含4.5，尝试使用4.5的端点
        let modelEndpoint = model;
        if (model.includes('4.5') && !model.includes('ernie-4.5')) {
          // 如果传入的是 ernie-4.5-turbo-128k，转换为 ernie-4.5-128k
          if (model.includes('128k')) {
            modelEndpoint = 'ernie-4.5-128k';
          } else if (model.includes('turbo')) {
            modelEndpoint = 'ernie-4.5-8k';
          }
        }
        
        const apiUrl = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${modelEndpoint}?access_token=${accessToken}`;
        const requestBody = {
          messages: messages,
          temperature: 0.7,
          max_output_tokens: 150,
          stream: false,
        };

        console.log('Ernie API request:', JSON.stringify({
          url: apiUrl,
          model,
          modelEndpoint,
          messagesCount: messages.length,
          accessTokenLength: accessToken.length,
          firstMessage: messages[0]?.content?.substring(0, 50) + '...',
        }, null, 2));

        const response = await fetch(
          apiUrl,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Ernie API error:', response.status, errorText);
          throw new Error(`Ernie API failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Ernie API response:', JSON.stringify(data, null, 2));
        
        // Check for error in response
        if (data.error_code || data.error) {
          const errorMsg = data.error_msg || data.error?.error_msg || data.error?.error_description || JSON.stringify(data.error || data);
          console.error('Ernie API error in response:', {
            error_code: data.error_code,
            error_msg: data.error_msg,
            error: data.error,
            full_response: data
          });
          throw new Error(`Ernie API error: ${errorMsg}`);
        }
        
        // 根据参考项目，响应格式是 data.result
        const result = data.result ? data.result.trim() : null;
        
        if (!result) {
          console.error('Ernie API returned no result:', {
            full_response: data,
            has_result: !!data.result,
            keys: Object.keys(data),
            error_code: data.error_code,
            error_msg: data.error_msg
          });
          throw new Error('Ernie API returned empty result');
        }
        
        console.log('Ernie API result:', result);
        
        return new Response(
          JSON.stringify({ 
            result: result
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          {
            status: 400,
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
    }
  } catch (error) {
    console.error("Baidu API Proxy Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return new Response(
      JSON.stringify({
        error: errorMessage || "Baidu API proxy failed",
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

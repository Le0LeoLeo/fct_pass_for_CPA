// Supabase Edge Function: OCR Service
// 使用百度千帆的 deepseek-ocr 模型进行 OCR 识别

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const QIANFAN_BASE_URL = "https://qianfan.baidubce.com/v2";
const QIANFAN_CHAT_URL = `${QIANFAN_BASE_URL}/chat/completions`;
const MODEL_NAME = "deepseek-ocr";

interface OCRRequest {
  file: string; // base64 encoded image
  filename?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
      },
    });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Qianfan API token from database
    console.log("Fetching API token from database...");
    const { data: apiConfig, error: configError } = await supabase
      .from("api_configs")
      .select("key_value")
      .eq("key_name", "baidu_api_token")
      .single();

    if (configError) {
      console.error("Database query error:", configError);
      throw new Error(`Failed to get API token from database: ${configError.message}`);
    }

    if (!apiConfig || !apiConfig.key_value) {
      console.error("API token not found in database");
      throw new Error("API token not found in database. Please add 'baidu_api_token' to api_configs table.");
    }

    const QIANFAN_API_KEY = apiConfig.key_value;
    console.log("API token retrieved successfully");

    // Parse request body
    console.log("Parsing request body...");
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body", detail: String(e) }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const { file, filename } = requestBody as OCRRequest;

    if (!file) {
      console.error("File parameter missing");
      return new Response(
        JSON.stringify({ error: "File is required" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    console.log("File received, filename:", filename);

    // Prepare OCR request
    const payload = {
      model: MODEL_NAME,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "請對圖片進行OCR，輸出識別到的文字。如果是成績單，請提取科目名稱和分數。",
            },
            {
              type: "image_url",
              image_url: { url: file },
            },
          ],
        },
      ],
      stop: [],
    };

    // Call Qianfan API with timeout
    console.log("Calling Qianfan API...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds timeout
    
    let response;
    try {
      response = await fetch(QIANFAN_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${QIANFAN_API_KEY}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error("OCR request timeout (120s exceeded)");
      }
      throw error;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Qianfan API error:", response.status, errorText);
      throw new Error(`Qianfan API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("Qianfan API call successful");

    return new Response(
      JSON.stringify({
        filename: filename || "upload",
        type: "image",
        ocr: result,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
        },
      }
    );
  } catch (error) {
    console.error("OCR Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return new Response(
      JSON.stringify({
        error: errorMessage || "OCR failed",
        detail: errorStack || error.toString(),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
        },
      }
    );
  }
});

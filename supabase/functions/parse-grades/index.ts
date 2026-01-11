// Supabase Edge Function: Parse Grades
// 使用 DeepSeek API 解析 OCR 文本，提取成绩事件

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/v1/chat/completions";

interface ParseRequest {
  ocr_text: string;
  track?: 'liberal' | 'science'; // 文理科：'liberal' = 文科, 'science' = 理科
}

function preprocessOCRText(text: string): string {
  const KEYWORDS = [
    "大測",
    "測驗",
    "考試",
    "報告",
    "作業",
    "選考",
    "實驗",
    "實驗考",
    "期中",
    "期末",
  ];

  const lines = String(text)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const filtered = lines.filter((line) => {
    const hasDate = /\b\d{1,2}\/\d{1,2}\b/.test(line);
    const hasKeyword = KEYWORDS.some((k) => line.includes(k));
    const hasWeek = line.includes("第") && line.includes("週");
    return (hasDate && hasKeyword) || hasWeek;
  });

  const compactText = (filtered.length > 0 ? filtered : lines)
    .join("\n")
    .replace(/\s+/g, " ")
    .trim();

  const MAX_PARSE_CHARS = 6000;
  return compactText.length > MAX_PARSE_CHARS
    ? compactText.slice(0, MAX_PARSE_CHARS) + "\n\n(內容過長已截斷)"
    : compactText;
}

function buildDeepSeekParsePrompt(scheduleText: string, track?: 'liberal' | 'science'): string {
  const excludeRules: string[] = [];
  
  // 总是忽略报告和考试
  excludeRules.push('- EXCLUDE 報告 (reports)');
  excludeRules.push('- EXCLUDE 考試 (exams)');
  
  // 根据文理科过滤选修科目
  if (track === 'liberal') {
    // 文科：忽略化選、物選、生選
    excludeRules.push('- EXCLUDE 化選 (Chemistry Elective)');
    excludeRules.push('- EXCLUDE 物選 (Physics Elective)');
    excludeRules.push('- EXCLUDE 生選 (Biology Elective)');
  } else if (track === 'science') {
    // 理科：忽略歷選、地選
    excludeRules.push('- EXCLUDE 歷選 (History Elective)');
    excludeRules.push('- EXCLUDE 地選 (Geography Elective)');
  }
  
  return `You are an assistant that extracts exam/assignment events from a school schedule.
Return ONLY valid JSON. Do not wrap in markdown. Do not add any commentary.

Schema:
{
  "events": [
    {
      "id": "string",
      "date": "YYYY-MM-DD or empty string",
      "date_range": "YYYY-MM-DD..YYYY-MM-DD or empty string",
      "week": "string",
      "subject": "string",
      "type": "string",
      "title": "string",
      "notes": "string"
    }
  ]
}

Rules:
- Only include items that should have a score: 大測/測驗/作業/實驗考/選考.
${excludeRules.join('\n')}
- If one cell contains multiple items split into multiple events.
- If year is missing, leave date empty string.
- Subject names should be extracted exactly as they appear (e.g., "數學大測3", "文法大測1", "中文大測2").

Schedule text:
${scheduleText}`;
}

function extractJsonFromText(text: string): string {
  const t = String(text || "").trim();
  const m = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (m && m[1]) return m[1].trim();
  if (t.startsWith("{") || t.startsWith("[")) return t;

  const idxObj = t.indexOf("{");
  const idxArr = t.indexOf("[");
  const start =
    idxArr !== -1 && (idxObj === -1 || idxArr < idxObj) ? idxArr : idxObj;
  if (start === -1)
    throw new Error("DeepSeek 回傳不是 JSON，請檢查回傳：\n" + t);

  const sub = t.slice(start);
  const endObj = sub.lastIndexOf("}");
  const endArr = sub.lastIndexOf("]");
  const end = Math.max(endObj, endArr);
  if (end === -1) throw new Error("無法擷取完整 JSON：\n" + t);
  return sub.slice(0, end + 1);
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
    const { ocr_text, track } = (await req.json()) as ParseRequest;

    if (!ocr_text) {
      return new Response(
        JSON.stringify({ error: "ocr_text is required" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Preprocess OCR text
    const processedText = preprocessOCRText(ocr_text);
    const userPrompt = buildDeepSeekParsePrompt(processedText, track);

    // Call DeepSeek API
    const payload = {
      model: "deepseek-chat",
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.2,
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
    let events = [];
    try {
      const jsonText = extractJsonFromText(content);
      const parsed = JSON.parse(jsonText);
      events = Array.isArray(parsed.events) ? parsed.events : [];
    } catch (e) {
      console.error("Failed to parse events:", e);
    }

    return new Response(
      JSON.stringify({
        ...result,
        events,
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
    console.error("Parse Grades Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Always return CORS headers even on error
    return new Response(
      JSON.stringify({
        error: errorMessage || "Parse failed",
        detail: errorStack || error.toString(),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
        },
      }
    );
  }
});

# 通过 Supabase Dashboard 部署 Edge Functions

如果 Supabase CLI 安装遇到问题，可以直接通过 Supabase Dashboard 部署 Edge Functions。

## 🚀 部署步骤

### 步骤 1: 添加 DeepSeek API Key 到数据库

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 运行以下 SQL：

```sql
-- 添加 DeepSeek API Key
INSERT INTO api_configs (key_name, key_value, description) VALUES
  ('deepseek_api_key', 'sk-683afa31c6c04431b4377d73c2ee6436', 'DeepSeek API Key for parsing grade events')
ON CONFLICT (key_name) DO UPDATE SET
  key_value = EXCLUDED.key_value,
  updated_at = NOW();

-- 验证
SELECT key_name, description FROM api_configs 
WHERE key_name IN ('baidu_api_token', 'deepseek_api_key');
```

### 步骤 2: 创建 OCR Edge Function

1. 在 Supabase Dashboard 中，进入 **Edge Functions**
2. 点击 **Create a new function**
3. 函数名称：`ocr`
4. 复制并粘贴以下代码：

```typescript
// Supabase Edge Function: OCR Service
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const QIANFAN_BASE_URL = "https://qianfan.baidubce.com/v2";
const QIANFAN_CHAT_URL = `${QIANFAN_BASE_URL}/chat/completions`;
const MODEL_NAME = "deepseek-ocr";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: apiConfig, error: configError } = await supabase
      .from("api_configs")
      .select("key_value")
      .eq("key_name", "baidu_api_token")
      .single();

    if (configError || !apiConfig) {
      throw new Error("Failed to get API token from database");
    }

    const QIANFAN_API_KEY = apiConfig.key_value;
    const { file, filename } = (await req.json()) as { file: string; filename?: string };

    if (!file) {
      return new Response(JSON.stringify({ error: "File is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

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

    const response = await fetch(QIANFAN_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${QIANFAN_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Qianfan API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

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
        },
      }
    );
  } catch (error) {
    console.error("OCR Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "OCR failed",
        detail: error.toString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
```

5. 点击 **Deploy**

### 步骤 3: 创建 Parse Grades Edge Function

1. 再次点击 **Create a new function**
2. 函数名称：`parse-grades`
3. 复制并粘贴以下代码：

```typescript
// Supabase Edge Function: Parse Grades
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/v1/chat/completions";

function preprocessOCRText(text: string): string {
  const KEYWORDS = [
    "大測", "測驗", "考試", "報告", "作業", "選考", "實驗", "實驗考", "期中", "期末",
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

function buildDeepSeekParsePrompt(scheduleText: string): string {
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
- Only include items that should have a score: 大測/測驗/考試/報告/作業/實驗考/選考.
- If one cell contains multiple items split into multiple events.
- If year is missing, leave date empty string.

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
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: apiConfig, error: configError } = await supabase
      .from("api_configs")
      .select("key_value")
      .eq("key_name", "deepseek_api_key")
      .single();

    if (configError || !apiConfig) {
      throw new Error("Failed to get DeepSeek API key from database");
    }

    const DEEPSEEK_API_KEY = apiConfig.key_value;
    const { ocr_text } = (await req.json()) as { ocr_text: string };

    if (!ocr_text) {
      return new Response(JSON.stringify({ error: "ocr_text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const processedText = preprocessOCRText(ocr_text);
    const userPrompt = buildDeepSeekParsePrompt(processedText);

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
        },
      }
    );
  } catch (error) {
    console.error("Parse Grades Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Parse failed",
        detail: error.toString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
```

4. 点击 **Deploy**

### 步骤 4: 验证部署

1. 在 Edge Functions 列表中，你应该看到两个函数：
   - `ocr`
   - `parse-grades`

2. 点击函数名称可以查看详情和日志

3. 测试函数（可选）：
   - 在函数详情页面点击 **Invoke** 按钮
   - 输入测试数据

## ✅ 完成！

部署完成后，前端代码会自动使用这些 Edge Functions。无需修改前端代码！

## 🐛 故障排除

### 问题：函数调用失败

1. 检查函数日志：
   - 在函数详情页面查看 **Logs** 标签
   - 查看错误信息

2. 检查 API Keys：
   ```sql
   SELECT key_name FROM api_configs 
   WHERE key_name IN ('baidu_api_token', 'deepseek_api_key');
   ```

3. 检查 CORS：
   - 确保函数返回了正确的 CORS headers
   - 检查浏览器控制台的错误信息

### 问题：API Key 未找到

确保在 `api_configs` 表中存在以下记录：
- `baidu_api_token`
- `deepseek_api_key`

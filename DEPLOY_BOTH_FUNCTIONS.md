# 部署两个 Edge Functions

需要部署两个 Edge Functions：`ocr` 和 `parse-grades`

## 🚀 立即部署

### 方法 1: 使用 CLI（推荐）

```powershell
cd "D:\fucking_AI_proj\AI 大學升學輔助應用"

# 部署 ocr function（带改进的错误日志）
supabase functions deploy ocr --no-verify-jwt

# 部署 parse-grades function
supabase functions deploy parse-grades --no-verify-jwt
```

### 方法 2: 通过 Dashboard

#### 部署 ocr 函数：

1. 访问：https://supabase.com/dashboard/project/aialjdzjuozrnqwlblyz/functions
2. 如果 `ocr` 已存在，点击它，然后点击 "Edit"
3. 如果不存在，点击 "Create a new function"，名称：`ocr`
4. 复制 `supabase/functions/ocr/index.ts` 的全部代码
5. 粘贴到编辑器
6. **取消勾选** "Verify JWT"
7. 点击 "Deploy"

#### 部署 parse-grades 函数：

1. 在同一个页面，点击 "Create a new function"
2. 函数名称：`parse-grades`
3. 复制 `supabase/functions/parse-grades/index.ts` 的全部代码
4. 粘贴到编辑器
5. **取消勾选** "Verify JWT"
6. 点击 "Deploy"

## ✅ 验证部署

部署完成后，在 Dashboard 中应该看到两个函数：
- ✅ `ocr` - OCR 识别服务
- ✅ `parse-grades` - 成绩解析服务

## 🔍 检查 CORS 配置

两个函数都应该在 OPTIONS 处理中包含：

```typescript
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
```

## 📝 确保 API Keys 已添加

从你的截图看，你已经添加了 `baidu_api_token` ✅

确保也有 `deepseek_api_key`：

```sql
SELECT key_name FROM api_configs 
WHERE key_name IN ('baidu_api_token', 'deepseek_api_key');
```

如果没有 `deepseek_api_key`，添加它：

```sql
INSERT INTO api_configs (key_name, key_value, description) VALUES
  ('deepseek_api_key', 'sk-683afa31c6c04431b4377d73c2ee6436', 'DeepSeek API Key for parsing grade events')
ON CONFLICT (key_name) DO UPDATE SET
  key_value = EXCLUDED.key_value,
  updated_at = NOW();
```

## 🐛 故障排除

### CORS 错误仍然存在

1. 确保函数已使用 `--no-verify-jwt` 部署
2. 检查 OPTIONS 处理是否正确返回 204 状态码
3. 清除浏览器缓存并刷新

### 500 错误

查看日志：
```powershell
supabase functions logs ocr --tail
supabase functions logs parse-grades --tail
```

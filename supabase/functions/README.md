# Supabase Edge Functions

本目录包含用于成绩识别和解析的 Supabase Edge Functions。

## 📁 Functions

### 1. `ocr` - OCR 识别服务
- **路径**: `supabase/functions/ocr/index.ts`
- **功能**: 使用百度千帆的 deepseek-ocr 模型进行 OCR 识别
- **输入**: 
  ```json
  {
    "file": "data:image/png;base64,...",
    "filename": "成绩单.png"
  }
  ```
- **输出**: OCR 识别结果

### 2. `parse-grades` - 成绩解析服务
- **路径**: `supabase/functions/parse-grades/index.ts`
- **功能**: 使用 DeepSeek API 解析 OCR 文本，提取成绩事件
- **输入**:
  ```json
  {
    "ocr_text": "OCR识别的文本内容..."
  }
  ```
- **输出**: 解析后的成绩事件列表

### 3. `baidu-api` - 百度 API 代理服务
- **路径**: `supabase/functions/baidu-api/index.ts`
- **功能**: 代理百度 API 调用以解决 CORS 问题，支持：
  - 获取访问令牌 (`get_token`)
  - 语音识别 (`speech_to_text`)
  - 文本转语音 (`text_to_speech`)
  - Ernie 聊天 API (`ernie_chat`)
- **输入**: 
  ```json
  {
    "action": "get_token" | "speech_to_text" | "text_to_speech" | "ernie_chat",
    "apiKey": "可选，如果未提供则从数据库读取",
    "secretKey": "可选，如果未提供则从数据库读取",
    "accessToken": "访问令牌（某些操作需要）",
    "audioData": "base64编码的音频数据（speech_to_text需要）",
    "text": "要转换的文本（text_to_speech需要）",
    "userInput": "用户输入（ernie_chat需要）",
    "conversationHistory": "对话历史（ernie_chat需要）"
  }
  ```
- **输出**: 根据不同的 action 返回相应的结果

## 🚀 部署步骤

### 1. 安装 Supabase CLI

```bash
# Windows (使用 Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# macOS
brew install supabase/tap/supabase

# Linux
npm install -g supabase
```

### 2. 登录 Supabase

```bash
supabase login
```

### 3. 链接项目

```bash
supabase link --project-ref your-project-ref
```

或者如果还没有初始化：

```bash
supabase init
```

### 4. 部署 Functions

```bash
# 部署所有 functions
supabase functions deploy

# 或者单独部署
supabase functions deploy ocr
supabase functions deploy parse-grades
supabase functions deploy baidu-api --no-verify-jwt
```

### 5. 设置环境变量和 Secrets

Edge Functions 会自动使用 Supabase 的环境变量。确保：

1. **API Keys 已存储在数据库**：
   - 运行 `supabase/insert_api_keys.sql` 添加百度 API Token
   - 运行 `supabase/insert_deepseek_key.sql` 添加 DeepSeek API Key

2. **Functions 会自动从 `api_configs` 表读取密钥**：
   - `baidu_api_token` - 用于 OCR
   - `deepseek_api_key` - 用于解析
   - `baidu_api_key` - 用于百度 API（面试功能）
   - `baidu_secret_key` - 用于百度 API（面试功能）

### 6. 设置 Secrets（可选，更安全）

如果不想将 API keys 存储在数据库中，可以使用 Supabase Secrets：

```bash
# 设置百度 API Token
supabase secrets set QIANFAN_API_KEY=your-baidu-api-token

# 设置 DeepSeek API Key
supabase secrets set DEEPSEEK_API_KEY=your-deepseek-api-key
```

然后修改 Edge Functions 代码以使用环境变量而不是数据库查询。

## 📝 本地开发

### 启动本地 Supabase

```bash
supabase start
```

### 本地测试 Functions

```bash
# 测试 OCR function
curl -X POST http://localhost:54321/functions/v1/ocr \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"file": "data:image/png;base64,..."}'

# 测试 parse-grades function
curl -X POST http://localhost:54321/functions/v1/parse-grades \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"ocr_text": "测试文本..."}'

# 测试 baidu-api function (获取 token)
curl -X POST http://localhost:54321/functions/v1/baidu-api \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_token"}'
```

## 🔒 安全注意事项

1. **API Keys 存储**：
   - ✅ 推荐：存储在 Supabase Secrets 中
   - ✅ 备选：存储在 `api_configs` 表中（已启用 RLS）

2. **CORS 配置**：
   - Functions 已配置 CORS，允许跨域请求
   - 生产环境建议限制允许的域名

3. **认证**：
   - 当前 Functions 使用 Supabase Anon Key
   - 可以添加用户认证检查

## 🐛 故障排除

### 问题：Function 部署失败

1. 检查 Supabase CLI 版本：
   ```bash
   supabase --version
   ```

2. 检查项目链接：
   ```bash
   supabase projects list
   ```

### 问题：API Key 未找到

1. 检查数据库中的配置：
   ```sql
   SELECT * FROM api_configs WHERE key_name IN ('baidu_api_token', 'deepseek_api_key', 'baidu_api_key', 'baidu_secret_key');
   ```

2. 检查 RLS 策略是否允许读取

### 问题：CORS 错误

确保前端请求包含正确的 Authorization header：
```typescript
const supabase = getSupabaseClient();
const { data } = await supabase.functions.invoke('ocr', {
  body: { file: dataUrl }
});
```

## 📚 相关文档

- [Supabase Edge Functions 文档](https://supabase.com/docs/guides/functions)
- [Supabase CLI 文档](https://supabase.com/docs/reference/cli/introduction)

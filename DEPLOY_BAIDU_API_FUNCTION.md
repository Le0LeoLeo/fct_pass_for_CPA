# 部署百度 API Edge Function 指南

## 问题说明

当前遇到 CORS 错误，因为 `baidu-api` Edge Function 还没有部署到 Supabase。需要先部署这个 Edge Function 才能解决 CORS 问题。

## 部署步骤

### 1. 确保已安装 Supabase CLI

```bash
# 检查是否已安装
supabase --version

# 如果未安装，Windows 使用：
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# macOS 使用：
brew install supabase/tap/supabase

# Linux 使用：
npm install -g supabase
```

### 2. 登录 Supabase

```bash
supabase login
```

### 3. 链接到你的项目

```bash
# 使用你的项目引用 ID（从 Supabase 仪表板获取）
supabase link --project-ref aialjdzjuozrnqwlblyz
```

### 4. 部署 baidu-api Edge Function

```bash
# 进入项目根目录
cd "d:\fucking_AI_proj\AI 大學升學輔助應用"

# 部署 baidu-api function（添加 --no-verify-jwt 允许匿名访问）
supabase functions deploy baidu-api --no-verify-jwt

# 如果遇到认证问题，确保使用正确的项目引用 ID
# 检查项目引用 ID：supabase projects list
```

**重要**：
- 如果修改了 Edge Function 代码，必须重新部署才能生效！
- `--no-verify-jwt` 参数允许匿名访问，不需要 JWT 验证

### 5. 验证部署

部署成功后，你应该看到类似以下的输出：
```
Deploying baidu-api...
Function baidu-api deployed successfully!
```

### 6. 确保数据库中有 API 配置

在 Supabase Dashboard 的 SQL Editor 中运行：

```sql
-- 检查是否已有配置
SELECT * FROM api_configs WHERE key_name IN ('baidu_api_key', 'baidu_secret_key');

-- 如果没有，添加配置（替换为你的实际密钥）
INSERT INTO api_configs (key_name, key_value, description)
VALUES 
  ('baidu_api_key', '你的百度API Key', '百度API密钥'),
  ('baidu_secret_key', '你的百度Secret Key', '百度API密钥')
ON CONFLICT (key_name) DO UPDATE SET key_value = EXCLUDED.key_value;
```

## 测试部署

部署完成后，可以在浏览器控制台测试：

```javascript
// 测试 Edge Function 是否可用
const supabase = getSupabaseClient();
const { data, error } = await supabase.functions.invoke('baidu-api', {
  body: {
    action: 'get_token'
  }
});

console.log('Result:', data, error);
```

## 故障排除

### 问题：部署失败 - "Function not found"

**解决方案**：确保你在正确的目录中，并且 `supabase/functions/baidu-api/index.ts` 文件存在。

### 问题：部署失败 - "Authentication error"

**解决方案**：
1. 重新登录：`supabase login`
2. 重新链接项目：`supabase link --project-ref aialjdzjuozrnqwlblyz`

### 问题：CORS 错误仍然存在

**解决方案**：
1. 确认 Edge Function 已成功部署
2. 检查 Supabase Dashboard > Edge Functions > baidu-api 是否显示为 "Active"
3. 清除浏览器缓存并刷新页面
4. 检查浏览器控制台的网络请求，确认请求是否发送到正确的 URL

### 问题：401 Unauthorized / Invalid JWT 错误

**解决方案**：
1. **重新部署 Edge Function 并添加 `--no-verify-jwt` 参数**（重要！）：
   ```bash
   supabase functions deploy baidu-api --no-verify-jwt
   ```
   
   `--no-verify-jwt` 参数允许匿名访问，跳过 JWT 验证，这是解决 401 错误的关键！

2. 确保前端代码已更新，只发送 `apikey` header，不发送无效的 `Authorization` header

3. 检查 Edge Function 日志：
   - 在 Supabase Dashboard > Edge Functions > baidu-api > Logs 中查看错误详情

4. 验证请求头：
   - 打开浏览器开发者工具 > Network
   - 查看请求头，确保有 `apikey` header
   - 如果没有有效的 session，不应该有 `Authorization` header

5. **如果仍然遇到 401 错误**：
   - 确认 Edge Function 已使用 `--no-verify-jwt` 参数部署
   - 检查 Supabase Dashboard > Edge Functions > baidu-api 的设置
   - 可能需要手动在 Dashboard 中禁用 JWT 验证

### 问题：API Key 未找到

**解决方案**：
1. 在 Supabase Dashboard > Table Editor > api_configs 中检查是否有 `baidu_api_key` 和 `baidu_secret_key` 记录
2. 如果没有，使用上面的 SQL 语句添加
3. 确保 RLS (Row Level Security) 策略允许读取这些配置

## 验证清单

- [ ] Supabase CLI 已安装并登录
- [ ] 项目已链接到 Supabase
- [ ] `baidu-api` Edge Function 已成功部署
- [ ] 数据库中已有 `baidu_api_key` 和 `baidu_secret_key` 配置
- [ ] 浏览器控制台不再显示 CORS 错误
- [ ] 面试功能可以正常获取访问令牌

## 相关文件

- Edge Function 代码：`supabase/functions/baidu-api/index.ts`
- 前端 API 服务：`src/services/api.ts`
- Edge Functions README：`supabase/functions/README.md`

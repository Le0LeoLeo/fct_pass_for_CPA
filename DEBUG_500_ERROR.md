# 调试 500 错误

Edge Function 返回 500 错误，需要查看日志找出问题。

## 🔍 查看 Edge Function 日志

### 方法 1: 使用 CLI

```powershell
# 查看 ocr function 的日志
supabase functions logs ocr

# 查看最近的错误
supabase functions logs ocr --tail
```

### 方法 2: 通过 Dashboard

1. 访问：https://supabase.com/dashboard/project/aialjdzjuozrnqwlblyz/functions
2. 点击 `ocr` 函数
3. 点击 **"Logs"** 标签
4. 查看最新的错误信息

## 🔧 常见问题

### 问题 1: API Key 未找到

**错误信息**：`Failed to get API token from database`

**解决方案**：
确保 `baidu_api_token` 已添加到 `api_configs` 表：

```sql
SELECT key_name, description FROM api_configs 
WHERE key_name = 'baidu_api_token';
```

如果没有，运行：
```sql
INSERT INTO api_configs (key_name, key_value, description) VALUES
  ('baidu_api_token', 'bce-v3/ALTAK-ujQFLeNrekvVqtoSjmoTC/339cc1ef4a0ee8ad295c3b2e31d66712aee57980', '百度 API Token')
ON CONFLICT (key_name) DO UPDATE SET
  key_value = EXCLUDED.key_value,
  updated_at = NOW();
```

### 问题 2: RLS 策略阻止访问

**错误信息**：`permission denied` 或 `row-level security`

**解决方案**：
确保 `api_configs` 表的 RLS 策略允许读取：

```sql
-- 检查 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'api_configs';

-- 如果不存在，创建策略
CREATE POLICY "Allow anon users to read api_configs"
ON api_configs
FOR SELECT
TO anon
USING (true);
```

### 问题 3: 请求体格式错误

**错误信息**：`File is required` 或 JSON 解析错误

**解决方案**：
检查前端是否正确发送请求。确保：
- `file` 字段是 base64 编码的 data URL
- Content-Type 是 `application/json`

### 问题 4: 百度 API 调用失败

**错误信息**：`Qianfan API error`

**解决方案**：
- 检查 API token 是否有效
- 检查 API token 是否过期
- 查看百度 API 的错误响应

## 🚀 快速修复步骤

1. **查看日志**：
   ```powershell
   supabase functions logs ocr --tail
   ```

2. **检查 API Key**：
   ```sql
   SELECT key_name FROM api_configs WHERE key_name = 'baidu_api_token';
   ```

3. **检查 RLS**：
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'api_configs';
   ```

4. **重新部署**（如果需要）：
   ```powershell
   supabase functions deploy ocr --no-verify-jwt
   ```

## 📝 测试 Edge Function

在 Dashboard 中测试：
1. 点击 `ocr` 函数
2. 点击 **"Invoke"** 按钮
3. 输入测试数据：
   ```json
   {
     "file": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
     "filename": "test.png"
   }
   ```
4. 查看响应和错误信息

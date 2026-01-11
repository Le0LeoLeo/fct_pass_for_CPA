# 修复 401 Unauthorized 错误

## ⚠️ 问题

Edge Function 返回 401 Unauthorized，表示需要认证。

## 🔧 解决方案

### 方案 1: 禁用 JWT 验证（推荐，用于公开 API）

重新部署 Edge Functions 时使用 `--no-verify-jwt` 标志：

```powershell
# 重新部署 ocr function（禁用 JWT 验证）
supabase functions deploy ocr --no-verify-jwt

# 部署 parse-grades function（禁用 JWT 验证）
supabase functions deploy parse-grades --no-verify-jwt
```

### 方案 2: 确保用户已登录

如果 Edge Function 需要认证，确保用户已登录：

1. 在调用 Edge Function 前检查用户是否已登录
2. 如果未登录，提示用户登录

### 方案 3: 使用 Anon Key（已实现）

已更新代码以自动获取 session token。如果用户未登录，Edge Function 应该允许匿名访问。

## 🚀 立即修复

运行以下命令重新部署（禁用 JWT 验证）：

```powershell
cd "D:\fucking_AI_proj\AI 大學升學輔助應用"
supabase functions deploy ocr --no-verify-jwt
```

## 📝 通过 Dashboard 配置

如果使用 Dashboard：

1. 访问：https://supabase.com/dashboard/project/aialjdzjuozrnqwlblyz/functions
2. 点击 `ocr` 函数
3. 在设置中找到 "Verify JWT" 选项
4. **取消勾选** "Verify JWT"
5. 点击 "Deploy"

## ✅ 验证

部署完成后，401 错误应该消失。

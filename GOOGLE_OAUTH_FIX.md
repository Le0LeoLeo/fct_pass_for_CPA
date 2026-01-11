# Google OAuth redirect_uri_mismatch 錯誤修復

## 錯誤說明

`redirect_uri_mismatch` 錯誤表示 Google Cloud Console 中配置的重定向 URI 與 Supabase 實際使用的不匹配。

## 解決步驟

### 1. 獲取正確的重定向 URI

Supabase 使用的重定向 URI 格式為：
```
https://aialjdzjuozrnqwlblyz.supabase.co/auth/v1/callback
```

### 2. 在 Google Cloud Console 中配置

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇您的專案
3. 導航到 **APIs & Services** > **Credentials**
4. 找到您的 OAuth 2.0 Client ID（用於 Supabase 的那個）
5. 點擊編輯
6. 在 **Authorized redirect URIs** 中添加：
   ```
   https://aialjdzjuozrnqwlblyz.supabase.co/auth/v1/callback
   ```
7. 點擊 **Save**

### 3. 在 Supabase Dashboard 中配置

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇您的專案
3. 導航到 **Authentication** > **URL Configuration**
4. 設置 **Site URL**:
   - 開發環境: `http://localhost:3000`
   - 生產環境: 您的實際域名
5. 在 **Redirect URLs** 中添加：
   ```
   http://localhost:3000
   http://localhost:3000/**
   ```
   以及您的生產環境 URL（如果有的話）

### 4. 驗證配置

確保以下配置正確：

#### Google Cloud Console
- ✅ OAuth 2.0 Client ID 已創建
- ✅ Authorized redirect URIs 包含：`https://aialjdzjuozrnqwlblyz.supabase.co/auth/v1/callback`
- ✅ Client ID 和 Client Secret 已複製到 Supabase

#### Supabase Dashboard
- ✅ Authentication > Providers > Google 已啟用
- ✅ Google Client ID 和 Secret 已正確填入
- ✅ Site URL 設置為 `http://localhost:3000`
- ✅ Redirect URLs 包含 `http://localhost:3000`

## 常見問題

### Q: 我已經添加了重定向 URI，但還是報錯

A: 請確認：
1. Google Cloud Console 中的 URI 完全匹配（包括協議 https://）
2. 沒有多餘的空格或斜杠
3. 已點擊 Save 保存更改
4. 等待幾分鐘讓更改生效

### Q: 開發環境和生產環境需要不同的配置嗎？

A: 是的：
- **開發環境**: Site URL 使用 `http://localhost:3000`
- **生產環境**: Site URL 使用您的實際域名
- Google Cloud Console 中的 redirect URI 只需要一個：`https://aialjdzjuozrnqwlblyz.supabase.co/auth/v1/callback`（這是 Supabase 的固定回調地址）

### Q: 如何測試配置是否正確？

A: 
1. 清除瀏覽器緩存和 Cookie
2. 重新啟動開發服務器
3. 嘗試登錄
4. 如果還有問題，檢查瀏覽器控制台的錯誤訊息

## 快速檢查清單

- [ ] Google Cloud Console 中已添加 `https://aialjdzjuozrnqwlblyz.supabase.co/auth/v1/callback`
- [ ] Supabase Dashboard 中 Google Provider 已啟用
- [ ] Supabase Dashboard 中 Site URL 設置正確
- [ ] Supabase Dashboard 中 Redirect URLs 包含本地開發 URL
- [ ] 已清除瀏覽器緩存
- [ ] 已重新啟動開發服務器

## 如果問題仍然存在

1. 檢查 Supabase Dashboard > Authentication > Providers > Google 中的配置
2. 確認 Google Cloud Console 中的 OAuth 憑證是否正確
3. 查看瀏覽器控制台的完整錯誤訊息
4. 檢查 Supabase 日誌（Dashboard > Logs > Auth Logs）

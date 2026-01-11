# Google 登錄設置說明

## 已完成的功能

✅ **Google 登錄整合**
- 使用 Supabase Auth 進行 Google OAuth 登錄
- 自動會話管理和狀態監聽
- 用戶資訊顯示（頭像、姓名、郵箱）

## Supabase 配置檢查清單

### 1. Supabase Dashboard 設置

在 Supabase Dashboard 中確認以下設置：

1. **Authentication > Providers**
   - ✅ Google Provider 已啟用
   - ✅ 已配置 Google OAuth Client ID 和 Secret
   - ✅ Redirect URL 已設置

2. **Authentication > URL Configuration**
   - Site URL: `http://localhost:3000` (開發環境)
   - Redirect URLs: 添加 `http://localhost:3000`

### 2. Google Cloud Console 設置

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建 OAuth 2.0 客戶端 ID
3. 授權的重定向 URI 應包含：
   - `https://aialjdzjuozrnqwlblyz.supabase.co/auth/v1/callback`

## 使用方式

### 登錄流程

1. 用戶點擊「使用 Google 登入」按鈕
2. 跳轉到 Google 登錄頁面
3. 用戶授權後，自動跳轉回應用
4. 應用自動檢測登錄狀態並進入主頁

### 登出

用戶可以在「個人資料」頁面點擊登出按鈕

## 代碼結構

### 認證服務 (`src/services/supabase.ts`)

```typescript
// Google 登錄
signInWithGoogle()

// 登出
signOut()

// 獲取當前用戶
getCurrentUser()

// 獲取會話
getSession()

// 監聽認證狀態變化
onAuthStateChange(callback)
```

### 登錄頁面 (`src/components/LoginPage.tsx`)

- 只顯示 Google 登錄按鈕
- 處理登錄錯誤顯示
- 載入狀態顯示

### 應用主體 (`src/App.tsx`)

- 自動檢查會話狀態
- 監聽認證狀態變化
- 根據登錄狀態顯示對應頁面

### 個人資料頁面 (`src/components/ProfilePage.tsx`)

- 顯示 Google 用戶頭像
- 顯示用戶姓名和郵箱

## 用戶資訊結構

Google 登錄後，用戶物件包含：

```typescript
{
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  }
}
```

## 故障排除

### 問題：點擊登錄沒有反應

1. 檢查 Supabase Google Provider 是否已啟用
2. 檢查 Google OAuth 憑證是否正確配置
3. 檢查瀏覽器控制台是否有錯誤

### 問題：登錄後沒有自動跳轉

1. 檢查 Redirect URL 是否正確設置
2. 檢查 Supabase Site URL 配置
3. 確認 `onAuthStateChange` 監聽器正常工作

### 問題：無法獲取用戶資訊

1. 檢查 Supabase RLS 政策
2. 確認用戶已成功登錄（檢查 session）
3. 查看瀏覽器控制台的錯誤訊息

## 安全注意事項

1. ✅ 使用 Supabase Anon Key（公開金鑰）進行前端認證
2. ✅ 所有敏感操作應在後端使用 Service Role Key
3. ✅ 已設置自動刷新 Token
4. ✅ 會話持久化已啟用

## 測試步驟

1. 啟動應用：`npm run dev`
2. 點擊「使用 Google 登入」
3. 完成 Google 授權
4. 確認自動跳轉到主頁
5. 檢查個人資料頁面顯示正確的用戶資訊
6. 測試登出功能

## 下一步擴展

可以考慮添加：
- 用戶資料編輯功能
- 用戶偏好設置存儲（使用 Supabase Database）
- 多種登錄方式（如果未來需要）

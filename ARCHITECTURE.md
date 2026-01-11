# 系統架構說明

## 後端服務架構

本專案採用混合後端架構，不同服務使用不同的後端平台：

### 1. Supabase - 主要後端服務

**用途：**
- 用戶認證和授權
- 用戶資料管理
- 其他業務邏輯數據存儲
- 實時功能
- API 服務

**配置：**
- Project URL: `https://aialjdzjuozrnqwlblyz.supabase.co`
- API Key: `sb_publishable_GtfEWqxJgDwM61N782DaxQ_7NG_Lzae`

**服務位置：**
- `src/services/supabase.ts` - Supabase 客戶端和服務

### 2. Firebase - 大學資料庫

**用途：**
- 大學資料存儲和查詢
- 大學資訊管理
- 公開資料庫

**配置：**
- 已內建在 `src/services/firebase.ts`
- 使用 Firestore 資料庫

**服務位置：**
- `src/services/firebase.ts` - Firebase 服務
- `src/services/database.ts` - 統一資料庫接口（默認使用 Firebase）

### 3. FastAPI - OCR 服務

**用途：**
- OCR 圖片識別
- 成績單識別服務

**服務位置：**
- `backend/ocr_service.py`

### 4. 百度 API - AI 服務

**用途：**
- 語音識別 (SST)
- 語音合成 (TTS)
- AI 對話 (文心 4.0)

**服務位置：**
- `src/services/api.ts`

## 資料流向

```
前端應用 (React)
    │
    ├─→ Supabase (用戶認證、用戶資料)
    │
    ├─→ Firebase (大學資料庫)
    │
    ├─→ FastAPI (OCR 服務)
    │
    └─→ 百度 API (語音、AI 服務)
```

## 服務選擇邏輯

### 大學資料庫
- **默認使用**: Firebase
- **備用方案**: Supabase（如果 Firebase 不可用）
- **切換方式**: 通過 `setDatabaseProvider('firebase' | 'supabase')`

### 其他後端服務
- **用戶認證**: Supabase Auth
- **用戶資料**: Supabase Database
- **OCR 服務**: FastAPI
- **AI 服務**: 百度 API

## 配置說明

### 環境變數

```env
# Supabase（後端服務）
VITE_SUPABASE_URL=https://aialjdzjuozrnqwlblyz.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_GtfEWqxJgDwM61N782DaxQ_7NG_Lzae

# 後端 API（OCR 服務）
VITE_API_BASE_URL=http://localhost:8000

# Firebase（大學資料庫）- 已內建配置
```

## 擴展建議

### 使用 Supabase 的功能

1. **用戶認證**
   ```typescript
   import { getSupabaseClient } from './services/supabase';
   const supabase = getSupabaseClient();
   await supabase.auth.signUp({ email, password });
   ```

2. **用戶資料存儲**
   ```typescript
   // 在 Supabase 創建 users 表或其他業務表
   await supabase.from('users').insert({ ... });
   ```

3. **實時訂閱**
   ```typescript
   supabase
     .channel('custom-channel')
     .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, payload => {
       console.log('Change received!', payload);
     })
     .subscribe();
   ```

### Firebase 繼續用於大學資料

- 保持現有的 Firebase 配置
- 大學資料庫繼續使用 Firebase Firestore
- 通過 `database.ts` 統一接口訪問

## 注意事項

1. **資料分離**: 大學資料在 Firebase，用戶資料在 Supabase
2. **認證**: 使用 Supabase Auth 進行用戶認證
3. **資料同步**: 如果需要，可以創建同步腳本
4. **備份**: 兩個服務都需要定期備份

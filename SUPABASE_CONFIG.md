# Supabase 配置完成

## 已配置的 Supabase 專案

- **Project URL**: `https://aialjdzjuozrnqwlblyz.supabase.co`
- **Publishable API Key**: `sb_publishable_GtfEWqxJgDwM61N782DaxQ_7NG_Lzae`

## 配置步驟

### 1. 創建環境變數文件

在項目根目錄創建 `.env.local` 文件（如果尚未創建）：

```env
# Supabase 配置
VITE_SUPABASE_URL=https://aialjdzjuozrnqwlblyz.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_GtfEWqxJgDwM61N782DaxQ_7NG_Lzae

# 後端API基礎URL
VITE_API_BASE_URL=http://localhost:8000
```

### 2. 設置 Supabase 資料庫

在 Supabase Dashboard 的 SQL Editor 中執行以下 SQL：

#### 步驟 1: 創建資料表

執行 `supabase/migrations/001_create_universities_table.sql` 中的 SQL：

```sql
-- 創建 universities 表
CREATE TABLE IF NOT EXISTS universities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  city TEXT,
  type TEXT CHECK (type IN ('PUBLIC', 'PRIVATE')),
  founded INTEGER,
  website TEXT,
  address TEXT,
  district TEXT,
  department TEXT,
  score TEXT,
  quota INTEGER,
  competition DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_universities_name ON universities(name);
CREATE INDEX IF NOT EXISTS idx_universities_city ON universities(city);
CREATE INDEX IF NOT EXISTS idx_universities_type ON universities(type);

-- 啟用 RLS 並設置公開讀取權限
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON universities
  FOR SELECT
  USING (true);
```

#### 步驟 2: 插入範例資料（可選）

執行 `supabase/migrations/002_insert_sample_data.sql` 中的 SQL 來插入範例資料。

### 3. 驗證配置

1. 確保 `.env.local` 文件已創建並包含正確的配置
2. 重啟開發服務器：`npm run dev`
3. 訪問大學資料庫頁面，應該會自動從 Supabase 載入資料

## 注意事項

- `.env.local` 文件已被 `.gitignore` 排除，不會被提交到 Git
- 如果環境變數未設置，系統會使用代碼中的默認值
- 系統會自動檢測 Supabase 是否可用，如果不可用會回退到 Firebase

## 測試連接

可以在瀏覽器控制台執行以下代碼測試 Supabase 連接：

```javascript
import { getSupabaseClient } from './src/services/supabase';
const supabase = getSupabaseClient();
const { data, error } = await supabase.from('universities').select('*').limit(1);
console.log('Supabase 連接測試:', error ? '失敗' : '成功', data);
```

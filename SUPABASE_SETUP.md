# Supabase 後端整合說明

## 安裝依賴

```bash
npm install @supabase/supabase-js
```

## 配置 Supabase

### 1. 創建 Supabase 專案

1. 前往 [Supabase](https://supabase.com)
2. 創建新專案
3. 獲取專案 URL 和 Anon Key

### 2. 配置環境變數

創建 `.env` 文件（或更新現有的）：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. 創建資料表

在 Supabase SQL Editor 中執行以下 SQL：

```sql
-- 創建大學資料表
CREATE TABLE universities (
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
  competition DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引以提升查詢效能
CREATE INDEX idx_universities_name ON universities(name);
CREATE INDEX idx_universities_city ON universities(city);
CREATE INDEX idx_universities_type ON universities(type);

-- 啟用 Row Level Security (RLS)
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

-- 允許所有人讀取（公開資料）
CREATE POLICY "Allow public read access" ON universities
  FOR SELECT
  USING (true);

-- 如果需要允許插入/更新/刪除，需要認證
-- CREATE POLICY "Allow authenticated insert" ON universities
--   FOR INSERT
--   WITH CHECK (auth.role() = 'authenticated');
```

### 4. 插入範例資料

```sql
INSERT INTO universities (name, name_en, city, type, department, score, quota, competition) VALUES
('國立臺灣大學', 'National Taiwan University', '台北市', 'PUBLIC', '資訊工程學系', '58-60', 45, 3.2),
('國立清華大學', 'National Tsing Hua University', '新竹市', 'PUBLIC', '電機工程學系', '55-58', 50, 2.8),
('國立成功大學', 'National Cheng Kung University', '台南市', 'PUBLIC', '企業管理學系', '50-54', 40, 3.5);
```

## 使用方式

### 方法 1: 使用統一的資料庫服務（推薦）

```typescript
import { loadUniversities, setDatabaseProvider } from '../services/database';

// 自動檢測（預設）
const universities = await loadUniversities();

// 或明確指定使用 Supabase
setDatabaseProvider('supabase');
const universities = await loadUniversities();
```

### 方法 2: 直接使用 Supabase 服務

```typescript
import { 
  loadUniversitiesFromSupabase, 
  initializeSupabase 
} from '../services/supabase';

// 初始化（如果環境變數未設置）
initializeSupabase('https://your-project.supabase.co', 'your-anon-key');

// 載入資料
const universities = await loadUniversitiesFromSupabase();
```

## API 功能

### 讀取操作（公開）

- `loadUniversitiesFromSupabase()` - 載入所有大學
- `searchUniversities(query)` - 搜尋大學
- `getUniversityById(id)` - 根據 ID 獲取大學

### 寫入操作（需要認證）

- `addUniversity(university)` - 添加大學
- `updateUniversity(id, updates)` - 更新大學
- `deleteUniversity(id)` - 刪除大學

## 認證設置

如果需要使用寫入操作，需要設置 Supabase 認證：

```typescript
import { getSupabaseClient } from '../services/supabase';

const supabase = getSupabaseClient();

// 登入
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

## 與 Firebase 的差異

| 功能 | Firebase | Supabase |
|------|----------|----------|
| 資料庫類型 | Firestore (NoSQL) | PostgreSQL (SQL) |
| 查詢語言 | Firestore Query | SQL |
| 即時更新 | 支持 | 支持 |
| 認證 | Firebase Auth | Supabase Auth |
| 儲存 | Cloud Storage | Storage |
| 免費額度 | 較少 | 較多 |

## 遷移建議

1. **階段性遷移**：可以先同時使用兩個服務，然後逐步遷移
2. **使用統一接口**：使用 `database.ts` 中的統一接口，方便切換
3. **資料同步**：可以寫腳本將 Firebase 資料遷移到 Supabase

## 故障排除

### 問題：無法連接到 Supabase

- 檢查環境變數是否正確設置
- 確認 Supabase 專案是否運行中
- 檢查網路連接

### 問題：權限錯誤

- 檢查 RLS 政策設置
- 確認是否已登入（寫入操作需要）
- 檢查 API Key 是否正確

### 問題：查詢失敗

- 檢查資料表結構是否正確
- 確認欄位名稱是否匹配
- 查看 Supabase 日誌

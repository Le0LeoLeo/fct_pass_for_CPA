-- 創建大學資料表
-- 在 Supabase SQL Editor 中執行此腳本

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

-- 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_universities_name ON universities(name);
CREATE INDEX IF NOT EXISTS idx_universities_city ON universities(city);
CREATE INDEX IF NOT EXISTS idx_universities_type ON universities(type);
CREATE INDEX IF NOT EXISTS idx_universities_name_en ON universities(name_en);

-- 創建更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_universities_updated_at 
    BEFORE UPDATE ON universities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 啟用 Row Level Security (RLS)
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

-- 允許所有人讀取（公開資料）
CREATE POLICY "Allow public read access" ON universities
  FOR SELECT
  USING (true);

-- 如果需要允許認證用戶插入/更新/刪除，取消下面的註釋
-- CREATE POLICY "Allow authenticated insert" ON universities
--   FOR INSERT
--   WITH CHECK (auth.role() = 'authenticated');
--
-- CREATE POLICY "Allow authenticated update" ON universities
--   FOR UPDATE
--   USING (auth.role() = 'authenticated');
--
-- CREATE POLICY "Allow authenticated delete" ON universities
--   FOR DELETE
--   USING (auth.role() = 'authenticated');

-- 直接在 Supabase Dashboard SQL Editor 中运行此文件
-- 或通过 Supabase CLI: supabase db execute -f insert_api_keys.sql

-- 首先创建表（如果不存在）
CREATE TABLE IF NOT EXISTS api_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL UNIQUE,
  key_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 啟用 Row Level Security
ALTER TABLE api_configs ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Allow authenticated users to read api_configs" ON api_configs;
DROP POLICY IF EXISTS "Allow anon users to read api_configs" ON api_configs;

-- 創建策略：允許已認證用戶讀取
CREATE POLICY "Allow authenticated users to read api_configs"
ON api_configs
FOR SELECT
TO authenticated
USING (true);

-- 創建策略：允許匿名用戶讀取（用於應用配置）
CREATE POLICY "Allow anon users to read api_configs"
ON api_configs
FOR SELECT
TO anon
USING (true);

-- 創建更新時間觸發器（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_api_configs_updated_at ON api_configs;
CREATE TRIGGER update_api_configs_updated_at
BEFORE UPDATE ON api_configs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 插入或更新百度 API 配置
INSERT INTO api_configs (key_name, key_value, description) VALUES
  ('baidu_api_key', 'MzakylxwMs22DzBMokLqZvAN', '百度 API Key'),
  ('baidu_secret_key', 'FvFP2IZMErVOMyXqgQEXKDUdA9RFbG75', '百度 Secret Key'),
  ('baidu_api_token', 'bce-v3/ALTAK-ujQFLeNrekvVqtoSjmoTC/339cc1ef4a0ee8ad295c3b2e31d66712aee57980', '百度 API Token')
ON CONFLICT (key_name) DO UPDATE SET
  key_value = EXCLUDED.key_value,
  updated_at = NOW();

-- 驗證插入的數據
SELECT key_name, description, created_at, updated_at 
FROM api_configs 
ORDER BY key_name;

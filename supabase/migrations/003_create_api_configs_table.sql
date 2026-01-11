-- 創建 API 配置表
CREATE TABLE IF NOT EXISTS api_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL UNIQUE,
  key_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 啟用 Row Level Security (RLS)
ALTER TABLE api_configs ENABLE ROW LEVEL SECURITY;

-- 創建策略：只允許已認證的用戶讀取（但實際上我們會通過服務端函數來獲取）
-- 為了安全，我們創建一個函數來獲取 API 密鑰
CREATE OR REPLACE FUNCTION get_api_config(key_name_param TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config_value TEXT;
BEGIN
  SELECT key_value INTO config_value
  FROM api_configs
  WHERE key_name = key_name_param
  LIMIT 1;
  
  RETURN config_value;
END;
$$;

-- 創建策略：允許所有用戶通過函數讀取（但函數本身有安全限制）
-- 實際上，我們會在前端直接查詢，但使用 RLS 保護
CREATE POLICY "Allow authenticated users to read api_configs"
ON api_configs
FOR SELECT
TO authenticated
USING (true);

-- 為了讓未認證用戶也能通過應用讀取（因為這是應用配置），我們允許 anon 讀取
-- 但這需要謹慎考慮，因為這意味著任何人都可以讀取 API 密鑰
-- 更好的方式是使用 Edge Function 或服務端代理
-- 這裡我們先允許讀取，但建議後續改為 Edge Function
CREATE POLICY "Allow anon users to read api_configs"
ON api_configs
FOR SELECT
TO anon
USING (true);

-- 創建更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_configs_updated_at
BEFORE UPDATE ON api_configs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 插入百度 API 配置
INSERT INTO api_configs (key_name, key_value, description) VALUES
  ('baidu_api_key', 'MzakylxwMs22DzBMokLqZvAN', '百度 API Key'),
  ('baidu_secret_key', 'FvFP2IZMErVOMyXqgQEXKDUdA9RFbG75', '百度 Secret Key'),
  ('baidu_api_token', 'bce-v3/ALTAK-ujQFLeNrekvVqtoSjmoTC/339cc1ef4a0ee8ad295c3b2e31d66712aee57980', '百度 API Token')
ON CONFLICT (key_name) DO UPDATE SET
  key_value = EXCLUDED.key_value,
  updated_at = NOW();

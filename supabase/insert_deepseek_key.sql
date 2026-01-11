-- 添加 DeepSeek API Key 到 Supabase api_configs 表
-- 在 Supabase Dashboard SQL Editor 中运行此文件

-- 插入或更新 DeepSeek API Key
INSERT INTO api_configs (key_name, key_value, description) VALUES
  ('deepseek_api_key', 'sk-683afa31c6c04431b4377d73c2ee6436', 'DeepSeek API Key for parsing grade events')
ON CONFLICT (key_name) DO UPDATE SET
  key_value = EXCLUDED.key_value,
  updated_at = NOW();

-- 驗證插入的數據
SELECT key_name, description, created_at, updated_at 
FROM api_configs 
WHERE key_name = 'deepseek_api_key';

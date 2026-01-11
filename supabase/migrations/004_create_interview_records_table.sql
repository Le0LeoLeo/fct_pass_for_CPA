-- 创建面试记录表
CREATE TABLE IF NOT EXISTS interview_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  conversation JSONB NOT NULL DEFAULT '[]'::jsonb, -- 存储对话历史 [{role: 'user', content: '...'}, ...]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb -- 存储额外信息，如评分、反馈等
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_interview_records_user_id ON interview_records(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_records_created_at ON interview_records(created_at DESC);

-- 启用 Row Level Security (RLS)
ALTER TABLE interview_records ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能查看和修改自己的记录
CREATE POLICY "Users can view their own interview records"
  ON interview_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interview records"
  ON interview_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview records"
  ON interview_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interview records"
  ON interview_records FOR DELETE
  USING (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_interview_records_updated_at
  BEFORE UPDATE ON interview_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

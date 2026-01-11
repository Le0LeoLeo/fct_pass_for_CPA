-- 创建 AI 对话记录表
CREATE TABLE IF NOT EXISTS ai_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb, -- 存储消息历史 [{id, role, content, timestamp}, ...]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_ai_chat_conversations_user_id ON ai_chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_conversations_created_at ON ai_chat_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_conversations_updated_at ON ai_chat_conversations(updated_at DESC);

-- 启用 Row Level Security (RLS)
ALTER TABLE ai_chat_conversations ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能查看和修改自己的对话记录
CREATE POLICY "Users can view their own ai chat conversations"
  ON ai_chat_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai chat conversations"
  ON ai_chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ai chat conversations"
  ON ai_chat_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ai chat conversations"
  ON ai_chat_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- 创建更新时间触发器（如果函数不存在则创建）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_chat_conversations_updated_at
  BEFORE UPDATE ON ai_chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

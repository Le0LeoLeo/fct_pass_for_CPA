# 面试记录保存功能设置指南

## 功能说明

面试记录保存功能允许用户保存面试对话历史，方便后续回顾和分析。

## 数据库设置

### 1. 运行数据库迁移

在 Supabase Dashboard 的 SQL Editor 中运行以下迁移文件：

```sql
-- 文件位置: supabase/migrations/004_create_interview_records_table.sql
```

或者直接在 SQL Editor 中执行：

```sql
-- 创建面试记录表
CREATE TABLE IF NOT EXISTS interview_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  conversation JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_interview_records_user_id ON interview_records(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_records_created_at ON interview_records(created_at DESC);

-- 启用 RLS
ALTER TABLE interview_records ENABLE ROW LEVEL SECURITY;

-- 创建策略
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
```

## 功能特性

### 1. 保存面试记录
- 点击"保存記錄"按钮保存当前对话
- 自动生成标题（使用第一个用户消息的前30个字符）
- 保存对话历史、性能指标和识别模式

### 2. 数据存储内容
- **conversation**: 完整的对话历史（JSONB 格式）
- **title**: 记录标题
- **metadata**: 额外信息（性能指标、识别模式等）
- **created_at**: 创建时间
- **updated_at**: 更新时间

### 3. 安全特性
- Row Level Security (RLS) 确保用户只能访问自己的记录
- 自动关联用户 ID
- 支持更新和删除操作

## API 函数

### 保存记录
```typescript
import { saveInterviewRecord } from '../services/supabase';

const record = await saveInterviewRecord(
  conversationHistory,
  '面试标题（可选）',
  { score: 85, feedback: '表现良好' } // metadata（可选）
);
```

### 获取所有记录
```typescript
import { getInterviewRecords } from '../services/supabase';

const records = await getInterviewRecords();
```

### 获取单个记录
```typescript
import { getInterviewRecordById } from '../services/supabase';

const record = await getInterviewRecordById(recordId);
```

### 更新记录
```typescript
import { updateInterviewRecord } from '../services/supabase';

const updated = await updateInterviewRecord(recordId, {
  title: '新标题',
  metadata: { score: 90 }
});
```

### 删除记录
```typescript
import { deleteInterviewRecord } from '../services/supabase';

const success = await deleteInterviewRecord(recordId);
```

## 使用说明

1. **开始面试**：正常进行面试对话
2. **保存记录**：点击"保存記錄"按钮
3. **查看状态**：保存成功后按钮会显示"已保存"（3秒后恢复）
4. **清空对话**：点击"清空對話"按钮清除当前对话（不会删除已保存的记录）

## 注意事项

- 用户必须登录才能保存记录
- 未登录时保存会显示错误提示
- 保存的记录会自动关联到当前登录用户
- 记录标题会自动生成，也可以手动指定

## 后续功能扩展

可以考虑添加：
- 面试记录列表页面
- 记录详情查看
- 记录搜索和筛选
- 记录导出功能
- 记录评分和反馈功能

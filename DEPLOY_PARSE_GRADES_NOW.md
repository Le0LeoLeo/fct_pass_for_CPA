# 部署 parse-grades Edge Function

`parse-grades` 函数还没有部署，需要立即部署。

## 🚀 立即部署

### 方法 1: 使用 CLI（推荐）

```powershell
cd "D:\fucking_AI_proj\AI 大學升學輔助應用"
supabase functions deploy parse-grades --no-verify-jwt
```

### 方法 2: 通过 Dashboard

1. **访问 Dashboard**：
   https://supabase.com/dashboard/project/aialjdzjuozrnqwlblyz/functions

2. **创建新函数**：
   - 点击 **"Create a new function"** 或 **"New Function"**
   - 函数名称：`parse-grades`

3. **复制代码**：
   - 打开项目文件：`supabase/functions/parse-grades/index.ts`
   - 复制全部代码
   - 粘贴到 Dashboard 编辑器

4. **配置设置**：
   - 找到 **"Verify JWT"** 选项
   - **取消勾选**（禁用 JWT 验证）

5. **部署**：
   - 点击 **"Deploy"** 按钮

## ✅ 验证

部署完成后，错误应该消失。

## 📝 确保 DeepSeek API Key 已添加

在部署前，确保数据库中有 DeepSeek API Key：

```sql
-- 在 Supabase Dashboard SQL Editor 中运行
INSERT INTO api_configs (key_name, key_value, description) VALUES
  ('deepseek_api_key', 'sk-683afa31c6c04431b4377d73c2ee6436', 'DeepSeek API Key for parsing grade events')
ON CONFLICT (key_name) DO UPDATE SET
  key_value = EXCLUDED.key_value,
  updated_at = NOW();
```

## 🔍 检查函数列表

部署后，在 Dashboard 中应该看到两个函数：
- ✅ `ocr` (已部署)
- ✅ `parse-grades` (需要部署)

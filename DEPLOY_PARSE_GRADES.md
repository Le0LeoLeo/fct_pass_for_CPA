# 部署 parse-grades Edge Function

由于路径问题，建议通过 Supabase Dashboard 部署 `parse-grades` 函数。

## 🚀 快速部署步骤

### 方法 1: 通过 Dashboard（推荐）

1. **登录 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard/project/aialjdzjuozrnqwlblyz/functions

2. **创建新函数**
   - 点击 **"Create a new function"** 或 **"New Function"**
   - 函数名称输入：`parse-grades`

3. **复制代码**
   - 打开项目中的文件：`supabase/functions/parse-grades/index.ts`
   - 复制全部代码（213 行）
   - 粘贴到 Dashboard 的代码编辑器中

4. **部署**
   - 点击 **"Deploy"** 按钮
   - 等待部署完成

5. **验证**
   - 在函数列表中应该看到 `parse-grades`
   - 状态应该显示为 "Active"

### 方法 2: 使用 CLI（如果路径问题解决）

如果你能切换到项目目录，可以运行：

```powershell
# 确保在项目根目录
cd "D:\fucking_AI_proj\AI 大學升學輔助應用"

# 部署函数
supabase functions deploy parse-grades
```

## ✅ 部署后验证

1. **检查函数列表**
   - 在 Dashboard 中应该看到两个函数：
     - ✅ `ocr` (已部署)
     - ✅ `parse-grades` (需要部署)

2. **测试函数**（可选）
   - 在 Dashboard 中点击 `parse-grades` 函数
   - 点击 **"Invoke"** 按钮
   - 输入测试数据：
     ```json
     {
       "ocr_text": "第1週 數學 大測 9/5"
     }
     ```
   - 查看返回结果

## 🔧 添加 DeepSeek API Key（如果还没有）

在 Supabase Dashboard 的 SQL Editor 中运行：

```sql
INSERT INTO api_configs (key_name, key_value, description) VALUES
  ('deepseek_api_key', 'sk-683afa31c6c04431b4377d73c2ee6436', 'DeepSeek API Key for parsing grade events')
ON CONFLICT (key_name) DO UPDATE SET
  key_value = EXCLUDED.key_value,
  updated_at = NOW();
```

## 📝 完成！

部署完成后，前端代码会自动使用这两个 Edge Functions：
- `ocr` - OCR 识别
- `parse-grades` - 成绩解析

无需修改前端代码！

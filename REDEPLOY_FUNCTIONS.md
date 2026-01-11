# 重新部署 Edge Functions（修复 CORS）

已修复 CORS 问题，需要重新部署 Edge Functions。

## 🔧 修复内容

已更新两个 Edge Functions 的 CORS 配置，添加了 `x-client-info` 和 `apikey` 到允许的 headers：

- `supabase/functions/ocr/index.ts`
- `supabase/functions/parse-grades/index.ts`

## 🚀 重新部署步骤

### 方法 1: 使用 CLI（推荐）

```powershell
# 确保在项目目录
cd "D:\fucking_AI_proj\AI 大學升學輔助應用"

# 重新部署 ocr function
supabase functions deploy ocr

# 部署 parse-grades function（如果还没有）
supabase functions deploy parse-grades
```

### 方法 2: 通过 Dashboard

1. 访问：https://supabase.com/dashboard/project/aialjdzjuozrnqwlblyz/functions
2. 点击 `ocr` 函数
3. 点击 **"Edit"** 按钮
4. 更新 CORS headers 部分：
   ```typescript
   "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
   ```
5. 点击 **"Deploy"**

6. 对 `parse-grades` 函数重复相同步骤（如果已创建）

## ✅ 验证

部署完成后，CORS 错误应该消失，前端可以正常调用 Edge Functions。

## 📝 UI 更新

已更新 `UpdateGradesPage.tsx` 以匹配 `score_counting` 项目的 UI：

- ✅ 一鍵分析按钮（OCR + DeepSeek）
- ✅ 预览区域和成绩填写表并排显示
- ✅ 保存/读取/清除按钮
- ✅ 状态显示和错误提示
- ✅ 本地存储支持

UI 已完全匹配 `score_counting` 项目的样式和功能！

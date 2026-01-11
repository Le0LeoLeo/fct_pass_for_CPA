# 紧急：重新部署 Edge Functions 以修复 CORS

## ⚠️ 问题

CORS 错误仍然存在，因为 Edge Functions 还没有重新部署。需要立即重新部署以应用 CORS 修复。

## 🔧 修复内容

已更新两个 Edge Functions 的 CORS 配置：
- `supabase/functions/ocr/index.ts` ✅
- `supabase/functions/parse-grades/index.ts` ✅

## 🚀 立即重新部署

### 方法 1: 使用 CLI（最快）

```powershell
# 确保在项目目录
cd "D:\fucking_AI_proj\AI 大學升學輔助應用"

# 重新部署 ocr function
supabase functions deploy ocr

# 如果 parse-grades 已创建，也重新部署
supabase functions deploy parse-grades
```

### 方法 2: 通过 Dashboard（如果 CLI 有问题）

1. **访问 Dashboard**：
   https://supabase.com/dashboard/project/aialjdzjuozrnqwlblyz/functions

2. **更新 ocr 函数**：
   - 点击 `ocr` 函数
   - 点击 **"Edit"** 或 **"Update"**
   - 找到 CORS 部分（第 18-26 行）
   - 更新为：
     ```typescript
     if (req.method === "OPTIONS") {
       return new Response(null, {
         status: 204,
         headers: {
           "Access-Control-Allow-Origin": "*",
           "Access-Control-Allow-Methods": "POST, OPTIONS",
           "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
         },
       });
     }
     ```
   - 点击 **"Deploy"**

3. **更新响应 headers**（第 109 和 124 行）：
   ```typescript
   headers: {
     "Content-Type": "application/json",
     "Access-Control-Allow-Origin": "*",
     "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
   },
   ```

4. **对 parse-grades 函数重复相同步骤**（如果已创建）

## ✅ 验证

部署完成后：
1. 刷新浏览器页面
2. 再次尝试上传文件
3. CORS 错误应该消失

## 📝 完整的 CORS 配置

确保以下 headers 在所有响应中都包含：

```typescript
"Access-Control-Allow-Origin": "*"
"Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey"
```

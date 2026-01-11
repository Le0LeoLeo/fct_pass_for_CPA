# 修复 504 Gateway Timeout 错误

Edge Function 返回 504 超时错误，需要优化代码并重新部署。

## 🔧 已做的优化

1. ✅ 添加了超时处理（120秒）
2. ✅ 改进了错误处理，确保总是返回 CORS headers
3. ✅ 添加了详细的日志记录

## 🚀 重新部署

### 方法 1: 使用 CLI

```powershell
cd "D:\fucking_AI_proj\AI 大學升學輔助應用"

# 重新部署 ocr function（带超时处理）
supabase functions deploy ocr --no-verify-jwt

# 重新部署 parse-grades function
supabase functions deploy parse-grades --no-verify-jwt
```

### 方法 2: 通过 Dashboard

1. **更新 ocr 函数**：
   - 访问：https://supabase.com/dashboard/project/aialjdzjuozrnqwlblyz/functions
   - 点击 `ocr` 函数
   - 点击 "Edit"
   - 复制更新后的 `supabase/functions/ocr/index.ts` 代码
   - 粘贴并点击 "Deploy"

2. **更新 parse-grades 函数**：
   - 点击 `parse-grades` 函数
   - 点击 "Edit"
   - 复制更新后的 `supabase/functions/parse-grades/index.ts` 代码
   - 粘贴并点击 "Deploy"

## 🔍 检查超时设置

Supabase Edge Functions 默认超时时间是：
- **免费计划**：10秒
- **Pro 计划**：60秒
- **Team/Enterprise**：可配置

如果 OCR 调用需要更长时间，可能需要：
1. 升级计划
2. 优化图片大小（压缩后再发送）
3. 使用异步处理（先返回，后台处理）

## 📝 优化建议

### 1. 压缩图片

在前端压缩图片后再发送：

```typescript
// 在 UpdateGradesPage.tsx 中添加图片压缩
const compressImage = async (file: File, maxWidth: number = 1920): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};
```

### 2. 检查 Edge Function 日志

部署后查看日志：

```powershell
supabase functions logs ocr --tail
```

查看是否有超时或错误信息。

## ✅ 验证

部署完成后：
1. 刷新浏览器页面
2. 尝试上传较小的图片（< 1MB）
3. 查看是否还有超时错误

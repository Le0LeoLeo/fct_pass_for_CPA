# GitHub Pages 快速开始指南

## 🎯 您现在需要做什么？

既然您已经推送了代码，现在需要做以下几步：

## 📍 步骤 1：检查 GitHub Actions 是否运行

1. **打开您的 GitHub 仓库页面**
   - 在浏览器中访问：`https://github.com/1e01e0leo/[您的仓库名称]`

2. **点击顶部的 `Actions` 标签**
   - 在仓库名称下方，您会看到：`Code` | `Issues` | `Pull requests` | **`Actions`** | `Projects` | ...
   - 点击 **`Actions`**

3. **查看是否有 workflow 运行**
   - 左侧应该能看到 **"Deploy to GitHub Pages"** workflow
   - 如果看到黄色或绿色的圆点，说明正在运行或已完成
   - 如果什么都没看到，继续下一步

## 🚀 步骤 2：手动触发部署（如果还没自动运行）

### 方法 A：通过 Actions 页面触发

1. **在 Actions 页面**
   - 点击左侧的 **"Deploy to GitHub Pages"**
   - 如果这是第一次，您会看到 "This workflow has never run"
   - 点击右侧的 **"Run workflow"** 按钮（蓝色按钮）
   - 在下拉菜单中选择您的分支（通常是 `main`）
   - 点击绿色的 **"Run workflow"** 按钮

2. **等待部署完成**
   - 您会看到 workflow 开始运行
   - 等待所有步骤显示绿色 ✓（大约 2-5 分钟）

### 方法 B：通过推送代码触发

如果 workflow 没有自动运行，可能是因为：
- 您的默认分支不是 `main`（可能是 `master` 或其他名称）

**解决方法：**
1. 打开 `.github/workflows/deploy.yml` 文件
2. 找到第 6 行：`- main`
3. 改为您的实际分支名称，例如：`- master`
4. 保存并推送：
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "修复分支名称"
   git push origin [您的分支名称]
   ```

## ✅ 步骤 3：查看部署结果

### 在 Actions 页面查看

1. **返回 Actions 页面**
   - 点击 **"Deploy to GitHub Pages"** workflow
   - 点击最新的运行记录（最上面的）
   - 您会看到两个任务：
     - **build** - 构建您的应用
     - **deploy** - 部署到 GitHub Pages

2. **检查是否成功**
   - 如果所有步骤都是绿色 ✓，说明部署成功
   - 如果有红色 ✗，点击查看错误信息

### 在 Settings → Pages 查看

1. **返回仓库设置**
   - 点击仓库顶部的 **"Settings"**
   - 左侧菜单点击 **"Pages"**（在 Code and automation 下）

2. **查看部署状态**
   - 在 "Build and deployment" 部分
   - 现在应该能看到 workflow 详情
   - 如果部署成功，页面顶部会显示您的网站 URL

## 🌐 步骤 4：访问您的网站

部署成功后，您的网站地址格式为：
```
https://1e01e0leo.github.io/[您的仓库名称]/
```

例如，如果您的仓库名是 `AI-大學升學輔助應用`，则地址是：
```
https://1e01e0leo.github.io/AI-大學升學輔助應用/
```

**注意：** 如果仓库名称包含中文字符，URL 可能会被编码，您可以在 Settings → Pages 页面顶部看到准确的 URL。

## 🔍 常见问题排查

### 问题 1：Actions 页面看不到 workflow

**可能原因：**
- `.github/workflows/deploy.yml` 文件没有推送到 GitHub

**解决方法：**
```bash
# 检查文件是否存在
ls .github/workflows/deploy.yml

# 如果存在，添加到 git 并推送
git add .github/workflows/deploy.yml
git commit -m "添加部署工作流"
git push origin main
```

### 问题 2：Workflow 运行失败

**查看错误信息：**
1. 在 Actions 页面点击失败的 workflow
2. 点击红色的任务（build 或 deploy）
3. 展开失败的步骤查看错误信息

**常见错误：**
- **npm ci 失败**：可能是 package.json 有问题
- **Build 失败**：检查代码是否有错误
- **权限错误**：确保在 Settings → Actions → General 中启用了 workflow 权限

### 问题 3：部署成功但网站显示 404

**可能原因：**
- base 路径配置不正确

**解决方法：**
1. 检查您的仓库名称
2. 打开 `vite.config.ts`
3. 确认 `base` 路径与仓库名称匹配
4. 重新推送并部署

## 📝 检查清单

在继续之前，请确认：

- [ ] `.github/workflows/deploy.yml` 文件已推送到 GitHub
- [ ] 在 GitHub 仓库的 Actions 页面能看到 "Deploy to GitHub Pages" workflow
- [ ] 已经手动触发或自动触发了 workflow
- [ ] Workflow 运行成功（所有步骤都是绿色）
- [ ] 在 Settings → Pages 能看到部署状态
- [ ] 可以访问网站 URL

## 🆘 需要帮助？

如果遇到问题，请告诉我：
1. 在 Actions 页面看到了什么？
2. Workflow 是否在运行？
3. 如果有错误，错误信息是什么？

我可以帮您进一步排查问题！

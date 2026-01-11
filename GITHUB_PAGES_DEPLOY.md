# GitHub Pages 部署指南

本指南将帮助您将应用部署到 GitHub Pages。

## 📋 前置要求

1. 确保您的代码已推送到 GitHub 仓库
2. 确保仓库是公开的（或使用 GitHub Pro 账户支持私有仓库的 Pages）

## 🚀 部署步骤

### 方法一：使用 GitHub Actions（推荐，自动部署）

1. **启用 GitHub Pages**
   - 前往您的 GitHub 仓库
   - 点击 `Settings` → `Pages`
   - 在 `Source` 部分，选择 `GitHub Actions` 作为部署源
   - 保存设置

2. **配置仓库名称（可选）**
   - GitHub Actions 会自动根据您的仓库名称设置 base 路径
   - 如果您想手动设置，可以：
     - 在仓库的 `Settings` → `Secrets and variables` → `Actions` 中添加 `VITE_BASE_PATH` secret
     - 或者创建 `.env.production` 文件并设置 `VITE_BASE_PATH=/您的仓库名称/`
   - 默认情况下，系统会自动使用仓库名称作为 base 路径

3. **推送代码触发部署**
   - 将代码推送到 `main` 分支（或您配置的主分支）
   - GitHub Actions 会自动构建并部署
   - 在仓库的 `Actions` 标签页可以查看部署进度

4. **访问您的网站**
   - 部署完成后，访问：`https://[您的用户名].github.io/[仓库名称]/`
   - 例如：`https://username.github.io/AI-大學升學輔助應用/`

### 方法二：手动部署

如果您想手动部署：

```bash
# 1. 构建项目
npm run build

# 2. 安装 gh-pages（如果还没有）
npm install --save-dev gh-pages

# 3. 添加部署脚本到 package.json
# "deploy": "gh-pages -d dist"

# 4. 运行部署
npm run deploy
```

## ⚙️ 环境变量配置

如果您的应用需要环境变量（如 Supabase 配置），需要在 GitHub 仓库中设置 Secrets：

1. 前往仓库的 `Settings` → `Secrets and variables` → `Actions`
2. 点击 `New repository secret`
3. 添加您的环境变量，例如：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. 在 `.github/workflows/deploy.yml` 中取消注释环境变量部分

## 🔧 常见问题

### 1. 页面显示空白或 404

**原因**：`base` 路径配置不正确

**解决**：
- GitHub Actions 会自动设置 base 路径，但如果您遇到问题：
  - 检查仓库名称是否正确
  - 手动设置 `VITE_BASE_PATH` 环境变量（在 GitHub Secrets 中）
  - 路径必须以 `/` 开头和结尾，例如：`/仓库名称/`

### 2. 资源文件加载失败

**原因**：相对路径问题

**解决**：
- 确保 `vite.config.ts` 中的 `base` 配置正确
- 重新构建项目：`npm run build`

### 3. 部署后样式丢失

**原因**：CSS 文件路径问题

**解决**：
- 检查构建输出目录 `dist` 中的文件结构
- 确保所有资源文件都在正确的位置

### 4. 主分支名称不是 `main`

如果您的默认分支是 `master` 或其他名称：

1. 打开 `.github/workflows/deploy.yml`
2. 将 `branches: - main` 改为您的分支名称

## 📝 自定义域名（可选）

如果您想使用自定义域名：

1. 在仓库根目录创建 `CNAME` 文件
2. 在文件中写入您的域名，例如：`example.com`
3. 在您的域名 DNS 设置中添加 CNAME 记录指向 `[用户名].github.io`

## 🔄 更新部署

每次您推送代码到主分支时，GitHub Actions 会自动重新部署。您也可以：

1. 前往 `Actions` 标签页
2. 选择 `Deploy to GitHub Pages` workflow
3. 点击 `Run workflow` 手动触发部署

## 📚 相关资源

- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html#github-pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

## ✅ 检查清单

部署前请确认：

- [ ] `vite.config.ts` 中的 `base` 路径已正确配置
- [ ] GitHub Pages 已启用并设置为使用 GitHub Actions
- [ ] 代码已推送到 GitHub 仓库
- [ ] 环境变量（如需要）已在 GitHub Secrets 中配置
- [ ] 构建成功（本地运行 `npm run build` 测试）

---

**注意**：首次部署可能需要几分钟时间。部署完成后，您的应用将在 GitHub Pages 上可用。

# Supabase Edge Functions 设置指南

已将 OCR 和成绩解析服务整合到 Supabase Edge Functions，无需运行独立的 Python 后端服务。

## ✅ 已完成的工作

1. ✅ 创建了 Supabase Edge Functions：
   - `ocr` - OCR 识别服务
   - `parse-grades` - 成绩解析服务

2. ✅ 更新了前端 API 调用以使用 Edge Functions

3. ✅ 创建了数据库配置 SQL 文件

## 🚀 快速部署步骤

### 步骤 1: 安装 Supabase CLI

**⚠️ 重要：Supabase CLI 不支持通过 npm 全局安装！**

#### 方法 A: 使用 Scoop（推荐，Windows）

```powershell
# 1. 安装 Scoop（如果还没有）
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# 2. 添加 Supabase bucket
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git

# 3. 安装 Supabase CLI
scoop install supabase

# 4. 验证安装
supabase --version
```

#### 方法 B: 使用 Chocolatey（Windows）

```powershell
choco install supabase
```

#### 方法 C: 直接下载二进制文件（Windows）

1. 访问：https://github.com/supabase/cli/releases
2. 下载最新版本的 `supabase_windows_amd64.zip`
3. 解压并将 `supabase.exe` 添加到 PATH 环境变量

#### 方法 D: 通过 Supabase Dashboard 部署（无需 CLI）

如果 CLI 安装有问题，可以直接在 Supabase Dashboard 中创建和部署 Edge Functions（见下方"通过 Dashboard 部署"部分）

### 步骤 2: 登录并链接项目

```bash
# 登录 Supabase
supabase login

# 链接到你的项目（替换为你的 project-ref）
supabase link --project-ref aialjdzjuozrnqwlblyz
```

### 步骤 3: 添加 API Keys 到数据库

在 Supabase Dashboard 的 SQL Editor 中运行：

1. **添加百度 API Token**（如果还没有）：
   ```sql
   -- 运行 supabase/insert_api_keys.sql 中的 SQL
   ```

2. **添加 DeepSeek API Key**：
   ```sql
   -- 运行 supabase/insert_deepseek_key.sql 中的 SQL
   INSERT INTO api_configs (key_name, key_value, description) VALUES
     ('deepseek_api_key', 'sk-683afa31c6c04431b4377d73c2ee6436', 'DeepSeek API Key for parsing grade events')
   ON CONFLICT (key_name) DO UPDATE SET
     key_value = EXCLUDED.key_value,
     updated_at = NOW();
   ```

### 步骤 4: 部署 Edge Functions

```bash
# 部署所有 functions
supabase functions deploy

# 或单独部署
supabase functions deploy ocr
supabase functions deploy parse-grades
```

### 步骤 5: 验证部署

部署成功后，你会看到类似这样的输出：

```
Deploying function ocr...
Function ocr deployed successfully
Deploying function parse-grades...
Function parse-grades deployed successfully
```

## 📝 使用方式

前端代码已经更新，会自动使用 Supabase Edge Functions。无需修改前端代码！

### 前端调用示例

```typescript
import { performOCR, parseGradesFromOCR } from './services/api';

// OCR 识别
const result = await performOCR(file);

// 解析成绩
const events = await parseGradesFromOCR(ocrText);
```

## 🔧 本地开发（可选）

如果你想在本地测试：

```bash
# 启动本地 Supabase
supabase start

# Functions 会在本地运行
# 前端会自动连接到本地 Supabase
```

## ⚠️ 重要提示

1. **不再需要 Python 后端服务**：
   - 可以停止 `backend/ocr_service.py`
   - 所有功能已迁移到 Supabase Edge Functions

2. **API Keys 安全**：
   - API keys 存储在 Supabase 数据库中
   - Edge Functions 从数据库读取，不会暴露给客户端

3. **环境变量**：
   - 确保前端 `.env` 文件中有正确的 Supabase 配置：
     ```
     VITE_SUPABASE_URL=https://aialjdzjuozrnqwlblyz.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

## 🐛 故障排除

### 问题：部署失败

```bash
# 检查 Supabase CLI 版本
supabase --version

# 重新登录
supabase login

# 检查项目链接
supabase projects list
```

### 问题：API Key 未找到

在 Supabase Dashboard 中检查：

```sql
SELECT key_name, description FROM api_configs 
WHERE key_name IN ('baidu_api_token', 'deepseek_api_key');
```

### 问题：Function 调用失败

1. 检查浏览器控制台的错误信息
2. 确认 Supabase URL 和 Anon Key 配置正确
3. 检查 Edge Functions 日志：
   ```bash
   supabase functions logs ocr
   supabase functions logs parse-grades
   ```

## 📚 更多信息

- **通过 Dashboard 部署（推荐，无需 CLI）**：查看 `SUPABASE_DASHBOARD_DEPLOY.md`
- 详细的 Functions 文档：`supabase/functions/README.md`
- Supabase Edge Functions 官方文档：https://supabase.com/docs/guides/functions

## 🎯 推荐方式

**如果 CLI 安装遇到问题，推荐使用 Dashboard 方式部署**：
1. 查看 `SUPABASE_DASHBOARD_DEPLOY.md` 文件
2. 直接在 Supabase Dashboard 中创建和部署 Edge Functions
3. 无需安装任何 CLI 工具

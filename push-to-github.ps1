# 推送到 GitHub 腳本
$ErrorActionPreference = "Stop"

# 項目路徑
$projectPath = "D:\fucking_AI_proj\AI 大學升學輔助應用"

Write-Host "正在切換到項目目錄: $projectPath" -ForegroundColor Cyan

# 檢查項目目錄是否存在
if (-not (Test-Path $projectPath)) {
    Write-Host "錯誤: 項目目錄不存在: $projectPath" -ForegroundColor Red
    exit 1
}

# 切換到項目目錄
Push-Location $projectPath

try {
    Write-Host "當前目錄: $(Get-Location)" -ForegroundColor Green
    
    # 檢查是否已初始化 git
    if (-not (Test-Path ".git")) {
        Write-Host "初始化 Git 倉庫..." -ForegroundColor Yellow
        git init
        git branch -M main
    }
    
    # 檢查遠程倉庫
    $remote = git remote get-url origin -ErrorAction SilentlyContinue
    if (-not $remote) {
        Write-Host "添加遠程倉庫..." -ForegroundColor Yellow
        git remote add origin https://github.com/Le0LeoLeo/fct_pass_for_CPA.git
    } else {
        Write-Host "遠程倉庫已配置: $remote" -ForegroundColor Green
    }
    
    # 創建 .gitignore（如果不存在）
    if (-not (Test-Path ".gitignore")) {
        Write-Host "創建 .gitignore 文件..." -ForegroundColor Yellow
        @"
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
backend/.env

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Python
__pycache__/
*.py[cod]
*`$py.class
*.so
.Python
env/
venv/
ENV/
.venv

# Cache
.cache/
.parcel-cache/

# Temporary files
*.tmp
*.temp

# User-specific files
*.user
*.suo
*.userosscache
*.sln.docstates

# Build outputs
*.exe
*.dll
*.pdb

# Firebase
.firebase/
firebase-debug.log
firestore-debug.log

# Misc
*.hprof
*.log
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
    }
    
    # 添加所有文件
    Write-Host "添加文件到 Git..." -ForegroundColor Yellow
    git add .
    
    # 檢查是否有變更
    $status = git status --short
    if ($status) {
        Write-Host "提交變更..." -ForegroundColor Yellow
        git commit -m "整合三個專案功能: OCR成績識別、TTS/SST面試練習、Firebase大學資料庫"
        
        Write-Host "推送到 GitHub..." -ForegroundColor Yellow
        git push -u origin main
        
        Write-Host "✅ 成功推送到 GitHub!" -ForegroundColor Green
    } else {
        Write-Host "沒有變更需要提交" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "錯誤: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}

Write-Host "完成!" -ForegroundColor Green

# GitHub 推送腳本
# 使用方法: .\push-to-github.ps1

Write-Host "正在準備推送到 GitHub..." -ForegroundColor Cyan

# 檢查是否已初始化 git
if (-not (Test-Path .git)) {
    Write-Host "初始化 Git 倉庫..." -ForegroundColor Yellow
    git init
}

# 檢查遠程倉庫
$remoteExists = git remote get-url origin 2>$null
if (-not $remoteExists) {
    Write-Host "添加遠程倉庫..." -ForegroundColor Yellow
    git remote add origin https://github.com/Le0LeoLeo/fct_pass_for_CPA.git
} else {
    Write-Host "遠程倉庫已配置: $remoteExists" -ForegroundColor Green
}

# 設置分支名稱
Write-Host "設置主分支..." -ForegroundColor Yellow
git branch -M main

# 添加所有文件
Write-Host "添加文件..." -ForegroundColor Yellow
git add .

# 檢查是否有變更
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "沒有變更需要提交" -ForegroundColor Yellow
    exit 0
}

# 提交變更
Write-Host "提交變更..." -ForegroundColor Yellow
$commitMessage = "更新專案：整合OCR、TTS/SST、Firebase功能"
git commit -m $commitMessage

# 推送到 GitHub
Write-Host "推送到 GitHub..." -ForegroundColor Yellow
Write-Host "注意：如果這是第一次推送，可能需要輸入 GitHub 認證資訊" -ForegroundColor Cyan

try {
    git push -u origin main
    Write-Host "`n✅ 成功推送到 GitHub!" -ForegroundColor Green
    Write-Host "倉庫地址: https://github.com/Le0LeoLeo/fct_pass_for_CPA" -ForegroundColor Cyan
} catch {
    Write-Host "`n❌ 推送失敗: $_" -ForegroundColor Red
    Write-Host "`n請檢查:" -ForegroundColor Yellow
    Write-Host "1. GitHub 認證是否正確" -ForegroundColor Yellow
    Write-Host "2. 網路連接是否正常" -ForegroundColor Yellow
    Write-Host "3. 倉庫權限是否足夠" -ForegroundColor Yellow
    Write-Host "`n如果需要設置認證，可以使用:" -ForegroundColor Cyan
    Write-Host "git config --global credential.helper wincred" -ForegroundColor Gray
}

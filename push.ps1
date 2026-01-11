# 推送到 GitHub - 簡化版
$ErrorActionPreference = "Continue"

# 使用工作區路徑
$workspace = "D:\fucking_AI_proj\AI 大學升學輔助應用"

Write-Host "項目路徑: $workspace" -ForegroundColor Cyan

# 檢查目錄
if (-not (Test-Path $workspace)) {
    Write-Host "錯誤: 目錄不存在" -ForegroundColor Red
    exit 1
}

# 執行 Git 命令
$commands = @(
    "cd `"$workspace`"",
    "if (-not (Test-Path '.git')) { git init; git branch -M main }",
    "`$r = git remote get-url origin 2>`$null; if (-not `$r) { git remote add origin https://github.com/Le0LeoLeo/fct_pass_for_CPA.git }",
    "git add .",
    "git commit -m 'Integrate three projects: OCR, TTS/SST, Firebase'",
    "git push -u origin main"
)

foreach ($cmd in $commands) {
    Write-Host "執行: $cmd" -ForegroundColor Yellow
    try {
        Invoke-Expression $cmd
    } catch {
        Write-Host "警告: $_" -ForegroundColor Yellow
    }
}

Write-Host "完成!" -ForegroundColor Green

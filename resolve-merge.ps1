# 解決合併衝突並推送
Write-Host "解決合併衝突..." -ForegroundColor Cyan

# 使用本地版本解決 README.md 衝突
Write-Host "使用本地版本解決 README.md 衝突..." -ForegroundColor Yellow
git checkout --ours README.md

# 添加解決後的文件
Write-Host "添加文件..." -ForegroundColor Yellow
git add README.md

# 完成合併提交
Write-Host "完成合併提交..." -ForegroundColor Yellow
git commit -m "合併遠程更改並解決衝突"

# 推送到 GitHub
Write-Host "推送到 GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host "✅ 完成!" -ForegroundColor Green

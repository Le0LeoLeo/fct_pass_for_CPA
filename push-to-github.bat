@echo off
chcp 65001 >nul
cd /d "D:\fucking_AI_proj\AI 大學升學輔助應用"

echo 正在初始化 Git 倉庫...
if not exist ".git" (
    git init
    git branch -M main
)

echo 檢查遠程倉庫...
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo 添加遠程倉庫...
    git remote add origin https://github.com/Le0LeoLeo/fct_pass_for_CPA.git
)

echo 添加文件...
git add .

echo 提交變更...
git commit -m "整合三個專案功能: OCR成績識別、TTS/SST面試練習、Firebase大學資料庫"

echo 推送到 GitHub...
git push -u origin main

echo 完成!
pause

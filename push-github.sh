#!/bin/bash
# 推送到 GitHub

cd "D:/fucking_AI_proj/AI 大學升學輔助應用" || exit 1

# 初始化 Git（如果尚未初始化）
if [ ! -d ".git" ]; then
    echo "初始化 Git 倉庫..."
    git init
    git branch -M main
fi

# 檢查遠程倉庫
if ! git remote get-url origin &>/dev/null; then
    echo "添加遠程倉庫..."
    git remote add origin https://github.com/Le0LeoLeo/fct_pass_for_CPA.git
fi

# 添加所有文件
echo "添加文件..."
git add .

# 提交
echo "提交變更..."
git commit -m "整合三個專案功能: OCR成績識別、TTS/SST面試練習、Firebase大學資料庫"

# 推送
echo "推送到 GitHub..."
git push -u origin main

echo "完成!"

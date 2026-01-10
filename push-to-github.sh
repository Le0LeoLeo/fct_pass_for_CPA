#!/bin/bash

# GitHub 推送腳本
# 使用方法: ./push-to-github.sh

echo "正在準備推送到 GitHub..."

# 檢查是否已初始化 git
if [ ! -d .git ]; then
    echo "初始化 Git 倉庫..."
    git init
fi

# 檢查遠程倉庫
if ! git remote get-url origin >/dev/null 2>&1; then
    echo "添加遠程倉庫..."
    git remote add origin https://github.com/Le0LeoLeo/fct_pass_for_CPA.git
else
    echo "遠程倉庫已配置"
fi

# 設置分支名稱
echo "設置主分支..."
git branch -M main

# 添加所有文件
echo "添加文件..."
git add .

# 檢查是否有變更
if [ -z "$(git status --porcelain)" ]; then
    echo "沒有變更需要提交"
    exit 0
fi

# 提交變更
echo "提交變更..."
git commit -m "更新專案：整合OCR、TTS/SST、Firebase功能"

# 推送到 GitHub
echo ""
echo "推送到 GitHub..."
echo "注意：如果這是第一次推送，可能需要輸入 GitHub 認證資訊"
echo ""

if git push -u origin main; then
    echo ""
    echo "✅ 成功推送到 GitHub!"
    echo "倉庫地址: https://github.com/Le0LeoLeo/fct_pass_for_CPA"
else
    echo ""
    echo "❌ 推送失敗"
    echo ""
    echo "請檢查:"
    echo "1. GitHub 認證是否正確"
    echo "2. 網路連接是否正常"
    echo "3. 倉庫權限是否足夠"
    exit 1
fi

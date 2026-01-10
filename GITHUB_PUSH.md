# 推送到 GitHub 說明

由於路徑編碼問題，請按照以下步驟手動推送：

## 方法 1: 使用 Git Bash 或 PowerShell

1. 打開終端（Git Bash 或 PowerShell）
2. 切換到項目目錄：
   ```bash
   cd "D:\fucking_AI_proj\AI 大學升學輔助應用"
   ```

3. 初始化 Git（如果尚未初始化）：
   ```bash
   git init
   git branch -M main
   ```

4. 添加遠程倉庫：
   ```bash
   git remote add origin https://github.com/Le0LeoLeo/fct_pass_for_CPA.git
   ```
   （如果已存在，使用 `git remote set-url origin https://github.com/Le0LeoLeo/fct_pass_for_CPA.git`）

5. 添加所有文件：
   ```bash
   git add .
   ```

6. 提交變更：
   ```bash
   git commit -m "整合三個專案功能: OCR成績識別、TTS/SST面試練習、Firebase大學資料庫"
   ```

7. 推送到 GitHub：
   ```bash
   git push -u origin main
   ```

## 方法 2: 使用 GitHub Desktop

1. 打開 GitHub Desktop
2. 選擇 "File" > "Add Local Repository"
3. 選擇項目目錄：`D:\fucking_AI_proj\AI 大學升學輔助應用`
4. 如果尚未初始化，點擊 "Create a Repository"
5. 填寫提交信息並點擊 "Commit to main"
6. 點擊 "Publish repository" 或 "Push origin"

## 方法 3: 使用 VS Code

1. 在 VS Code 中打開項目目錄
2. 打開 Source Control 面板（Ctrl+Shift+G）
3. 點擊 "Initialize Repository"（如果尚未初始化）
4. 點擊 "+" 添加所有文件
5. 輸入提交信息並提交
6. 點擊 "..." > "Push" > "Push to..." > 選擇 origin/main

## 注意事項

- 確保已安裝 Git
- 確保已配置 Git 用戶名和郵箱：
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  ```
- 如果遇到認證問題，可能需要配置 GitHub Personal Access Token

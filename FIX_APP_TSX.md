# 修复 App.tsx 的说明

由于 Git 的行尾符转换问题，本地修改无法正确推送到 GitHub。

## 解决方案

请在 GitHub 网页上直接编辑 `src/App.tsx` 文件：

1. 访问：https://github.com/Le0LeoLeo/fct_pass_for_CPA/blob/main/src/App.tsx
2. 点击右上角的铅笔图标（Edit this file）
3. 将第 1 行从：
   ```typescript
   import { useState, useEffect } from "react";
   ```
   改为：
   ```typescript
   import { useState, useEffect, useRef } from "react";
   ```

4. 在第 31 行（`export default function App() {` 之后）添加：
   ```typescript
   // 從 localStorage 恢復上次的頁面狀態
   const getInitialPage = (): Page => {
     const savedPage = localStorage.getItem('currentPage') as Page;
     return savedPage && savedPage !== "login" ? savedPage : "login";
   };
   ```

5. 将第 38 行从：
   ```typescript
   const [currentPage, setCurrentPage] = useState<Page>("login");
   ```
   改为：
   ```typescript
   const [currentPage, setCurrentPage] = useState<Page>(getInitialPage());
   ```

6. 在第 42 行（`const [user, setUser] = useState<any>(null);` 之后）添加：
   ```typescript
   const isInitialCheckRef = useRef(true);
   const currentPageRef = useRef<Page>(getInitialPage());
   ```

7. 在第 45 行（`// 檢查認證狀態` 之前）添加：
   ```typescript
   // 保存當前頁面到 localStorage 並更新 ref
   useEffect(() => {
     currentPageRef.current = currentPage;
     if (currentPage !== "login" && isLoggedIn) {
       localStorage.setItem('currentPage', currentPage);
     }
   }, [currentPage, isLoggedIn]);
   ```

8. 修改 `onAuthStateChange` 回调函数（大约第 60-75 行），将：
   ```typescript
   if (session?.user) {
     setUser(session.user);
     setIsLoggedIn(true);
     if (currentPage === "login") {
       setCurrentPage("home");
     }
   }
   ```
   改为：
   ```typescript
   if (session?.user) {
     setUser(session.user);
     setIsLoggedIn(true);
     // 只在初始檢查或從登出狀態轉為登入狀態時才改變頁面
     // 避免在窗口重新獲得焦點時重置頁面
     if (isInitialCheckRef.current) {
       const savedPage = localStorage.getItem('currentPage') as Page;
       setCurrentPage(savedPage && savedPage !== "login" ? savedPage : "home");
       isInitialCheckRef.current = false;
     } else if (currentPageRef.current === "login") {
       // 只有在當前是登入頁時才跳轉
       const savedPage = localStorage.getItem('currentPage') as Page;
       setCurrentPage(savedPage && savedPage !== "login" ? savedPage : "home");
     }
     // 如果已經在其他頁面，保持當前頁面不變
   }
   ```

9. 修改 `useEffect` 的依赖项（大约第 89 行），将：
   ```typescript
   }, [currentPage]);
   ```
   改为：
   ```typescript
   }, []); // 移除 currentPage 依賴，避免循環觸發
   ```

10. 修改 `checkSession` 函数（大约第 91-108 行），将：
    ```typescript
    if (session?.user) {
      setUser(session.user);
      setIsLoggedIn(true);
      setCurrentPage("home");
    }
    ```
    改为：
    ```typescript
    if (session?.user) {
      setUser(session.user);
      setIsLoggedIn(true);
      // 只在初始載入時恢復保存的頁面，否則保持當前頁面
      if (isInitialCheckRef.current) {
        const savedPage = localStorage.getItem('currentPage') as Page;
        setCurrentPage(savedPage && savedPage !== "login" ? savedPage : "home");
        isInitialCheckRef.current = false;
      }
    }
    ```

11. 修改 `handleNavigate` 函数（大约第 134 行），将：
    ```typescript
    const handleNavigate = (page: string) => {
      setCurrentPage(page as Page);
      setIsMobileMenuOpen(false);
    };
    ```
    改为：
    ```typescript
    const handleNavigate = (page: string) => {
      const newPage = page as Page;
      setCurrentPage(newPage);
      setIsMobileMenuOpen(false);
      // 保存頁面狀態（登入狀態下）
      if (isLoggedIn && newPage !== "login") {
        localStorage.setItem('currentPage', newPage);
      }
    };
    ```

12. 滚动到底部，点击 "Commit changes"
13. 填写提交信息："修复切换窗口后自动跳回主页问题"
14. 点击 "Commit changes"

完成！修改将自动触发 GitHub Actions 重新部署。

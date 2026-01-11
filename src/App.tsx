import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginPage } from "./components/LoginPage";
import { HomePage } from "./components/HomePage";
import { UniversityDatabasePage } from "./components/UniversityDatabasePage";
import { InterviewPage } from "./components/InterviewPage";
import { QuestionnairePage } from "./components/QuestionnairePage";
import { AIChatPage } from "./components/AIChatPage";
import { StatisticsPage } from "./components/StatisticsPage";
import { ProfilePage } from "./components/ProfilePage";
import { GradesAndPracticePage } from "./components/GradesAndPracticePage";
import { UpdateGradesPage } from "./components/UpdateGradesPage";
import { InterviewPracticePage } from "./components/InterviewPracticePage";
import { Sidebar } from "./components/Sidebar";
import { getSession, onAuthStateChange, signOut, getCurrentUser } from "./services/supabase";
import { Loader2 } from "lucide-react";

type Page = 
  | "login" 
  | "home" 
  | "university-database" 
  | "interview" 
  | "questionnaire" 
  | "ai-chat" 
  | "statistics"
  | "profile"
  | "grades-and-practice"
  | "update-grades"
  | "interview-practice";

export default function App() {
  // 從 localStorage 恢復上次的頁面狀態
  const getInitialPage = (): Page => {
    const savedPage = localStorage.getItem('currentPage') as Page;
    return savedPage && savedPage !== "login" ? savedPage : "login";
  };

  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const isInitialCheckRef = useRef(true);
  const currentPageRef = useRef<Page>(getInitialPage());

  // 保存當前頁面到 localStorage 並更新 ref
  useEffect(() => {
    currentPageRef.current = currentPage;
    if (currentPage !== "login" && isLoggedIn) {
      localStorage.setItem('currentPage', currentPage);
    }
  }, [currentPage, isLoggedIn]);

  // 檢查認證狀態
  useEffect(() => {
    checkSession();

    // 監聽認證狀態變化
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
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
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setCurrentPage("login");
        localStorage.removeItem('currentPage');
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // 移除 currentPage 依賴，避免循環觸發

  const checkSession = async () => {
    try {
      const session = await getSession();
      if (session?.user) {
        setUser(session.user);
        setIsLoggedIn(true);
        // 只在初始載入時恢復保存的頁面，否則保持當前頁面
        if (isInitialCheckRef.current) {
          const savedPage = localStorage.getItem('currentPage') as Page;
          setCurrentPage(savedPage && savedPage !== "login" ? savedPage : "home");
          isInitialCheckRef.current = false;
        }
      } else {
        setIsLoggedIn(false);
        setCurrentPage("login");
        localStorage.removeItem('currentPage');
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setIsLoggedIn(false);
      setCurrentPage("login");
      localStorage.removeItem('currentPage');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    // 這個函數現在由認證狀態監聽器處理
    // 保留以保持向後兼容
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      setIsLoggedIn(false);
      setCurrentPage("login");
      localStorage.removeItem('currentPage');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigate = (page: string) => {
    const newPage = page as Page;
    setCurrentPage(newPage);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
    // 保存頁面狀態（登入狀態下）
    if (isLoggedIn && newPage !== "login") {
      localStorage.setItem('currentPage', newPage);
    }
  };

  // 載入中顯示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">載入中...</p>
        </motion.div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        user={user}
      />

      {/* Main Content */}
      <div className="flex-1 md:ml-64 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentPage === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <HomePage onNavigate={handleNavigate} user={user} />
            </motion.div>
          )}
          {currentPage === "university-database" && (
            <motion.div
              key="university-database"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <UniversityDatabasePage onNavigate={handleNavigate} />
            </motion.div>
          )}
          {currentPage === "interview" && (
            <motion.div
              key="interview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <InterviewPage onNavigate={handleNavigate} />
            </motion.div>
          )}
          {currentPage === "questionnaire" && (
            <motion.div
              key="questionnaire"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <QuestionnairePage onNavigate={handleNavigate} />
            </motion.div>
          )}
          {currentPage === "ai-chat" && (
            <motion.div
              key="ai-chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AIChatPage onNavigate={handleNavigate} />
            </motion.div>
          )}
          {currentPage === "statistics" && (
            <motion.div
              key="statistics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StatisticsPage onNavigate={handleNavigate} />
            </motion.div>
          )}
          {currentPage === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ProfilePage onNavigate={handleNavigate} onLogout={handleLogout} user={user} />
            </motion.div>
          )}
          {currentPage === "grades-and-practice" && (
            <motion.div
              key="grades-and-practice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GradesAndPracticePage onNavigate={handleNavigate} />
            </motion.div>
          )}
          {currentPage === "update-grades" && (
            <motion.div
              key="update-grades"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <UpdateGradesPage onNavigate={handleNavigate} />
            </motion.div>
          )}
          {currentPage === "interview-practice" && (
            <motion.div
              key="interview-practice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <InterviewPracticePage onNavigate={handleNavigate} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

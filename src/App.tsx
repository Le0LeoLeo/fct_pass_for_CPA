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
import { InterviewEvaluationPage } from "./components/InterviewEvaluationPage";
import { Sidebar } from "./components/Sidebar";
import { getSession, onAuthStateChange, signOut } from "./services/supabase";
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
  | "register"
  | "grades-and-practice"
  | "update-grades"
  | "interview-practice"
  | "interview-evaluation";

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
  const [profileComplete, setProfileComplete] = useState(false);
  const isInitialCheckRef = useRef(true);
  const currentPageRef = useRef<Page>(getInitialPage());

  // 保存當前頁面到 localStorage 並更新 ref
  useEffect(() => {
    currentPageRef.current = currentPage;
    if (currentPage !== "login" && isLoggedIn) {
      localStorage.setItem('currentPage', currentPage);
    }
  }, [currentPage, isLoggedIn]);

  const isProfileComplete = (currentUser: any) => {
    const profile = currentUser?.user_metadata?.profile || {};
    return Boolean(
      profile.name &&
      profile.school &&
      profile.grade &&
      profile.region &&
      profile.majorPreference &&
      profile.interests &&
      profile.desiredMajors &&
      profile.careerGoals &&
      profile.preferredCountries &&
      profile.acceptFarFromHome &&
      profile.budgetPerYear
    );
  };

  const resolvePostLoginPage = (currentUser: any) => {
    const complete = isProfileComplete(currentUser);
    setProfileComplete(complete);
    if (!complete) {
      return "register" as Page;
    }
    const savedPage = localStorage.getItem('currentPage') as Page;
    return savedPage && savedPage !== "login" ? savedPage : "home";
  };

  // 檢查認證狀態
  useEffect(() => {
    checkSession();

    // 監聽認證狀態變化
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (session?.user) {
        setUser(session.user);
        setIsLoggedIn(true);
        const nextPage = resolvePostLoginPage(session.user);
        if (isInitialCheckRef.current) {
          setCurrentPage(nextPage);
          isInitialCheckRef.current = false;
        } else if (currentPageRef.current === "login") {
          setCurrentPage(nextPage);
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setProfileComplete(false);
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
        const nextPage = resolvePostLoginPage(session.user);
        if (isInitialCheckRef.current) {
          setCurrentPage(nextPage);
          isInitialCheckRef.current = false;
        }
      } else {
        setIsLoggedIn(false);
        setProfileComplete(false);
        setCurrentPage("login");
        localStorage.removeItem('currentPage');
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setIsLoggedIn(false);
      setProfileComplete(false);
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
      setProfileComplete(false);
      setCurrentPage("login");
      localStorage.removeItem('currentPage');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigate = (page: string) => {
    const newPage = page as Page;
    if (!profileComplete && newPage !== "register") {
      setCurrentPage("register");
      setIsMobileMenuOpen(false);
      return;
    }
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
              <ProfilePage
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                user={user}
                onProfileUpdated={(updatedUser) => {
                  setUser(updatedUser);
                  const complete = isProfileComplete(updatedUser);
                  setProfileComplete(complete);
                }}
              />
            </motion.div>
          )}
          {currentPage === "register" && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ProfilePage
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                user={user}
                mode="register"
                onProfileUpdated={(updatedUser) => {
                  setUser(updatedUser);
                  const complete = isProfileComplete(updatedUser);
                  setProfileComplete(complete);
                  if (complete && currentPage === "register") {
                    setCurrentPage("home");
                  }
                }}
              />
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
          {currentPage === "interview-evaluation" && (
            <motion.div
              key="interview-evaluation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <InterviewEvaluationPage onNavigate={handleNavigate} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

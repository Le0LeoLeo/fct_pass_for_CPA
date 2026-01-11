import { useState, useEffect } from "react";
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
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // 瑼Ｘ隤????
  useEffect(() => {
    checkSession();

    // ??隤??????
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (session?.user) {
        setUser(session.user);
        setIsLoggedIn(true);
        if (currentPage === "login") {
          setCurrentPage("home");
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setCurrentPage("login");
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const session = await getSession();
      if (session?.user) {
        setUser(session.user);
        setIsLoggedIn(true);
        setCurrentPage("home");
      } else {
        setIsLoggedIn(false);
        setCurrentPage("login");
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setIsLoggedIn(false);
      setCurrentPage("login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    // ??貊?函隤????賢??
    // 靽?隞乩???敺摰?
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      setIsLoggedIn(false);
      setCurrentPage("login");
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  // 頛銝剝＊蝷?
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">頛銝?..</p>
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
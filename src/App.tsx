import { useState } from "react";
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

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentPage("home");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage("login");
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

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
              <HomePage onNavigate={handleNavigate} />
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
              <ProfilePage onNavigate={handleNavigate} onLogout={handleLogout} />
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
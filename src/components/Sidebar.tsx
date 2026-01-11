import { Home, BookOpen, ClipboardCheck, Bot, User, LogOut, GraduationCap, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  user?: any;
}

export function Sidebar({ currentPage, onNavigate, onLogout, isMobileMenuOpen, setIsMobileMenuOpen, user }: SidebarProps) {
  // 提取 Google 用戶名稱
  const userName = 
    user?.user_metadata?.full_name || 
    user?.user_metadata?.name || 
    (user?.user_metadata?.given_name && user?.user_metadata?.family_name 
      ? `${user.user_metadata.given_name} ${user.user_metadata.family_name}` 
      : null) ||
    user?.user_metadata?.given_name ||
    user?.email?.split('@')[0] || 
    '用戶';
  
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const menuItems = [
    { id: "home", label: "主頁", icon: Home },
    { id: "university-database", label: "大學資料庫", icon: BookOpen },
    { id: "grades-and-practice", label: "成績與練習", icon: ClipboardCheck },
    { id: "ai-chat", label: "AI 助手", icon: Bot },
    { id: "profile", label: "個人資料", icon: User },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-[80] w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-900"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </motion.button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-black/50 z-[60]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-[70] transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0`}
      >
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-6 border-b border-gray-200"
        >
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center"
            >
              <GraduationCap className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <h1 className="text-[18px] text-gray-900">AI 升學輔助</h1>
              <p className="text-[12px] text-gray-500">升學規劃專家</p>
            </div>
          </div>
        </motion.div>

        {/* User Info */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 border-b border-gray-200"
        >
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer"
            onClick={() => onNavigate("profile")}
          >
            {userAvatar ? (
              <img 
                src={userAvatar} 
                alt={userName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] text-gray-900 truncate">{userName}</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <motion.div
                    animate={isActive ? { rotate: [0, -10, 10, 0] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                  <span className="text-[15px]">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-4 border-t border-gray-200"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[15px]">登出</span>
          </motion.button>
        </motion.div>
      </div>
    </>
  );
}
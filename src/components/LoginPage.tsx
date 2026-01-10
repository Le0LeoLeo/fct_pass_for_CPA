import { useState } from "react";
import { GraduationCap, Mail, Lock, Eye, EyeOff, MessageCircle, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl mb-6 shadow-lg"
          >
            <GraduationCap className="w-14 h-14 text-white" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[48px] font-semibold text-gray-900 mb-4 leading-tight"
          >
            AI 升學輔助
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[20px] text-gray-600 mb-8"
          >
            AI 規劃你的升學之路
          </motion.p>
          <div className="space-y-4">
            {[
              { icon: GraduationCap, title: "智能推薦科系", desc: "根據興趣與能力分析", color: "blue" },
              { icon: MessageCircle, title: "AI 面試練習", desc: "提升應試能力與信心", color: "purple" },
              { icon: BarChart3, title: "成績追蹤分析", desc: "掌握學習進度與目標", color: "green" }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ x: 10, transition: { duration: 0.2 } }}
                  className="flex items-center gap-3"
                >
                  <div className={`w-12 h-12 bg-${item.color}-100 rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${item.color}-600`} />
                  </div>
                  <div>
                    <h3 className="text-[16px] text-gray-900">{item.title}</h3>
                    <p className="text-[14px] text-gray-600">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl mb-4 shadow-lg"
            >
              <GraduationCap className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-[28px] font-semibold text-gray-900 mb-2">
              AI 升學輔助
            </h1>
            <p className="text-[15px] text-gray-500">AI 規劃你的升學之路</p>
          </div>

          {/* Login Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100"
          >
            <h2 className="text-[24px] text-gray-900 mb-2">歡迎回來</h2>
            <p className="text-[15px] text-gray-600 mb-6">登入您的帳號以繼續</p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label htmlFor="email" className="block text-[14px] text-gray-700 mb-2">
                  電子郵件
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="pl-12 h-12 bg-gray-50 border-gray-200 rounded-xl"
                    required
                  />
                </div>
              </motion.div>

              {/* Password Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label htmlFor="password" className="block text-[14px] text-gray-700 mb-2">
                  密碼
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-12 pr-12 h-12 bg-gray-50 border-gray-200 rounded-xl"
                    required
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>
              </motion.div>

              {/* Forgot Password */}
              <div className="text-right">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  type="button"
                  className="text-[14px] text-blue-600 hover:text-blue-700"
                >
                  忘記密碼？
                </motion.button>
              </div>

              {/* Login Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                  >
                    登入
                  </Button>
                </motion.div>
              </motion.div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-[13px]">
                  <span className="px-4 bg-white text-gray-500">或</span>
                </div>
              </div>

              {/* Register Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-gray-700 rounded-xl"
                  >
                    建立新帳號
                  </Button>
                </motion.div>
              </motion.div>
            </form>
          </motion.div>

          {/* Footer */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-[13px] text-gray-500 mt-6"
          >
            登入即表示您同意我們的服務條款及隱私權政策
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
import { BookOpen, ClipboardCheck, Bot, User, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getUserStats } from "../services/supabase";

interface HomePageProps {
  onNavigate: (page: string) => void;
  user?: any;
}

export function HomePage({ onNavigate, user }: HomePageProps) {
  const [stats, setStats] = useState({
    questionnaireProgress: { completed: 0, total: 5, progress: 0 },
    interviewCount: 0,
    interviewThisWeek: 0,
    favoriteUniversities: 0,
    viewedUniversities: 0,
    recentActivities: [] as Array<{ type: string; title: string; time: string; id: string }>,
    aiRecommendations: [] as Array<{ name: string; match: number }>,
    weeklyTasks: { completed: 0, total: 4 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const userStats = await getUserStats();
        setStats(userStats);
      } catch (error) {
        console.error('加载统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);
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
  const features = [
    {
      id: "university-database",
      title: "大學資料庫",
      description: "搜尋學校與科系資訊",
      icon: BookOpen,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      id: "grades-and-practice",
      title: "成績與練習",
      description: "面試、問卷、分數統計",
      icon: ClipboardCheck,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      id: "ai-chat",
      title: "AI 助手",
      description: "隨時解答升學問題",
      icon: Bot,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl md:rounded-3xl p-4 md:p-8 mb-4 md:mb-8 shadow-lg"
        >
          <div className="flex items-start justify-between mb-4 md:mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-[11px] md:text-[14px] text-blue-100 mb-1 md:mb-2">歡迎回來</p>
              <h2 className="text-[20px] md:text-[32px] text-white mb-2 md:mb-4">{userName}</h2>
              <p className="text-[12px] md:text-[16px] text-blue-100">繼續您的升學規劃旅程</p>
            </motion.div>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
              whileHover={{ rotate: 360, transition: { duration: 0.6 } }}
              className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30"
            >
              <GraduationCap className="w-6 h-6 md:w-10 md:h-10 text-white" />
            </motion.div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
            {[
              { 
                label: "完成問卷", 
                value: loading ? "..." : String(stats.questionnaireProgress.completed), 
                total: `/5`, 
                progress: stats.questionnaireProgress.progress 
              },
              { 
                label: "面試練習", 
                value: loading ? "..." : `${stats.interviewCount}次`, 
                desc: `本週已練習 ${stats.interviewThisWeek} 次` 
              },
              { 
                label: "收藏學校", 
                value: loading ? "..." : `${stats.favoriteUniversities}間`, 
                desc: `已瀏覽 ${stats.viewedUniversities} 間大學` 
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-5 border border-white/20"
              >
                <p className="text-[11px] md:text-[13px] text-blue-100 mb-1 md:mb-2">{stat.label}</p>
                <div className="flex items-end gap-2">
                  <p className="text-[24px] md:text-[32px] text-white">{stat.value}</p>
                  {stat.total && <p className="text-[16px] md:text-[18px] text-blue-100 mb-1">{stat.total}</p>}
                </div>
                {stat.progress !== undefined && (
                  <div className="mt-2 md:mt-3 h-1.5 md:h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.progress}%` }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.8 }}
                      className="h-full bg-white rounded-full"
                    ></motion.div>
                  </div>
                )}
                {stat.desc && <p className="text-[13px] text-blue-100 mt-2">{stat.desc}</p>}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Left Column - Features */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl md:rounded-3xl shadow-sm p-4 md:p-8 border border-gray-100 mb-4 md:mb-8"
            >
              <h3 className="text-[18px] md:text-[24px] text-gray-900 mb-4 md:mb-6">功能選單</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.button
                      key={feature.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      whileHover={{ y: -8, scale: 1.03, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onNavigate(feature.id)}
                      className="flex flex-col items-start p-4 md:p-6 bg-gray-50 hover:bg-gray-100 rounded-xl md:rounded-2xl transition-all hover:shadow-md"
                    >
                      <motion.div 
                        whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 md:mb-4 shadow-sm`}
                      >
                        <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                      </motion.div>
                      <h4 className="text-[15px] md:text-[17px] text-gray-900 mb-1 md:mb-2">
                        {feature.title}
                      </h4>
                      <p className="text-[13px] md:text-[14px] text-gray-500">
                        {feature.description}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl md:rounded-3xl shadow-sm p-4 md:p-8 border border-gray-100"
            >
              <h3 className="text-[18px] md:text-[24px] text-gray-900 mb-4 md:mb-6">最近活動</h3>
              <div className="space-y-3 md:space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">載入中...</div>
                ) : stats.recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">還沒有活動記錄</div>
                ) : (
                  stats.recentActivities.map((activity, index) => {
                    const Icon = activity.type === 'questionnaire' ? ClipboardCheck : 
                                activity.type === 'interview' ? ClipboardCheck : BookOpen;
                    const color = activity.type === 'questionnaire' ? 'blue' : 
                                 activity.type === 'interview' ? 'purple' : 'green';
                    const actionText = activity.type === 'questionnaire' ? '結果' : 
                                      activity.type === 'interview' ? '回饋' : '詳情';
                    
                    return (
                      <motion.div
                        key={activity.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        whileHover={{ x: 5, transition: { duration: 0.2 } }}
                        onClick={() => {
                          if (activity.type === 'questionnaire') {
                            onNavigate('questionnaire');
                          } else if (activity.type === 'interview') {
                            onNavigate('grades-and-practice');
                          } else {
                            onNavigate('university-database');
                          }
                        }}
                        className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl cursor-pointer ${
                          color === 'blue' ? 'bg-blue-50' : color === 'purple' ? 'bg-purple-50' : 'bg-green-50'
                        }`}
                      >
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          color === 'blue' ? 'bg-blue-100' : color === 'purple' ? 'bg-purple-100' : 'bg-green-100'
                        }`}>
                          <Icon className={`w-5 h-5 md:w-6 md:h-6 ${
                            color === 'blue' ? 'text-blue-600' : color === 'purple' ? 'text-purple-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] md:text-[16px] text-gray-900 truncate">{activity.title}</p>
                          <p className="text-[12px] md:text-[14px] text-gray-500">{activity.time}</p>
                        </div>
                        <button className={`text-[12px] md:text-[14px] flex-shrink-0 ${
                          color === 'blue' ? 'text-blue-600 hover:text-blue-700' : 
                          color === 'purple' ? 'text-purple-600 hover:text-purple-700' : 
                          'text-green-600 hover:text-green-700'
                        }`}>
                          查看{actionText}
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Quick Info */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[20px] text-gray-900">本週任務</h3>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full"
                >
                  <span className="text-[18px] text-blue-600">{loading ? '...' : stats.weeklyTasks.completed}</span>
                  <span className="text-[14px] text-blue-500">/</span>
                  <span className="text-[14px] text-gray-500">{stats.weeklyTasks.total}</span>
                </motion.div>
              </div>
              
              {/* Progress Bar */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] text-gray-500">完成進度</span>
                  <span className="text-[13px] text-blue-600">
                    {loading ? '...' : Math.round((stats.weeklyTasks.completed / stats.weeklyTasks.total) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: loading ? "0%" : `${(stats.weeklyTasks.completed / stats.weeklyTasks.total) * 100}%` }}
                    transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  ></motion.div>
                </div>
              </motion.div>

              <div className="space-y-3">
                {[
                  { 
                    done: stats.questionnaireProgress.completed >= stats.questionnaireProgress.total, 
                    text: "完成智能問卷" 
                  },
                  { 
                    done: stats.interviewThisWeek >= 3, 
                    text: `練習 3 次面試${stats.interviewThisWeek > 0 ? ` (${stats.interviewThisWeek}/3)` : ''}` 
                  },
                  { 
                    done: stats.viewedUniversities >= 5, 
                    text: `瀏覽 5 間大學${stats.viewedUniversities > 0 ? ` (${stats.viewedUniversities}/5)` : ''}` 
                  },
                  { 
                    done: false, 
                    text: "更新成績資料" 
                  }
                ].map((task, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <motion.div 
                      whileHover={{ scale: 1.2 }}
                      className={`w-6 h-6 rounded-full ${task.done ? "bg-green-500" : "border-2 border-gray-300"} flex items-center justify-center`}
                    >
                      {task.done && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </motion.div>
                    <span className={`text-[15px] ${task.done ? "text-gray-600 line-through" : "text-gray-900"}`}>
                      {task.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl shadow-lg p-6 text-white"
            >
              <h3 className="text-[20px] mb-3">AI 推薦</h3>
              <p className="text-[14px] text-purple-100 mb-4">
                {loading ? '載入中...' : stats.questionnaireProgress.completed >= stats.questionnaireProgress.total
                  ? '根據您的測驗結果，我們推薦以下科系：'
                  : '完成問卷後即可查看AI推薦'}
              </p>
              <div className="space-y-2">
                {loading ? (
                  <div className="text-purple-100 text-center py-4">載入中...</div>
                ) : stats.aiRecommendations.length === 0 ? (
                  <div className="text-purple-100 text-center py-4">請先完成問卷</div>
                ) : (
                  stats.aiRecommendations.slice(0, 2).map((dept, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ scale: 1.03, x: 5 }}
                    className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30 cursor-pointer"
                  >
                    <p className="text-[15px]">{dept.name}</p>
                    <p className="text-[12px] text-purple-100">匹配度 {dept.match}%</p>
                  </motion.div>
                  ))
                )}
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate("questionnaire")}
                className="w-full mt-4 bg-white text-purple-600 hover:bg-purple-50 rounded-xl py-2.5 transition-colors"
              >
                查看完整分析
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
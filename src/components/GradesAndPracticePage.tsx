import { MessageCircle, FileText, BarChart3, ChevronRight, TrendingUp, PenSquare } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface GradesAndPracticePageProps {
  onNavigate: (page: string) => void;
}

export function GradesAndPracticePage({ onNavigate }: GradesAndPracticePageProps) {
  const sections = [
    {
      id: "interview-practice",
      title: "面試練習",
      description: "AI 模擬面試，提升應答能力",
      icon: MessageCircle,
      color: "from-purple-500 to-purple-600",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      stats: [
        { label: "總練習次數", value: "12" },
        { label: "本週練習", value: "3" },
        { label: "平均評分", value: "85" }
      ]
    },
    {
      id: "questionnaire",
      title: "智能問卷",
      description: "性向測驗與科系推薦",
      icon: FileText,
      color: "from-green-500 to-green-600",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      stats: [
        { label: "已完成問卷", value: "3" },
        { label: "推薦科系", value: "5" },
        { label: "匹配度", value: "92%" }
      ]
    },
    {
      id: "statistics",
      title: "分數統計",
      description: "成績分析與進步追蹤",
      icon: BarChart3,
      color: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      stats: [
        { label: "平均分數", value: "84.6" },
        { label: "本月進步", value: "+2.3" },
        { label: "班級排名", value: "5/40" }
      ]
    },
    {
      id: "update-grades",
      title: "更新成績",
      description: "輸入與管理成績資料",
      icon: PenSquare,
      color: "from-orange-500 to-orange-600",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      stats: [
        { label: "已輸入科目", value: "5" },
        { label: "學期平均", value: "84.6" },
        { label: "最近更新", value: "今天" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 md:mb-8"
        >
          <h1 className="text-[20px] md:text-[32px] text-gray-900 mb-1 md:mb-2">成績與練習</h1>
          <p className="text-[13px] md:text-[16px] text-gray-600">管理您的學習成果、練習記錄與統計分析</p>
        </motion.div>

        {/* Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl md:rounded-3xl p-4 md:p-8 mb-4 md:mb-8 shadow-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
            <div className="text-white">
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-lg md:rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="text-[16px] md:text-[20px]">本週學習概況</h3>
              </div>
              <p className="text-[12px] md:text-[14px] text-white/80">持續進步中，保持這個節奏！</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-6 border border-white/20">
              <p className="text-[12px] md:text-[14px] text-white/80 mb-1 md:mb-2">總學習時數</p>
              <p className="text-[24px] md:text-[36px] text-white">18.5 hr</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-6 border border-white/20">
              <p className="text-[12px] md:text-[14px] text-white/80 mb-1 md:mb-2">完成度</p>
              <p className="text-[24px] md:text-[36px] text-white">78%</p>
            </div>
          </div>
        </motion.div>

        {/* Main Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl md:rounded-3xl shadow-lg border border-gray-100 overflow-hidden"
              >
                {/* Card Header */}
                <div className={`bg-gradient-to-br ${section.color} p-4 md:p-6`}>
                  <div className="flex items-start justify-between mb-3 md:mb-4">
                    <motion.div 
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className={`w-12 h-12 md:w-16 md:h-16 ${section.iconBg} rounded-xl md:rounded-2xl flex items-center justify-center`}
                    >
                      <Icon className={`w-6 h-6 md:w-8 md:h-8 ${section.iconColor}`} />
                    </motion.div>
                  </div>
                  <h3 className="text-[18px] md:text-[24px] text-white mb-1 md:mb-2">{section.title}</h3>
                  <p className="text-[12px] md:text-[14px] text-white/80">{section.description}</p>
                </div>

                {/* Card Stats */}
                <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                  {section.stats.map((stat, statIndex) => (
                    <motion.div
                      key={statIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 + statIndex * 0.05 }}
                      className="flex items-center justify-between"
                    >
                      <span className="text-[13px] md:text-[15px] text-gray-600">{stat.label}</span>
                      <span className="text-[18px] md:text-[20px] text-gray-900">{stat.value}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Card Action */}
                <motion.button
                  onClick={() => onNavigate(section.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-between p-4 md:p-6 border-t border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-[14px] md:text-[16px] text-blue-600">進入功能</span>
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-4 md:mt-8 bg-white rounded-xl md:rounded-3xl shadow-sm border border-gray-100 p-4 md:p-8"
        >
          <h3 className="text-[18px] md:text-[24px] text-gray-900 mb-4 md:mb-6">最近活動記錄</h3>
          <div className="space-y-3 md:space-y-4">
            {[
              { 
                icon: BarChart3, 
                title: "查看成績趨勢分析", 
                time: "1 小時前", 
                color: "blue",
                detail: "平均分數 84.6"
              },
              { 
                icon: MessageCircle, 
                title: "完成面試模擬練習", 
                time: "3 小時前", 
                color: "purple",
                detail: "評分：85 分"
              },
              { 
                icon: FileText, 
                title: "完成性向測驗問卷", 
                time: "昨天", 
                color: "green",
                detail: "推薦：資訊工程"
              }
            ].map((activity, index) => {
              const ActivityIcon = activity.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ x: 5, transition: { duration: 0.2 } }}
                  className={`flex items-center gap-3 md:gap-4 p-3 md:p-5 bg-${activity.color}-50 rounded-xl md:rounded-2xl cursor-pointer border border-${activity.color}-100`}
                >
                  <div className={`w-10 h-10 md:w-12 md:h-12 bg-${activity.color}-500 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <ActivityIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] md:text-[16px] text-gray-900 truncate">{activity.title}</p>
                    <p className="text-[12px] md:text-[14px] text-gray-500">{activity.detail}</p>
                  </div>
                  <span className="text-[12px] md:text-[14px] text-gray-400 flex-shrink-0">{activity.time}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
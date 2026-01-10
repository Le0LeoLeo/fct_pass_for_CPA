import { TrendingUp, Award, Target, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Button } from "./ui/button";

interface StatisticsPageProps {
  onNavigate: (page: string) => void;
}

export function StatisticsPage({ onNavigate }: StatisticsPageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const gradeData = [
    { month: "9月", score: 68 },
    { month: "10月", score: 72 },
    { month: "11月", score: 75 },
    { month: "12月", score: 78 },
    { month: "1月", score: 82 },
    { month: "2月", score: 85 },
  ];

  const subjectData = [
    { subject: "國文", score: 82 },
    { subject: "英文", score: 88 },
    { subject: "數學", score: 85 },
    { subject: "社會", score: 78 },
    { subject: "自然", score: 90 },
  ];

  const slides = [
    // Slide 1: 概覽
    {
      title: "學習成果概覽",
      subtitle: "2024 學年度統計報告",
      content: (
        <div className="grid grid-cols-3 gap-8 mt-12">
          {[
            { 
              icon: Award, 
              label: "平均分數", 
              value: "84.6", 
              change: "+2.3",
              color: "blue",
              desc: "較上月提升"
            },
            { 
              icon: TrendingUp, 
              label: "成長幅度", 
              value: "+17", 
              change: "6個月",
              color: "purple",
              desc: "持續進步中"
            },
            { 
              icon: Target, 
              label: "班級排名", 
              value: "5/40", 
              change: "Top 12.5%",
              color: "green",
              desc: "優秀表現"
            }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
                className="text-center"
              >
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className={`inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-600 rounded-3xl mb-6 shadow-lg`}
                >
                  <Icon className="w-12 h-12 text-white" />
                </motion.div>
                <p className="text-[16px] text-gray-500 mb-3">{stat.label}</p>
                <motion.p 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.4 + index * 0.1 }}
                  className="text-[56px] text-gray-900 mb-2"
                >
                  {stat.value}
                </motion.p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 bg-${stat.color}-50 rounded-full`}>
                  <span className={`text-[15px] text-${stat.color}-600`}>{stat.change}</span>
                  <span className="text-[13px] text-gray-500">{stat.desc}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )
    },
    
    // Slide 2: 成績趨勢
    {
      title: "成績趨勢分析",
      subtitle: "過去六個月進步軌跡",
      content: (
        <div className="mt-8">
          <div className="w-full h-[400px] mb-8">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 16, fill: "#6b7280" }}
                  stroke="#d1d5db"
                />
                <YAxis 
                  domain={[60, 90]}
                  tick={{ fontSize: 16, fill: "#6b7280" }}
                  stroke="#d1d5db"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "white",
                    border: "2px solid #3b82f6",
                    borderRadius: "16px",
                    fontSize: "16px",
                    padding: "12px 16px",
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  dot={{ fill: "#3b82f6", r: 8 }}
                  activeDot={{ r: 12 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-6"
          >
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <TrendingUp className="w-10 h-10" />
                <h4 className="text-[24px]">成績持續進步</h4>
              </div>
              <p className="text-[18px] text-blue-100">
                相較於 6 個月前，您的成績提升了 <span className="text-[28px] text-white">17 分</span>
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <Award className="w-10 h-10" />
                <h4 className="text-[24px]">穩定成長</h4>
              </div>
              <p className="text-[18px] text-green-100">
                每月平均進步 <span className="text-[28px] text-white">2.8 分</span>，保持這個節奏！
              </p>
            </div>
          </motion.div>
        </div>
      )
    },
    
    // Slide 3: 各科表現
    {
      title: "各科成績表現",
      subtitle: "科目分析與強弱項評估",
      content: (
        <div className="mt-8">
          <div className="w-full h-[420px] mb-6">
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 16, fill: "#6b7280" }}
                  stroke="#d1d5db"
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 16, fill: "#6b7280" }}
                  stroke="#d1d5db"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "white",
                    border: "2px solid #8b5cf6",
                    borderRadius: "16px",
                    fontSize: "16px",
                    padding: "12px 16px",
                  }}
                />
                <Bar 
                  dataKey="score" 
                  fill="url(#colorGradient)" 
                  radius={[16, 16, 0, 0]}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-6"
          >
            <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-[20px] text-gray-900">強項科目</h4>
              </div>
              <p className="text-[16px] text-gray-700 leading-relaxed">
                <span className="text-[24px] text-green-600">自然科</span> 表現優異（90 分），建議考慮理工相關科系
              </p>
            </div>
            <div className="bg-orange-50 border-2 border-orange-200 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-[20px] text-gray-900">加強科目</h4>
              </div>
              <p className="text-[16px] text-gray-700 leading-relaxed">
                <span className="text-[24px] text-orange-600">社會科</span> 還有進步空間（78 分），建議加強複習
              </p>
            </div>
          </motion.div>
        </div>
      )
    },
    
    // Slide 4: 學習目標
    {
      title: "學習目標追蹤",
      subtitle: "本目標達成進度",
      content: (
        <div className="mt-12 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-10 mb-8 border-2 border-blue-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[32px] text-gray-900 mb-2">本月目標：平均 85 分</h3>
                <p className="text-[18px] text-gray-600">目標期限：2026/01/31</p>
              </div>
              <div className="text-right">
                <p className="text-[20px] text-gray-500 mb-1">當前進度</p>
                <p className="text-[56px] text-blue-600">84.6</p>
              </div>
            </div>
            <div className="h-6 bg-white rounded-full overflow-hidden shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "99.5%" }}
                transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 rounded-full flex items-center justify-end pr-4"
              >
                <span className="text-white text-[14px]">99.5%</span>
              </motion.div>
            </div>
            <p className="text-[18px] text-blue-600 mt-4 text-center">
              🎯 再進步 <span className="text-[24px]">0.4 分</span> 即可達成目標！
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
            >
              <h4 className="text-[24px] text-gray-900 mb-6">本週學習計劃</h4>
              <div className="space-y-4">
                {[
                  { done: true, text: "複習數學第三章", color: "green" },
                  { done: false, text: "完成社會科測驗", color: "blue" },
                  { done: false, text: "準備英文聽力練習", color: "purple" }
                ].map((task, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className={`w-7 h-7 rounded-full ${task.done ? `bg-${task.color}-500` : "border-3 border-gray-300"} flex items-center justify-center flex-shrink-0`}>
                      {task.done && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-[17px] ${task.done ? "text-gray-500 line-through" : "text-gray-900"}`}>
                      {task.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-8 text-white shadow-lg"
            >
              <h4 className="text-[24px] mb-6">AI 升學建議</h4>
              <div className="space-y-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 border border-white/30">
                  <p className="text-[15px] text-purple-100 mb-2">預估學測級分</p>
                  <p className="text-[42px]">56-58</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 border border-white/30">
                  <p className="text-[15px] text-purple-100 mb-2">推薦科系</p>
                  <p className="text-[20px]">資訊工程、電機工程</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Slide Container */}
        <div className="bg-white rounded-3xl shadow-2xl p-12 min-h-[750px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.4 }}
              className="pb-28"
            >
              {/* Slide Header */}
              <div className="text-center mb-8">
                <motion.h1 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-[48px] text-gray-900 mb-3"
                >
                  {slides[currentSlide].title}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-[20px] text-gray-500"
                >
                  {slides[currentSlide].subtitle}
                </motion.p>
                <motion.div 
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="w-32 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-6 rounded-full"
                ></motion.div>
              </div>

              {/* Slide Content */}
              <div className="mt-8">
                {slides[currentSlide].content}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="absolute bottom-8 left-12 right-12 flex items-center justify-between">
            {currentSlide > 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={prevSlide}
                  variant="outline"
                  className="h-14 w-14 rounded-full border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 p-0"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              </motion.div>
            ) : (
              <div className="h-14 w-14" />
            )}

            {/* Slide Indicators */}
            <div className="flex items-center gap-3">
              {slides.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  whileHover={{ scale: 1.2 }}
                  className={`rounded-full transition-all ${
                    index === currentSlide
                      ? "w-12 h-3 bg-blue-600"
                      : "w-3 h-3 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>

            {currentSlide < slides.length - 1 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={nextSlide}
                  variant="outline"
                  className="h-14 w-14 rounded-full border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 p-0"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </motion.div>
            ) : (
              <div className="h-14 w-14" />
            )}
          </div>

          {/* Slide Counter */}
          <div className="absolute top-8 right-12 bg-gray-100 px-5 py-2 rounded-full">
            <span className="text-[16px] text-gray-600">
              <span className="text-blue-600 text-[20px]">{currentSlide + 1}</span> / {slides.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
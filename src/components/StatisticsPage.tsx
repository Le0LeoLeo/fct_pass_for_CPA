import { TrendingUp, Award, Target, AlertCircle, ChevronLeft, ChevronRight, Loader2, Info, ChevronDown, ChevronUp } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { analyzeGradeStatistics, GradeStatistics } from "../services/api";
import { getBaiduApiConfig } from "../services/supabase";
import { GradeEvent } from "../services/api";

interface StatisticsPageProps {
  onNavigate: (page: string) => void;
}

const LS_KEY = "schedule_score_state_v1";

// 成績類型權重配置（與AIChatPage保持一致）
const GRADE_TYPE_WEIGHTS: Record<string, number> = {
  '測驗': 0.2, '測': 0.2, '小測': 0.2, '大測': 0.2, 'quiz': 0.2, 'test': 0.2,
  '考試': 0.2, '考': 0.2, '期中': 0.2, '期末': 0.2, '期中考': 0.2, '期末考': 0.2, '實驗考': 0.2, 'exam': 0.2,
  '作業': 0.6, '報告': 0.6, '實驗': 0.6, '日常': 0.6, '表現': 0.6, '平時': 0.6, 'homework': 0.6, 'assignment': 0.6, 'report': 0.6,
};

function getGradeTypeWeight(type: string): number {
  if (!type) return 0.6;
  const lowerType = type.toLowerCase();
  for (const [key, weight] of Object.entries(GRADE_TYPE_WEIGHTS)) {
    if (lowerType.includes(key.toLowerCase())) {
      return weight;
    }
  }
  return 0.6;
}

interface GradeEventWithScore extends GradeEvent {
  score: string;
  maxScore: string;
  note: string;
}

export function StatisticsPage({ onNavigate }: StatisticsPageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [gradeEvents, setGradeEvents] = useState<GradeEventWithScore[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<{
    estimatedScore: string;
    recommendedMajors: string;
    analysis: string;
    strengths: string[];
    improvements: string[];
  } | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [bearerToken, setBearerToken] = useState<string>("");
  const [showInfo, setShowInfo] = useState(false);

  // Load grade data from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
          const state = JSON.parse(saved);
          if (state.events && state.scores) {
            const eventsWithScores: GradeEventWithScore[] = state.events.map((ev: GradeEvent) => ({
              ...ev,
              score: state.scores[ev.id]?.score || "",
              maxScore: state.scores[ev.id]?.maxScore || "",
              note: state.scores[ev.id]?.note || "",
            }));
            setGradeEvents(eventsWithScores);
          }
        }
      } catch (e) {
        console.error("Failed to load grade data:", e);
      }
    };

    loadData();
    // Listen for storage changes
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, []);

  // Get API token
  useEffect(() => {
    const initAPI = async () => {
      try {
        const config = await getBaiduApiConfig();
        if (config.apiToken) {
          setBearerToken(config.apiToken);
        } else if (config.apiKey && config.secretKey) {
          // If no bearer token, try to get from localStorage
          const localToken = localStorage.getItem("baidu_api_token");
          if (localToken) {
            setBearerToken(localToken);
          }
        }
      } catch (error) {
        console.error("Failed to get API config:", error);
        const localToken = localStorage.getItem("baidu_api_token");
        if (localToken) {
          setBearerToken(localToken);
        }
      }
    };
    initAPI();
  }, []);

  // Calculate statistics
  const statistics = useMemo((): GradeStatistics => {
    const bySubject = new Map<string, { 
      count: number; 
      scored: number; 
      sum: number; 
      totalScore: number; 
      totalMax: number;
      byType: Record<string, { scores: number[]; maxScores: number[] }>;
    }>();
    let totalEvents = 0;
    let totalScored = 0;
    let totalScoreSum = 0;
    let totalMaxSum = 0;

    // Helper function to check if subject is elective (選修)
    const isElective = (subject: string): boolean => {
      return subject.includes("選") || subject.includes("選修");
    };

    for (const ev of gradeEvents) {
      totalEvents += 1;
      const subj = ev.subject || "(未分類)";
      const isElectiveSubject = isElective(subj);
      
      if (!bySubject.has(subj)) {
        bySubject.set(subj, { count: 0, scored: 0, sum: 0, totalScore: 0, totalMax: 0, byType: {} });
      }
      const agg = bySubject.get(subj)!;
      agg.count += 1;
      const sc = Number(ev.score);
      const max = Number(ev.maxScore || 100);
      if (!Number.isNaN(sc) && ev.score !== "") {
        agg.scored += 1;
        const pct = max > 0 ? (sc / max) * 100 : 0;
        agg.sum += pct;
        agg.totalScore += sc;
        agg.totalMax += max;
        
        // 按類型分組（用於加權計算）
        const type = ev.type || "";
        const normalizedType = getGradeTypeWeight(type) === 0.2 
          ? (type.includes('測') ? '測驗' : '考試')
          : '日常表現';
        if (!agg.byType[normalizedType]) {
          agg.byType[normalizedType] = { scores: [], maxScores: [] };
        }
        agg.byType[normalizedType].scores.push(sc);
        agg.byType[normalizedType].maxScores.push(max);
        
        // 選修不記入平均分
        if (!isElectiveSubject) {
          totalScored += 1;
          totalScoreSum += sc;
          totalMaxSum += max;
        }
      }
    }

    // 計算加權平均分（考慮類型權重：測驗20%、考試20%、日常表現60%）
    let totalWeightedAvg = 0;
    let weightedSubjectCount = 0;
    
    bySubject.forEach((agg, subj) => {
      const isElectiveSubject = isElective(subj);
      if (!isElectiveSubject && agg.scored > 0) {
        // 計算該科目的加權平均
        const typeAverages: Record<string, number> = {};
        Object.entries(agg.byType).forEach(([type, typeData]) => {
          const totalPct = typeData.scores.reduce((sum, s, i) => sum + (s / typeData.maxScores[i] * 100), 0);
          typeAverages[type] = totalPct / typeData.scores.length;
        });
        
        const quizAvg = typeAverages['測驗'] || 0;
        const examAvg = typeAverages['考試'] || 0;
        const dailyAvg = typeAverages['日常表現'] || 0;
        
        const hasQuiz = typeAverages['測驗'] !== undefined;
        const hasExam = typeAverages['考試'] !== undefined;
        const hasDaily = typeAverages['日常表現'] !== undefined;
        
        let subjectWeightedAvg = 0;
        let weightSum = 0;
        if (hasQuiz) { subjectWeightedAvg += quizAvg * 0.2; weightSum += 0.2; }
        if (hasExam) { subjectWeightedAvg += examAvg * 0.2; weightSum += 0.2; }
        if (hasDaily) { subjectWeightedAvg += dailyAvg * 0.6; weightSum += 0.6; }
        
        if (weightSum > 0) {
          subjectWeightedAvg = subjectWeightedAvg / weightSum;
          totalWeightedAvg += subjectWeightedAvg;
          weightedSubjectCount += 1;
        }
      }
    });

    const overallAvg = weightedSubjectCount > 0
      ? (totalWeightedAvg / weightedSubjectCount).toFixed(1)
      : (totalScored > 0 && totalMaxSum > 0 
          ? ((totalScoreSum / totalMaxSum) * 100).toFixed(1)
          : "-");

    return {
      bySubject: Array.from(bySubject.entries()).map(([subj, a]) => ({
        subject: subj,
        avg: a.scored > 0 ? (a.sum / a.scored).toFixed(1) : "-",
        avgScore: a.scored > 0 ? (a.totalScore / a.scored).toFixed(1) : "-",
        scored: a.scored,
        total: a.count,
        completion: a.count > 0 ? ((a.scored / a.count) * 100).toFixed(0) : "0"
      })),
      overall: {
        totalEvents,
        totalScored,
        completion: totalEvents > 0 ? ((totalScored / totalEvents) * 100).toFixed(0) : "0",
        overallAvg,
        overallScore: totalScored > 0 ? (totalScoreSum / totalScored).toFixed(1) : "-",
        overallMax: totalScored > 0 ? (totalMaxSum / totalScored).toFixed(1) : "-",
      }
    };
  }, [gradeEvents]);

  // Calculate trend data (by month)
  const gradeData = useMemo(() => {
    const monthMap = new Map<string, { count: number; sum: number; maxSum: number }>();
    
    gradeEvents.forEach(ev => {
      if (ev.date) {
        const date = new Date(ev.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthName = `${date.getMonth() + 1}月`;
        
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, { count: 0, sum: 0, maxSum: 0 });
        }
        const sc = Number(ev.score);
        const max = Number(ev.maxScore || 100);
        if (!Number.isNaN(sc) && ev.score !== "") {
          const agg = monthMap.get(monthKey)!;
          agg.count += 1;
          agg.sum += sc;
          agg.maxSum += max;
        }
      }
    });

    return Array.from(monthMap.entries())
      .map(([key, agg]) => {
        const [year, month] = key.split("-");
        return {
          month: `${parseInt(month)}月`,
          score: agg.count > 0 ? Math.round((agg.sum / agg.maxSum) * 100) : 0,
          date: key,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-6); // Last 6 months
  }, [gradeEvents]);

  // Calculate subject data
  const subjectData = useMemo(() => {
    return statistics.bySubject
      .filter(subj => subj.scored > 0)
      .map(subj => ({
        subject: subj.subject,
        score: parseFloat(subj.avg) || 0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 subjects
  }, [statistics]);

  // Load AI analysis
  useEffect(() => {
    if (bearerToken && gradeEvents.length > 0 && statistics.overall.totalScored > 0 && !aiAnalysis && !isLoadingAI) {
      setIsLoadingAI(true);
      analyzeGradeStatistics(statistics, bearerToken)
        .then(result => {
          setAiAnalysis(result);
          setIsLoadingAI(false);
        })
        .catch(error => {
          console.error("Failed to get AI analysis:", error);
          setIsLoadingAI(false);
        });
    }
  }, [bearerToken, gradeEvents, statistics, aiAnalysis, isLoadingAI]);

  // Calculate growth
  const growth = useMemo(() => {
    if (gradeData.length < 2) return { value: "0", change: "數據不足" };
    const first = gradeData[0].score;
    const last = gradeData[gradeData.length - 1].score;
    const diff = last - first;
    return {
      value: diff > 0 ? `+${diff}` : String(diff),
      change: `${gradeData.length}個月`,
    };
  }, [gradeData]);

  // Calculate average monthly progress
  const avgMonthlyProgress = useMemo(() => {
    if (gradeData.length < 2) return "0";
    const first = gradeData[0].score;
    const last = gradeData[gradeData.length - 1].score;
    const diff = last - first;
    return (diff / gradeData.length).toFixed(1);
  }, [gradeData]);

  // Find strengths and weaknesses
  const strengths = useMemo(() => {
    return statistics.bySubject
      .filter(subj => parseFloat(subj.avg) >= 85 && subj.scored > 0)
      .sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg))
      .slice(0, 2);
  }, [statistics]);

  const weaknesses = useMemo(() => {
    return statistics.bySubject
      .filter(subj => parseFloat(subj.avg) < 80 && subj.scored > 0)
      .sort((a, b) => parseFloat(a.avg) - parseFloat(b.avg))
      .slice(0, 2);
  }, [statistics]);

  const slides = [
    // Slide 1: 概覽
    {
      title: "學習成果概覽",
      subtitle: "成績統計報告",
      content: (
        <div className="grid grid-cols-3 gap-8 mt-12">
          {[
            { 
              icon: Award, 
              label: "平均分數", 
              value: statistics.overall.overallAvg !== "-" ? statistics.overall.overallAvg : "0", 
              change: statistics.overall.totalScored > 0 ? `${statistics.overall.totalScored}項已評分` : "無數據",
              color: "blue",
              desc: statistics.overall.completion !== "0" ? `完成度 ${statistics.overall.completion}%` : "尚未開始"
            },
            { 
              icon: TrendingUp, 
              label: "成長幅度", 
              value: growth.value, 
              change: growth.change,
              color: "purple",
              desc: gradeData.length >= 2 ? "持續進步中" : "數據不足"
            },
            { 
              icon: Target, 
              label: "科目數", 
              value: statistics.bySubject.length.toString(), 
              change: `${statistics.overall.totalScored}/${statistics.overall.totalEvents}`,
              color: "green",
              desc: "已記錄科目"
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
      subtitle: gradeData.length > 0 ? "成績進步軌跡" : "尚未有足夠數據",
      content: (
        <div className="mt-8">
          {gradeData.length > 0 ? (
            <>
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
                      domain={[0, 100]}
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
                {gradeData.length >= 2 && (
                  <>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white">
                      <div className="flex items-center gap-4 mb-4">
                        <TrendingUp className="w-10 h-10" />
                        <h4 className="text-[24px]">成績持續進步</h4>
                      </div>
                      <p className="text-[18px] text-blue-100">
                        相較於 {gradeData[0].month}，您的成績提升了 <span className="text-[28px] text-white">{growth.value} 分</span>
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-8 text-white">
                      <div className="flex items-center gap-4 mb-4">
                        <Award className="w-10 h-10" />
                        <h4 className="text-[24px]">穩定成長</h4>
                      </div>
                      <p className="text-[18px] text-green-100">
                        每月平均進步 <span className="text-[28px] text-white">{avgMonthlyProgress} 分</span>，保持這個節奏！
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            </>
          ) : (
            <div className="text-center py-20">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-[20px] text-gray-500">尚未有足夠的成績數據</p>
              <p className="text-[16px] text-gray-400 mt-2">請先到「更新成績」頁面輸入成績</p>
            </div>
          )}
        </div>
      )
    },
    
    // Slide 3: 各科表現
    {
      title: "各科成績表現",
      subtitle: "科目分析與強弱項評估",
      content: (
        <div className="mt-8">
          {subjectData.length > 0 ? (
            <>
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
                {strengths.length > 0 && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                        <Award className="w-7 h-7 text-white" />
                      </div>
                      <h4 className="text-[20px] text-gray-900">強項科目</h4>
                    </div>
                    <p className="text-[16px] text-gray-700 leading-relaxed">
                      <span className="text-[24px] text-green-600">{strengths[0].subject}</span> 表現優異（{strengths[0].avg}%），建議考慮相關科系
                    </p>
                  </div>
                )}
                {weaknesses.length > 0 && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                        <Target className="w-7 h-7 text-white" />
                      </div>
                      <h4 className="text-[20px] text-gray-900">加強科目</h4>
                    </div>
                    <p className="text-[16px] text-gray-700 leading-relaxed">
                      <span className="text-[24px] text-orange-600">{weaknesses[0].subject}</span> 還有進步空間（{weaknesses[0].avg}%），建議加強複習
                    </p>
                  </div>
                )}
              </motion.div>
            </>
          ) : (
            <div className="text-center py-20">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-[20px] text-gray-500">尚未有科目成績數據</p>
              <p className="text-[16px] text-gray-400 mt-2">請先到「更新成績」頁面輸入成績</p>
            </div>
          )}
        </div>
      )
    },
    
    // Slide 4: 學習目標 + AI 分析
    {
      title: "學習目標追蹤",
      subtitle: "目標達成進度與 AI 升學建議",
      content: (
        <div className="mt-12 max-w-4xl mx-auto">
          {statistics.overall.totalScored > 0 ? (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-10 mb-8 border-2 border-blue-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-[32px] text-gray-900 mb-2">當前平均：{statistics.overall.overallAvg}%</h3>
                    <p className="text-[18px] text-gray-600">已完成 {statistics.overall.totalScored} 項成績記錄</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[20px] text-gray-500 mb-1">完成度</p>
                    <p className="text-[56px] text-blue-600">{statistics.overall.completion}%</p>
                  </div>
                </div>
                <div className="h-6 bg-white rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${statistics.overall.completion}%` }}
                    transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 rounded-full flex items-center justify-end pr-4"
                  >
                    <span className="text-white text-[14px]">{statistics.overall.completion}%</span>
                  </motion.div>
                </div>
              </motion.div>

              <div className="grid grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
                >
                  <h4 className="text-[24px] text-gray-900 mb-6">科目完成情況</h4>
                  <div className="space-y-4">
                    {statistics.bySubject.slice(0, 3).map((subj, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-center justify-between"
                      >
                        <span className="text-[17px] text-gray-900">{subj.subject}</span>
                        <span className="text-[17px] text-gray-600">{subj.scored}/{subj.total}</span>
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
                  {isLoadingAI ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="ml-3 text-[16px]">正在分析中...</span>
                    </div>
                  ) : aiAnalysis ? (
                    <div className="space-y-4">
                      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 border border-white/30">
                        <p className="text-[15px] text-purple-100 mb-2">預估學測級分</p>
                        <p className="text-[42px]">{aiAnalysis.estimatedScore}</p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 border border-white/30">
                        <p className="text-[15px] text-purple-100 mb-2">推薦科系</p>
                        <p className="text-[20px]">{aiAnalysis.recommendedMajors}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-[16px] text-purple-100">請配置文心 API Token 以啟用 AI 分析</p>
                    </div>
                  )}
                </motion.div>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-[20px] text-gray-500">尚未有成績數據</p>
              <p className="text-[16px] text-gray-400 mt-2">請先到「更新成績」頁面輸入成績</p>
            </div>
          )}
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
        {/* Header with Info Button */}
        <div className="flex items-center justify-end mb-4">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors bg-white shadow-sm"
          >
            <Info className="w-4 h-4" />
            <span>功能說明</span>
            {showInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        
        {/* 功能說明卡片 */}
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 md:p-6 mb-4"
          >
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Info className="w-5 h-5" />
              功能說明
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>📊 成績統計分析：</strong>多維度分析成績資料，包括各科目成績統計、學期成績趨勢、加權平均分數、成績分佈圖表等。</p>
              <p><strong>🤖 AI成績分析：</strong>使用AI分析成績並提供建議，包括預估學測分數、推薦適合科系、優點分析、改進建議等。</p>
              <p><strong>📈 視覺化圖表：</strong>使用圖表展示成績趨勢和分佈，幫助您更直觀地了解學習狀況。</p>
              <p><strong>📋 詳細報告：</strong>生成完整的成績分析報告，包含多個統計維度的詳細資訊。</p>
              <p className="mt-3 text-xs text-blue-600"><strong>💡 提示：</strong>需要先輸入成績資料（在成績管理頁面）。AI分析需要配置API密鑰。分析結果僅供參考。</p>
            </div>
          </motion.div>
        )}
        
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

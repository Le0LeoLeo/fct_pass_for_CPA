import { MessageCircle, FileText, BarChart3, ChevronRight, TrendingUp, PenSquare } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { getUserStats, getInterviewRecords } from "../services/supabase";

interface GradesAndPracticePageProps {
  onNavigate: (page: string) => void;
}

const LS_KEY = "schedule_score_state_v1";

// 记录成绩查看时间
export function recordGradeView() {
  localStorage.setItem('last_grade_view', new Date().toISOString());
}

// 本周学习概况组件
function WeeklyStats() {
  const [stats, setStats] = useState({
    weeklyStudyHours: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const userStats = await getUserStats();
        setStats({
          weeklyStudyHours: userStats.weeklyStudyHours || 0,
          completionRate: userStats.completionRate || 0,
        });
      } catch (error) {
        console.error('加载学习统计失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <>
      <div className="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-6 border border-white/20">
        <p className="text-[12px] md:text-[14px] text-white/80 mb-1 md:mb-2">總學習時數</p>
        <p className="text-[24px] md:text-[36px] text-white">
          {loading ? '...' : `${stats.weeklyStudyHours} hr`}
        </p>
      </div>
      <div className="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-6 border border-white/20">
        <p className="text-[12px] md:text-[14px] text-white/80 mb-1 md:mb-2">完成度</p>
        <p className="text-[24px] md:text-[36px] text-white">
          {loading ? '...' : `${stats.completionRate}%`}
        </p>
      </div>
    </>
  );
}

// 获取真实成绩数据
function getRealGradeStats() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      return {
        subjectCount: 0,
        average: "0.0",
        lastUpdated: "尚未更新"
      };
    }

    const obj = JSON.parse(raw);
    const events = obj.events || [];
    const scores = obj.scores || {};

    if (events.length === 0) {
      return {
        subjectCount: 0,
        average: "0.0",
        lastUpdated: "尚未更新"
      };
    }

    // 计算已输入科目数（统计不同科目）
    const subjects = new Set<string>();
    events.forEach((ev: any) => {
      if (ev.subject) {
        subjects.add(ev.subject);
      }
    });
    const subjectCount = subjects.size;

    // Helper function to check if subject is elective (選修)
    const isElective = (subject: string): boolean => {
      return subject.includes("選") || subject.includes("選修");
    };

    // 计算学期平均（加权平均），選修不記入平均分
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let scoredCount = 0;

    events.forEach((ev: any) => {
      const scoreData = scores[ev.id];
      if (scoreData && scoreData.score && !isNaN(parseFloat(scoreData.score))) {
        const subject = ev.subject || "";
        const isElectiveSubject = isElective(subject);
        
        // 選修不記入平均分
        if (!isElectiveSubject) {
          const score = parseFloat(scoreData.score);
          const maxScore = parseFloat(scoreData.maxScore || "100");
          if (maxScore > 0) {
            const weight = maxScore;
            totalWeightedScore += score * weight;
            totalWeight += weight;
            scoredCount++;
          }
        }
      }
    });

    const average = totalWeight > 0 
      ? (totalWeightedScore / totalWeight).toFixed(1)
      : "0.0";

    // 格式化最近更新时间
    let lastUpdated = "尚未更新";
    if (obj.savedAt) {
      const savedDate = new Date(obj.savedAt);
      const now = new Date();
      const diffMs = now.getTime() - savedDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        lastUpdated = "剛剛";
      } else if (diffMins < 60) {
        lastUpdated = `${diffMins} 分鐘前`;
      } else if (diffHours < 24) {
        lastUpdated = diffHours === 1 ? "1 小時前" : `${diffHours} 小時前`;
      } else if (diffDays === 1) {
        lastUpdated = "昨天";
      } else if (diffDays < 7) {
        lastUpdated = `${diffDays} 天前`;
      } else {
        const month = savedDate.getMonth() + 1;
        const day = savedDate.getDate();
        lastUpdated = `${month}/${day}`;
      }
    }

    return {
      subjectCount,
      average,
      lastUpdated,
      scoredCount,
      totalEvents: events.length
    };
  } catch (e) {
    console.error('Failed to get grade stats:', e);
    return {
      subjectCount: 0,
      average: "0.0",
      lastUpdated: "尚未更新"
    };
  }
}

export function GradesAndPracticePage({ onNavigate }: GradesAndPracticePageProps) {
  const [gradeStats, setGradeStats] = useState(getRealGradeStats());
  const [detailedActivities, setDetailedActivities] = useState<Array<{
    type: string;
    icon: string;
    title: string;
    time: string;
    color: string;
    detail: string;
    id?: string;
  }>>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [interviewStats, setInterviewStats] = useState({
    totalCount: 0,
    thisWeek: 0,
    averageScore: 0,
  });
  const [questionnaireStats, setQuestionnaireStats] = useState({
    completed: 0,
    recommendedMajors: 0,
    matchRate: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // 加载活动记录和统计数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const userStats = await getUserStats();
        setDetailedActivities(userStats.detailedActivities || []);
        
        // 加载面试统计数据
        const interviews = await getInterviewRecords();
        const totalCount = interviews.length;
        
        // 计算本周面试次数
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // 周一
        startOfWeek.setHours(0, 0, 0, 0);
        const thisWeek = interviews.filter(record => {
          const recordDate = new Date(record.created_at);
          return recordDate >= startOfWeek;
        }).length;
        
        // 计算平均评分
        const scoresWithRating = interviews
          .map(record => record.metadata?.evaluation?.score)
          .filter((score): score is number => typeof score === 'number' && !isNaN(score));
        const averageScore = scoresWithRating.length > 0
          ? Math.round(scoresWithRating.reduce((sum, score) => sum + score, 0) / scoresWithRating.length)
          : 0;
        
        setInterviewStats({
          totalCount,
          thisWeek,
          averageScore,
        });
        
        // 加载问卷统计数据
        const questionnaireCompleted = localStorage.getItem('questionnaire_completed_at');
        const questionnaireState = localStorage.getItem('adaptive_questionnaire_state');
        const questionnaireFinalState = localStorage.getItem('adaptive_questionnaire_final_state');
        
        // 检查问卷是否完成（有完成时间或者状态显示完成）
        const isCompleted = !!questionnaireCompleted || !!questionnaireFinalState;
        const completed = isCompleted ? 1 : 0;
        
        // 获取推荐科系数量
        const recommendedMajors = userStats.aiRecommendations?.length || 0;
        
        // 获取最高匹配度
        const matchRate = userStats.aiRecommendations && userStats.aiRecommendations.length > 0
          ? userStats.aiRecommendations[0].match || 0
          : 0;
        
        setQuestionnaireStats({
          completed,
          recommendedMajors,
          matchRate,
        });
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoadingActivities(false);
        setLoadingStats(false);
      }
    };

    loadData();
  }, []);

  // 定期更新统计数据
  useEffect(() => {
    const updateStats = () => {
      setGradeStats(getRealGradeStats());
    };

    // 立即更新一次
    updateStats();

    // 监听 localStorage 变化
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LS_KEY) {
        updateStats();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // 定期检查（因为同标签页的 localStorage 变化不会触发 storage 事件）
    const interval = setInterval(updateStats, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

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
        { label: "總練習次數", value: loadingStats ? "..." : interviewStats.totalCount.toString() },
        { label: "本週練習", value: loadingStats ? "..." : interviewStats.thisWeek.toString() },
        { label: "平均評分", value: loadingStats ? "..." : (interviewStats.averageScore > 0 ? interviewStats.averageScore.toString() : "-") }
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
        { label: "已完成問卷", value: loadingStats ? "..." : questionnaireStats.completed.toString() },
        { label: "推薦科系", value: loadingStats ? "..." : questionnaireStats.recommendedMajors.toString() },
        { label: "匹配度", value: loadingStats ? "..." : (questionnaireStats.matchRate > 0 ? `${questionnaireStats.matchRate}%` : "-") }
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
        { label: "平均分數", value: gradeStats.average },
        { label: "已完成", value: gradeStats.scoredCount ? `${gradeStats.scoredCount}/${gradeStats.totalEvents}` : "0/0" },
        { label: "科目數", value: gradeStats.subjectCount.toString() }
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
        { label: "已輸入科目", value: gradeStats.subjectCount.toString() },
        { label: "學期平均", value: gradeStats.average },
        { label: "最近更新", value: gradeStats.lastUpdated }
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
            <WeeklyStats />
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
            {loadingActivities ? (
              <div className="text-center py-8 text-gray-500">載入中...</div>
            ) : detailedActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">還沒有活動記錄</div>
            ) : (
              detailedActivities.map((activity, index) => {
                const ActivityIcon = activity.icon === 'BarChart3' ? BarChart3 :
                                    activity.icon === 'MessageCircle' ? MessageCircle : FileText;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ x: 5, transition: { duration: 0.2 } }}
                  onClick={() => {
                    if (activity.type === 'grade') {
                      onNavigate('update-grades');
                    } else if (activity.type === 'interview') {
                      onNavigate('interview-practice');
                    } else if (activity.type === 'questionnaire') {
                      onNavigate('questionnaire');
                    }
                  }}
                  className={`flex items-center gap-3 md:gap-4 p-3 md:p-5 rounded-xl md:rounded-2xl cursor-pointer border ${
                    activity.color === 'blue' ? 'bg-blue-50 border-blue-100' :
                    activity.color === 'purple' ? 'bg-purple-50 border-purple-100' :
                    'bg-green-50 border-green-100'
                  }`}
                >
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activity.color === 'blue' ? 'bg-blue-500' :
                    activity.color === 'purple' ? 'bg-purple-500' :
                    'bg-green-500'
                  }`}>
                    <ActivityIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] md:text-[16px] text-gray-900 truncate">{activity.title}</p>
                    <p className="text-[12px] md:text-[14px] text-gray-500">{activity.detail}</p>
                  </div>
                  <span className="text-[12px] md:text-[14px] text-gray-400 flex-shrink-0">{activity.time}</span>
                </motion.div>
              );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
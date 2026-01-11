import { Video, Mic, MessageSquare, CheckCircle, Play } from "lucide-react";
import { Button } from "./ui/button";

interface InterviewPageProps {
  onNavigate: (page: string) => void;
}

export function InterviewPage({ onNavigate }: InterviewPageProps) {
  const questionCategories = [
    { id: 1, title: "自我介紹", count: 12, icon: MessageSquare, color: "bg-blue-500" },
    { id: 2, title: "學習動機", count: 15, icon: CheckCircle, color: "bg-purple-500" },
    { id: 3, title: "專業問題", count: 20, icon: Video, color: "bg-cyan-500" },
    { id: 4, title: "情境題", count: 18, icon: Mic, color: "bg-green-500" },
  ];

  const recentPractice = [
    { id: 1, question: "請簡單介紹你自己", score: 85, date: "2 天前", feedback: "表達清晰，建議加強眼神接觸" },
    { id: 2, question: "為什麼選擇這個科系？", score: 92, date: "3 天前", feedback: "動機明確，回答完整" },
    { id: 3, question: "你的優點和缺點是什麼？", score: 78, date: "5 天前", feedback: "可以舉更具體的例子" },
    { id: 4, question: "如何處理壓力和挫折？", score: 88, date: "1 週前", feedback: "回答誠懇，有實際經驗支持" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[32px] text-gray-900 mb-2">面試練習</h1>
          <p className="text-[16px] text-gray-600">透過 AI 提升您的面試能力</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {/* AI Mock Interview Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl shadow-lg p-8 mb-8 text-white">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-[28px] mb-3">AI 模擬面試</h2>
                  <p className="text-[16px] text-blue-100 mb-6">
                    透過 AI 進行即時互動面試，獲得專業回饋與建議
                  </p>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                      <p className="text-[13px] text-blue-100 mb-1">已練習</p>
                      <p className="text-[24px]">12次</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                      <p className="text-[13px] text-blue-100 mb-1">平均分數</p>
                      <p className="text-[24px]">86分</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                      <p className="text-[13px] text-blue-100 mb-1">進步幅度</p>
                      <p className="text-[24px]">+14</p>
                    </div>
                  </div>
                  <Button className="w-full md:w-auto h-12 bg-white text-blue-600 hover:bg-blue-50 rounded-xl px-8">
                    <Play className="w-5 h-5 mr-2" />
                    開始模擬面試
                  </Button>
                </div>
                <div className="hidden md:flex w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl items-center justify-center">
                  <Video className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>

            {/* Question Categories */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
              <h3 className="text-[24px] text-gray-900 mb-6">常見面試題庫</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {questionCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      className="flex flex-col items-center p-6 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all hover:shadow-md"
                    >
                      <div className={`w-14 h-14 ${category.color} rounded-xl flex items-center justify-center mb-3`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h4 className="text-[16px] text-gray-900 mb-1">
                        {category.title}
                      </h4>
                      <p className="text-[13px] text-gray-500">
                        {category.count} 題
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Practice Mode */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-[24px] text-gray-900 mb-6">練習模式</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center gap-4 p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl hover:shadow-md transition-all">
                  <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-[17px] text-gray-900 mb-1">文字對話練習</h4>
                    <p className="text-[14px] text-gray-600">透過文字與 AI 模擬面試</p>
                  </div>
                </button>
                
                <button className="flex items-center gap-4 p-6 bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-2xl hover:shadow-md transition-all">
                  <div className="w-14 h-14 bg-cyan-500 rounded-xl flex items-center justify-center">
                    <Mic className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-[17px] text-gray-900 mb-1">語音對話練習</h4>
                    <p className="text-[14px] text-gray-600">使用語音進行真實模擬</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Recent Practice */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-[20px] text-gray-900 mb-4">最近練習</h3>
              <div className="space-y-3">
                {recentPractice.map((practice) => (
                  <div
                    key={practice.id}
                    className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-[15px] text-gray-900 flex-1 pr-2">
                        {practice.question}
                      </p>
                      <div className={`flex items-center justify-center min-w-[3rem] h-10 rounded-xl ${
                        practice.score >= 85 ? "bg-green-100" : practice.score >= 70 ? "bg-blue-100" : "bg-orange-100"
                      }`}>
                        <span className={`text-[16px] ${
                          practice.score >= 85 ? "text-green-600" : practice.score >= 70 ? "text-blue-600" : "text-orange-600"
                        }`}>
                          {practice.score}
                        </span>
                      </div>
                    </div>
                    <p className="text-[13px] text-gray-500 mb-2">{practice.date}</p>
                    <p className="text-[13px] text-gray-600 bg-white rounded-lg p-2">
                      💡 {practice.feedback}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

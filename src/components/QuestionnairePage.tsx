import { useState } from "react";
import { ChevronRight, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

interface QuestionnairePageProps {
  onNavigate: (page: string) => void;
}

export function QuestionnairePage({ onNavigate }: QuestionnairePageProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const questions = [
    {
      id: 1,
      category: "興趣探索",
      question: "你最喜歡哪種類型的活動？",
      options: [
        "解決複雜的問題和謎題",
        "與人交流和溝通",
        "創作藝術作品",
        "戶外運動和冒險",
      ],
    },
    {
      id: 2,
      category: "能力評估",
      question: "你認為自己最擅長什麼？",
      options: [
        "邏輯思考和分析",
        "表達和演說",
        "創意發想",
        "團隊合作",
      ],
    },
    {
      id: 3,
      category: "性向分析",
      question: "面對新事物，你通常會？",
      options: [
        "仔細研究後再嘗試",
        "立刻與他人討論",
        "用創新方式探索",
        "邊做邊學習",
      ],
    },
    {
      id: 4,
      category: "職涯規劃",
      question: "你理想的工作環境是？",
      options: [
        "安靜的研究室",
        "活潑的辦公室",
        "自由的工作室",
        "多變的戶外環境",
      ],
    },
    {
      id: 5,
      category: "價值觀",
      question: "對你來說最重要的是？",
      options: [
        "追求知識真理",
        "幫助他人成長",
        "展現個人創意",
        "達成具體成就",
      ],
    },
  ];

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 300);
    } else {
      setTimeout(() => {
        setShowResults(true);
      }, 300);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[32px] text-gray-900 mb-2">問卷結果</h1>
            <p className="text-[16px] text-gray-600">AI 深度分析您的性向與能力</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Success Message */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl shadow-lg p-8 mb-6 text-white">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <CheckCircle className="w-14 h-14 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[28px] mb-2">分析完成！</h2>
                    <p className="text-[16px] text-green-100">
                      AI 已根據您的回答進行深度分析
                    </p>
                  </div>
                </div>
              </div>

              {/* Personality Type */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6">
                <h3 className="text-[24px] text-gray-900 mb-6">您的性向類型</h3>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
                  <h4 className="text-[24px] text-gray-900 mb-3">研究型 (Investigative)</h4>
                  <p className="text-[16px] text-gray-600 leading-relaxed">
                    您喜歡探索和理解事物運作的原理，擅長邏輯思考與問題解決，
                    適合從事需要分析和研究的工作。
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[15px] mb-2">
                      <span className="text-gray-600">邏輯思維</span>
                      <span className="text-blue-600">92%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: "92%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[15px] mb-2">
                      <span className="text-gray-600">創意發想</span>
                      <span className="text-purple-600">78%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: "78%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[15px] mb-2">
                      <span className="text-gray-600">人際互動</span>
                      <span className="text-green-600">65%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: "65%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              {/* Recommended Departments */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-[20px] text-gray-900 mb-4">推薦科系</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl cursor-pointer hover:bg-blue-100 transition-colors">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white text-[18px]">
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[16px] text-gray-900">資訊工程學系</h4>
                      <p className="text-[13px] text-gray-600">匹配度 95%</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl cursor-pointer hover:bg-purple-100 transition-colors">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white text-[18px]">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[16px] text-gray-900">電機工程學系</h4>
                      <p className="text-[13px] text-gray-600">匹配度 88%</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-cyan-50 rounded-2xl cursor-pointer hover:bg-cyan-100 transition-colors">
                    <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center text-white text-[18px]">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[16px] text-gray-900">數學系</h4>
                      <p className="text-[13px] text-gray-600">匹配度 82%</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <Button
                  onClick={() => onNavigate("home")}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl mt-6"
                >
                  返回主頁
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-[32px] text-gray-900 mb-2">智能問卷</h1>
              <p className="text-[16px] text-gray-600">分析您的興趣與性向</p>
            </div>
            <span className="text-[15px] text-gray-500">
              第 {currentQuestion + 1} / {questions.length} 題
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10">
          <div className="mb-8">
            <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-600 rounded-full text-[13px] mb-6">
              {question.category}
            </span>
            <h2 className="text-[28px] text-gray-900 leading-relaxed">
              {question.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-4">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all hover:border-blue-500 hover:bg-blue-50 ${
                  answers[currentQuestion] === index
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    answers[currentQuestion] === index
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}>
                    {answers[currentQuestion] === index && (
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="text-[17px] text-gray-900">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Hint */}
        <p className="text-center text-[15px] text-gray-500 mt-6">
          點選答案後將自動進入下一題
        </p>
      </div>
    </div>
  );
}
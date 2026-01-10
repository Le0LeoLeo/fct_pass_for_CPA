import { useState, useEffect, useRef } from "react";
import { Bot, User, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface AIChatPageProps {
  onNavigate: (page: string) => void;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function AIChatPage({ onNavigate }: AIChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "您好！我是 AI 升學輔導助手，很高興為您服務。我可以幫您：\n\n• 推薦適合的科系\n• 解答升學相關問題\n• 提供面試準備建議\n• 分析學校與科系資訊\n\n請問有什麼我可以幫助您的嗎？",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickQuestions = [
    "推薦適合我的科系",
    "如何準備面試？",
    "理工科系比較",
    "分數落點分析",
  ];

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        role: "assistant",
        content: getAIResponse(inputValue),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes("科系") || lowerQuestion.includes("推薦")) {
      return "根據您的興趣和能力分析，我推薦以下科系：\n\n1. 資訊工程學系\n   • 符合您的邏輯思維能力\n   • 就業前景優異\n   • 薪資水準較高\n\n2. 電機工程學系\n   • 理論與實務並重\n   • 產業需求穩定\n\n您想進一步了解哪個科系呢？";
    }
    
    if (lowerQuestion.includes("面試") || lowerQuestion.includes("準備")) {
      return "面試準備建議：\n\n1. 自我介紹練習\n   • 控制在 2-3 分鐘\n   • 突出個人特色\n\n2. 了解科系特色\n   • 研究課程內容\n   • 準備相關問題\n\n3. 模擬練習\n   • 使用我們的 AI 面試功能\n   • 記錄並改進表現\n\n建議您到「面試練習」頁面進行模擬訓練！";
    }
    
    if (lowerQuestion.includes("分數") || lowerQuestion.includes("落點")) {
      return "分數落點分析需要您的考試成績資料。請提供：\n\n• 學測或統測成績\n• 在校成績排名\n• 想就讀的地區\n• 科系偏好\n\n您可以到「分數統計」頁面輸入詳細資料，我會為您提供更精確的落點分析！";
    }
    
    return "感謝您的提問！這是個很好的問題。我建議您可以：\n\n• 查看大學資料庫了解更多科系資訊\n• 完成智能問卷找出適合的方向\n• 進行面試練習提升應試能力\n\n還有其他想了解的嗎？我很樂意為您解答！";
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-[32px] text-gray-900">AI 助手</h1>
              <p className="text-[15px] text-green-500 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                在線上
              </p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-13rem)]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, delay: index === messages.length - 1 ? 0.1 : 0 }}
                    className={`flex gap-4 ${
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === "user"
                          ? "bg-blue-600"
                          : "bg-gradient-to-br from-purple-500 to-purple-600"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </motion.div>

                    {/* Message Bubble */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 }}
                      className={`max-w-[70%] rounded-2xl px-5 py-4 ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-[15px] leading-relaxed whitespace-pre-line">
                        {message.content}
                      </p>
                      <p
                        className={`text-[12px] mt-2 ${
                          message.role === "user" ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString("zh-TW", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-4"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl px-5 py-4">
                      <div className="flex gap-1.5">
                        <motion.div 
                          animate={{ y: [0, -8, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                          className="w-2.5 h-2.5 bg-gray-400 rounded-full"
                        ></motion.div>
                        <motion.div 
                          animate={{ y: [0, -8, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                          className="w-2.5 h-2.5 bg-gray-400 rounded-full"
                        ></motion.div>
                        <motion.div 
                          animate={{ y: [0, -8, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                          className="w-2.5 h-2.5 bg-gray-400 rounded-full"
                        ></motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="px-6 pb-4 border-t border-gray-100 pt-4"
            >
              <p className="text-[14px] text-gray-500 mb-3">快速提問：</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickQuestion(question)}
                    className="px-4 py-2 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-500 rounded-full text-[14px] text-gray-700 transition-all"
                  >
                    {question}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t border-gray-100">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="輸入訊息..."
                  className="h-12 bg-gray-50 border-gray-200 rounded-xl"
                />
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="h-12 w-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-0 flex items-center justify-center disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
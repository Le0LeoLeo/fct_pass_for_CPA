import { useState, useEffect, useRef } from "react";
import { Bot, User, Send, Plus, Trash2, MessageSquare, X, Menu, ChevronRight, ChevronLeft, Info, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { callErnieChatAPI } from "../services/api";
import { getBaiduApiConfig } from "../services/supabase";
import { getBaiduAccessToken } from "../services/api";

interface AIChatPageProps {
  onNavigate: (page: string) => void;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEY = "ai_chat_conversations";
const GRADE_STORAGE_KEY = "schedule_score_state_v1";

// 成績類型權重配置（學校評分系統）
const GRADE_TYPE_WEIGHTS: Record<string, number> = {
  // 測驗類型：20%
  '測驗': 0.2,
  '測': 0.2,
  '小測': 0.2,
  '大測': 0.2,
  'quiz': 0.2,
  'test': 0.2,
  // 考試類型：20%
  '考試': 0.2,
  '考': 0.2,
  '期中': 0.2,
  '期末': 0.2,
  '期中考': 0.2,
  '期末考': 0.2,
  '實驗考': 0.2,
  'exam': 0.2,
  // 日常表現類型：60%
  '作業': 0.6,
  '報告': 0.6,
  '實驗': 0.6,
  '日常': 0.6,
  '表現': 0.6,
  '平時': 0.6,
  'homework': 0.6,
  'assignment': 0.6,
  'report': 0.6,
};

// 根據類型判斷權重
function getGradeTypeWeight(type: string): number {
  if (!type) return 0.6; // 默認視為日常表現（60%）
  const lowerType = type.toLowerCase();
  for (const [key, weight] of Object.entries(GRADE_TYPE_WEIGHTS)) {
    if (lowerType.includes(key.toLowerCase())) {
      return weight;
    }
  }
  return 0.6; // 默認視為日常表現
}

// 獲取用戶成績數據的函數
function getUserGradesData(): string {
  try {
    const raw = localStorage.getItem(GRADE_STORAGE_KEY);
    if (!raw) {
      return "用戶尚未輸入成績資料";
    }

    const obj = JSON.parse(raw);
    const events = obj.events || [];
    const scores = obj.scores || {};

    if (events.length === 0) {
      return "用戶尚未輸入成績資料";
    }

    // 檢查是否為選修科目
    const isElective = (subject: string): boolean => {
      return subject.includes("選") || subject.includes("選修");
    };

    // 計算加權平均分數（考慮成績類型權重：測驗20%、考試20%、日常表現60%）
    // 對於每個科目，先按類型分組計算平均，再按權重組合
    let scoredCount = 0;
    const subjects = new Set<string>();
    const subjectScores: Record<string, { 
      count: number; 
      maxScore: number; 
      byType: Record<string, { scores: number[]; maxScores: number[] }> 
    }> = {};

    events.forEach((ev: any) => {
      if (ev.subject) {
        subjects.add(ev.subject);
      }
      const scoreData = scores[ev.id];
      if (scoreData && scoreData.score && !isNaN(parseFloat(scoreData.score))) {
        const subject = ev.subject || "";
        const isElectiveSubject = isElective(subject);
        const score = parseFloat(scoreData.score);
        const maxScore = parseFloat(scoreData.maxScore || "100");
        const type = ev.type || "";
        const normalizedType = getGradeTypeWeight(type) === 0.2 
          ? (type.includes('測') ? '測驗' : '考試')
          : '日常表現';
        
        if (maxScore > 0 && !isElectiveSubject) {
          scoredCount++;
          
          if (!subjectScores[subject]) {
            subjectScores[subject] = { count: 0, maxScore: 0, byType: {} };
          }
          subjectScores[subject].count += 1;
          subjectScores[subject].maxScore = Math.max(subjectScores[subject].maxScore, maxScore);
          
          if (!subjectScores[subject].byType[normalizedType]) {
            subjectScores[subject].byType[normalizedType] = { scores: [], maxScores: [] };
          }
          subjectScores[subject].byType[normalizedType].scores.push(score);
          subjectScores[subject].byType[normalizedType].maxScores.push(maxScore);
        }
      }
    });

    // 計算總體加權平均（所有科目的加權平均）
    let totalWeightedScore = 0;
    let totalSubjects = 0;

    Object.entries(subjectScores).forEach(([subject, data]) => {
      // 計算該科目的加權平均
      const typeAverages: Record<string, number> = {};
      Object.entries(data.byType).forEach(([type, typeData]) => {
        const totalScore = typeData.scores.reduce((sum, s, i) => sum + (s / typeData.maxScores[i] * 100), 0);
        typeAverages[type] = totalScore / typeData.scores.length;
      });
      
      // 按權重組合：測驗20%、考試20%、日常表現60%
      const quizAvg = typeAverages['測驗'] || 0;
      const examAvg = typeAverages['考試'] || 0;
      const dailyAvg = typeAverages['日常表現'] || 0;
      
      // 計算加權平均，如果某類型沒有成績，則調整權重
      const hasQuiz = typeAverages['測驗'] !== undefined;
      const hasExam = typeAverages['考試'] !== undefined;
      const hasDaily = typeAverages['日常表現'] !== undefined;
      
      let subjectWeightedAvg = 0;
      let weightSum = 0;
      if (hasQuiz) { subjectWeightedAvg += quizAvg * 0.2; weightSum += 0.2; }
      if (hasExam) { subjectWeightedAvg += examAvg * 0.2; weightSum += 0.2; }
      if (hasDaily) { subjectWeightedAvg += dailyAvg * 0.6; weightSum += 0.6; }
      
      if (weightSum > 0) {
        subjectWeightedAvg = subjectWeightedAvg / weightSum; // 歸一化
        totalWeightedScore += subjectWeightedAvg;
        totalSubjects += 1;
      }
    });

    const average = totalSubjects > 0 
      ? (totalWeightedScore / totalSubjects).toFixed(1)
      : "0.0";

    // 構建成績摘要文本
    let gradeSummary = `用戶成績資訊（評分系統：測驗20%、考試20%、日常表現60%）：\n`;
    gradeSummary += `- 總科目數：${subjects.size}\n`;
    gradeSummary += `- 已評分項目：${scoredCount}/${events.length}\n`;
    gradeSummary += `- 加權平均分（考慮類型權重）：${average}分\n\n`;
    
    // 各科成績
    if (Object.keys(subjectScores).length > 0) {
      gradeSummary += `各科成績：\n`;
      Object.entries(subjectScores).forEach(([subject, data]) => {
        const typeAverages: Record<string, number> = {};
        Object.entries(data.byType).forEach(([type, typeData]) => {
          const totalScore = typeData.scores.reduce((sum, s, i) => sum + (s / typeData.maxScores[i] * 100), 0);
          typeAverages[type] = totalScore / typeData.scores.length;
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
        
        const avg = weightSum > 0 ? (subjectWeightedAvg / weightSum).toFixed(1) : "0.0";
        const typeInfo = [];
        if (hasQuiz) typeInfo.push(`測驗:${quizAvg.toFixed(1)}`);
        if (hasExam) typeInfo.push(`考試:${examAvg.toFixed(1)}`);
        if (hasDaily) typeInfo.push(`日常:${dailyAvg.toFixed(1)}`);
        gradeSummary += `- ${subject}：加權平均 ${avg}分（${typeInfo.join(' ')}, 共${data.count}項）\n`;
      });
    }

    return gradeSummary;
  } catch (e) {
    console.error('獲取成績數據失敗:', e);
    return "無法讀取成績資料";
  }
}

export function AIChatPage({ onNavigate }: AIChatPageProps) {
  console.log('🚀 AIChatPage 組件已渲染');
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "您好！我是 AI 升學輔導助手，很高興為您服務。我可以幫您：\n\n• 推薦適合的科系\n• 解答升學相關問題\n• 提供面試準備建議\n• 分析學校與科系資訊\n• 根據您的成績提供個性化建議\n\n請問有什麼我可以幫助您的嗎？",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [accessToken, setAccessToken] = useState<string>("");
  const [apiReady, setApiReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载对话历史
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const loadedConversations: Conversation[] = parsed.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setConversations(loadedConversations);
        
        // 如果有对话，加载最新的
        if (loadedConversations.length > 0) {
          const latest = loadedConversations[loadedConversations.length - 1];
          setCurrentConversationId(latest.id);
          setMessages(latest.messages);
        }
      } catch (error) {
        console.error('加载对话历史失败:', error);
      }
    }
  }, []);

  // 保存对话到 localStorage
  const saveConversations = (convs: Conversation[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
    } catch (error) {
      console.error('保存对话失败:', error);
    }
  };

  // 保存对话历史
  useEffect(() => {
    if (conversations.length > 0) {
      saveConversations(conversations);
    }
  }, [conversations]);

  // 添加状态监听
  useEffect(() => {
    console.log('📊 狀態更新:', { apiReady, hasAccessToken: !!accessToken, accessTokenLength: accessToken.length });
  }, [apiReady, accessToken]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 生成对话标题（基于第一条用户消息）
  const generateTitle = (firstUserMessage: string): string => {
    const trimmed = firstUserMessage.trim();
    if (trimmed.length <= 30) return trimmed;
    return trimmed.substring(0, 30) + "...";
  };

  // 创建新对话
  const createNewConversation = () => {
    const initialMessage: Message = {
      id: 1,
      role: "assistant",
      content: "您好！我是 AI 升學輔導助手，很高興為您服務。我可以幫您：\n\n• 推薦適合的科系\n• 解答升學相關問題\n• 提供面試準備建議\n• 分析學校與科系資訊\n\n請問有什麼我可以幫助您的嗎？",
      timestamp: new Date(),
    };
    
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "新對話",
      messages: [initialMessage],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setConversations((prev) => [...prev, newConversation]);
    setCurrentConversationId(newConversation.id);
    setMessages([initialMessage]);
  };

  // 切换对话
  const switchConversation = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      setCurrentConversationId(conversationId);
      setMessages(conversation.messages);
    }
  };

  // 删除对话
  const deleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newConversations = conversations.filter((c) => c.id !== conversationId);
    setConversations(newConversations);
    
    if (currentConversationId === conversationId) {
      if (newConversations.length > 0) {
        const latest = newConversations[newConversations.length - 1];
        setCurrentConversationId(latest.id);
        setMessages(latest.messages);
      } else {
        createNewConversation();
      }
    }
  };

  // 保存当前对话
  const saveCurrentConversation = () => {
    if (!currentConversationId) return;
    
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === currentConversationId) {
          // 如果有用户消息，更新标题
          const firstUserMessage = messages.find((m) => m.role === "user");
          const newTitle = firstUserMessage
            ? generateTitle(firstUserMessage.content)
            : conv.title;
          
          return {
            ...conv,
            messages: messages,
            title: newTitle,
            updatedAt: new Date(),
          };
        }
        return conv;
      })
    );
  };


  // 初始化 API 配置和访问令牌
  useEffect(() => {
    const initializeAPI = async () => {
      console.log('🔧 開始初始化 API 配置...');
      try {
        const config = await getBaiduApiConfig();
        console.log('📦 從 Supabase 獲取的配置:', {
          hasApiKey: !!config.apiKey,
          hasSecretKey: !!config.secretKey,
          hasApiToken: !!config.apiToken,
          apiKeyLength: config.apiKey?.length || 0,
          secretKeyLength: config.secretKey?.length || 0,
          apiTokenLength: config.apiToken?.length || 0,
        });
        
        // 优先使用 apiToken（Bearer token），如果没有则使用 apiKey + secretKey 获取 access token
        if (config.apiToken) {
          setAccessToken(config.apiToken);
          setApiReady(true);
          console.log('✅ 文心 API 已就緒（使用 Bearer Token）');
        } else if (config.apiKey && config.secretKey) {
          try {
            console.log('🔄 正在通過 OAuth 獲取訪問令牌...');
            const token = await getBaiduAccessToken(config.apiKey, config.secretKey);
            console.log('✅ 成功獲取訪問令牌，長度:', token.length);
            setAccessToken(token);
            setApiReady(true);
            console.log('✅ 文心 API 已就緒（使用 OAuth Token）');
          } catch (error) {
            console.error('❌ 獲取訪問令牌失敗:', error);
            // 如果從 Supabase 獲取失敗，嘗試從 localStorage
            const localApiKey = localStorage.getItem('baidu_api_key') || '';
            const localSecretKey = localStorage.getItem('baidu_secret_key') || '';
            const localApiToken = localStorage.getItem('baidu_api_token') || '';
            
            if (localApiToken) {
              setAccessToken(localApiToken);
              setApiReady(true);
              console.log('文心 API 已就緒（從 localStorage 使用 Bearer Token）');
            } else if (localApiKey && localSecretKey) {
              try {
                const token = await getBaiduAccessToken(localApiKey, localSecretKey);
                setAccessToken(token);
                setApiReady(true);
              } catch (err) {
                console.error('從 localStorage 獲取令牌失敗:', err);
              }
            }
          }
        } else {
          // 如果 Supabase 沒有配置，嘗試從 localStorage
          const localApiToken = localStorage.getItem('baidu_api_token') || '';
          const localApiKey = localStorage.getItem('baidu_api_key') || '';
          const localSecretKey = localStorage.getItem('baidu_secret_key') || '';
          
          if (localApiToken) {
            setAccessToken(localApiToken);
            setApiReady(true);
            console.log('文心 API 已就緒（從 localStorage 使用 Bearer Token）');
          } else if (localApiKey && localSecretKey) {
            try {
              const token = await getBaiduAccessToken(localApiKey, localSecretKey);
              setAccessToken(token);
              setApiReady(true);
            } catch (err) {
              console.error('從 localStorage 獲取令牌失敗:', err);
            }
          }
        }
      } catch (error) {
        console.error('❌ 初始化 API 配置失敗:', error);
        console.error('錯誤詳情:', error);
      }
    };

    initializeAPI();
  }, []);

  const quickQuestions = [
    "推薦適合我的科系",
    "如何準備面試？",
    "理工科系比較",
    "分數落點分析",
  ];

  const handleSend = async () => {
    console.log('🎯 handleSend 被調用');
    console.log('📝 輸入值:', inputValue);
    console.log('📊 當前狀態:', { apiReady, hasAccessToken: !!accessToken, accessTokenLength: accessToken.length });
    
    if (!inputValue.trim()) {
      console.log('⚠️ 輸入為空，返回');
      return;
    }

    // 如果没有当前对话，创建新对话
    if (!currentConversationId) {
      createNewConversation();
    }

    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    // 如果是新对话的第一条用户消息，更新标题
    if (currentConversationId && messages.length === 1) {
      const title = generateTitle(inputValue);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId ? { ...conv, title } : conv
        )
      );
    }
    
    const currentInput = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      console.log('📤 準備發送消息:', {
        apiReady,
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken?.length || 0,
        message: currentInput,
        conversationHistoryLength: messages.length,
      });

      if (apiReady && accessToken) {
        console.log('✅ API 已就緒，開始調用真實 API');
        // 使用真实的文心 4.5 API
        const conversationHistory = messages
          .filter(msg => msg.role !== "assistant" || msg.id !== 1) // 排除初始欢迎消息
          .map(msg => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content,
          }));

        console.log('🤖 調用文心 API，對話歷史長度:', conversationHistory.length);
        console.log('🔗 API 端點: https://qianfan.baidubce.com/v2/chat/completions');
        console.log('📝 模型: ernie-4.5-turbo-128k');

        // 獲取用戶成績數據並構建增強版system prompt
        const gradesData = getUserGradesData();
        const enhancedSystemPrompt = `你是一位專業的AI升學輔導助手，可以幫助學生：
1. 推薦適合的科系和專業
2. 解答升學相關問題
3. 提供面試準備建議
4. 分析學校與科系資訊
5. 進行分數落點分析
6. 根據學生成績提供個性化建議

${gradesData}

要求：
- 回答要專業、準確、友好
- 根據學生的具體情況（包括成績數據）提供個性化建議
- 當用戶詢問與成績、分數、落點相關問題時，可以參考上述成績資訊
- 使用清晰易懂的語言
- 可以適當使用列表和分段來組織回答
- 如果用戶成績資料尚未完整，可以提醒用戶到「更新成績」頁面輸入成績`;

        const aiResponseText = await callErnieChatAPI(
          currentInput,
          conversationHistory,
          accessToken,
          'ernie-4.5-turbo-128k', // 使用文心 4.5 Turbo 128k
          enhancedSystemPrompt
        );

        console.log('✅ 收到 AI 響應，長度:', aiResponseText.length);

        const aiResponse: Message = {
          id: newMessages.length + 1,
          role: "assistant",
          content: aiResponseText,
          timestamp: new Date(),
        };
        const finalMessages = [...newMessages, aiResponse];
        setMessages(finalMessages);
        
        // 保存对话
        if (currentConversationId) {
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === currentConversationId
                ? { ...conv, messages: finalMessages, updatedAt: new Date() }
                : conv
            )
          );
        }
      } else {
        console.warn('⚠️ API 未就緒，使用模擬響應');
        console.warn('⚠️ API 狀態:', { 
          apiReady, 
          hasAccessToken: !!accessToken,
          accessTokenValue: accessToken ? `${accessToken.substring(0, 20)}...` : 'empty',
          reason: !apiReady ? 'apiReady is false' : !accessToken ? 'accessToken is empty' : 'unknown'
        });
        
        // 如果 API 未就緒，使用模擬響應
        const aiResponse: Message = {
          id: newMessages.length + 1,
          role: "assistant",
          content: getAIResponse(currentInput) + '\n\n[注意：當前使用模擬響應，API 未就緒]',
          timestamp: new Date(),
        };
        const finalMessages = [...newMessages, aiResponse];
        setMessages(finalMessages);
        
        // 保存对话
        if (currentConversationId) {
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === currentConversationId
                ? { ...conv, messages: finalMessages, updatedAt: new Date() }
                : conv
            )
          );
        }
      }
    } catch (error) {
      console.error('❌ AI 響應錯誤:', error);
      console.error('錯誤詳情:', error);
      const errorMessage: Message = {
        id: newMessages.length + 1,
        role: "assistant",
        content: "抱歉，我暫時無法回應。請檢查 API 配置或稍後再試。",
        timestamp: new Date(),
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      
      // 保存对话
      if (currentConversationId) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConversationId
              ? { ...conv, messages: finalMessages, updatedAt: new Date() }
              : conv
          )
        );
      }
    } finally {
      setIsTyping(false);
    }
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Mobile Sidebar Toggle */}
        {!sidebarOpen && (
          <div className="lg:hidden p-4 border-b border-gray-200">
            <Button
              onClick={() => setSidebarOpen(true)}
              className="h-9 w-9 p-0 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className={`mx-auto h-full flex flex-col transition-all duration-300 ${sidebarOpen ? 'max-w-4xl' : 'max-w-5xl'}`}>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-4">
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
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowInfo(!showInfo)}
                    className="h-10 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg flex items-center gap-2"
                  >
                    <Info className="w-4 h-4" />
                    <span className="hidden md:inline">功能說明</span>
                    {showInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  {/* Toggle Sidebar Button */}
                  <Button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md flex items-center justify-center"
                    title={sidebarOpen ? "收起對話記錄" : "展開對話記錄"}
                  >
                    {sidebarOpen ? (
                      <ChevronLeft className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </Button>
                </div>
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
                    <p><strong>💬 智能對話：</strong>使用文心4.5 API進行自然語言對話，提供流暢的對話體驗。可解答升學相關問題，包括科系推薦、學校選擇建議、面試準備技巧、升學規劃建議等。</p>
                    <p><strong>📊 成績分析：</strong>AI助手可以讀取您的成績資料，根據您的實際成績提供個性化的升學建議、分數落點分析和科系推薦。成績資料來自「更新成績」頁面。</p>
                    <p><strong>💾 對話記錄：</strong>自動保存所有對話記錄，支援多個對話。可創建新對話、刪除舊對話、切換對話。對話記錄保存在本地瀏覽器。</p>
                    <p><strong>⚡ 即時回應：</strong>快速生成回答，流暢的對話體驗。AI會根據您的問題和成績資料提供專業、準確的回答。</p>
                    <p className="mt-3 text-xs text-blue-600"><strong>💡 提示：</strong>需要配置百度API密鑰（在個人資料頁面配置）。建議問題具體明確以獲得更好回答。如要使用成績分析功能，請先到「更新成績」頁面輸入成績資料。</p>
                  </div>
                </motion.div>
              )}
            </div>

          {/* Chat Container */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col flex-1 min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 pr-6">
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
          <div className="p-6 border-t border-gray-100 relative z-10">
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
                  className="h-12 w-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-0 flex items-center justify-center disabled:opacity-50 relative z-20"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Right Side */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-80 bg-white border-l border-gray-200 flex flex-col h-screen fixed right-0 top-0 z-30 lg:relative lg:z-auto"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-semibold text-gray-900">對話記錄</h2>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={createNewConversation}
                    className="h-9 w-9 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    title="新對話"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setSidebarOpen(false)}
                    className="h-9 w-9 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex"
                    title="收起對話記錄"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setSidebarOpen(false)}
                    className="h-9 w-9 p-0 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg lg:hidden"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-[14px]">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>還沒有對話記錄</p>
                  <p className="text-[12px] mt-1">開始新對話吧！</p>
                </div>
              ) : (
                <div className="p-2">
                  {conversations
                    .slice()
                    .reverse()
                    .map((conversation) => (
                      <motion.div
                        key={conversation.id}
                        whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                        className={`group relative p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                          currentConversationId === conversation.id
                            ? "bg-blue-50 border border-blue-200"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          switchConversation(conversation.id);
                          if (window.innerWidth < 1024) {
                            setSidebarOpen(false);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <p className="text-[14px] font-medium text-gray-900 truncate">
                                {conversation.title}
                              </p>
                            </div>
                            <p className="text-[12px] text-gray-500">
                              {conversation.updatedAt.toLocaleDateString("zh-TW", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <Button
                            onClick={(e) => deleteConversation(conversation.id, e)}
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
                            title="刪除對話"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
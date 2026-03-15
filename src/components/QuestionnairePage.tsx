import { useState, useEffect } from "react";
import { ChevronRight, CheckCircle, ArrowLeft, Loader2, Info, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import {
  generateQuestionnaireQuestion,
  updatePersonalityWeights,
  calculateConfidenceScore,
  checkDimensionConvergence,
  getBaiduAccessToken,
  callErnieChatAPI,
  type QuestionnaireState,
  type PersonalityWeights,
  type QuestionnaireQuestion,
} from "../services/api";
import { getBaiduApiConfig } from "../services/supabase";

interface QuestionnairePageProps {
  onNavigate: (page: string) => void;
}

// 初始化人格权重
const initialWeights: PersonalityWeights = {
  mbti: {
    E: 0,
    I: 0,
    S: 0,
    N: 0,
    T: 0,
    F: 0,
    J: 0,
    P: 0,
  },
  holland: {
    R: 0,
    I: 0,
    A: 0,
    S: 0,
    E: 0,
    C: 0,
  },
};

// 初始化问卷状态
const initialState: QuestionnaireState = {
  currentWeights: initialWeights,
  stage: 'icebreaker',
  questionNumber: 0,
  answers: [],
  convergedDimensions: {
    mbti: [],
    holland: [],
  },
  confidenceScores: {
    mbti: {},
    holland: {},
  },
};

export function QuestionnairePage({ onNavigate }: QuestionnairePageProps) {
  const [state, setState] = useState<QuestionnaireState>(() => {
    // 尝试从localStorage恢复状态
    const saved = localStorage.getItem('adaptive_questionnaire_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved state:', e);
      }
    }
    return initialState;
  });
  
  const [currentQuestion, setCurrentQuestion] = useState<QuestionnaireQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [bearerToken, setBearerToken] = useState<string | null>(null);
  const [recommendedMajors, setRecommendedMajors] = useState<Array<{ name: string; match: number; reason: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [prefetchQuestions, setPrefetchQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<Array<{ completedAt: string; questionCount: number; mbti: string; holland: string }>>(() => {
    const raw = localStorage.getItem('questionnaire_history');
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  });

  // 初始化 API 配置和访问令牌（参考AIChatPage的实现）
  useEffect(() => {
    const initializeAPI = async () => {
      console.log('🔧 [Questionnaire] 開始初始化 API 配置...');
      try {
        const config = await getBaiduApiConfig();
        console.log('📦 [Questionnaire] 從 Supabase 獲取的配置:', {
          hasApiKey: !!config.apiKey,
          hasSecretKey: !!config.secretKey,
          hasApiToken: !!config.apiToken,
        });
        
        // 优先使用 apiToken（Bearer token），如果没有则使用 apiKey + secretKey 获取 access token
        if (config.apiToken) {
          setBearerToken(config.apiToken);
          console.log('✅ [Questionnaire] 文心5.0 API 已就緒（使用 Bearer Token）');
        } else if (config.apiKey && config.secretKey) {
          try {
            console.log('🔄 [Questionnaire] 正在通過 OAuth 獲取訪問令牌...');
            const token = await getBaiduAccessToken(config.apiKey, config.secretKey);
            console.log('✅ [Questionnaire] 成功獲取訪問令牌，長度:', token.length);
            setBearerToken(token);
            console.log('✅ [Questionnaire] 文心5.0 API 已就緒（使用 OAuth Token）');
          } catch (error) {
            console.error('❌ [Questionnaire] 獲取訪問令牌失敗:', error);
            // 如果從 Supabase 獲取失敗，嘗試從 localStorage
            const localApiKey = localStorage.getItem('baidu_api_key') || '';
            const localSecretKey = localStorage.getItem('baidu_secret_key') || '';
            const localApiToken = localStorage.getItem('baidu_api_token') || '';
            
            if (localApiToken) {
              setBearerToken(localApiToken);
              console.log('✅ [Questionnaire] 文心5.0 API 已就緒（從 localStorage 使用 Bearer Token）');
            } else if (localApiKey && localSecretKey) {
              try {
                const token = await getBaiduAccessToken(localApiKey, localSecretKey);
                setBearerToken(token);
                console.log('✅ [Questionnaire] 文心5.0 API 已就緒（從 localStorage 使用 OAuth Token）');
              } catch (err) {
                console.error('❌ [Questionnaire] 從 localStorage 獲取令牌失敗:', err);
                setError('無法獲取API Token，請檢查配置');
              }
            } else {
              setError('未配置百度API Key，無法生成問題');
            }
          }
        } else {
          // 如果 Supabase 沒有配置，嘗試從 localStorage
          const localApiToken = localStorage.getItem('baidu_api_token') || '';
          const localApiKey = localStorage.getItem('baidu_api_key') || '';
          const localSecretKey = localStorage.getItem('baidu_secret_key') || '';
          
          if (localApiToken) {
            setBearerToken(localApiToken);
            console.log('✅ [Questionnaire] 文心5.0 API 已就緒（從 localStorage 使用 Bearer Token）');
          } else if (localApiKey && localSecretKey) {
            try {
              const token = await getBaiduAccessToken(localApiKey, localSecretKey);
              setBearerToken(token);
              console.log('✅ [Questionnaire] 文心5.0 API 已就緒（從 localStorage 使用 OAuth Token）');
            } catch (err) {
              console.error('❌ [Questionnaire] 從 localStorage 獲取令牌失敗:', err);
              setError('未配置百度API Key，無法生成問題');
            }
          } else {
            setError('未配置百度API Key，無法生成問題');
          }
        }
      } catch (error) {
        console.error('❌ [Questionnaire] 初始化 API 配置失敗:', error);
        setError('獲取API配置失敗');
      }
    };

    initializeAPI();
  }, []);

  // 加载或生成第一个问题
  useEffect(() => {
    if (!currentQuestion && !isLoading && !showResults && bearerToken && hasStarted) {
      loadNextQuestion();
    }
  }, [bearerToken, hasStarted]);

  // 保存状态到localStorage
  useEffect(() => {
    if (state.questionNumber > 0) {
      localStorage.setItem('adaptive_questionnaire_state', JSON.stringify(state));
      localStorage.setItem('questionnaire_answers', JSON.stringify(state.answers));
    }
  }, [state]);

  const loadNextQuestion = async (overrideState?: QuestionnaireState) => {
    if (!bearerToken) {
      setError('未配置API Token，無法生成問題');
      setIsLoading(false);
      return;
    }

    const baseState = overrideState ?? state;

    if (prefetchQuestions.length > 0) {
      const [first, ...rest] = prefetchQuestions;
      setCurrentQuestion(first);
      setSelectedOption(null);
      setPrefetchQuestions(rest);
      setIsLoading(false);
      return;
    }

    // 如果已经在加载中，不重复调用
    if (isLoading && currentQuestion) {
      return;
    }

    setError(null);
    
    try {
      const lastAnswer = baseState.answers.length > 0 
        ? baseState.answers[baseState.answers.length - 1]
        : undefined;
      
      // 使用Promise.race确保快速响应
      // 檢查問題是否重複（簡單檢查）
      const checkDuplicate = (newQuestion: QuestionnaireQuestion): boolean => {
        return baseState.answers.some(
          a => a.question.trim() === newQuestion.question.trim() ||
               a.question.includes(newQuestion.question.substring(0, 10)) ||
               newQuestion.question.includes(a.question.substring(0, 10))
        );
      };
      
      let question: QuestionnaireQuestion | null = null;
      let attempts = 0;
      const maxAttempts = 3; // 最多嘗試3次避免重複
      
      while (!question && attempts < maxAttempts) {
        const generated = await Promise.race([
          generateQuestionnaireQuestion(
            baseState,
            lastAnswer ? {
              question: lastAnswer.question,
              selectedOption: lastAnswer.selectedOption,
            } : undefined,
            bearerToken
          ),
          // 超時保護（30秒）
          new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('生成問題超時')), 30000)
          )
        ]) as Promise<QuestionnaireQuestion | null>;
        
        if (!generated) {
          // 所有維度都已收斂，問卷完成
          handleQuestionnaireComplete();
          return;
        }
        
        // 檢查是否重複
        if (!checkDuplicate(generated)) {
          question = generated;
          break;
        }
        
        attempts++;
        console.log(`⚠️ [Questionnaire] 問題重複，重新生成 (嘗試 ${attempts}/${maxAttempts})`);
        
        // 短暫延遲後重試
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!question) {
        // 如果3次都重複，使用最後一次生成的問題
        console.warn('⚠️ [Questionnaire] 多次生成仍重複，使用最後一次結果');
        const lastGenerated = await generateQuestionnaireQuestion(
          baseState,
          lastAnswer ? {
            question: lastAnswer.question,
            selectedOption: lastAnswer.selectedOption,
          } : undefined,
          bearerToken
        );
        if (lastGenerated) {
          question = lastGenerated;
        } else {
          handleQuestionnaireComplete();
          return;
        }
      }
      
      setCurrentQuestion(question);
      setSelectedOption(null);
      setPrefetchQuestions([]);

      if (baseState.questionNumber < 12) {
        void prefetchNextQuestions(baseState);
      }
    } catch (err) {
      console.error('Failed to generate question:', err);
      setError(err instanceof Error ? err.message : '生成問題失敗，請重試');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (optionIndex: number) => {
    if (!currentQuestion || isLoading) return;
    
    setSelectedOption(optionIndex);
    setIsLoading(true); // 立即顯示載入狀態
    
    // 更新人格權重（同步操作，快速完成）
    const selectedWeights = currentQuestion.options[optionIndex].weights;
    const newWeights = updatePersonalityWeights(state.currentWeights, selectedWeights);
    
    // 更新信心值
    const newConfidenceScores = { ...state.confidenceScores };
    
    // 更新MBTI信心值
    const mbtiPairs = ['E/I', 'S/N', 'T/F', 'J/P'];
    for (const pair of mbtiPairs) {
      newConfidenceScores.mbti[pair] = calculateConfidenceScore(newWeights, pair, 'mbti');
    }
    
    // 更新Holland信心值
    const hollandTypes = ['R', 'I', 'A', 'S', 'E', 'C'];
    for (const type of hollandTypes) {
      newConfidenceScores.holland[type] = calculateConfidenceScore(newWeights, type, 'holland');
    }
    
    // 檢查收斂
    const convergedDimensions = checkDimensionConvergence(newWeights, newConfidenceScores);
    
    // 確定下一階段
    let nextStage = state.stage;
    if (state.questionNumber === 0) {
      nextStage = 'icebreaker';
    } else if (state.questionNumber < 4) {
      nextStage = 'behavior';
    } else {
      nextStage = 'situation';
    }
    
    // 更新状态
    const newState: QuestionnaireState = {
      currentWeights: newWeights,
      stage: nextStage,
      questionNumber: state.questionNumber + 1,
      answers: [
        ...state.answers,
        {
          question: currentQuestion.question,
          selectedOption: optionIndex,
          timestamp: new Date().toISOString(),
        },
      ],
      convergedDimensions,
      confidenceScores: newConfidenceScores,
    };
    
    setState(newState);
    
    // 先預抓下一題，減少等待時間
    prefetchNextQuestions(newState);

    // 立即开始加载下一题（使用最新狀態，避免等待 state 更新）
    loadNextQuestion(newState);
  };

  const prefetchNextQuestions = async (baseState: QuestionnaireState) => {
    if (!bearerToken) return;

    try {
      const lastAnswer = baseState.answers.length > 0
        ? baseState.answers[baseState.answers.length - 1]
        : undefined;

      const generatedFirst = await generateQuestionnaireQuestion(
        baseState,
        lastAnswer
          ? { question: lastAnswer.question, selectedOption: lastAnswer.selectedOption }
          : undefined,
        bearerToken
      );

      if (!generatedFirst) {
        return;
      }

      const firstQuestion = generatedFirst;

      const simulatedState: QuestionnaireState = {
        ...baseState,
        questionNumber: baseState.questionNumber + 1,
        answers: [
          ...baseState.answers,
          {
            question: firstQuestion.question,
            selectedOption: 0,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const generatedSecond = await generateQuestionnaireQuestion(
        simulatedState,
        {
          question: firstQuestion.question,
          selectedOption: 0,
        },
        bearerToken
      );

      if (generatedSecond) {
        const normalizedSecond = generatedSecond;
        const isDuplicate = firstQuestion.question.trim() === normalizedSecond.question.trim() ||
          firstQuestion.question.includes(normalizedSecond.question.substring(0, 10)) ||
          normalizedSecond.question.includes(firstQuestion.question.substring(0, 10));

        if (!isDuplicate) {
          setPrefetchQuestions([firstQuestion, normalizedSecond]);
          return;
        }
      }

      setPrefetchQuestions([firstQuestion]);
    } catch (err) {
      console.warn('Prefetch question failed:', err);
    }
  };

  const handleQuestionnaireComplete = (finalState?: QuestionnaireState) => {
    const completedState = finalState ?? state;
    const completedAt = new Date().toISOString();
    // 标记问卷完成
    localStorage.setItem('questionnaire_completed_at', completedAt);
    localStorage.setItem('adaptive_questionnaire_final_state', JSON.stringify(completedState));
    localStorage.setItem('questionnaire_answers', JSON.stringify(completedState.answers));

    const mbtiType = getMBTIResult(completedState.currentWeights);
    const hollandCode = getHollandResult(completedState.currentWeights);

    const nextHistory = [
      {
        completedAt,
        questionCount: completedState.questionNumber,
        mbti: mbtiType,
        holland: hollandCode,
      },
      ...historyItems,
    ].slice(0, 10);

    localStorage.setItem('questionnaire_history', JSON.stringify(nextHistory));
    setHistoryItems(nextHistory);

    setState(completedState);
    setShowResults(true);
    setHasStarted(true);
  };

  const handleResetQuestionnaire = () => {
    localStorage.removeItem('adaptive_questionnaire_state');
    localStorage.removeItem('adaptive_questionnaire_final_state');
    localStorage.removeItem('questionnaire_completed_at');
    localStorage.removeItem('questionnaire_answers');
    setState(initialState);
    setCurrentQuestion(null);
    setSelectedOption(null);
    setIsLoading(false);
    setShowResults(false);
    setPrefetchQuestions([]);
    setError(null);
    setHasStarted(false);
  };

  const handleEndQuestionnaire = () => {
    const completedState: QuestionnaireState = {
      ...state,
      questionNumber: state.questionNumber + 1,
    };
    handleQuestionnaireComplete(completedState);
  };

  useEffect(() => {
    if (!showResults || !bearerToken) {
      return;
    }

    const mbtiType = getMBTIResult(state.currentWeights);
    const hollandCode = getHollandResult(state.currentWeights);

    generateRecommendedMajors(mbtiType, hollandCode);
  }, [showResults, bearerToken]);

  const getMBTIResult = (weights: PersonalityWeights): string => {
    const e = weights.mbti.E >= weights.mbti.I ? 'E' : 'I';
    const s = weights.mbti.S >= weights.mbti.N ? 'S' : 'N';
    const t = weights.mbti.T >= weights.mbti.F ? 'T' : 'F';
    const j = weights.mbti.J >= weights.mbti.P ? 'J' : 'P';
    return `${e}${s}${t}${j}`;
  };

  const getHollandResult = (weights: PersonalityWeights): string => {
    const types = ['R', 'I', 'A', 'S', 'E', 'C'];
    const sorted = types
      .map(type => ({ type, value: weights.holland[type as keyof PersonalityWeights['holland']] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map(item => item.type)
      .join('');
    return sorted;
  };

  const getMBTIDescription = (type: string): string => {
    const descriptions: Record<string, string> = {
      'INTJ': '您是一位战略思考者，喜欢独立工作，擅长分析和规划。',
      'INTP': '您是一位逻辑分析家，好奇心强，喜欢探索理论和概念。',
      'ENTJ': '您是一位天生的领导者，果断、有组织能力，善于制定计划。',
      'ENTP': '您是一位创新者，思维敏捷，喜欢挑战和辩论。',
      'INFJ': '您是一位理想主义者，富有洞察力，关心他人成长。',
      'INFP': '您是一位调停者，富有创造力，重视个人价值观。',
      'ENFJ': '您是一位教育家，热情、有同理心，善于激励他人。',
      'ENFP': '您是一位活动家，充满热情，喜欢探索可能性。',
      'ISTJ': '您是一位检查员，务实、可靠，注重细节和秩序。',
      'ISFJ': '您是一位守护者，细心、负责，关心他人需求。',
      'ESTJ': '您是一位管理者，果断、高效，善于组织和管理。',
      'ESFJ': '您是一位执政官，友好、负责，重视传统和稳定。',
      'ISTP': '您是一位鉴赏家，灵活、实用，喜欢动手解决问题。',
      'ISFP': '您是一位探险家，温和、艺术，享受当下时刻。',
      'ESTP': '您是一位企业家，大胆、行动力强，喜欢冒险。',
      'ESFP': '您是一位表演者，热情、自由，享受社交和娱乐。',
    };
    return descriptions[type] || '您的性格类型具有独特的特点。';
  };

  const getHollandDescription = (code: string): string => {
    const descriptions: Record<string, string> = {
      'R': '现实型：喜欢使用工具、机器，从事实际操作工作。',
      'I': '研究型：喜欢观察、学习、研究、分析、评估和解决问题。',
      'A': '艺术型：喜欢自由、开放的环境，从事艺术创作。',
      'S': '社会型：喜欢帮助、教导、服务他人，关注人际关系。',
      'E': '企业型：喜欢领导、管理、影响他人，追求成就。',
      'C': '常规型：喜欢有组织、有系统的工作，注重细节。',
    };
    
    const topTypes = code.split('').slice(0, 3);
    return topTypes.map(t => descriptions[t] || '').join(' ');
  };

  const generateRecommendedMajors = async (mbtiType: string, hollandCode: string) => {
    if (!bearerToken) {
      return;
    }

    try {
      const prompt = `你是一位升學顧問，請根據以下性向結果推薦科系：\n- MBTI：${mbtiType}\n- Holland：${hollandCode}\n\n請輸出 3 個推薦科系，每個包含：\n1. 科系名稱\n2. 匹配度（70-99 的整數）\n3. 一句理由（繁體中文，20字內）\n\n請用 JSON 陣列輸出，格式如下：\n[\n  {"name":"科系","match":95,"reason":"理由"}\n]`;

      const response = await callErnieChatAPI(
        prompt,
        [],
        bearerToken,
        'ernie-4.5-turbo-vl',
        '你是升學顧問，只輸出 JSON，不要額外說明。'
      );

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? jsonMatch[0] : response;
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) {
        setRecommendedMajors(parsed.slice(0, 3));
      }
    } catch (error) {
      console.error('生成推薦科系失敗:', error);
    }
  };

  if (showResults) {
    const mbtiType = getMBTIResult(state.currentWeights);
    const hollandCode = getHollandResult(state.currentWeights);
    
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
                      已完成 {state.questionNumber} 題，AI 已根據您的回答進行深度分析
                    </p>
                  </div>
                </div>
              </div>

              {/* MBTI Result */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6">
                <h3 className="text-[24px] text-gray-900 mb-6">MBTI 性格類型</h3>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
                  <h4 className="text-[32px] text-gray-900 mb-3 font-bold">{mbtiType}</h4>
                  <p className="text-[16px] text-gray-600 leading-relaxed">
                    {getMBTIDescription(mbtiType)}
                  </p>
                </div>
                <div className="space-y-4">
                  {[
                    { label: '外向 (E)', value: state.currentWeights.mbti.E, max: Math.max(state.currentWeights.mbti.E, state.currentWeights.mbti.I) },
                    { label: '内向 (I)', value: state.currentWeights.mbti.I, max: Math.max(state.currentWeights.mbti.E, state.currentWeights.mbti.I) },
                    { label: '感觉 (S)', value: state.currentWeights.mbti.S, max: Math.max(state.currentWeights.mbti.S, state.currentWeights.mbti.N) },
                    { label: '直觉 (N)', value: state.currentWeights.mbti.N, max: Math.max(state.currentWeights.mbti.S, state.currentWeights.mbti.N) },
                    { label: '思考 (T)', value: state.currentWeights.mbti.T, max: Math.max(state.currentWeights.mbti.T, state.currentWeights.mbti.F) },
                    { label: '情感 (F)', value: state.currentWeights.mbti.F, max: Math.max(state.currentWeights.mbti.T, state.currentWeights.mbti.F) },
                    { label: '判断 (J)', value: state.currentWeights.mbti.J, max: Math.max(state.currentWeights.mbti.J, state.currentWeights.mbti.P) },
                    { label: '知觉 (P)', value: state.currentWeights.mbti.P, max: Math.max(state.currentWeights.mbti.J, state.currentWeights.mbti.P) },
                  ].map((item, idx) => {
                    const percentage = item.max > 0 ? (item.value / item.max) * 100 : 0;
                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-[15px] mb-2">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="text-blue-600">{item.value.toFixed(1)}</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Holland Result */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6">
                <h3 className="text-[24px] text-gray-900 mb-6">Holland 職業興趣類型</h3>
                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 mb-6">
                  <h4 className="text-[32px] text-gray-900 mb-3 font-bold">{hollandCode}</h4>
                  <p className="text-[16px] text-gray-600 leading-relaxed">
                    {getHollandDescription(hollandCode)}
                  </p>
                </div>
                <div className="space-y-4">
                  {[
                    { label: '现实型 (R)', value: state.currentWeights.holland.R },
                    { label: '研究型 (I)', value: state.currentWeights.holland.I },
                    { label: '艺术型 (A)', value: state.currentWeights.holland.A },
                    { label: '社会型 (S)', value: state.currentWeights.holland.S },
                    { label: '企业型 (E)', value: state.currentWeights.holland.E },
                    { label: '常规型 (C)', value: state.currentWeights.holland.C },
                  ].map((item, idx) => {
                    const maxValue = Math.max(...Object.values(state.currentWeights.holland));
                    const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-[15px] mb-2">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="text-green-600">{item.value.toFixed(1)}</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              {/* Recommended Departments */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-[20px] text-gray-900 mb-4">推薦科系</h3>
                <div className="space-y-3">
                  {recommendedMajors.length > 0 ? (
                    recommendedMajors.map((major, index) => (
                      <div
                        key={`${major.name}-${index}`}
                        className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl cursor-pointer hover:bg-blue-100 transition-colors"
                      >
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white text-[18px]">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-[16px] text-gray-900">{major.name}</h4>
                          <p className="text-[13px] text-gray-600">匹配度 {major.match}%</p>
                          <p className="text-[12px] text-gray-500 mt-1">{major.reason}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-[13px] text-gray-500 py-6">
                      正在生成推薦科系...
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleResetQuestionnaire}
                  className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl mt-6"
                >
                  重設問卷
                </Button>
                <Button
                  onClick={() => onNavigate("home")}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl mt-3"
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

  if (isLoading && !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">AI 正在生成問題...</p>
        </div>
      </div>
    );
  }

  if (error && !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>重新載入</Button>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10">
            <div className="mb-8">
              <h1 className="text-[32px] text-gray-900 mb-2">智能問卷</h1>
              <p className="text-[16px] text-gray-600">AI 自適應性向分析</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-8">
              <h2 className="text-[20px] text-gray-900 mb-3">開始前須知</h2>
              <ul className="space-y-2 text-[15px] text-gray-600">
                <li>• 問卷約需 5-10 分鐘完成</li>
                <li>• 請依真實想法作答以提升準確度</li>
                <li>• 完成後會提供性格與職業興趣分析</li>
              </ul>
            </div>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[18px] text-gray-900">歷史紀錄</h2>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {showHistory ? '收起' : '查看'}
                </button>
              </div>
              {showHistory && (
                <div className="space-y-3">
                  {historyItems.length > 0 ? (
                    historyItems.map((item, index) => (
                      <div
                        key={`${item.completedAt}-${index}`}
                        className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3"
                      >
                        <div>
                          <p className="text-[14px] text-gray-900">
                            {new Date(item.completedAt).toLocaleString('zh-TW', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="text-[12px] text-gray-500">
                            {item.questionCount} 題 · MBTI {item.mbti} · Holland {item.holland}
                          </p>
                        </div>
                        <span className="text-[12px] text-gray-400">#{historyItems.length - index}</span>
                      </div>
                    ))
                  ) : (
                    <div className="bg-gray-50 rounded-2xl px-4 py-6 text-center text-[13px] text-gray-500">
                      尚無歷史紀錄
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={() => setHasStarted(true)}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              開始問卷
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">準備中...</p>
        </div>
      </div>
    );
  }

  const stageLabels = {
    icebreaker: '破冰階段',
    behavior: '行為階段',
    situation: '情境階段',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-[32px] text-gray-900 mb-2">智能問卷</h1>
              <p className="text-[16px] text-gray-600">AI 自適應性向分析</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <Info className="w-4 h-4" />
                <span>功能說明</span>
                {showInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <span className="text-[15px] text-gray-500">
                第 {state.questionNumber + 1} 題
              </span>
              <button
                onClick={handleResetQuestionnaire}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                重設
              </button>
              <button
                onClick={handleEndQuestionnaire}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                結束
              </button>
            </div>
          </div>
          
          {/* 功能說明卡片 */}
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-purple-50 border border-purple-200 rounded-xl p-4 md:p-6 mb-4"
            >
              <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                功能說明
              </h3>
              <div className="space-y-2 text-sm text-purple-800">
                <p><strong>🧠 自適應問卷系統：</strong>根據您的回答動態調整問題，提高問卷效率。系統會自動檢測已收斂的維度，停止相關問題。</p>
                <p><strong>📊 MBTI人格測試：</strong>評估16種人格類型（E/I、S/N、T/F、J/P），幫助您了解自己的性格特質。</p>
                <p><strong>🎯 Holland職業興趣測試：</strong>評估6種職業興趣類型（R/I/A/S/E/C），幫助您找到適合的職業方向。</p>
                <p><strong>📈 信心分數計算：</strong>即時計算各維度的信心分數，確保問卷結果的準確性。</p>
                <p><strong>💾 進度保存：</strong>自動保存問卷進度，可隨時繼續。不會因為關閉頁面而遺失進度。</p>
                <p><strong>📋 結果分析：</strong>完成問卷後顯示詳細的人格和職業興趣分析，可用於AI推薦和升學建議。</p>
                <p className="mt-3 text-xs text-purple-600"><strong>💡 提示：</strong>問卷需要5-10分鐘完成。建議誠實回答以獲得準確結果。結果會影響AI推薦的準確性。</p>
              </div>
            </motion.div>
          )}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((state.questionNumber / 15) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10">
          <div className="mb-8">
            <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-600 rounded-full text-[13px] mb-6">
              {stageLabels[state.stage]}
            </span>
            <h2 className="text-[28px] text-gray-900 leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !isLoading && handleAnswer(index)}
                disabled={isLoading}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all hover:border-blue-500 hover:bg-blue-50 ${
                  selectedOption === index
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedOption === index
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}>
                    {selectedOption === index && (
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="text-[17px] text-gray-900">{option.text}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Loading indicator - 优化显示 */}
        {isLoading && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-full">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <p className="text-[14px] text-blue-600 font-medium">AI 正在生成下一題...</p>
            </div>
          </div>
        )}

        {/* Navigation Hint */}
        {!isLoading && (
          <p className="text-center text-[15px] text-gray-500 mt-6">
            點選答案後將自動進入下一題
          </p>
        )}
      </div>
    </div>
  );
}
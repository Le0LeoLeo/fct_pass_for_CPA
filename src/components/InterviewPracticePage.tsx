import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Trash2, Volume2, ArrowLeft, Sparkles, Zap, Clock, MessageSquare, Save, CheckCircle, ChevronRight, X, Plus, Settings, Award, Loader2, Info, ChevronDown, ChevronUp } from "lucide-react";
import { getBaiduAccessToken, speechToText, textToSpeech, callErnieChatAPI } from "../services/api";
import { getBaiduApiConfig, saveInterviewRecord, getInterviewRecords, deleteInterviewRecord, InterviewRecord, updateInterviewRecord } from "../services/supabase";
import { Button } from "./ui/button";

interface InterviewPracticePageProps {
  onNavigate: (page: string) => void;
}

export function InterviewPracticePage({ onNavigate }: InterviewPracticePageProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionMode, setRecognitionMode] = useState("mandarin");
  const [status, setStatus] = useState("就緒");
  const [conversation, setConversation] = useState("");
  const [speed, setSpeed] = useState(5);
  const [pitch, setPitch] = useState(5);
  const [volume, setVolume] = useState(5);
  const [pauseAdjust, setPauseAdjust] = useState(true);
  const [metrics, setMetrics] = useState({
    asr: "-",
    llm: "-",
    tts: "-",
    endToEnd: "-"
  });

  // API配置（从 Supabase 获取）
  const [baiduApiKey, setBaiduApiKey] = useState<string>('');
  const [baiduSecretKey, setBaiduSecretKey] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>(''); // 用于 TTS/ASR
  const [bearerToken, setBearerToken] = useState<string>(''); // 用于 LLM (千帆API)
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [apiConfigLoaded, setApiConfigLoaded] = useState(false);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [interviewRecords, setInterviewRecords] = useState<InterviewRecord[]>([]);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false); // 默认不显示高级选项
  const [isGeneratingEvaluation, setIsGeneratingEvaluation] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  } | null>(null);
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // 加载面试记录
  useEffect(() => {
    const loadRecords = async () => {
      setIsLoadingRecords(true);
      try {
        const records = await getInterviewRecords();
        setInterviewRecords(records);
        console.log('✅ 已加载面试记录:', records.length);
      } catch (error) {
        console.error('加载面试记录失败:', error);
      } finally {
        setIsLoadingRecords(false);
      }
    };
    
    loadRecords();
  }, []);


  // 从 Supabase 加载 API 配置
  useEffect(() => {
    const loadApiConfig = async () => {
      try {
        const config = await getBaiduApiConfig();
        if (config.apiKey && config.secretKey) {
          setBaiduApiKey(config.apiKey);
          setBaiduSecretKey(config.secretKey);
          
          // 优先使用 apiToken（Bearer token）用于千帆API
          if (config.apiToken) {
            setBearerToken(config.apiToken);
            console.log('✅ 使用 Bearer Token 用于千帆API');
          }
          
          setApiConfigLoaded(true);
        } else {
          console.warn('API 配置未找到，請檢查 Supabase 數據庫');
          // 如果 Supabase 沒有配置，嘗試從 localStorage 獲取（向後兼容）
          const localApiKey = localStorage.getItem('baidu_api_key') || '';
          const localSecretKey = localStorage.getItem('baidu_secret_key') || '';
          const localApiToken = localStorage.getItem('baidu_api_token') || '';
          if (localApiKey && localSecretKey) {
            setBaiduApiKey(localApiKey);
            setBaiduSecretKey(localSecretKey);
            if (localApiToken) {
              setBearerToken(localApiToken);
            }
            setApiConfigLoaded(true);
          }
        }
      } catch (error) {
        console.error('Failed to load API config from Supabase:', error);
        // 如果 Supabase 失敗，嘗試從 localStorage 獲取（向後兼容）
        const localApiKey = localStorage.getItem('baidu_api_key') || '';
        const localSecretKey = localStorage.getItem('baidu_secret_key') || '';
        const localApiToken = localStorage.getItem('baidu_api_token') || '';
        if (localApiKey && localSecretKey) {
          setBaiduApiKey(localApiKey);
          setBaiduSecretKey(localSecretKey);
          if (localApiToken) {
            setBearerToken(localApiToken);
          }
          setApiConfigLoaded(true);
        }
      }
    };
    
    loadApiConfig();
  }, []);

  // 初始化访问令牌
  useEffect(() => {
    if (apiConfigLoaded && baiduApiKey && baiduSecretKey && !accessToken) {
      getBaiduAccessToken(baiduApiKey, baiduSecretKey)
        .then(token => setAccessToken(token))
        .catch(err => console.error('Failed to get access token:', err));
    }
  }, [apiConfigLoaded, baiduApiKey, baiduSecretKey, accessToken]);

  const handleStartRecording = async () => {
    if (!isRecording) {
      // 开始录音
      // 检查 API 配置是否已加载
      if (!apiConfigLoaded) {
        alert('正在加载API配置，请稍候...');
        return;
      }
      
      // 检查是否有 API 密钥
      if (!baiduApiKey || !baiduSecretKey) {
        alert('请先在 Supabase 数据库中配置百度API密钥（baidu_api_key 和 baidu_secret_key）');
        return;
      }
      
      // 如果没有 accessToken，尝试获取
      let currentAccessToken = accessToken;
      if (!currentAccessToken) {
        try {
          setStatus('正在获取访问令牌...');
          currentAccessToken = await getBaiduAccessToken(baiduApiKey, baiduSecretKey);
          setAccessToken(currentAccessToken);
          setStatus('就緒');
        } catch (error) {
          console.error('Failed to get access token:', error);
          alert('获取访问令牌失败，请检查API密钥是否正确');
          setStatus('就緒');
          return;
        }
      }

      // 确保有有效的 accessToken
      if (!currentAccessToken) {
        alert('无法获取访问令牌，请检查API配置');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        audioStreamRef.current = stream;
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          if (audioChunksRef.current.length > 0) {
            await processAudio();
          }
        };

        mediaRecorder.start(100);
        setIsRecording(true);
        setStatus("錄音中...");

        // 每1.5秒处理一次音频
        recordingIntervalRef.current = setInterval(() => {
          // 如果TTS正在播放，暂停录音处理
          if (isTTSPlaying) {
            return;
          }
          
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setTimeout(() => {
              if (isRecording && !isTTSPlaying) {
                audioChunksRef.current = [];
                mediaRecorder.start(100);
              }
            }, 50);
          }
        }, 1500);
      } catch (error) {
        console.error('Failed to start recording:', error);
        alert('无法访问麦克风，请检查权限设置');
      }
    } else {
      // 停止录音
      stopRecording();
    }
  };

  const stopRecording = () => {
    // 停止TTS播放
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsTTSPlaying(false);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    setIsRecording(false);
    setStatus("就緒");
  };

  const processAudio = async () => {
    // 如果TTS正在播放，跳过音频处理
    if (isTTSPlaying || !accessToken || audioChunksRef.current.length === 0) return;

    const startTime = Date.now();
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const chunksToProcess = [...audioChunksRef.current];
    audioChunksRef.current = [];

    try {
      // 转换音频格式（简化版，实际需要更复杂的音频处理）
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // 转换为PCM（简化处理）
      const pcmData = convertToPCM(audioBuffer.getChannelData(0));
      const pcmBlob = new Blob([pcmData], { type: 'audio/pcm' });

      // 语音识别
      const asrStartTime = Date.now();
      const recognizedText = await speechToText(pcmBlob, accessToken);
      const asrLatency = Date.now() - asrStartTime;

      if (recognizedText && recognizedText.trim().length > 0) {
        setMetrics(prev => ({ ...prev, asr: `${asrLatency}ms` }));
        addMessage('user', recognizedText);

        // 调用LLM - 使用千帆API（与AI助手相同的方式）
        console.log('🚀 开始调用 LLM API...');
        const llmStartTime = Date.now();
        const newHistory = [...conversationHistory, { role: 'user', content: recognizedText }];
        console.log('📝 对话历史:', newHistory);
        
        // 确保有 Bearer Token（用于千帆API）
        let currentBearerToken = bearerToken;
        console.log('🔑 当前 Bearer Token 状态:', {
          hasBearerToken: !!currentBearerToken,
          tokenLength: currentBearerToken?.length || 0,
          tokenPrefix: currentBearerToken ? currentBearerToken.substring(0, 20) + '...' : 'null'
        });
        
        if (!currentBearerToken) {
          console.log('⚠️ Bearer Token 为空，尝试从配置获取...');
          // 如果没有 Bearer Token，尝试从配置获取
          try {
            const config = await getBaiduApiConfig();
            console.log('📦 API 配置获取结果:', {
              hasApiToken: !!config.apiToken,
              apiTokenLength: config.apiToken?.length || 0
            });
            if (config.apiToken) {
              currentBearerToken = config.apiToken;
              setBearerToken(config.apiToken);
              console.log('✅ Bearer Token 已从配置获取');
            } else {
              throw new Error('缺少 baidu_api_token（Bearer Token），请先在 Supabase 中配置');
            }
          } catch (error) {
            console.error('❌ 无法获取 Bearer Token:', error);
            const errorMessage = error instanceof Error ? error.message : '无法获取API Token';
            addMessage('assistant', `抱歉，${errorMessage}。请检查 Supabase 数据库中的 baidu_api_token 配置。`);
            return;
          }
        }
        
        let response: string;
        try {
          console.log('🌐 准备调用 LLM API，参数:', {
            userInput: recognizedText,
            historyLength: newHistory.length,
            bearerTokenLength: currentBearerToken.length,
            model: 'ernie-4.5-turbo-128k'
          });
          
          // 为面试场景定制 system prompt - 超严格的面试官
          const interviewSystemPrompt = `你是一位**极其严格和专业**的大学面试官，以高标准、严要求著称。你的角色是**面试官**，不是顾问或建议者。

你的面试风格：
1. **严格专业**：以最高标准要求面试者，不轻易给予肯定
2. **深度追问**：对每个回答都要深入挖掘，找出不足和漏洞
3. **挑战性提问**：提出有难度的问题，测试面试者的真实水平
4. **质疑态度**：对模糊、不具体的回答要质疑和追问
5. **压力测试**：适当施加压力，观察面试者的应变能力

你的任务是：
1. **严格提问**：根据学生的回答，提出尖锐、有挑战性的后续问题
2. **模拟真实严格面试**：包括自我介绍、学习动机、专业问题、情境题、压力测试等
3. **简洁但严厉**：每次只问一个问题，回复控制在30-60字之间，适合语音播放，语气要专业但严格
4. **深度追问**：对不完整、模糊的回答要追问"能具体说明吗？"、"还有吗？"、"为什么？"
5. **挑战性**：提出有难度的问题，如"如果给你一个项目，你会如何规划？"、"你认为自己最大的不足是什么？"

重要规则：
- ❌ **不要**给出面试建议或准备方法
- ❌ **不要**列出多个问题或提供示例答案
- ❌ **不要**轻易表扬或肯定，要保持严格标准
- ✅ **要**作为严格的面试官直接提问
- ✅ **要**对回答进行深度追问和质疑
- ✅ **要**提出有挑战性的问题
- ✅ **要**保持专业但严格的态度

提问风格示例：
- ✅ 严格："请简单介绍一下你自己，重点说明你的学术成就和优势。"
- ✅ 挑战："为什么选择这个科系？你认为自己有什么优势能胜任？"
- ✅ 追问："能详细说说你在项目中的具体贡献吗？你负责了哪些部分？"
- ✅ 质疑："这个回答不够具体，能举一个具体的例子吗？"
- ✅ 压力："如果这个项目失败了，你会如何处理？"
- ❌ 错误："在面试中，面试官通常会问...建议你这样回答..."
- ❌ 错误："以下是一些常见问题及回答建议..."`;

          // 使用 callErnieChatAPI，传入定制的面试官 system prompt
          response = await callErnieChatAPI(
            recognizedText,
            newHistory,
            currentBearerToken,
            'ernie-4.5-turbo-128k',
            interviewSystemPrompt // 传入自定义的面试官 prompt
          );
          const llmLatency = Date.now() - llmStartTime;
          setMetrics(prev => ({ ...prev, llm: `${llmLatency}ms` }));
          
          console.log('✅ LLM response received:', {
            responseLength: response?.length || 0,
            responsePreview: response ? response.substring(0, 100) + '...' : 'null',
            latency: `${llmLatency}ms`
          });
        } catch (error) {
          console.error('❌ LLM call failed:', error);
          console.error('错误详情:', {
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined
          });
          const llmLatency = Date.now() - llmStartTime;
          setMetrics(prev => ({ ...prev, llm: `Error: ${llmLatency}ms` }));
          
          // 显示错误消息给用户
          const errorMessage = error instanceof Error ? error.message : 'LLM调用失败';
          addMessage('assistant', `抱歉，处理您的请求时出错：${errorMessage}`);
          return;
        }

        if (response && response.trim()) {
          console.log('✅ LLM 返回有效响应，添加到对话');
          addMessage('assistant', response);
          setConversationHistory([...newHistory, { role: 'assistant', content: response }]);
          
          // 暂停录音，播放TTS
          await pauseRecordingForTTS();
          await playTTS(response);
          await resumeRecordingAfterTTS();
        } else {
          console.warn('⚠️ LLM returned empty response', {
            response: response,
            responseType: typeof response,
            isEmpty: !response,
            isWhitespace: response && !response.trim()
          });
          addMessage('assistant', '抱歉，系统暂时无法响应，请稍后再试。');
        }

        const totalLatency = Date.now() - startTime;
        setMetrics(prev => ({ ...prev, endToEnd: `${totalLatency}ms` }));
      }
    } catch (error) {
      console.error('Audio processing error:', error);
    }
  };

  const convertToPCM = (float32Array: Float32Array): ArrayBuffer => {
    const int16Array = new Int16Array(float32Array.length);
    const multiplier = 0x7FFF;
    
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * multiplier;
    }
    
    return int16Array.buffer;
  };

  // 暂停录音以便播放TTS
  const pauseRecordingForTTS = async () => {
    setIsTTSPlaying(true);
    
    // 停止当前的录音
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // TTS播放完成后恢复录音
  const resumeRecordingAfterTTS = async () => {
    // 注意：这个函数在 playTTS 的 onended 回调中调用
    // 此时 isTTSPlaying 已经通过 playTTS 设置为 false
    // 只需要恢复录音即可
    
    // 如果还在录音状态，恢复录音
    if (isRecording && mediaRecorderRef.current && audioStreamRef.current) {
      // 确保 MediaRecorder 处于停止状态
      if (mediaRecorderRef.current.state === 'inactive') {
        audioChunksRef.current = [];
        mediaRecorderRef.current.start(100);
        
        // 重新启动定时器
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
        
        recordingIntervalRef.current = setInterval(() => {
          // 检查 TTS 是否正在播放
          if (isTTSPlaying) {
            return;
          }
          
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setTimeout(() => {
              // 再次检查状态，确保可以继续录音
              if (isRecording && !isTTSPlaying && mediaRecorderRef.current && audioStreamRef.current) {
                audioChunksRef.current = [];
                mediaRecorderRef.current.start(100);
              }
            }, 50);
          }
        }, 1500);
      }
    }
  };

  const playTTS = async (text: string) => {
    if (!accessToken) return;

    try {
      const ttsStartTime = Date.now();
      const audioBlob = await textToSpeech(text, accessToken, {
        speed,
        pitch,
        volume,
        person: 4, // 情感女声
      });
      const ttsLatency = Date.now() - ttsStartTime;
      setMetrics(prev => ({ ...prev, tts: `${ttsLatency}ms` }));

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      await new Promise((resolve, reject) => {
        audio.onended = async () => {
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          setIsTTSPlaying(false);
          // TTS播放完成后恢复录音
          await resumeRecordingAfterTTS();
          resolve(null);
        };
        audio.onerror = async (error) => {
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          setIsTTSPlaying(false);
          await resumeRecordingAfterTTS();
          reject(error);
        };
        audio.play().catch(async (error) => {
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          setIsTTSPlaying(false);
          await resumeRecordingAfterTTS();
          reject(error);
        });
      });
    } catch (error) {
      console.error('TTS error:', error);
      setIsTTSPlaying(false);
    }
  };

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const prefix = role === 'user' ? '您: ' : 'AI: ';
    setConversation(prev => prev + prefix + content + '\n\n');
  };

  const handleClearConversation = () => {
    setConversation("");
    setConversationHistory([]);
    setMetrics({
      asr: "-",
      llm: "-",
      tts: "-",
      endToEnd: "-"
    });
    setCurrentRecordId(null);
  };

  // 加载面试记录
  const loadInterviewRecord = async (recordId: string) => {
    try {
      const record = interviewRecords.find(r => r.id === recordId);
      if (!record) return;

      // 恢复对话历史
      setConversationHistory(record.conversation);
      
      // 恢复对话显示
      const conversationText = record.conversation
        .map(msg => {
          const prefix = msg.role === 'user' ? '您: ' : 'AI: ';
          return prefix + msg.content;
        })
        .join('\n\n');
      setConversation(conversationText);
      
      // 恢复元数据
      if (record.metadata?.metrics) {
        setMetrics(record.metadata.metrics);
      }
      if (record.metadata?.recognitionMode) {
        setRecognitionMode(record.metadata.recognitionMode);
      }

      // 恢复评分结果（如果有）
      if (record.metadata?.evaluation) {
        setEvaluationResult(record.metadata.evaluation);
        console.log('✅ 已恢复评分结果:', record.metadata.evaluation);
      }

      setCurrentRecordId(recordId);
      console.log('✅ 已加载面试记录:', record.title);
    } catch (error) {
      console.error('加载面试记录失败:', error);
      alert('加载记录失败');
    }
  };

  // 生成面试评分（使用 DeepSeek Edge Function）
  const generateEvaluation = async () => {
    if (conversationHistory.length === 0) {
      alert('没有对话记录，无法生成评分');
      return;
    }

    setIsGeneratingEvaluation(true);
    setEvaluationResult(null);

    try {
      // 使用 Supabase Edge Function 调用 DeepSeek
      const { getSupabaseClient } = await import("../services/supabase");
      const supabase = getSupabaseClient();
      
      // Get session to ensure we have auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('🚀 调用 interview-evaluation Edge Function，对话历史长度:', conversationHistory.length);
      
      const { data, error } = await supabase.functions.invoke('interview-evaluation', {
        body: {
          conversation: conversationHistory,
        },
        headers: {
          Authorization: session ? `Bearer ${session.access_token}` : undefined,
        },
      });

      console.log('📥 Edge Function 响应:', { 
        hasData: !!data, 
        hasError: !!error, 
        error: error ? JSON.stringify(error, null, 2) : null,
        dataKeys: data ? Object.keys(data) : []
      });

      if (error) {
        console.error('❌ Edge Function 调用错误详情:', error);
        const errorMsg = error.message || '未知错误';
        throw new Error(`生成评分失败: ${errorMsg}。请检查：1) Edge Function "interview-evaluation" 是否已部署 2) DeepSeek API Key 是否已配置`);
      }

      // 检查响应数据
      if (!data) {
        throw new Error('Edge Function 未返回数据。请检查 Edge Function 是否已部署');
      }

      // 检查是否有错误
      if (data?.error) {
        console.error('Edge Function 返回错误:', data);
        const errorDetail = data.detail || '';
        throw new Error(`Edge Function 错误: ${data.error}${errorDetail ? '\n详情: ' + errorDetail.substring(0, 200) : ''}`);
      }

      // 从响应中提取评估结果
      const evaluation = data?.evaluation;
      if (!evaluation) {
        console.error('Edge Function 完整响应:', JSON.stringify(data, null, 2));
        throw new Error('Edge Function 未返回评估结果。请检查：1) Edge Function "interview-evaluation" 是否已部署 2) DeepSeek API Key 是否已配置在 Supabase 数据库中');
      }

      // 验证和格式化结果
      const result = {
        score: Math.round(evaluation.score || 0),
        feedback: evaluation.feedback || '暂无评价',
        strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
        improvements: Array.isArray(evaluation.improvements) ? evaluation.improvements : [],
        details: evaluation.details || {},
      };

      setEvaluationResult(result);
      setShowEvaluationDialog(true);

      // 保存面试记录（只在评分后保存）
      try {
        const firstUserMessage = conversationHistory.find(msg => msg.role === 'user');
        const title = firstUserMessage 
          ? firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '')
          : `面试记录 ${new Date().toLocaleString('zh-TW')}`;

        // 保存记录（包含评分）
        const record = await saveInterviewRecord(
          conversationHistory,
          title,
          {
            metrics: metrics,
            recognitionMode: recognitionMode,
            evaluation: result,
            evaluatedAt: new Date().toISOString(),
          }
        );

        if (record) {
          setCurrentRecordId(record.id);
          // 重新加载记录列表
          const records = await getInterviewRecords();
          setInterviewRecords(records);
          console.log('✅ 面试记录已保存（含评分）:', record.id);
        }
      } catch (saveError) {
        console.error('保存面试记录失败:', saveError);
        // 不阻止用户查看评分，只记录错误
      }

      console.log('✅ 评分生成成功:', result);
    } catch (error) {
      console.error('生成评分失败:', error);
      alert('生成评分失败: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsGeneratingEvaluation(false);
    }
  };

  // 删除面试记录
  const handleDeleteRecord = async (recordId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('确定要删除这条面试记录吗？')) {
      return;
    }

    try {
      const success = await deleteInterviewRecord(recordId);
      if (success) {
        // 从列表中移除
        setInterviewRecords(prev => prev.filter(r => r.id !== recordId));
        
        // 如果删除的是当前记录，清空对话
        if (currentRecordId === recordId) {
          handleClearConversation();
        }
        
        console.log('✅ 已删除面试记录:', recordId);
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('删除面试记录失败:', error);
      alert('删除失败');
    }
  };

  // 移除手动保存功能，改为只在评分后保存

  // 清理资源
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const handleStopPlayback = () => {
    setStatus("已停止");
    setTimeout(() => setStatus("就緒"), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-3 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 md:mb-8"
        >
            <div className="flex items-center justify-between mb-4">
              <motion.button
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate("grades-and-practice")}
                className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-[14px] md:text-[15px]">返回</span>
              </motion.button>
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                  title={sidebarOpen ? "收起記錄" : "展開記錄"}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-[13px] md:text-[14px]">面試記錄</span>
                  {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                    showAdvancedOptions 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="進階選項"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-[13px] md:text-[14px] hidden md:inline">進階</span>
                </motion.button>
                <div className="flex items-center gap-2 text-purple-600">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-[13px] md:text-[14px]">AI 驅動</span>
                </div>
              </div>
            </div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-[28px] md:text-[36px] text-gray-900 mb-2">AI 面試模擬系統</h1>
              <p className="text-[14px] md:text-[16px] text-gray-600">真實面試場景模擬 · 即時語音互動 · 智能評估反饋</p>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <Info className="w-4 h-4" />
              <span className="hidden md:inline">功能說明</span>
              {showInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
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
                <p><strong>🎤 真實語音識別 (SST)：</strong>使用百度語音識別API，將您的語音轉換為文字。支援中文普通話識別，即時語音轉文字，自動添加標點符號。</p>
                <p><strong>🔊 真實語音合成 (TTS)：</strong>使用百度語音合成API，將AI回答轉換為語音。可調整語速、音調、音量，支援暫停調整功能，提供自然流暢的語音輸出。</p>
                <p><strong>🤖 AI面試官：</strong>使用文心4.0 API進行智能對話，模擬真實面試場景。根據您的回答提出追問，提供專業面試建議。</p>
                <p><strong>⚡ 性能指標監控：</strong>即時顯示ASR（語音識別）、LLM（AI對話）、TTS（語音合成）和端到端延遲，幫助您了解系統性能。</p>
                <p><strong>💾 面試記錄管理：</strong>自動保存面試對話記錄，可查看歷史記錄。結束面試後可生成評估報告，包含分數、優點、改進建議。</p>
                <p className="mt-3 text-xs text-purple-600"><strong>💡 提示：</strong>需要允許瀏覽器麥克風權限。建議在安靜環境中使用。首次使用需要配置百度API密鑰（在個人資料頁面配置）。</p>
              </div>
            </motion.div>
          )}
          
          {/* 高级选项面板 */}
          {showAdvancedOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-white rounded-xl shadow-md border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[16px] font-semibold text-gray-900">進階選項</h3>
                <button
                  onClick={() => setShowAdvancedOptions(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAdvancedOptions}
                    readOnly
                    className="w-4 h-4 text-purple-600 bg-white border-purple-300 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                  />
                  <span className="text-[14px] text-gray-700">顯示性能指標和音頻控制</span>
                </label>
                <div className="text-[13px] text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="font-medium text-gray-700 mb-1">💡 記錄保存說明</p>
                  <p className="text-[12px]">面試記錄將在生成評分後自動保存，包含完整的對話歷史和評分結果。</p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Interview Area - Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 space-y-4 md:space-y-6"
          >
            {/* Recording Control Card */}
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Animated Header */}
              <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600 p-6 md:p-8 relative overflow-hidden">
                {/* Animated Background Elements */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
                />
                <motion.div
                  animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                  }}
                  className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"
                />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={isRecording ? {
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="relative"
                    >
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl md:rounded-3xl flex items-center justify-center">
                        <Mic className="w-8 h-8 md:w-10 md:h-10 text-white" />
                      </div>
                      {isRecording && (
                        <motion.div
                          animate={{
                            scale: [1, 1.5],
                            opacity: [0.5, 0]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeOut"
                          }}
                          className="absolute inset-0 bg-red-500 rounded-2xl md:rounded-3xl"
                        />
                      )}
                    </motion.div>
                    <div className="text-left">
                      <h2 className="text-[20px] md:text-[24px] text-white mb-1">語音識別</h2>
                      <p className="text-[12px] md:text-[13px] text-white/80">短語音識別 · 千帆v2流式 · 分段TTS並行</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <motion.div
                    key={`${status}-${isTTSPlaying}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`px-4 py-2 rounded-full text-[13px] md:text-[14px] backdrop-blur-sm ${
                      isTTSPlaying
                        ? "bg-blue-500/90 text-white"
                        : isRecording 
                        ? "bg-red-500/90 text-white" 
                        : status === "已停止"
                        ? "bg-gray-500/90 text-white"
                        : "bg-white/90 text-purple-600"
                    }`}
                  >
                    {isTTSPlaying ? "語音播放中" : status}
                  </motion.div>
                </div>
              </div>

              {/* Controls */}
              <div className="p-4 md:p-6 space-y-4">
                {/* Recognition Mode & Recording Button */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-[13px] md:text-[14px] text-gray-600 mb-2">識別模式</label>
                    <select
                      value={recognitionMode}
                      onChange={(e) => setRecognitionMode(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white text-[14px] md:text-[15px] transition-all"
                    >
                      <option value="mandarin">🇨🇳 普通話（純中文）</option>
                      <option value="english">🇬🇧 英語</option>
                      <option value="cantonese">🇭🇰 粵語</option>
                    </select>
                  </div>
                  <motion.button
                    whileHover={isTTSPlaying ? {} : { scale: 1.05 }}
                    whileTap={isTTSPlaying ? {} : { scale: 0.95 }}
                    onClick={handleStartRecording}
                    disabled={isTTSPlaying}
                    className={`sm:self-end px-6 md:px-8 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-[15px] md:text-[16px] ${
                      isTTSPlaying
                        ? "bg-gray-400 cursor-not-allowed text-white shadow-gray-200"
                        : isRecording
                        ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-200"
                        : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-purple-200"
                    }`}
                  >
                    {isTTSPlaying ? (
                      <>
                        <Volume2 className="w-5 h-5 animate-pulse" />
                        語音播放中...
                      </>
                    ) : isRecording ? (
                      <>
                        <MicOff className="w-5 h-5" />
                        停止錄音
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5" />
                        開始錄音
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Conversation Area */}
                <div className="relative">
                  <div className="absolute -top-3 left-4 px-3 py-1 bg-purple-100 text-purple-600 text-[12px] rounded-full z-10 border border-purple-200">
                    對話記錄
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 border-2 border-gray-200 rounded-2xl p-4 md:p-6 min-h-[250px] md:min-h-[350px] relative overflow-hidden pt-6">
                    {!conversation && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <MessageSquare className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3" />
                          <p className="text-[13px] md:text-[14px] text-gray-400">點擊「開始錄音」開始對話...</p>
                        </div>
                      </div>
                    )}
                    <p className="text-[14px] md:text-[15px] text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {conversation}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Controls Card - 条件渲染 */}
            {showAdvancedOptions && (
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-100 p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Volume2 className="w-5 h-5 text-purple-600" />
                <h3 className="text-[16px] md:text-[18px] text-gray-900">音頻控制</h3>
              </div>

              <div className="space-y-4">
                {/* Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {/* Speed */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-600" />
                        <label className="text-[13px] md:text-[14px] text-gray-700">語速</label>
                      </div>
                      <span className="text-[15px] md:text-[16px] text-purple-600 px-2 py-1 bg-white rounded-lg">{speed}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                      className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer slider-purple"
                    />
                  </div>

                  {/* Pitch */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <label className="text-[13px] md:text-[14px] text-gray-700">音調</label>
                      </div>
                      <span className="text-[15px] md:text-[16px] text-blue-600 px-2 py-1 bg-white rounded-lg">{pitch}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={pitch}
                      onChange={(e) => setPitch(Number(e.target.value))}
                      className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer slider-blue"
                    />
                  </div>

                  {/* Volume */}
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-indigo-600" />
                        <label className="text-[13px] md:text-[14px] text-gray-700">音量</label>
                      </div>
                      <span className="text-[15px] md:text-[16px] text-indigo-600 px-2 py-1 bg-white rounded-lg">{volume}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer slider-indigo"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStopPlayback}
                    className="px-5 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all text-[13px] md:text-[14px] text-gray-700 shadow-sm"
                  >
                    停止播放
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClearConversation}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl hover:from-red-100 hover:to-red-200 transition-all flex items-center gap-2 text-[13px] md:text-[14px] text-red-700 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    清空對話
                  </motion.button>
                  
                  {/* Pause Adjust Toggle */}
                  <div className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                    <input
                      type="checkbox"
                      id="pauseAdjust"
                      checked={pauseAdjust}
                      onChange={(e) => setPauseAdjust(e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-white border-purple-300 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                    />
                    <label htmlFor="pauseAdjust" className="text-[13px] md:text-[14px] text-gray-700 whitespace-nowrap cursor-pointer">
                      停頓微調
                    </label>
                  </div>
                </div>
              </div>
            </div>
            )}
          </motion.div>

          {/* Performance Metrics - Right Sidebar - 条件渲染 */}
          {showAdvancedOptions && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`space-y-4 ${sidebarOpen ? 'lg:col-span-1' : 'hidden'}`}
          >
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-100 p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-purple-600" />
                <h3 className="text-[16px] md:text-[18px] text-gray-900">性能指標</h3>
              </div>

              <div className="space-y-3">
                {[
                  { label: "ASR延遲", value: metrics.asr, color: "purple", icon: Mic },
                  { label: "LLM延遲", value: metrics.llm, color: "blue", icon: Sparkles },
                  { label: "TTS延遲", value: metrics.tts, color: "indigo", icon: Volume2 },
                  { label: "端到端延遲", value: metrics.endToEnd, color: "pink", icon: Zap }
                ].map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (0.1 * index) }}
                    className={`bg-gradient-to-br from-${metric.color}-50 to-${metric.color}-100/50 rounded-xl p-4 border border-${metric.color}-200`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <metric.icon className={`w-4 h-4 text-${metric.color}-600`} />
                        <p className="text-[12px] md:text-[13px] text-gray-600">{metric.label}</p>
                      </div>
                    </div>
                    <p className={`text-[24px] md:text-[28px] text-${metric.color}-600`}>{metric.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-[15px] md:text-[16px]">使用提示</h3>
              </div>
              <ul className="space-y-2 text-[12px] md:text-[13px] text-white/90">
                <li>• 選擇合適的識別模式</li>
                <li>• 保持安靜的環境</li>
                <li>• 清晰表達您的回答</li>
                <li>• 調整音頻參數以獲得最佳體驗</li>
              </ul>
            </div>
          </motion.div>
          )}
        </div>

        {/* 结束面试并生成评分按钮 */}
        {conversationHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generateEvaluation}
              disabled={isGeneratingEvaluation}
              className={`px-8 py-4 rounded-2xl shadow-lg flex items-center gap-3 text-[16px] font-semibold transition-all ${
                isGeneratingEvaluation
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
              }`}
            >
              {isGeneratingEvaluation ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  正在生成評分...
                </>
              ) : (
                <>
                  <Award className="w-5 h-5" />
                  結束面試並生成評分
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* Interview Records Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="hidden lg:block w-80 bg-white border-l border-gray-200 flex flex-col fixed right-0 top-0 h-screen z-20"
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[18px] font-semibold text-gray-900">面試記錄</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleClearConversation}
                      className="h-9 w-9 p-0 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                      title="新面試"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setSidebarOpen(false)}
                      className="h-9 w-9 p-0 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                      title="收起記錄"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Records List */}
              <div className="flex-1 overflow-y-auto">
                {isLoadingRecords ? (
                  <div className="p-4 text-center text-gray-500 text-[14px]">
                    <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300 animate-spin" />
                    <p>載入中...</p>
                  </div>
                ) : interviewRecords.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-[14px]">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>還沒有面試記錄</p>
                    <p className="text-[12px] mt-1">開始面試並保存記錄吧！</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {interviewRecords
                      .slice()
                      .reverse()
                      .map((record) => (
                        <motion.div
                          key={record.id}
                          whileHover={{ backgroundColor: "rgba(147, 51, 234, 0.05)" }}
                          className={`group relative p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                            currentRecordId === record.id
                              ? "bg-purple-50 border border-purple-200"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => {
                            loadInterviewRecord(record.id);
                            // 如果有评分，显示评分对话框
                            if (record.metadata?.evaluation) {
                              setEvaluationResult(record.metadata.evaluation);
                              setShowEvaluationDialog(true);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <MessageSquare className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                <p className="text-[14px] font-medium text-gray-900 truncate">
                                  {record.title || '未命名面試'}
                                </p>
                              </div>
                              <p className="text-[12px] text-gray-500">
                                {new Date(record.created_at).toLocaleDateString("zh-TW", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-[11px] text-gray-400">
                                  {record.conversation.length} 條對話
                                </p>
                                {record.metadata?.evaluation?.score !== undefined && (
                                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                                    record.metadata.evaluation.score >= 80
                                      ? 'bg-green-100 text-green-700'
                                      : record.metadata.evaluation.score >= 60
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : record.metadata.evaluation.score >= 40
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {record.metadata.evaluation.score}分
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              onClick={(e) => handleDeleteRecord(record.id, e)}
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
                              title="刪除記錄"
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

        {/* Mobile Sidebar Toggle */}
        {!sidebarOpen && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(true)}
            className="fixed right-4 bottom-4 lg:hidden z-40 bg-purple-600 text-white p-3 rounded-full shadow-lg"
            title="顯示面試記錄"
          >
            <MessageSquare className="w-5 h-5" />
          </motion.button>
        )}

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="lg:hidden fixed right-0 top-0 w-80 bg-white border-l border-gray-200 flex flex-col h-screen z-40"
              >
                {/* Mobile Sidebar Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[18px] font-semibold text-gray-900">面試記錄</h2>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleClearConversation}
                        className="h-9 w-9 p-0 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                        title="新面試"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => setSidebarOpen(false)}
                        className="h-9 w-9 p-0 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Mobile Records List */}
                <div className="flex-1 overflow-y-auto">
                  {isLoadingRecords ? (
                    <div className="p-4 text-center text-gray-500 text-[14px]">
                      <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300 animate-spin" />
                      <p>載入中...</p>
                    </div>
                  ) : interviewRecords.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-[14px]">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>還沒有面試記錄</p>
                      <p className="text-[12px] mt-1">開始面試並保存記錄吧！</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {interviewRecords
                        .slice()
                        .reverse()
                        .map((record) => (
                          <motion.div
                            key={record.id}
                            whileHover={{ backgroundColor: "rgba(147, 51, 234, 0.05)" }}
                            className={`group relative p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                              currentRecordId === record.id
                                ? "bg-purple-50 border border-purple-200"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => {
                              loadInterviewRecord(record.id);
                              setSidebarOpen(false);
                              // 如果有评分，显示评分对话框
                              if (record.metadata?.evaluation) {
                                setEvaluationResult(record.metadata.evaluation);
                                setShowEvaluationDialog(true);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <MessageSquare className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                  <p className="text-[14px] font-medium text-gray-900 truncate">
                                    {record.title || '未命名面試'}
                                  </p>
                                </div>
                                <p className="text-[12px] text-gray-500">
                                  {new Date(record.created_at).toLocaleDateString("zh-TW", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-[11px] text-gray-400">
                                    {record.conversation.length} 條對話
                                  </p>
                                  {record.metadata?.evaluation?.score !== undefined && (
                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                                      record.metadata.evaluation.score >= 80
                                        ? 'bg-green-100 text-green-700'
                                        : record.metadata.evaluation.score >= 60
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : record.metadata.evaluation.score >= 40
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                      {record.metadata.evaluation.score}分
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button
                                onClick={(e) => handleDeleteRecord(record.id, e)}
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
                                title="刪除記錄"
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

              {/* Mobile Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black/50 z-30"
                onClick={() => setSidebarOpen(false)}
              />
            </>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .slider-purple::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(147, 51, 234, 0.3);
        }
        
        .slider-purple::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(147, 51, 234, 0.3);
        }

        .slider-blue::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }
        
        .slider-blue::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .slider-indigo::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }
        
        .slider-indigo::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }
      `}</style>

      {/* 评分结果对话框 */}
      <AnimatePresence>
        {showEvaluationDialog && evaluationResult && (
          <>
            {/* 遮罩层 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEvaluationDialog(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            
            {/* 对话框 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* 对话框头部 */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-t-3xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-[24px] font-bold text-white">面試評分結果</h2>
                        <p className="text-[14px] text-white/80">DeepSeek AI 專業評估</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowEvaluationDialog(false)}
                      className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* 对话框内容 */}
                <div className="p-6 space-y-6">
                  {/* 总分 */}
                  <div className="text-center border-b border-gray-200 pb-6">
                    <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 mb-4">
                      <span className="text-[42px] font-bold text-purple-600">
                        {evaluationResult.score}
                      </span>
                      <span className="text-[20px] text-purple-600 ml-1">分</span>
                    </div>
                    <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-3 mb-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          evaluationResult.score >= 80
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : evaluationResult.score >= 60
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                            : evaluationResult.score >= 40
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                            : 'bg-gradient-to-r from-red-500 to-red-600'
                        }`}
                        style={{ width: `${Math.min(evaluationResult.score, 100)}%` }}
                      />
                    </div>
                    <p className={`text-[15px] font-semibold ${
                      evaluationResult.score >= 80
                        ? 'text-green-600'
                        : evaluationResult.score >= 60
                        ? 'text-yellow-600'
                        : evaluationResult.score >= 40
                        ? 'text-orange-600'
                        : 'text-red-600'
                    }`}>
                      {evaluationResult.score >= 80
                        ? '優秀'
                        : evaluationResult.score >= 60
                        ? '良好'
                        : evaluationResult.score >= 40
                        ? '一般'
                        : '需要大幅改進'}
                    </p>
                  </div>

                  {/* 详细评分 */}
                  {evaluationResult.details && Object.keys(evaluationResult.details).length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(evaluationResult.details).map(([key, value]: [string, any]) => {
                        const score = Number(value) || 0;
                        const maxScore = 25;
                        const percentage = (score / maxScore) * 100;
                        return (
                          <div key={key} className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center hover:border-purple-300 transition-colors">
                            <p className="text-[13px] text-gray-600 mb-3 font-medium">
                              {key === 'expression' ? '表達能力' :
                               key === 'professional' ? '專業素養' :
                               key === 'communication' ? '溝通能力' :
                               key === 'comprehensive' ? '綜合素質' : key}
                            </p>
                            <div className="mb-2">
                              <p className={`text-[28px] font-bold ${
                                score === 0 ? 'text-red-600' :
                                score < 10 ? 'text-orange-600' :
                                score < 15 ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {score}
                              </p>
                              <p className="text-[11px] text-gray-400">/ {maxScore}</p>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  score === 0 ? 'bg-red-500' :
                                  score < 10 ? 'bg-orange-500' :
                                  score < 15 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 总体评价 */}
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-5">
                    <h3 className="text-[18px] font-semibold text-gray-900 mb-3">總體評價</h3>
                    <p className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {evaluationResult.feedback}
                    </p>
                  </div>

                  {/* 优势 - 只在有优势时显示 */}
                  {evaluationResult.strengths && evaluationResult.strengths.length > 0 && (
                    <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                      <h3 className="text-[18px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        優勢表現
                      </h3>
                      <ul className="space-y-2">
                        {evaluationResult.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2 text-[15px] text-gray-700">
                            <span className="text-green-600 mt-1 font-bold">✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 改进建议 */}
                  {evaluationResult.improvements && evaluationResult.improvements.length > 0 && (
                    <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
                      <h3 className="text-[18px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-orange-600" />
                        改進建議
                      </h3>
                      <ul className="space-y-2.5">
                        {evaluationResult.improvements.map((improvement, index) => (
                          <li key={index} className="flex items-start gap-2 text-[15px] text-gray-700">
                            <span className="text-orange-600 mt-1 font-bold">•</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => setShowEvaluationDialog(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      關閉
                    </Button>
                    <Button
                      onClick={() => {
                        // 评分已经在生成时自动保存了，这里只是关闭对话框
                        setShowEvaluationDialog(false);
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      關閉
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
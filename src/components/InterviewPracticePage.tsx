import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Mic, MicOff, Trash2, Volume2, ArrowLeft, Sparkles, Zap, Clock, MessageSquare } from "lucide-react";
import { getBaiduAccessToken, speechToText, textToSpeech, callErnieAPI } from "../services/api";

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

  // API配置（应该从环境变量或配置中获取）
  const [baiduApiKey] = useState(localStorage.getItem('baidu_api_key') || '');
  const [baiduSecretKey] = useState(localStorage.getItem('baidu_secret_key') || '');
  const [accessToken, setAccessToken] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化访问令牌
  useEffect(() => {
    if (baiduApiKey && baiduSecretKey && !accessToken) {
      getBaiduAccessToken(baiduApiKey, baiduSecretKey)
        .then(token => setAccessToken(token))
        .catch(err => console.error('Failed to get access token:', err));
    }
  }, [baiduApiKey, baiduSecretKey, accessToken]);

  const handleStartRecording = async () => {
    if (!isRecording) {
      // 开始录音
      if (!accessToken) {
        alert('请先配置百度API密钥');
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
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setTimeout(() => {
              if (isRecording) {
                audioChunksRef.current = [];
                mediaRecorder.start(100);
              }
            }, 50);
          }
        }, 1500);

        // 添加欢迎消息
        if (conversationHistory.length === 0) {
          const welcomeText = '您好！我是AI面试官，很高兴与您交流。请先简单介绍一下自己。';
          addMessage('assistant', welcomeText);
          await playTTS(welcomeText);
        }
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
    if (!accessToken || audioChunksRef.current.length === 0) return;

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

        // 调用LLM
        const llmStartTime = Date.now();
        const newHistory = [...conversationHistory, { role: 'user', content: recognizedText }];
        const response = await callErnieAPI(recognizedText, newHistory, accessToken);
        const llmLatency = Date.now() - llmStartTime;
        setMetrics(prev => ({ ...prev, llm: `${llmLatency}ms` }));

        if (response) {
          addMessage('assistant', response);
          setConversationHistory([...newHistory, { role: 'assistant', content: response }]);
          await playTTS(response);
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
      await new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve(null);
        };
        audio.onerror = reject;
        audio.play().catch(reject);
      });
    } catch (error) {
      console.error('TTS error:', error);
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
  };

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
            <div className="flex items-center gap-2 text-purple-600">
              <Sparkles className="w-5 h-5" />
              <span className="text-[13px] md:text-[14px]">AI 驅動</span>
            </div>
          </div>
          <h1 className="text-[28px] md:text-[36px] text-gray-900 mb-2">AI 面試模擬系統</h1>
          <p className="text-[14px] md:text-[16px] text-gray-600">真實面試場景模擬 · 即時語音互動 · 智能評估反饋</p>
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
                    key={status}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`px-4 py-2 rounded-full text-[13px] md:text-[14px] backdrop-blur-sm ${
                      isRecording 
                        ? "bg-red-500/90 text-white" 
                        : status === "已停止"
                        ? "bg-gray-500/90 text-white"
                        : "bg-white/90 text-purple-600"
                    }`}
                  >
                    {status}
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
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartRecording}
                    className={`sm:self-end px-6 md:px-8 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-[15px] md:text-[16px] ${
                      isRecording
                        ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-200"
                        : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-purple-200"
                    }`}
                  >
                    {isRecording ? (
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

            {/* Audio Controls Card */}
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
          </motion.div>

          {/* Performance Metrics - Right Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
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
        </div>
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
    </div>
  );
}
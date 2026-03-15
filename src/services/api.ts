// API service for backend communication

import { getSupabaseClient } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://aialjdzjuozrnqwlblyz.supabase.co';

export interface OCRResponse {
  filename: string;
  type: string;
  ocr: {
    choices?: Array<{
      message: {
        content: string;
      };
    }>;
  };
}

// Convert file to base64 data URL
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function performOCR(file: File): Promise<OCRResponse> {
  try {
    // Convert file to base64
    const dataUrl = await fileToDataURL(file);
    
    // Use Supabase Edge Function
    const supabase = getSupabaseClient();
    
    // Get session to ensure we have auth token
    const { data: { session } } = await supabase.auth.getSession();
    
    const { data, error } = await supabase.functions.invoke('ocr', {
      body: {
        file: dataUrl,
        filename: file.name,
      },
      headers: {
        Authorization: session ? `Bearer ${session.access_token}` : undefined,
      },
    });

    if (error) {
      throw new Error(`OCR failed: ${error.message}`);
    }

    return data as OCRResponse;
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
}

// Baidu TTS/SST API functions
export interface BaiduTokenResponse {
  access_token: string;
  expires_in: number;
}

async function getSupabaseFunctionHeaders(anonKey: string): Promise<Record<string, string>> {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': anonKey,
  };

  const isSessionValid = Boolean(
    session?.access_token &&
    (!session.expires_at || session.expires_at * 1000 > Date.now())
  );

  if (isSessionValid) {
    headers['Authorization'] = `Bearer ${session!.access_token}`;
  }

  return headers;
}

export async function getBaiduAccessToken(apiKey: string, secretKey: string): Promise<string> {
  // Use Supabase Edge Function to avoid CORS issues
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aialjdzjuozrnqwlblyz.supabase.co';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GtfEWqxJgDwM61N782DaxQ_7NG_Lzae';
  
  const headers = await getSupabaseFunctionHeaders(anonKey);
  
  const response = await fetch(`${supabaseUrl}/functions/v1/baidu-api`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'get_token',
      apiKey,
      secretKey,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function speechToText(
  audioBlob: Blob,
  accessToken: string,
  options: { devPid?: string } = {}
): Promise<string> {
  // Convert blob to base64
  const arrayBuffer = await audioBlob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const base64Audio = btoa(String.fromCharCode(...uint8Array));
  
  // Use Supabase Edge Function to avoid CORS issues
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aialjdzjuozrnqwlblyz.supabase.co';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GtfEWqxJgDwM61N782DaxQ_7NG_Lzae';
  
  const headers = await getSupabaseFunctionHeaders(anonKey);
  
  const response = await fetch(`${supabaseUrl}/functions/v1/baidu-api`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'speech_to_text',
      accessToken,
      audioData: base64Audio,
      devPid: options.devPid,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Speech recognition failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.text || '';
}

export async function textToSpeech(
  text: string,
  accessToken: string,
  options: {
    speed?: number;
    pitch?: number;
    volume?: number;
    person?: number;
  } = {}
): Promise<Blob> {
  // Use Supabase Edge Function to avoid CORS issues
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aialjdzjuozrnqwlblyz.supabase.co';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GtfEWqxJgDwM61N782DaxQ_7NG_Lzae';
  
  const headers = await getSupabaseFunctionHeaders(anonKey);
  
  const response = await fetch(`${supabaseUrl}/functions/v1/baidu-api`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'text_to_speech',
      accessToken,
      text,
      speed: options.speed || 5,
      pitch: options.pitch || 5,
      volume: options.volume || 5,
      person: options.person || 4,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TTS failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  // Convert base64 back to blob
  const audioBytes = Uint8Array.from(atob(data.audioData), c => c.charCodeAt(0));
  return new Blob([audioBytes], { type: 'audio/mp3' });
}

export async function callErnieAPI(
  userInput: string,
  conversationHistory: Array<{ role: string; content: string }>,
  accessToken: string,
  model: string = 'ernie-5.0' // 使用文心5.0
): Promise<string> {
  // Use Supabase Edge Function to avoid CORS issues
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aialjdzjuozrnqwlblyz.supabase.co';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GtfEWqxJgDwM61N782DaxQ_7NG_Lzae';
  
  const headers = await getSupabaseFunctionHeaders(anonKey);
  
  const response = await fetch(`${supabaseUrl}/functions/v1/baidu-api`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'ernie_chat',
      accessToken,
      userInput,
      conversationHistory,
      model,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Ernie API Edge Function error:', response.status, response.statusText, errorText);
    throw new Error(`Ernie API failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log('📦 Ernie API Edge Function response:', data);
  
  // Check if there's an error in the response
  if (data.error) {
    console.error('❌ Ernie API error in response:', data.error);
    throw new Error(`Ernie API error: ${data.error}`);
  }
  
  // Check if result exists
  if (!data.result) {
    console.warn('⚠️ Ernie API returned no result:', data);
    throw new Error('Ernie API returned empty result');
  }
  
  return data.result;
}

// 快速生成問卷問題的API調用（優化速度）
async function callErnieChatAPIFast(
  userInput: string,
  bearerToken: string,
  systemPrompt: string,
  unconvergedDimensions: string[]
): Promise<string> {
  const messages = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: userInput,
    },
  ];

  // 優化的請求參數：適度提高temperature增加多樣性，避免重複
  const requestBody = {
    model: 'ernie-4.5-turbo-vl',
    messages: messages,
    temperature: 0.7, // 適度降低temperature，加快穩定生成
    top_p: 0.8,
    penalty_score: 1,
    max_output_tokens: 700, // 提高輸出長度避免截斷
    stop: [],
    web_search: {
      enable: false,
      enable_trace: false,
    },
  };

  const response = await fetch(
    'https://qianfan.baidubce.com/v2/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ernie API failed: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Ernie API error: ${data.error.message || data.error.code || 'Unknown error'}`);
  }
  
  // 提取响应内容
  if (data.choices && data.choices.length > 0 && data.choices[0].message) {
    return data.choices[0].message.content?.trim() || '';
  }
  
  if (data.result) {
    return data.result.trim();
  }
  
  throw new Error(`API response format unexpected: ${JSON.stringify(data).substring(0, 200)}`);
}

// 文心 5.0 聊天 API（用于 AI 助手）- 使用新的千帆 API 格式
export async function callErnieChatAPI(
  userInput: string,
  conversationHistory: Array<{ role: string; content: string }>,
  bearerToken: string,
  model: string = 'ernie-5.0',
  customSystemPrompt?: string // 允许自定义 system prompt
): Promise<string> {
  const systemPrompt = customSystemPrompt || `你是一位專業的AI升學輔導助手，可以協助學生：
1. 推薦適合的科系與專業
2. 解答升學相關問題
3. 提供面試準備建議
4. 分析學校與科系資訊
5. 進行分數落點分析

要求：
- 回答要專業、準確、友好
- 根據學生的具體情況提供個性化建議
- 使用清晰易懂的語言
- 可適當使用列表與分段來組織回答`;

  const messages = [
    {
      role: 'system',
      content: systemPrompt,
    },
    ...conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: 'user',
      content: userInput,
    },
  ];

  // 使用新的千帆 API 格式
  const requestBody = {
    model: model,
    messages: messages,
    temperature: 0.8,
    top_p: 0.8,
    penalty_score: 1,
    stop: [],
    web_search: {
      enable: false,
      enable_trace: false,
    },
  };

  console.log('🌐 [callErnieChatAPI] 發送 API 請求:', {
    url: 'https://qianfan.baidubce.com/v2/chat/completions',
    model: model,
    messagesCount: messages.length,
    bearerTokenLength: bearerToken.length,
    bearerTokenPrefix: bearerToken.substring(0, 20) + '...',
    requestBodyPreview: JSON.stringify(requestBody).substring(0, 200) + '...',
  });

  let response: Response;
  try {
    response = await fetch(
      'https://qianfan.baidubce.com/v2/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}`,
        },
        body: JSON.stringify(requestBody),
      }
    );
    console.log('📥 [callErnieChatAPI] API 響應狀態:', response.status, response.statusText);
  } catch (fetchError) {
    console.error('❌ [callErnieChatAPI] Fetch 錯誤:', fetchError);
    throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Ernie API 錯誤:', errorText);
    throw new Error(`Ernie API failed: ${response.statusText} - ${errorText}`);
  }

  let data: any;
  try {
    const responseText = await response.text();
    console.log('📦 [callErnieChatAPI] API 響應原始文本 (前500字符):', responseText.substring(0, 500));
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ [callErnieChatAPI] JSON 解析失敗:', parseError);
      console.error('響應文本:', responseText);
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
    }
    
    console.log('📦 [callErnieChatAPI] API 響應數據:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length || 0,
      hasResult: !!data.result,
      hasError: !!data.error,
      responseKeys: Object.keys(data),
      fullResponse: JSON.stringify(data, null, 2).substring(0, 1000) // 显示前1000字符
    });
  } catch (error) {
    console.error('❌ [callErnieChatAPI] 處理響應時出錯:', error);
    throw error;
  }
  
  // 处理新 API 格式的响应
  if (data.error) {
    console.error('❌ Ernie API error:', {
      error: data.error,
      fullResponse: JSON.stringify(data, null, 2)
    });
    throw new Error(`Ernie API error: ${data.error.message || data.error.code || 'Unknown error'}`);
  }
  
  // 新 API 格式：data.choices[0].message.content
  if (data.choices && data.choices.length > 0 && data.choices[0].message) {
    const content = data.choices[0].message.content;
    console.log('✅ 从 choices[0].message.content 提取响应:', {
      contentLength: content?.length || 0,
      contentPreview: content ? content.substring(0, 100) + '...' : 'null'
    });
    return content ? content.trim() : '';
  }
  
  // 兼容旧格式：data.result
  if (data.result) {
    console.log('✅ 从 result 提取响应:', {
      resultLength: data.result?.length || 0,
      resultPreview: data.result ? data.result.substring(0, 100) + '...' : 'null'
    });
    return data.result.trim();
  }
  
  // 如果都没有，记录详细信息并抛出错误
  console.error('⚠️ [callErnieChatAPI] API 响应中没有找到有效内容:', {
    responseKeys: Object.keys(data),
    choices: data.choices,
    result: data.result,
    error: data.error,
    fullData: JSON.stringify(data, null, 2)
  });
  
  // 抛出错误而不是返回默认消息，这样调用方可以知道发生了什么
  throw new Error(`API response format unexpected: ${JSON.stringify(data).substring(0, 200)}`);
}

// 成绩统计分析接口
export interface GradeStatistics {
  bySubject: Array<{
    subject: string;
    avg: string;
    avgScore: string;
    scored: number;
    total: number;
    completion: string;
  }>;
  overall: {
    totalEvents: number;
    totalScored: number;
    completion: string;
    overallAvg: string;
    overallScore: string;
    overallMax: string;
  };
}

// 使用文心 5.0 进行成绩统计分析
export async function analyzeGradeStatistics(
  statistics: GradeStatistics,
  bearerToken: string
): Promise<{
  estimatedScore: string;
  recommendedMajors: string;
  analysis: string;
  strengths: string[];
  improvements: string[];
}> {
  const systemPrompt = `你是一位專業的升學輔導AI助手，擅長分析學生的成績資料並提供升學建議。

重要：該學生的成績計算採用加權平均系統，權重配置如下：
- 測驗成績：20%
- 考試成績：20%
- 日常表現（作業、報告、實驗等）：60%
成績統計中的平均分已考量這些權重因素。

要求：
1. 根據成績統計資料，預估學測級分（15級分制，範圍約45-60級分）
2. 推薦3-5個適合的科系與專業
3. 分析學習優勢與需要加強的科目
4. 提供具體的改進建議，特別關注日常表現（權重60%）的重要性
5. 回答要專業、準確、友好
6. 使用清晰易懂的語言，可適當使用列表與分段

輸出格式要求：
- 預估學測級分：XX-XX級分（例如：56-58級分）
- 推薦科系：用逗號分隔，例如：資訊工程、電機工程、機械工程
- 分析：一段話總結學習情況
- 優勢科目：用逗號分隔
- 需要加強：用逗號分隔`;

  const userPrompt = `請分析以下成績統計資料：

整體統計：
- 總成績事件數：${statistics.overall.totalEvents}
- 已評分事件數：${statistics.overall.totalScored}
- 完成度：${statistics.overall.completion}%
- 整體平均分：${statistics.overall.overallAvg}%
- 平均得分：${statistics.overall.overallScore} / ${statistics.overall.overallMax}

各科表現：
${statistics.bySubject.map(subj => 
  `- ${subj.subject}：平均 ${subj.avg}%，已完成 ${subj.scored}/${subj.total} 項（完成度 ${subj.completion}%）`
).join('\n')}

請提供：
1. 預估學測級分
2. 推薦科系與專業
3. 學習情況分析
4. 優勢科目
5. 需要加強的科目`;

  const messages = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: userPrompt,
    },
  ];

  const requestBody = {
    model: 'ernie-5.0',
    messages: messages,
    temperature: 0.8,
    top_p: 0.8,
    penalty_score: 1,
    stop: [],
    web_search: {
      enable: false,
      enable_trace: false,
    },
  };

  const response = await fetch(
    'https://qianfan.baidubce.com/v2/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ 成绩分析 API 錯誤:', errorText);
    throw new Error(`成绩分析 API failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    console.error('成绩分析 API error:', data);
    throw new Error(`成绩分析 API error: ${data.error.message || data.error.code || 'Unknown error'}`);
  }
  
  const aiResponse = data.choices?.[0]?.message?.content || data.result || '无法生成分析';
  
  // 解析 AI 响应
  const estimatedScoreMatch = aiResponse.match(/预估学测级分[：:]\s*(\d+-\d+)/) || 
                              aiResponse.match(/(\d+-\d+)\s*级分/);
  const estimatedScore = estimatedScoreMatch ? estimatedScoreMatch[1] : '55-57';
  
  const recommendedMatch = aiResponse.match(/推荐科系[：:]([^\n]+)/);
  const recommendedMajors = recommendedMatch ? recommendedMatch[1].trim() : '資訊工程、電機工程';
  
  const strengthsMatch = aiResponse.match(/优势科目[：:]([^\n]+)/);
  const strengths = strengthsMatch ? strengthsMatch[1].split(/[,，]/).map(s => s.trim()) : [];
  
  const improvementsMatch = aiResponse.match(/需要加强[：:]([^\n]+)/);
  const improvements = improvementsMatch ? improvementsMatch[1].split(/[,，]/).map(s => s.trim()) : [];
  
  return {
    estimatedScore,
    recommendedMajors,
    analysis: aiResponse,
    strengths: strengths.length > 0 ? strengths : statistics.bySubject
      .filter(s => parseFloat(s.avg) >= 85)
      .map(s => s.subject),
    improvements: improvements.length > 0 ? improvements : statistics.bySubject
      .filter(s => parseFloat(s.avg) < 80)
      .map(s => s.subject),
  };
}

// DeepSeek 解析成绩事件
export interface GradeEvent {
  id: string;
  date: string;
  date_range: string;
  week: string;
  subject: string;
  type: string;
  title: string;
  notes: string;
}

export interface ParseGradesResponse {
  choices?: Array<{
    message: {
      content: string;
    };
  }>;
  events?: GradeEvent[];
}

export async function parseGradesFromOCR(
  ocrText: string,
  track?: 'liberal' | 'science'
): Promise<ParseGradesResponse> {
  try {
    // Use Supabase Edge Function
    const supabase = getSupabaseClient();
    
    // Get session to ensure we have auth token
    const { data: { session } } = await supabase.auth.getSession();
    
    const { data, error } = await supabase.functions.invoke('parse-grades', {
      body: {
        ocr_text: ocrText,
        track: track, // 传递文理科选择
      },
      headers: {
        Authorization: session ? `Bearer ${session.access_token}` : undefined,
      },
    });

    if (error) {
      throw new Error(`Parse grades failed: ${error.message}`);
    }

    // Edge Function already extracts events, so return directly
    return data as ParseGradesResponse;
  } catch (error) {
    console.error('Parse Grades Error:', error);
    throw error;
  }
}

// ==================== 自适应问卷系统 ====================

// 人格权重接口
export interface PersonalityWeights {
  // MBTI 维度
  mbti: {
    E: number; // 外向
    I: number; // 内向
    S: number; // 感觉
    N: number; // 直觉
    T: number; // 思考
    F: number; // 情感
    J: number; // 判断
    P: number; // 知觉
  };
  // Holland 维度
  holland: {
    R: number; // 现实型
    I: number; // 研究型
    A: number; // 艺术型
    S: number; // 社会型
    E: number; // 企业型
    C: number; // 常规型
  };
}

// 问卷问题接口
export interface QuestionnaireQuestion {
  question: string;
  options: Array<{
    text: string;
    weights: {
      mbti?: Partial<PersonalityWeights['mbti']>;
      holland?: Partial<PersonalityWeights['holland']>;
    };
  }>;
}

// 问卷状态接口
export interface QuestionnaireState {
  currentWeights: PersonalityWeights;
  stage: 'icebreaker' | 'behavior' | 'situation'; // 破冰 → 行为 → 情境
  questionNumber: number;
  answers: Array<{
    question: string;
    selectedOption: number;
    timestamp: string;
  }>;
  convergedDimensions: {
    mbti: string[]; // 已收敛的MBTI维度，如 ['E/I', 'S/N']
    holland: string[]; // 已收敛的Holland维度，如 ['R', 'I']
  };
  confidenceScores: {
    mbti: Record<string, number>; // 如 { 'E/I': 0.85 }
    holland: Record<string, number>; // 如 { 'R': 0.90 }
  };
}

// 生成問卷問題的函數
export async function generateQuestionnaireQuestion(
  state: QuestionnaireState,
  lastAnswer?: { question: string; selectedOption: number },
  bearerToken: string
): Promise<QuestionnaireQuestion | null> {
  // 計算哪些維度尚未收斂
  const unconvergedDimensions: string[] = [];
  
  // 檢查MBTI維度
  const mbtiPairs = [
    { key: 'E/I', values: ['E', 'I'] },
    { key: 'S/N', values: ['S', 'N'] },
    { key: 'T/F', values: ['T', 'F'] },
    { key: 'J/P', values: ['J', 'P'] },
  ];
  
  for (const pair of mbtiPairs) {
    if (state.convergedDimensions.mbti.includes(pair.key)) {
      continue; // 已收斂，跳過
    }
    
    const diff = Math.abs(state.currentWeights.mbti[pair.values[0] as keyof PersonalityWeights['mbti']] - 
                          state.currentWeights.mbti[pair.values[1] as keyof PersonalityWeights['mbti']]);
    const confidence = state.confidenceScores.mbti[pair.key] || 0;
    
    if (diff < 3 || confidence < 0.8) {
      unconvergedDimensions.push(`MBTI-${pair.key}`);
    }
  }
  
  // 檢查Holland維度
  const hollandTypes = ['R', 'I', 'A', 'S', 'E', 'C'];
  for (const type of hollandTypes) {
    if (state.convergedDimensions.holland.includes(type)) {
      continue; // 已收斂，跳過
    }
    
    // 計算該類型與其他類型的最大差距
    const currentValue = state.currentWeights.holland[type as keyof PersonalityWeights['holland']];
    const otherValues = hollandTypes
      .filter(t => t !== type)
      .map(t => state.currentWeights.holland[t as keyof PersonalityWeights['holland']]);
    const maxDiff = Math.max(...otherValues.map(v => Math.abs(currentValue - v)));
    const confidence = state.confidenceScores.holland[type] || 0;
    
    if (maxDiff < 3 || confidence < 0.8) {
      unconvergedDimensions.push(`Holland-${type}`);
    }
  }
  
  // 如果所有維度都收斂了，返回null表示問卷完成
  if (unconvergedDimensions.length === 0) {
    return null;
  }
  
  // 確定當前階段
  let currentStage = state.stage;
  if (state.questionNumber === 0) {
    currentStage = 'icebreaker';
  } else if (state.questionNumber < 5) {
    currentStage = 'behavior';
  } else {
    currentStage = 'situation';
  }
  
  // 構建系統提示詞（確保繁體中文且不重複）
  const stageName = currentStage === 'icebreaker' ? '破冰' : currentStage === 'behavior' ? '行為' : '情境';
  const unconvergedStr = unconvergedDimensions.slice(0, 2).join(',');
  
  // 獲取已生成的問題列表（避免重複）
  const previousQuestions = state.answers
    .slice(-5) // 只取最近5題
    .map(a => a.question)
    .join('、');
  
  // 優化prompt：明確要求繁體中文，避免重複
  const systemPrompt = `生成繁體中文問卷問題。要求：
1. 必須使用繁體中文（台灣用語）
2. ${stageName}階段，生活化校園情境
3. 3-4個選項，每個選項繁體中文
4. 針對未收斂維度：${unconvergedStr}
5. 問題必須與已問過的不同：${previousQuestions || '無'}
6. 問題要新穎、多樣化，避免重複

僅輸出JSON（繁體中文）：
{"question":"問題（繁體）","options":[{"text":"選項1（繁體）","weights":{"mbti":{"E":1},"holland":{"R":1}}}]}`;

  // 用戶提示（包含問題歷史）
  const userPrompt = lastAnswer 
    ? `生成第${state.questionNumber + 1}題。上一題：${lastAnswer.question.substring(0, 40)}...，用戶選了選項${lastAnswer.selectedOption + 1}。請生成不同的新問題。`
    : `生成第${state.questionNumber + 1}題（${stageName}階段）。`;

  try {
    // 使用优化的快速生成函数
    const response = await callErnieChatAPIFast(
      userPrompt,
      bearerToken,
      systemPrompt,
      unconvergedDimensions
    );
    
    // 快速解析JSON響應（優化）
    let questionData: QuestionnaireQuestion;
    try {
      // 快速提取JSON：先嘗試直接解析，失敗再提取
      let jsonStr = response.trim();
      
      // 如果包含markdown代碼塊，提取JSON部分
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      } else {
        // 提取第一個完整的JSON對象
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }

      // 移除 JSON 中的行內註解（//）以避免解析失敗
      jsonStr = jsonStr.replace(/\/\/.*$/gm, '');
      
      questionData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse question JSON:', response);
      // 嘗試更寬鬆的解析
      try {
        const cleaned = response.replace(/[^\x20-\x7E\n\r]/g, ''); // 移除非ASCII字符
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const cleanedJson = jsonMatch[0].replace(/\/\/.*$/gm, '');
          questionData = JSON.parse(cleanedJson);
        } else {
          throw parseError;
        }
      } catch (e) {
        // 嘗試截斷修復：補齊括號並移除尾端不完整內容
        try {
          let trimmed = response.trim();
          const startIndex = trimmed.indexOf('{');
          if (startIndex >= 0) {
            trimmed = trimmed.slice(startIndex);
          }
          const lastBrace = trimmed.lastIndexOf('}');
          if (lastBrace >= 0) {
            trimmed = trimmed.slice(0, lastBrace + 1);
          }
          if (trimmed) {
            const cleanedTrimmed = trimmed.replace(/\/\/.*$/gm, '');
            questionData = JSON.parse(cleanedTrimmed);
          } else {
            throw e;
          }
        } catch (finalError) {
          throw new Error('AI返回的格式不正確，無法解析為JSON');
        }
      }
    }
    
    // 驗證問題格式
    if (!questionData.question || !questionData.options || questionData.options.length < 2) {
      throw new Error('生成的問題格式不正確');
    }
    
    return questionData;
  } catch (error) {
    console.error('Error generating question:', error);
    throw error;
  }
}

// 計算信心值
export function calculateConfidenceScore(
  weights: PersonalityWeights,
  dimension: string,
  type: 'mbti' | 'holland'
): number {
  if (type === 'mbti') {
    const pairs: Record<string, string[]> = {
      'E/I': ['E', 'I'],
      'S/N': ['S', 'N'],
      'T/F': ['T', 'F'],
      'J/P': ['J', 'P'],
    };
    
    const pair = pairs[dimension];
    if (!pair) return 0;
    
    const diff = Math.abs(weights.mbti[pair[0] as keyof PersonalityWeights['mbti']] - 
                          weights.mbti[pair[1] as keyof PersonalityWeights['mbti']]);
    // 差距越大，信心值越高（最大1.0）
    return Math.min(diff / 10, 1.0);
  } else {
    // Holland類型：計算該類型與其他類型的最大差距
    const currentValue = weights.holland[dimension as keyof PersonalityWeights['holland']];
    const allTypes = ['R', 'I', 'A', 'S', 'E', 'C'];
    const otherValues = allTypes
      .filter(t => t !== dimension)
      .map(t => weights.holland[t as keyof PersonalityWeights['holland']]);
    const maxDiff = Math.max(...otherValues.map(v => Math.abs(currentValue - v)));
    return Math.min(maxDiff / 10, 1.0);
  }
}

// 更新人格權重
export function updatePersonalityWeights(
  currentWeights: PersonalityWeights,
  selectedWeights: QuestionnaireQuestion['options'][0]['weights']
): PersonalityWeights {
  const newWeights = JSON.parse(JSON.stringify(currentWeights)); // 深拷貝
  
  // 更新MBTI權重
  if (selectedWeights.mbti) {
    for (const [key, value] of Object.entries(selectedWeights.mbti)) {
      if (key in newWeights.mbti) {
        newWeights.mbti[key as keyof PersonalityWeights['mbti']] += value || 0;
      }
    }
  }
  
  // 更新Holland權重
  if (selectedWeights.holland) {
    for (const [key, value] of Object.entries(selectedWeights.holland)) {
      if (key in newWeights.holland) {
        newWeights.holland[key as keyof PersonalityWeights['holland']] += value || 0;
      }
    }
  }
  
  return newWeights;
}

// 檢查維度是否收斂
export function checkDimensionConvergence(
  weights: PersonalityWeights,
  confidenceScores: QuestionnaireState['confidenceScores']
): QuestionnaireState['convergedDimensions'] {
  const converged: QuestionnaireState['convergedDimensions'] = {
    mbti: [],
    holland: [],
  };
  
  // 檢查MBTI維度
  const mbtiPairs = [
    { key: 'E/I', values: ['E', 'I'] },
    { key: 'S/N', values: ['S', 'N'] },
    { key: 'T/F', values: ['T', 'F'] },
    { key: 'J/P', values: ['J', 'P'] },
  ];
  
  for (const pair of mbtiPairs) {
    const diff = Math.abs(weights.mbti[pair.values[0] as keyof PersonalityWeights['mbti']] - 
                          weights.mbti[pair.values[1] as keyof PersonalityWeights['mbti']]);
    const confidence = confidenceScores.mbti[pair.key] || 0;
    
    if (diff >= 3 && confidence >= 0.8) {
      converged.mbti.push(pair.key);
    }
  }
  
  // 檢查Holland維度
  const hollandTypes = ['R', 'I', 'A', 'S', 'E', 'C'];
  for (const type of hollandTypes) {
    const currentValue = weights.holland[type as keyof PersonalityWeights['holland']];
    const otherValues = hollandTypes
      .filter(t => t !== type)
      .map(t => weights.holland[t as keyof PersonalityWeights['holland']]);
    const maxDiff = Math.max(...otherValues.map(v => Math.abs(currentValue - v)));
    const confidence = confidenceScores.holland[type] || 0;
    
    if (maxDiff >= 3 && confidence >= 0.8) {
      converged.holland.push(type);
    }
  }
  
  return converged;
}
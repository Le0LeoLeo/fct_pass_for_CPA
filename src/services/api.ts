// API service for backend communication

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

export async function performOCR(file: File): Promise<OCRResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/ocr`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`OCR failed: ${response.statusText}`);
  }

  return response.json();
}

// Baidu TTS/SST API functions
export interface BaiduTokenResponse {
  access_token: string;
  expires_in: number;
}

export async function getBaiduAccessToken(apiKey: string, secretKey: string): Promise<string> {
  const response = await fetch(
    `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(secretKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data: BaiduTokenResponse = await response.json();
  return data.access_token;
}

export async function speechToText(audioBlob: Blob, accessToken: string): Promise<string> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.pcm');
  
  const params = new URLSearchParams({
    dev_pid: '1537', // 1537=普通话(纯中文识别)
    cuid: 'web_interview_client',
  });

  const response = await fetch(
    `https://vop.baidu.com/server_api?${params.toString()}&token=${accessToken}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/pcm;rate=16000',
      },
      body: audioBlob,
    }
  );

  if (!response.ok) {
    throw new Error(`Speech recognition failed: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.err_no === 0 && result.result && result.result.length > 0) {
    return result.result[0];
  }
  return '';
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
  const params = new URLSearchParams({
    tex: text,
    tok: accessToken,
    cuid: 'web_interview_client',
    ctp: '1',
    lan: 'zh',
    per: (options.person || 4).toString(), // 4=情感女声
    spd: (options.speed || 5).toString(),
    pit: (options.pitch || 5).toString(),
    vol: (options.volume || 5).toString(),
    aue: '3', // mp3格式
  });

  const response = await fetch(`https://tsn.baidu.com/text2audio?${params.toString()}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TTS failed: ${errorText}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const errorData = await response.json();
    throw new Error(`TTS API error: ${JSON.stringify(errorData)}`);
  }

  return response.blob();
}

export async function callErnieAPI(
  userInput: string,
  conversationHistory: Array<{ role: string; content: string }>,
  accessToken: string
): Promise<string> {
  const systemPrompt = `你是一位专业的AI面试官，负责技术岗位（如前端开发、后端开发、全栈开发等）面试。要求：
1. 提问简洁明了，每次只问一个问题
2. 根据候选人的回答进行深入追问，展现专业水平
3. 语气自然友好
4. 回复控制在30-60字之间，口语化表达，避免书面语
5. 如果候选人回答不完整，可以适当引导`;

  const messages = [
    {
      role: 'system',
      content: systemPrompt,
    },
    ...conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  const response = await fetch(
    `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-4.0-8k?access_token=${accessToken}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages,
        temperature: 0.7,
        max_output_tokens: 150,
        stream: false,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Ernie API failed: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.result) {
    return data.result.trim();
  }
  return '抱歉，系统暂时无法响应，请稍后再试。';
}

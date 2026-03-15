// Supabase service for backend database operations

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aialjdzjuozrnqwlblyz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GtfEWqxJgDwM61N782DaxQ_7NG_Lzae';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabaseClient;
}

// Google 登錄
export async function signInWithGoogle(): Promise<{ data: any; error: any }> {
  const supabase = getSupabaseClient();
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });
}

// 登出
export async function signOut(): Promise<{ error: any }> {
  const supabase = getSupabaseClient();
  return await supabase.auth.signOut();
}

// 獲取當前用戶
export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// 獲取當前會話
export async function getSession() {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// 監聽認證狀態變化
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const supabase = getSupabaseClient();
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

export function initializeSupabase(url?: string, anonKey?: string): SupabaseClient {
  const finalUrl = url || supabaseUrl;
  const finalKey = anonKey || supabaseAnonKey;
  
  if (!finalUrl || !finalKey || finalUrl === 'https://your-project.supabase.co') {
    throw new Error('請配置 Supabase URL 和 Anon Key');
  }
  
  supabaseClient = createClient(finalUrl, finalKey);
  return supabaseClient;
}

// 大學資料介面（與 Firebase 結構兼容）
export interface University {
  id: string;
  name?: string;
  nameEn?: string;
  name_en?: string; // 兼容舊字段
  city?: string;
  district?: string;
  address?: string;
  type?: 'PUBLIC' | 'PRIVATE' | string;
  founded?: number;
  website?: string;
  
  // 聯繫信息
  contact?: {
    email?: string;
    phone?: string;
    fax?: string | null;
  };
  
  // 專業和學科
  majors?: string[];
  disciplines?: string[];
  
  // 錄取分數
  admission_scores?: {
    admission_min?: number;
    tier?: string;
  };
  
  // 排名
  ranking?: {
    domestic?: number;
    qs?: number;
    timesHigherEd?: number;
    lastUpdated?: string | null;
  };
  
  // 學費
  tuition?: {
    undergraduate?: {
      currency?: string;
      perYear?: number;
      perSemester?: number;
    };
    graduate?: {
      currency?: string;
      perYear?: number;
      perSemester?: number;
    };
  };
  
  // 其他
  images?: string[] | null;
  statistics?: any;
  metadata?: any;
  updated_at?: any;
  
  // 兼容舊字段
  department?: string;
  score?: string;
  quota?: number;
  competition?: number;
  created_at?: string;
  
  [key: string]: any;
}

// 從 Supabase 載入大學資料
export async function loadUniversitiesFromSupabase(): Promise<University[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Universities table not found, returning empty list.');
        return [];
      }
      console.error('Supabase error:', error);
      throw error;
    }
    
    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      nameEn: item.name_en,
      city: item.city,
      type: item.type,
      founded: item.founded,
      website: item.website,
      address: item.address,
      district: item.district,
      department: item.department,
      score: item.score,
      quota: item.quota,
      competition: item.competition,
    }));
  } catch (error) {
    console.error('Error loading universities from Supabase:', error);
    throw error;
  }
}

// 搜尋大學
export async function searchUniversities(query: string): Promise<University[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .or(`name.ilike.%${query}%,name_en.ilike.%${query}%,city.ilike.%${query}%`)
      .order('name', { ascending: true });
    
    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Universities table not found, returning empty search results.');
        return [];
      }
      console.error('Supabase search error:', error);
      throw error;
    }
    
    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      nameEn: item.name_en,
      city: item.city,
      type: item.type,
      founded: item.founded,
      website: item.website,
      address: item.address,
      district: item.district,
      department: item.department,
      score: item.score,
      quota: item.quota,
      competition: item.competition,
    }));
  } catch (error) {
    console.error('Error searching universities:', error);
    throw error;
  }
}

// 根據 ID 獲取單一大學
export async function getUniversityById(id: string): Promise<University | null> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Universities table not found, returning null.');
        return null;
      }
      console.error('Supabase get error:', error);
      return null;
    }
    
    if (!data) return null;
    
    return {
      id: data.id,
      name: data.name,
      nameEn: data.name_en,
      city: data.city,
      type: data.type,
      founded: data.founded,
      website: data.website,
      address: data.address,
      district: data.district,
      department: data.department,
      score: data.score,
      quota: data.quota,
      competition: data.competition,
    };
  } catch (error) {
    console.error('Error getting university:', error);
    return null;
  }
}

// 添加大學（需要認證）
export async function addUniversity(university: Omit<University, 'id' | 'created_at' | 'updated_at'>): Promise<University> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('universities')
      .insert({
        name: university.name,
        name_en: university.nameEn,
        city: university.city,
        type: university.type,
        founded: university.founded,
        website: university.website,
        address: university.address,
        district: university.district,
        department: university.department,
        score: university.score,
        quota: university.quota,
        competition: university.competition,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    
    return {
      id: data.id,
      name: data.name,
      nameEn: data.name_en,
      city: data.city,
      type: data.type,
      founded: data.founded,
      website: data.website,
      address: data.address,
      district: data.district,
      department: data.department,
      score: data.score,
      quota: data.quota,
      competition: data.competition,
    };
  } catch (error) {
    console.error('Error adding university:', error);
    throw error;
  }
}

// 更新大學（需要認證）
export async function updateUniversity(id: string, updates: Partial<University>): Promise<University> {
  const supabase = getSupabaseClient();
  
  try {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.nameEn !== undefined) updateData.name_en = updates.nameEn;
    if (updates.city !== undefined) updateData.city = updates.city;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.founded !== undefined) updateData.founded = updates.founded;
    if (updates.website !== undefined) updateData.website = updates.website;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.district !== undefined) updateData.district = updates.district;
    if (updates.department !== undefined) updateData.department = updates.department;
    if (updates.score !== undefined) updateData.score = updates.score;
    if (updates.quota !== undefined) updateData.quota = updates.quota;
    if (updates.competition !== undefined) updateData.competition = updates.competition;
    
    const { data, error } = await supabase
      .from('universities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
    
    return {
      id: data.id,
      name: data.name,
      nameEn: data.name_en,
      city: data.city,
      type: data.type,
      founded: data.founded,
      website: data.website,
      address: data.address,
      district: data.district,
      department: data.department,
      score: data.score,
      quota: data.quota,
      competition: data.competition,
    };
  } catch (error) {
    console.error('Error updating university:', error);
    throw error;
  }
}

// 刪除大學（需要認證）
export async function deleteUniversity(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    const { error } = await supabase
      .from('universities')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting university:', error);
    throw error;
  }
}

// API 配置接口
export interface ApiConfig {
  id: string;
  key_name: string;
  key_value: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// 獲取 API 配置
export async function getApiConfig(keyName: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  
  try {
    console.log(`🔍 查詢 API 配置: ${keyName}`);
    const { data, error } = await supabase
      .from('api_configs')
      .select('key_value')
      .eq('key_name', keyName)
      .single();
    
    if (error) {
      console.error(`❌ 獲取 API 配置失敗 (${keyName}):`, error);
      return null;
    }
    
    const value = data?.key_value || null;
    console.log(`✅ 獲取 API 配置成功 (${keyName}):`, value ? `長度 ${value.length}` : 'null');
    return value;
  } catch (error) {
    console.error(`❌ 獲取 API 配置異常 (${keyName}):`, error);
    return null;
  }
}

// 獲取所有 API 配置（僅用於管理）
export async function getAllApiConfigs(): Promise<ApiConfig[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('api_configs')
      .select('*')
      .order('key_name', { ascending: true });
    
    if (error) {
      console.error('Error getting all API configs:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting all API configs:', error);
    throw error;
  }
}

// 獲取百度 API 配置（便捷函數）
export async function getBaiduApiConfig(): Promise<{
  apiKey: string | null;
  secretKey: string | null;
  apiToken: string | null;
}> {
  console.log('🔧 getBaiduApiConfig 開始執行');
  
  try {
    const supabase = getSupabaseClient();
    console.log('✅ Supabase 客戶端已獲取');
    
    // 先檢查表是否存在
    const { data: tableCheck, error: tableError } = await supabase
      .from('api_configs')
      .select('key_name')
      .limit(1);
    
    if (tableError) {
      console.error('❌ 無法訪問 api_configs 表:', tableError);
      console.error('錯誤詳情:', JSON.stringify(tableError, null, 2));
    } else {
      console.log('✅ api_configs 表可訪問，找到記錄數:', tableCheck?.length || 0);
    }
    
    const [apiKey, secretKey, apiToken] = await Promise.all([
      getApiConfig('baidu_api_key'),
      getApiConfig('baidu_secret_key'),
      getApiConfig('baidu_api_token'),
    ]);
    
    const result = {
      apiKey,
      secretKey,
      apiToken,
    };
    
    console.log('📦 getBaiduApiConfig 結果:', {
      hasApiKey: !!apiKey,
      hasSecretKey: !!secretKey,
      hasApiToken: !!apiToken,
    });
    
    return result;
  } catch (error) {
    console.error('❌ getBaiduApiConfig 異常:', error);
    return {
      apiKey: null,
      secretKey: null,
      apiToken: null,
    };
  }
}

// 面试记录接口
export interface InterviewRecord {
  id: string;
  user_id: string;
  title: string | null;
  conversation: Array<{ role: string; content: string }>;
  created_at: string;
  updated_at: string;
  metadata?: {
    score?: number;
    feedback?: string;
    duration?: number;
    [key: string]: any;
  };
}

// 保存面试记录
export async function saveInterviewRecord(
  conversation: Array<{ role: string; content: string }>,
  title?: string,
  metadata?: Record<string, any>
): Promise<InterviewRecord | null> {
  const supabase = getSupabaseClient();
  
  try {
    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    // 如果没有提供标题，自动生成一个
    const recordTitle = title || `面试记录 ${new Date().toLocaleString('zh-TW')}`;

    const { data, error } = await supabase
      .from('interview_records')
      .insert({
        user_id: user.id,
        title: recordTitle,
        conversation: conversation,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('保存面试记录失败:', error);
      throw error;
    }

    console.log('✅ 面试记录已保存:', data.id);
    return data as InterviewRecord;
  } catch (error) {
    console.error('保存面试记录异常:', error);
    return null;
  }
}

// 获取用户的所有面试记录
export async function getInterviewRecords(): Promise<InterviewRecord[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('interview_records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取面试记录失败:', error);
      return [];
    }

    return (data || []) as InterviewRecord[];
  } catch (error) {
    console.error('获取面试记录异常:', error);
    return [];
  }
}

// 根据 ID 获取单个面试记录
export async function getInterviewRecordById(id: string): Promise<InterviewRecord | null> {
  const supabase = getSupabaseClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('interview_records')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('获取面试记录失败:', error);
      return null;
    }

    return data as InterviewRecord;
  } catch (error) {
    console.error('获取面试记录异常:', error);
    return null;
  }
}

// 辅助函数：计算时间差
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '剛剛';
  if (diffMins < 60) return `${diffMins} 分鐘前`;
  if (diffHours < 24) return `${diffHours} 小時前`;
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays} 天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 週前`;
  return `${Math.floor(diffDays / 30)} 個月前`;
}

// 辅助函数：根据问卷答案生成AI推荐
function getAIRecommendations(answers: number[]): Array<{ name: string; match: number }> {
  // 确保 answers 是数组
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return [
      { name: '資訊工程學系', match: 85 },
      { name: '電機工程學系', match: 80 },
    ];
  }

  // 简单的推荐逻辑：根据答案模式推荐
  const avgAnswer = answers.reduce((a, b) => a + b, 0) / answers.length;
  
  if (avgAnswer < 1.5) {
    // 偏向逻辑和分析
    return [
      { name: '資訊工程學系', match: 95 },
      { name: '數學系', match: 90 },
      { name: '電機工程學系', match: 88 },
    ];
  } else if (avgAnswer < 2.5) {
    // 偏向沟通和表达
    return [
      { name: '企業管理學系', match: 92 },
      { name: '傳播學系', match: 88 },
      { name: '外國語文學系', match: 85 },
    ];
  } else if (avgAnswer < 3.5) {
    // 偏向创意
    return [
      { name: '設計學系', match: 93 },
      { name: '藝術學系', match: 90 },
      { name: '建築學系', match: 87 },
    ];
  } else {
    // 偏向实践
    return [
      { name: '機械工程學系', match: 91 },
      { name: '土木工程學系', match: 88 },
      { name: '化學工程學系', match: 85 },
    ];
  }
}

// 辅助函数：获取成绩统计
function getGradeStats() {
  try {
    const LS_KEY = "schedule_score_state_v1";
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      return { average: "0.0" };
    }

    const obj = JSON.parse(raw);
    const events = obj.events || [];
    const scores = obj.scores || {};

    if (events.length === 0) {
      return { average: "0.0" };
    }

    // 计算学期平均
    let totalWeightedScore = 0;
    let totalWeight = 0;

    events.forEach((ev: any) => {
      if (ev.subject && scores[ev.id] !== undefined && scores[ev.id] !== null) {
        const subject = ev.subject;
        if (!subject.includes("選") && !subject.includes("選修")) {
          const score = parseFloat(scores[ev.id]);
          const weight = ev.weight || 1;
          totalWeightedScore += score * weight;
          totalWeight += weight;
        }
      }
    });

    const average = totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(1) : "0.0";
    return { average };
  } catch (error) {
    return { average: "0.0" };
  }
}

// 获取用户统计数据
export async function getUserStats() {
  const supabase = getSupabaseClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        questionnaireProgress: { completed: 0, total: 5 },
        interviewCount: 0,
        interviewThisWeek: 0,
        favoriteUniversities: 0,
        viewedUniversities: 0,
      };
    }

    // 获取面试记录总数
    const { data: allInterviews, error: interviewError } = await supabase
      .from('interview_records')
      .select('created_at')
      .eq('user_id', user.id);

    if (interviewError) {
      console.error('获取面试记录失败:', interviewError);
    }

    // 计算本周的面试次数（从周一开始）
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // 周一
    startOfWeek.setHours(0, 0, 0, 0);
    
    const interviewThisWeek = allInterviews?.filter(record => {
      const recordDate = new Date(record.created_at);
      return recordDate >= startOfWeek;
    }).length || 0;

    // 获取问卷进度（从 localStorage，如果没有则返回 0）
    const questionnaireAnswersRaw = localStorage.getItem('questionnaire_answers');
    const questionnaireAnswers = questionnaireAnswersRaw ? JSON.parse(questionnaireAnswersRaw) : [];
    const completedQuestions = questionnaireAnswers.length;
    const totalQuestions = 5; // 问卷总题数

    // 获取问卷完成时间
    const questionnaireCompleted = localStorage.getItem('questionnaire_completed_at');

    // 获取收藏的大学数量（从 localStorage）
    const favoriteUniversities = JSON.parse(localStorage.getItem('favorite_universities') || '[]');
    const favoriteCount = favoriteUniversities.length;

    // 计算使用天数（从最早的活动记录开始）
    const firstInterviewDate = allInterviews && allInterviews.length > 0
      ? new Date(Math.min(...allInterviews.map((r: any) => new Date(r.created_at).getTime())))
      : null;
    const firstQuestionnaireDate = questionnaireCompleted ? new Date(questionnaireCompleted) : null;
    const firstFavoriteDate = favoriteUniversities.length > 0 && favoriteUniversities[0]?.addedAt
      ? new Date(favoriteUniversities[0].addedAt)
      : null;
    
    const dates = [firstInterviewDate, firstQuestionnaireDate, firstFavoriteDate].filter(Boolean) as Date[];
    const firstActivityDate = dates.length > 0 
      ? new Date(Math.min(...dates.map(d => d.getTime())))
      : null;
    
    const usageDays = firstActivityDate
      ? Math.ceil((now.getTime() - firstActivityDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // 获取浏览过的大学数量（从 localStorage）
    const viewedUniversities = JSON.parse(localStorage.getItem('viewed_universities') || '[]');
    const viewedCount = viewedUniversities.length;

    // 获取最近的面试记录（最多3条）
    const recentInterviews = allInterviews
      ?.slice(0, 3)
      .map(record => ({
        type: 'interview' as const,
        title: record.title || '模擬面試練習',
        time: getTimeAgo(new Date(record.created_at)),
        id: record.id,
      })) || [];

    // 获取最近的收藏（最多1条）
    const recentFavorites = favoriteUniversities
      .slice(-1)
      .map((fav: any) => ({
        type: 'favorite' as const,
        title: `收藏${fav.name}`,
        time: fav.addedAt ? getTimeAgo(new Date(fav.addedAt)) : '最近',
        id: fav.id,
      }));

    const recentActivities = [
      ...(questionnaireCompleted && completedQuestions >= totalQuestions
        ? [{
            type: 'questionnaire' as const,
            title: '完成性向測驗',
            time: getTimeAgo(new Date(questionnaireCompleted)),
            id: 'questionnaire',
          }]
        : []),
      ...recentInterviews,
      ...recentFavorites,
    ].slice(0, 3); // 最多显示3条

    // 获取AI推荐（基于问卷结果）
    const aiRecommendations = completedQuestions >= totalQuestions && Array.isArray(questionnaireAnswers)
      ? getAIRecommendations(questionnaireAnswers)
      : [];

    // 计算本周学习时数（基于面试记录，假设每次面试约30分钟）
    const interviewMinutes = interviewThisWeek * 30;
    const studyHours = (interviewMinutes / 60).toFixed(1);

    // 计算完成度（基于任务完成情况）
    const weeklyTasksCompleted = (completedQuestions >= totalQuestions ? 1 : 0) + 
                                 (interviewThisWeek >= 3 ? 1 : 0) + 
                                 (viewedCount >= 5 ? 1 : 0);
    const completionRate = Math.round((weeklyTasksCompleted / 4) * 100);

    // 获取最近活动记录（更详细的信息）
    const detailedActivities = [];
    
    // 添加成绩查看记录（如果有成绩数据）
    const gradeStats = getGradeStats();
    if (gradeStats.average !== "0.0") {
      const lastGradeView = localStorage.getItem('last_grade_view');
      if (lastGradeView) {
        detailedActivities.push({
          type: 'grade',
          icon: 'BarChart3',
          title: '查看成績趨勢分析',
          time: getTimeAgo(new Date(lastGradeView)),
          color: 'blue',
          detail: `平均分數 ${gradeStats.average}`,
        });
      }
    }

    // 添加最近的面试记录
    const recentInterview = allInterviews?.[0];
    if (recentInterview) {
      const score = recentInterview.metadata?.evaluation?.score;
      detailedActivities.push({
        type: 'interview',
        icon: 'MessageCircle',
        title: '完成面試模擬練習',
        time: getTimeAgo(new Date(recentInterview.created_at)),
        color: 'purple',
        detail: score ? `評分：${score} 分` : '已完成',
        id: recentInterview.id,
      });
    }

    // 添加问卷完成记录
    if (questionnaireCompleted && completedQuestions >= totalQuestions) {
      const topRecommendation = aiRecommendations[0];
      detailedActivities.push({
        type: 'questionnaire',
        icon: 'FileText',
        title: '完成性向測驗問卷',
        time: getTimeAgo(new Date(questionnaireCompleted)),
        color: 'green',
        detail: topRecommendation ? `推薦：${topRecommendation.name}` : '已完成',
      });
    }

    return {
      questionnaireProgress: {
        completed: completedQuestions,
        total: totalQuestions,
        progress: Math.round((completedQuestions / totalQuestions) * 100),
      },
      interviewCount: allInterviews?.length || 0,
      interviewThisWeek,
      favoriteUniversities: favoriteCount,
      viewedUniversities: viewedCount,
      recentActivities,
      aiRecommendations,
      weeklyTasks: {
        completed: weeklyTasksCompleted,
        total: 4,
      },
      weeklyStudyHours: parseFloat(studyHours),
      completionRate,
      detailedActivities: detailedActivities.slice(0, 3), // 最多3条
      usageDays, // 使用天数
    };
  } catch (error) {
    console.error('获取用户统计数据失败:', error);
    return {
      questionnaireProgress: { completed: 0, total: 5, progress: 0 },
      interviewCount: 0,
      interviewThisWeek: 0,
      favoriteUniversities: 0,
      viewedUniversities: 0,
      recentActivities: [],
      aiRecommendations: [],
      weeklyTasks: { completed: 0, total: 4 },
      weeklyStudyHours: 0,
      completionRate: 0,
      detailedActivities: [],
      usageDays: 0,
    };
  }
}

// 更新面试记录
export async function updateInterviewRecord(
  id: string,
  updates: {
    title?: string;
    conversation?: Array<{ role: string; content: string }>;
    metadata?: Record<string, any>;
  }
): Promise<InterviewRecord | null> {
  const supabase = getSupabaseClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    const { data, error } = await supabase
      .from('interview_records')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('更新面试记录失败:', error);
      throw error;
    }

    return data as InterviewRecord;
  } catch (error) {
    console.error('更新面试记录异常:', error);
    return null;
  }
}

// 删除面试记录
export async function deleteInterviewRecord(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    const { error } = await supabase
      .from('interview_records')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('删除面试记录失败:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('删除面试记录异常:', error);
    return false;
  }
}

// ==================== AI 对话记录相关函数 ====================

export interface AIChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO 字符串格式
}

export interface AIChatConversation {
  id: string;
  user_id: string;
  title: string;
  messages: AIChatMessage[];
  created_at: string;
  updated_at: string;
}

// 保存 AI 对话记录（创建或更新）
export async function saveAIChatConversation(
  conversationId: string | null,
  title: string,
  messages: Array<{ id: number; role: "user" | "assistant"; content: string; timestamp: Date }>
): Promise<AIChatConversation | null> {
  const supabase = getSupabaseClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    // 转换消息格式（将 Date 转换为 ISO 字符串）
    const formattedMessages: AIChatMessage[] = messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
    }));

    if (conversationId) {
      // 更新现有对话
      const { data, error } = await supabase
        .from('ai_chat_conversations')
        .update({
          title: title,
          messages: formattedMessages,
        })
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('更新 AI 对话记录失败:', error);
        throw error;
      }

      return data as AIChatConversation;
    } else {
      // 创建新对话
      const { data, error } = await supabase
        .from('ai_chat_conversations')
        .insert({
          user_id: user.id,
          title: title,
          messages: formattedMessages,
        })
        .select()
        .single();

      if (error) {
        console.error('创建 AI 对话记录失败:', error);
        throw error;
      }

      return data as AIChatConversation;
    }
  } catch (error) {
    console.error('保存 AI 对话记录异常:', error);
    return null;
  }
}

// 获取用户的所有 AI 对话记录
export async function getAIChatConversations(): Promise<AIChatConversation[]> {
  const supabase = getSupabaseClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('ai_chat_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('获取 AI 对话记录失败:', error);
      return [];
    }

    return (data || []) as AIChatConversation[];
  } catch (error) {
    console.error('获取 AI 对话记录异常:', error);
    return [];
  }
}

// 删除 AI 对话记录
export async function deleteAIChatConversation(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    const { error } = await supabase
      .from('ai_chat_conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('删除 AI 对话记录失败:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('删除 AI 对话记录异常:', error);
    return false;
  }
}
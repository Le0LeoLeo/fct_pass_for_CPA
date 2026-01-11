// Firebase service for university database

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA6QVAAIBGpnt8QBAScj3gMQmnQijqX_vk",
  authDomain: "cpaapp-8c4d6.firebaseapp.com",
  projectId: "cpaapp-8c4d6",
  storageBucket: "cpaapp-8c4d6.firebasestorage.app",
  messagingSenderId: "182638554959",
  appId: "1:182638554959:web:3e5e126b379c6c68c1df3a"
};

let app: any = null;
let db: Firestore | null = null;

export function initializeFirebase() {
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return db;
}

export interface University {
  id: string;
  name?: string;
  nameEn?: string;
  city?: string;
  district?: string;
  address?: string;
  type?: string; // "PUBLIC" | "PRIVATE"
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
  
  // 描述和介紹
  description?: string;
  introduction?: string;
  department?: string;
  department_introduction?: string;
  about?: string;
  
  // 兼容舊字段
  [key: string]: any;
}

// 計算文檔的數據字段數量（用於判斷數據完整性）
function countDataFields(uni: University): number {
  let count = 0;
  
  // 基本字段
  if (uni.name) count++;
  if (uni.nameEn) count++;
  if (uni.city) count++;
  if (uni.district) count++;
  if (uni.address) count++;
  if (uni.type) count++;
  if (uni.founded) count++;
  if (uni.website) count++;
  
  // 聯繫信息
  if (uni.contact) {
    if (uni.contact.email) count++;
    if (uni.contact.phone) count++;
    if (uni.contact.fax) count++;
  }
  
  // 專業和學科
  if (uni.majors && uni.majors.length > 0) count += uni.majors.length;
  if (uni.disciplines && uni.disciplines.length > 0) count += uni.disciplines.length;
  
  // 錄取分數
  if (uni.admission_scores) {
    if (uni.admission_scores.admission_min) count++;
    if (uni.admission_scores.tier) count++;
  }
  
  // 排名
  if (uni.ranking) {
    if (uni.ranking.domestic) count++;
    if (uni.ranking.qs) count++;
    if (uni.ranking.timesHigherEd) count++;
  }
  
  // 學費
  if (uni.tuition) {
    if (uni.tuition.undergraduate) count++;
    if (uni.tuition.graduate) count++;
  }
  
  // 描述字段
  if (uni.description) count++;
  if (uni.introduction) count++;
  if (uni.department_introduction) count++;
  if (uni.about) count++;
  if (uni.department) count++;
  
  // metadata
  if (uni.metadata) count++;
  
  // statistics
  if (uni.statistics) count++;
  
  return count;
}

// 檢測字符串是否包含中文字符
function containsChinese(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  // 匹配中文字符範圍：\u4e00-\u9fff（包括CJK統一漢字）
  // 也匹配其他CJK擴展區：\u3400-\u4dbf, \u20000-\u2a6df等
  const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf]/;
  const hasChinese = chineseRegex.test(str);
  if (hasChinese) {
    console.log(`🔍 檢測到中文: "${str}"`);
  }
  return hasChinese;
}

// 清理文本中的亂碼字符
function cleanGarbledText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  // 移除常見的亂碼字符：◆、◇、 等
  return text.replace(/[◆◇\uFFFD]/g, '').trim();
}

// 遞歸清理對象中的所有亂碼字符
function cleanData(data: any): any {
  if (!data) return data;
  
  // 如果是字符串，直接清理
  if (typeof data === 'string') {
    return cleanGarbledText(data);
  }
  
  // 如果是數組，清理數組中的每個元素
  if (Array.isArray(data)) {
    return data.map(item => cleanData(item));
  }
  
  // 如果是對象，遞歸清理所有屬性
  if (typeof data === 'object') {
    const cleaned: any = {};
    Object.keys(data).forEach(key => {
      cleaned[key] = cleanData(data[key]);
    });
    return cleaned;
  }
  
  // 其他類型直接返回
  return data;
}

export async function loadUniversities(): Promise<University[]> {
  if (!db) {
    db = initializeFirebase();
  }

  try {
    const universitiesCollection = collection(db, 'universities');
    const snapshot = await getDocs(universitiesCollection);
    
    console.log(`Firebase 查詢結果：共 ${snapshot.size} 個文檔`);
    console.log(`\n🔍 開始處理文檔，過濾中文ID...\n`);
    
    const universities: University[] = [];
    const allDocumentsJson: any[] = [];
    let skippedChineseCount = 0;
    const allDocIds: string[] = [];
    
    snapshot.forEach((doc) => {
      allDocIds.push(doc.id);
      const data = doc.data();
      
      // 保存所有文檔的原始JSON（包括中文ID的）
      allDocumentsJson.push({
        id: doc.id,
        ...data,
      });
      
      // 過濾掉文檔ID包含中文的文檔
      if (containsChinese(doc.id)) {
        console.log(`⏭️ 跳過中文文檔ID: "${doc.id}"`);
        skippedChineseCount++;
        return; // 直接返回，不載入此文檔
      }
      
      // 清理亂碼字符
      const cleanedData = cleanData(data);
      
      universities.push({
        id: doc.id,
        ...cleanedData,
      });
      
      // 調試：顯示每個載入的文檔基本信息（只有非中文ID的文檔才會到這裡）
      console.log(`✅ 載入文檔: ${doc.id} - ${cleanedData.name || cleanedData.nameEn || '無名稱'}`);
    });

    // 顯示所有文檔ID列表
    console.log(`\n📝 所有文檔ID列表（共 ${allDocIds.length} 個）:`);
    allDocIds.forEach((id, index) => {
      const isChinese = containsChinese(id);
      const marker = isChinese ? '❌ 中文ID' : '✅ 英文ID';
      console.log(`${index + 1}. ${marker}: "${id}"`);
    });
    
    // 在控制台顯示所有文檔的JSON（包括被過濾的）
    console.log(`\n📋 ========== 所有文檔的JSON數據 ==========`);
    console.log(`總文檔數: ${snapshot.size}`);
    console.log(`已載入: ${universities.length} 個（已過濾中文ID）`);
    console.log(`已跳過: ${skippedChineseCount} 個（中文ID文檔）`);
    console.log(`\n完整JSON數據:`);
    console.log(JSON.stringify(allDocumentsJson, null, 2));
    console.log(`\n已載入的文檔JSON:`);
    console.log(JSON.stringify(universities, null, 2));
    console.log(`\n==========================================\n`);

    // 去重：按name分組，保留數據更完整的文檔
    console.log(`\n🔄 開始去重處理...`);
    const nameMap = new Map<string, University>();
    
    universities.forEach((uni) => {
      const name = uni.name || uni.nameEn || '';
      if (!name) {
        // 如果沒有名稱，直接保留
        nameMap.set(uni.id, uni);
        return;
      }
      
      const existing = nameMap.get(name);
      if (!existing) {
        // 如果這個名稱還沒有記錄，直接添加
        nameMap.set(name, uni);
      } else {
        // 如果已存在同名文檔，比較數據完整性，保留字段更多的
        const existingFieldCount = countDataFields(existing);
        const currentFieldCount = countDataFields(uni);
        
        console.log(`發現重複名稱: "${name}"`);
        console.log(`  現有文檔 (${existing.id}): ${existingFieldCount} 個字段`);
        console.log(`  新文檔 (${uni.id}): ${currentFieldCount} 個字段`);
        
        if (currentFieldCount > existingFieldCount) {
          console.log(`  ✅ 保留新文檔 (${uni.id})，數據更完整`);
          nameMap.set(name, uni);
        } else {
          console.log(`  ⏭️ 保留現有文檔 (${existing.id})`);
        }
      }
    });
    
    const deduplicatedUniversities = Array.from(nameMap.values());
    console.log(`✅ 去重完成：${universities.length} 個文檔 -> ${deduplicatedUniversities.length} 個文檔`);
    console.log(`   移除了 ${universities.length - deduplicatedUniversities.length} 個重複文檔\n`);
    
    return deduplicatedUniversities;
  } catch (error) {
    console.error('❌ Error loading universities:', error);
    throw error;
  }
}

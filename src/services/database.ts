// 統一的資料庫服務接口，支持 Firebase 和 Supabase 切換

import { loadUniversities as loadFromFirebase, University as FirebaseUniversity } from './firebase';
import { 
  loadUniversitiesFromSupabase, 
  University as SupabaseUniversity,
  initializeSupabase 
} from './supabase';

export type University = FirebaseUniversity | SupabaseUniversity;

export type DatabaseProvider = 'firebase' | 'supabase' | 'auto';

// 大學資料庫默認使用 Firebase
let currentProvider: DatabaseProvider = 'firebase';

export function setDatabaseProvider(provider: DatabaseProvider) {
  currentProvider = provider;
}

export function getDatabaseProvider(): DatabaseProvider {
  return currentProvider;
}

// 自動檢測可用的資料庫服務
async function detectProvider(): Promise<'firebase' | 'supabase'> {
  // 大學資料庫優先使用 Firebase
  // Supabase 用於其他後端服務（認證、其他數據等）
  return 'firebase';
}

// 統一的載入大學資料函數
// 大學資料庫使用 Firebase，Supabase 用於其他後端服務
export async function loadUniversities(): Promise<University[]> {
  let provider = currentProvider;
  
  if (provider === 'auto') {
    provider = await detectProvider();
  }
  
  try {
    // 大學資料庫默認使用 Firebase
    if (provider === 'supabase') {
      return await loadUniversitiesFromSupabase();
    } else {
      return await loadFromFirebase();
    }
  } catch (error) {
    console.error(`Error loading from ${provider}:`, error);
    
    // 如果 Firebase 失敗，嘗試 Supabase 作為備用
    if (provider === 'firebase') {
      console.log('Firebase failed, falling back to Supabase...');
      try {
        return await loadUniversitiesFromSupabase();
      } catch (fallbackError) {
        console.error('Both providers failed');
        throw error;
      }
    } else {
      throw error;
    }
  }
}

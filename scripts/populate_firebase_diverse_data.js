// Firebase 資料庫多樣化資料匯入腳本
// 此腳本用於將包含各種科系的範例大學資料匯入 Firebase

// 使用方法：
// 1. 安裝 Firebase Admin SDK: npm install firebase-admin
// 2. 配置 Firebase Admin 憑證
// 3. 執行: node scripts/populate_firebase_diverse_data.js

const admin = require('firebase-admin');

// 初始化 Firebase Admin（需要配置服務帳號憑證）
// const serviceAccount = require('./path/to/serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

const db = admin.firestore();

// 多樣化的範例大學資料
const diverseUniversities = [
  // 工程類
  {
    name: '國立臺灣大學',
    nameEn: 'National Taiwan University',
    city: '台北市',
    district: '大安區',
    type: 'PUBLIC',
    founded: 1928,
    website: 'https://www.ntu.edu.tw',
    majors: ['資訊工程', '電機工程', '機械工程', '土木工程', '化學工程'],
    disciplines: ['工程', '科學', '管理'],
    department: '資訊工程學系',
    department_introduction: '本系致力於培養資訊工程領域的專業人才，涵蓋人工智慧、軟體開發、網路技術等領域。',
    admission_scores: { admission_min: 58, tier: 'Tier 1' },
    ranking: { domestic: 1, qs: 69, timesHigherEd: 113 },
    contact: {
      email: 'admission@ntu.edu.tw',
      phone: '+886-2-3366-3366'
    }
  },
  {
    name: '國立清華大學',
    nameEn: 'National Tsing Hua University',
    city: '新竹市',
    district: '東區',
    type: 'PUBLIC',
    founded: 1911,
    website: 'https://www.nthu.edu.tw',
    majors: ['電機工程', '材料科學', '物理', '化學', '生命科學'],
    disciplines: ['工程', '科學', '生命科學'],
    department: '電機工程學系',
    department_introduction: '本系在電機電子領域享有盛譽，涵蓋通訊、控制、電力系統等專業領域。',
    admission_scores: { admission_min: 55, tier: 'Tier 1' },
    ranking: { domestic: 2, qs: 177, timesHigherEd: 251 },
    contact: {
      email: 'admission@nthu.edu.tw',
      phone: '+886-3-571-5131'
    }
  },
  
  // 商管類
  {
    name: '國立成功大學',
    nameEn: 'National Cheng Kung University',
    city: '台南市',
    district: '東區',
    type: 'PUBLIC',
    founded: 1931,
    website: 'https://www.ncku.edu.tw',
    majors: ['企業管理', '會計', '財務金融', '國際企業', '資訊管理'],
    disciplines: ['管理', '商學', '資訊'],
    department: '企業管理學系',
    department_introduction: '本系培養具備國際視野的企業管理人才，課程涵蓋行銷、人力資源、策略管理等領域。',
    admission_scores: { admission_min: 50, tier: 'Tier 1' },
    ranking: { domestic: 3, qs: 224, timesHigherEd: 301 },
    contact: {
      email: 'admission@ncku.edu.tw',
      phone: '+886-6-275-7575'
    }
  },
  {
    name: '國立政治大學',
    nameEn: 'National Chengchi University',
    city: '台北市',
    district: '文山區',
    type: 'PUBLIC',
    founded: 1927,
    website: 'https://www.nccu.edu.tw',
    majors: ['外交', '政治', '法律', '新聞', '傳播'],
    disciplines: ['社會科學', '法律', '傳播'],
    department: '外交學系',
    department_introduction: '本系培養國際事務與外交專業人才，課程涵蓋國際關係、外交實務、區域研究等。',
    admission_scores: { admission_min: 52, tier: 'Tier 1' },
    ranking: { domestic: 4, qs: 501, timesHigherEd: 601 },
    contact: {
      email: 'admission@nccu.edu.tw',
      phone: '+886-2-2939-3091'
    }
  },
  
  // 醫學類
  {
    name: '國立陽明交通大學',
    nameEn: 'National Yang Ming Chiao Tung University',
    city: '新竹市',
    district: '東區',
    type: 'PUBLIC',
    founded: 1975,
    website: 'https://www.nycu.edu.tw',
    majors: ['醫學', '護理', '物理治療', '職能治療', '醫學工程'],
    disciplines: ['醫學', '健康科學', '工程'],
    department: '醫學系',
    department_introduction: '本系培養優秀的臨床醫師，課程涵蓋基礎醫學、臨床醫學、醫學人文等領域。',
    admission_scores: { admission_min: 60, tier: 'Tier 1' },
    ranking: { domestic: 5, qs: 301, timesHigherEd: 401 },
    contact: {
      email: 'admission@nycu.edu.tw',
      phone: '+886-3-571-2121'
    }
  },
  
  // 文理類
  {
    name: '國立中央大學',
    nameEn: 'National Central University',
    city: '桃園市',
    district: '中壢區',
    type: 'PUBLIC',
    founded: 1915,
    website: 'https://www.ncu.edu.tw',
    majors: ['數學', '物理', '化學', '地球科學', '大氣科學'],
    disciplines: ['科學', '數學', '自然科學'],
    department: '數學系',
    department_introduction: '本系培養數學理論與應用人才，涵蓋純數學、應用數學、統計等領域。',
    admission_scores: { admission_min: 48, tier: 'Tier 2' },
    ranking: { domestic: 6, qs: 401, timesHigherEd: 501 },
    contact: {
      email: 'admission@ncu.edu.tw',
      phone: '+886-3-422-7151'
    }
  },
  
  // 藝術類
  {
    name: '國立台灣藝術大學',
    nameEn: 'National Taiwan University of Arts',
    city: '新北市',
    district: '板橋區',
    type: 'PUBLIC',
    founded: 1955,
    website: 'https://www.ntua.edu.tw',
    majors: ['美術', '音樂', '戲劇', '舞蹈', '設計'],
    disciplines: ['藝術', '設計', '表演'],
    department: '美術學系',
    department_introduction: '本系培養藝術創作與理論研究人才，涵蓋繪畫、雕塑、新媒體藝術等領域。',
    admission_scores: { admission_min: 45, tier: 'Tier 2' },
    ranking: { domestic: 15, qs: null, timesHigherEd: null },
    contact: {
      email: 'admission@ntua.edu.tw',
      phone: '+886-2-2272-2181'
    }
  },
  
  // 教育類
  {
    name: '國立台灣師範大學',
    nameEn: 'National Taiwan Normal University',
    city: '台北市',
    district: '大安區',
    type: 'PUBLIC',
    founded: 1922,
    website: 'https://www.ntnu.edu.tw',
    majors: ['教育', '心理', '特殊教育', '幼兒教育', '體育'],
    disciplines: ['教育', '心理', '社會科學'],
    department: '教育學系',
    department_introduction: '本系培養優秀的教育工作者，課程涵蓋教育理論、教學方法、教育心理等領域。',
    admission_scores: { admission_min: 50, tier: 'Tier 1' },
    ranking: { domestic: 7, qs: 431, timesHigherEd: 501 },
    contact: {
      email: 'admission@ntnu.edu.tw',
      phone: '+886-2-7749-1111'
    }
  },
  
  // 農業類
  {
    name: '國立中興大學',
    nameEn: 'National Chung Hsing University',
    city: '台中市',
    district: '南區',
    type: 'PUBLIC',
    founded: 1919,
    website: 'https://www.nchu.edu.tw',
    majors: ['農業', '獸醫', '生命科學', '應用數學', '化學'],
    disciplines: ['農業', '生命科學', '科學'],
    department: '應用數學系',
    department_introduction: '本系培養數學應用人才，涵蓋統計、計算數學、數學建模等領域。',
    admission_scores: { admission_min: 44, tier: 'Tier 2' },
    ranking: { domestic: 8, qs: 501, timesHigherEd: 601 },
    contact: {
      email: 'admission@nchu.edu.tw',
      phone: '+886-4-2287-3181'
    }
  }
];

async function populateFirebase() {
  console.log('開始匯入多樣化大學資料...');
  
  const batch = db.batch();
  let count = 0;
  
  for (const uni of diverseUniversities) {
    // 使用英文名稱作為文檔ID（避免中文ID問題）
    const docId = uni.nameEn.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const docRef = db.collection('universities').doc(docId);
    
    batch.set(docRef, {
      ...uni,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    count++;
    console.log(`準備匯入: ${uni.name} (${docId})`);
  }
  
  await batch.commit();
  console.log(`\n✅ 成功匯入 ${count} 筆多樣化大學資料！`);
  console.log('\n包含的科系類型：');
  console.log('- 工程類：資訊工程、電機工程、機械工程等');
  console.log('- 商管類：企業管理、會計、財務金融等');
  console.log('- 醫學類：醫學、護理、物理治療等');
  console.log('- 文理類：數學、物理、化學等');
  console.log('- 藝術類：美術、音樂、戲劇等');
  console.log('- 教育類：教育、心理、特殊教育等');
  console.log('- 農業類：農業、獸醫、生命科學等');
}

// 執行匯入
if (require.main === module) {
  populateFirebase()
    .then(() => {
      console.log('\n匯入完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('匯入失敗：', error);
      process.exit(1);
    });
}

module.exports = { populateFirebase, diverseUniversities };

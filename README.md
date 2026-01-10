# AI 大學升學輔助應用

這是一個整合了多個功能的AI大學升學輔助應用，包含：

## 功能模組

### 1. 成績管理 (UpdateGradesPage)
- ✅ 手動輸入成績
- ✅ **OCR識別成績單** - 上傳成績單圖片，自動識別並提取成績資料
- ✅ 學期管理
- ✅ 加權平均計算

### 2. 面試練習 (InterviewPracticePage)
- ✅ **真實語音識別 (SST)** - 使用百度語音識別API
- ✅ **真實語音合成 (TTS)** - 使用百度語音合成API
- ✅ **AI面試官** - 使用文心4.0 API進行智能對話
- ✅ 性能指標監控
- ✅ 音頻參數調整

### 3. 大學資料庫 (UniversityDatabasePage)
- ✅ **Firebase整合** - 從Firebase Firestore讀取大學資料
- ✅ 搜尋與篩選
- ✅ 詳細資訊顯示

## 技術棧

### 前端
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Firebase SDK

### 後端
- FastAPI (OCR服務)
- 百度千帆API (OCR, TTS, SST)
- 文心4.0 API (AI對話)

## 安裝與運行

### 前端

```bash
npm install
npm run dev
```

### 後端 (OCR服務)

```bash
cd backend
pip install -r requirements.txt
# 配置 .env 文件
uvicorn ocr_service:app --reload --port 8000
```

## 環境變數配置

### 前端 (.env)

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 後端 (backend/.env)

```env
QIANFAN_API_KEY=bce-v3/your-api-key-here
```

### 百度API配置

在瀏覽器 localStorage 中配置：
- `baidu_api_key`: 百度API Key
- `baidu_secret_key`: 百度Secret Key

## 專案結構

```
.
├── backend/              # 後端服務
│   ├── ocr_service.py    # OCR API服務
│   └── requirements.txt # Python依賴
├── src/
│   ├── components/      # React組件
│   │   ├── UpdateGradesPage.tsx      # 成績管理（含OCR）
│   │   ├── InterviewPracticePage.tsx  # 面試練習（含TTS/SST）
│   │   └── UniversityDatabasePage.tsx # 大學資料庫（含Firebase）
│   └── services/        # API服務
│       ├── api.ts       # 百度API封裝
│       └── firebase.ts # Firebase服務
└── package.json
```

## 整合的功能

### 1. score_counting (OCR功能)
- 整合到 `UpdateGradesPage`
- 支持圖片上傳和OCR識別
- 自動解析成績資料

### 2. meet_prepare_tts_sst_erine (面試功能)
- 整合到 `InterviewPracticePage`
- 真實的語音識別和合成
- AI面試官對話

### 3. uni_database (大學資料庫)
- 整合到 `UniversityDatabasePage`
- Firebase Firestore資料讀取
- 動態資料載入

## 注意事項

1. 確保後端OCR服務正在運行（端口8000）
2. 配置百度API密鑰以使用TTS/SST功能
3. 配置Firebase以使用大學資料庫功能
4. 瀏覽器需要允許麥克風權限以使用語音功能

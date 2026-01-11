# 整合說明

本專案已成功整合三個外部專案的功能：

## 整合內容

### 1. score_counting → UpdateGradesPage

**整合的功能：**
- OCR圖片識別成績單
- 自動提取科目和分數
- 圖片上傳界面

**使用方式：**
1. 進入「更新成績」頁面
2. 點擊「上傳成績單圖片」按鈕
3. 選擇成績單圖片
4. 系統會自動識別並提取成績資料
5. 確認後添加到成績列表

**技術實現：**
- 後端：`backend/ocr_service.py` - FastAPI服務
- 前端：`src/services/api.ts` - OCR API調用
- 組件：`src/components/UpdateGradesPage.tsx` - 添加了OCR上傳功能

### 2. meet_prepare_tts_sst_erine → InterviewPracticePage

**整合的功能：**
- 真實語音識別 (SST) - 使用百度語音識別API
- 真實語音合成 (TTS) - 使用百度語音合成API
- AI面試官對話 - 使用文心4.0 API
- 性能指標監控
- 音頻參數調整

**使用方式：**
1. 進入「面試練習」頁面
2. 配置百度API密鑰（首次使用）
3. 點擊「開始錄音」開始面試
4. 系統會自動識別語音、生成AI回應並播放

**技術實現：**
- API服務：`src/services/api.ts` - 封裝百度TTS/SST和文心API
- 組件：`src/components/InterviewPracticePage.tsx` - 完整的語音交互功能

**配置要求：**
- 需要在localStorage中設置：
  - `baidu_api_key`: 百度API Key
  - `baidu_secret_key`: 百度Secret Key

### 3. uni_database → UniversityDatabasePage

**整合的功能：**
- Firebase Firestore資料讀取
- 動態載入大學資料
- 搜尋和篩選功能

**使用方式：**
1. 進入「大學資料庫」頁面
2. 系統自動從Firebase載入資料
3. 使用搜尋框搜尋大學
4. 點擊大學卡片查看詳細資訊

**技術實現：**
- Firebase服務：`src/services/firebase.ts` - Firebase初始化和資料讀取
- 組件：`src/components/UniversityDatabasePage.tsx` - 整合Firebase資料顯示

**配置要求：**
- Firebase配置已硬編碼在 `src/services/firebase.ts` 中
- 如需更改，請修改該文件中的 `firebaseConfig`

## 文件結構

```
.
├── backend/                    # 後端服務（OCR）
│   ├── ocr_service.py         # OCR API服務
│   ├── requirements.txt       # Python依賴
│   ├── start.sh              # Linux/Mac啟動腳本
│   ├── start.bat             # Windows啟動腳本
│   └── README.md             # 後端說明
├── src/
│   ├── components/
│   │   ├── UpdateGradesPage.tsx      # ✅ 已整合OCR
│   │   ├── InterviewPracticePage.tsx # ✅ 已整合TTS/SST
│   │   └── UniversityDatabasePage.tsx # ✅ 已整合Firebase
│   └── services/
│       ├── api.ts            # 百度API封裝（TTS/SST/OCR）
│       └── firebase.ts       # Firebase服務
└── package.json              # ✅ 已添加Firebase依賴
```

## 啟動步驟

### 1. 安裝前端依賴

```bash
npm install
```

### 2. 啟動後端OCR服務

```bash
cd backend
pip install -r requirements.txt
# 配置 .env 文件（複製 .env.example 並填入API密鑰）
uvicorn ocr_service:app --reload --port 8000
```

### 3. 啟動前端

```bash
npm run dev
```

### 4. 配置百度API（面試功能）

在瀏覽器控制台執行：

```javascript
localStorage.setItem('baidu_api_key', 'your-api-key');
localStorage.setItem('baidu_secret_key', 'your-secret-key');
```

## 功能對照表

| 原專案 | 整合位置 | 功能狀態 |
|--------|---------|---------|
| score_counting | UpdateGradesPage | ✅ 完整整合 |
| meet_prepare_tts_sst_erine | InterviewPracticePage | ✅ 完整整合 |
| uni_database | UniversityDatabasePage | ✅ 完整整合 |

## 注意事項

1. **OCR服務**：需要後端服務運行在 `http://localhost:8000`
2. **語音功能**：需要配置百度API密鑰，並允許瀏覽器麥克風權限
3. **Firebase**：已配置預設Firebase專案，如需更改請修改 `src/services/firebase.ts`
4. **CORS**：後端已配置CORS，允許所有來源（生產環境請限制）

## 測試建議

1. **OCR功能**：上傳一張成績單圖片測試識別
2. **語音功能**：測試錄音、識別和TTS播放
3. **Firebase功能**：檢查大學資料是否正確載入

## 後續優化建議

1. 添加錯誤處理和用戶提示
2. 優化OCR識別準確度
3. 添加語音識別的實時反饋
4. 優化Firebase資料結構
5. 添加資料快取機制

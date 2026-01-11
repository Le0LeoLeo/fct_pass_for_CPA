# Firebase 資料庫多樣化資料匯入指南

## 問題說明

如果您的 Firebase 資料庫中只有計算機科學相關的大學資料，可以使用此腳本匯入包含各種科系的範例資料。

## 原因分析

程式碼本身**沒有過濾計算機科學**，問題可能出在：

1. **Firebase 資料庫中只有計算機科學資料** - 這是資料問題，不是程式碼問題
2. **資料匯入時只匯入了計算機科學相關資料** - 需要補充更多樣化的資料

## 解決方案

### 方法一：使用匯入腳本（推薦）

1. **安裝 Firebase Admin SDK**
   ```bash
   npm install firebase-admin
   ```

2. **配置 Firebase Admin 憑證**
   - 前往 Firebase Console → 專案設定 → 服務帳戶
   - 產生新的私密金鑰
   - 將金鑰檔案放在專案根目錄（例如：`firebase-admin-key.json`）

3. **修改腳本以使用憑證**
   編輯 `scripts/populate_firebase_diverse_data.js`，取消註解並設定憑證路徑：
   ```javascript
   const serviceAccount = require('../firebase-admin-key.json');
   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount)
   });
   ```

4. **執行匯入腳本**
   ```bash
   node scripts/populate_firebase_diverse_data.js
   ```

### 方法二：手動在 Firebase Console 匯入

1. 前往 Firebase Console → Firestore Database
2. 選擇 `universities` 集合
3. 手動新增包含各種科系的大學資料

### 方法三：檢查現有資料

1. 開啟瀏覽器開發者工具（F12）
2. 前往「大學資料庫」頁面
3. 查看 Console 輸出，會顯示：
   - 載入的文檔數量
   - 所有文檔的 JSON 數據
   - 文檔ID列表

## 腳本包含的科系類型

此腳本會匯入以下多樣化的科系：

- ✅ **工程類**：資訊工程、電機工程、機械工程、土木工程、化學工程
- ✅ **商管類**：企業管理、會計、財務金融、國際企業、資訊管理
- ✅ **醫學類**：醫學、護理、物理治療、職能治療、醫學工程
- ✅ **文理類**：數學、物理、化學、地球科學、大氣科學
- ✅ **藝術類**：美術、音樂、戲劇、舞蹈、設計
- ✅ **教育類**：教育、心理、特殊教育、幼兒教育、體育
- ✅ **農業類**：農業、獸醫、生命科學、應用數學、化學

## 驗證資料

匯入後，請：

1. 重新載入「大學資料庫」頁面
2. 檢查是否顯示各種不同科系的大學
3. 使用搜尋功能測試不同科系（例如：搜尋「醫學」、「商管」、「藝術」）

## 注意事項

- 腳本使用 `merge: true`，不會覆蓋現有資料，只會更新或新增
- 文檔ID使用英文名稱生成，避免中文ID問題
- 如果資料庫中已有同名大學，會更新現有資料

## 如果問題仍然存在

如果匯入後仍然只顯示計算機科學相關資料，請檢查：

1. **搜尋功能**：確認搜尋框是否被設定為只搜尋計算機科學
2. **資料過濾**：檢查 `src/services/firebase.ts` 是否有額外的過濾邏輯
3. **資料顯示**：檢查 `src/components/UniversityDatabasePage.tsx` 的顯示邏輯

# 自適應問卷系統使用說明

## 功能概述

本系統實作一個基於文心4.5 Turbo VL的**自適應人格與職涯問卷系統**，具有以下特點：

1. **不使用固定題數** - 依據使用者回答動態生成問題
2. **AI即時生成問題** - 每個問題由文心5.0根據上一題回答即時生成
3. **問題由淺入深** - 破冰 → 行為 → 情境三個階段
4. **雙重評估系統** - 同時評估MBTI與Holland職業興趣類型
5. **智能收斂機制** - 當某一維度差距≥3且信心值≥0.8時，該維度停止出題

## 系統架構

### 核心元件

1. **API服務** (`src/services/api.ts`)
   - `generateQuestionnaireQuestion()` - 生成問卷問題
   - `updatePersonalityWeights()` - 更新人格權重
   - `calculateConfidenceScore()` - 計算信心值
   - `checkDimensionConvergence()` - 檢查維度收斂

2. **問卷頁面** (`src/components/QuestionnairePage.tsx`)
   - 自適應問卷UI
   - 狀態管理（保存到localStorage）
   - 結果展示

### 資料結構

#### 人格權重 (PersonalityWeights)
```typescript
{
  mbti: {
    E: number, I: number,  // 外向/內向
    S: number, N: number,  // 感覺/直覺
    T: number, F: number,  // 思考/情感
    J: number, P: number   // 判斷/知覺
  },
  holland: {
    R: number,  // 現實型
    I: number,  // 研究型
    A: number,  // 藝術型
    S: number,  // 社會型
    E: number,  // 企業型
    C: number   // 常規型
  }
}
```

#### 問卷狀態 (QuestionnaireState)
```typescript
{
  currentWeights: PersonalityWeights,
  stage: 'icebreaker' | 'behavior' | 'situation',
  questionNumber: number,
  answers: Array<{ question, selectedOption, timestamp }>,
  convergedDimensions: {
    mbti: string[],      // 如 ['E/I', 'S/N']
    holland: string[]    // 如 ['R', 'I']
  },
  confidenceScores: {
    mbti: Record<string, number>,
    holland: Record<string, number>
  }
}
```

## 工作流程

1. **初始化**
   - 所有人格權重初始化為0
   - 階段設為'icebreaker'
   - 從localStorage恢復之前的狀態（若有）

2. **生成問題**
   - 呼叫`generateQuestionnaireQuestion()`，傳入目前狀態與上一題回答
   - AI依據未收斂的維度生成問題
   - 問題包含3-4個選項，每個選項包含權重變化

3. **使用者回答**
   - 使用者選擇選項後，更新人格權重
   - 重新計算信心值
   - 檢查維度收斂

4. **收斂判斷**
   - MBTI維度：若兩個值的差距≥3且信心值≥0.8，則收斂
   - Holland維度：若該類型與其他類型的最大差距≥3且信心值≥0.8，則收斂
   - 收斂的維度不再出題

5. **完成問卷**
   - 當所有維度都收斂時，問卷完成
   - 顯示MBTI與Holland結果

## AI Prompt規則

系統向文心4.5 Turbo VL送出的prompt包含以下規則：

1. **禁止提及專業術語**
   - 不能在問題中提及"MBTI"、"Holland"、"性格測試"等

2. **問題風格**
   - 必須是生活化或校園情境
   - 貼近高中生的日常經驗

3. **階段控制**
   - 破冰階段：輕鬆、簡單的問題
   - 行為階段：詢問日常行為與偏好
   - 情境階段：詢問在特定情境下的選擇

4. **輸出格式**
   - 必須是有效的JSON
   - 包含問題內容與選項
   - 每個選項包含權重變化

## 配置要求

### 必需的API配置

**參考AIChatPage的實作方式**，系統支援多種配置方式：

#### 方式1：Supabase配置（建議）

在Supabase的`api_configs`表中配置：

1. **百度API Key與Secret Key**
   - `baidu_api_key`
   - `baidu_secret_key`

2. **或直接配置Bearer Token**
   - `baidu_api_token`（若已配置則優先使用，無需再取得access token）

#### 方式2：LocalStorage配置（備用）

若Supabase沒有配置，系統會自動嘗試從localStorage取得：
- `baidu_api_key`
- `baidu_secret_key`
- `baidu_api_token`

### 取得Bearer Token的流程

系統初始化API的流程（與AIChatPage完全一致）：

1. **優先使用apiToken**：若Supabase中有`baidu_api_token`，直接使用
2. **使用OAuth取得**：若有`apiKey`與`secretKey`，透過`getBaiduAccessToken()`取得
3. **LocalStorage備用**：若Supabase沒有配置，嘗試從localStorage取得
4. **錯誤處理**：若所有方式都失敗，顯示錯誤提示

### API呼叫方式

問卷系統使用與AI助手相同的API呼叫方式：
- 使用`callErnieChatAPI()`函式
- 直接呼叫千帆API（`https://qianfan.baidubce.com/v2/chat/completions`）
- 使用`ernie-4.5-turbo-vl`模型（與AI助手的「快速」模型一致）
- 支援自訂system prompt

## 使用示例

### 開始問卷

使用者進入問卷頁面後，系統會自動：
1. 檢查localStorage中是否有未完成的問卷
2. 若有，恢復狀態並繼續
3. 若沒有，從第一題開始

### 回答問題

1. 使用者看到AI生成的問題
2. 選擇選項
3. 系統自動更新權重並生成下一題

### 查看結果

問卷完成後，顯示：
- MBTI性格類型（如INTJ、ENFP等）
- Holland職業興趣類型（如RIS、AES等）
- 各維度的詳細分數
- 推薦科系

## 狀態保存

問卷狀態會自動保存到localStorage：
- `adaptive_questionnaire_state` - 目前問卷狀態
- `adaptive_questionnaire_final_state` - 最終完成狀態
- `questionnaire_completed_at` - 完成時間

## 注意事項

1. **API Token**
   - 確保已正確配置百度API的Key與Secret
   - 或直接配置Bearer Token

2. **JSON解析**
   - AI返回的回應必須是有效的JSON
   - 系統會嘗試從回應中提取JSON（若AI添加了其他文字）

3. **收斂條件**
   - 維度差距≥3且信心值≥0.8才會收斂
   - 若所有維度都收斂，問卷自動完成

4. **問題數量**
   - 不固定，依收斂情況動態調整
   - 通常需要10-20題

## 故障排除

### 問題：無法生成問題
- 檢查API Token是否正確配置
- 檢查網路連線
- 查看瀏覽器控制台的錯誤訊息

### 問題：AI返回的格式不正確
- 系統會嘗試從回應中提取JSON
- 若仍然失敗，會顯示錯誤訊息
- 可以重試或刷新頁面

### 問題：問卷狀態遺失
- 檢查localStorage是否被清除
- 系統會在每次回答後自動保存狀態

## 技術細節

### 信心值計算

- **MBTI維度**：計算兩個值的差距，差距越大信心值越高
- **Holland維度**：計算該類型與其他類型的最大差距

### 權重更新

選擇選項後，該選項的權重會直接加到目前權重上：
```typescript
newWeights.mbti.E += optionWeights.mbti.E || 0;
```

### 收斂檢查

系統在每個問題後檢查所有維度：
- 若差距≥3且信心值≥0.8，標記為收斂
- 收斂的維度不再生成相關問題

## 未來改進

1. 支援更多人格類型評估
2. 最佳化AI prompt以提升問題品質
3. 新增問題歷史記錄
4. 支援匯出問卷結果
5. 增加更多推薦科系的匹配算法

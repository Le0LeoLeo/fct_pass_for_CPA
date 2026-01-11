# 自适应问卷系统使用说明

## 功能概述

本系统实现了一个基于文心4.5T的**自适应人格与职涯问卷系统**，具有以下特点：

1. **不使用固定题数** - 根据用户回答动态生成问题
2. **AI即时生成问题** - 每个问题由文心4.5T根据上一题回答即时生成
3. **问题由浅入深** - 破冰 → 行为 → 情境三个阶段
4. **双重评估系统** - 同时评估MBTI和Holland职业兴趣类型
5. **智能收敛机制** - 当某一维度差距≥3且信心值≥0.8时，该维度停止出题

## 系统架构

### 核心组件

1. **API服务** (`src/services/api.ts`)
   - `generateQuestionnaireQuestion()` - 生成问卷问题
   - `updatePersonalityWeights()` - 更新人格权重
   - `calculateConfidenceScore()` - 计算信心值
   - `checkDimensionConvergence()` - 检查维度收敛

2. **问卷页面** (`src/components/QuestionnairePage.tsx`)
   - 自适应问卷UI
   - 状态管理（保存到localStorage）
   - 结果展示

### 数据结构

#### 人格权重 (PersonalityWeights)
```typescript
{
  mbti: {
    E: number, I: number,  // 外向/内向
    S: number, N: number,  // 感觉/直觉
    T: number, F: number,  // 思考/情感
    J: number, P: number   // 判断/知觉
  },
  holland: {
    R: number,  // 现实型
    I: number,  // 研究型
    A: number,  // 艺术型
    S: number,  // 社会型
    E: number,  // 企业型
    C: number   // 常规型
  }
}
```

#### 问卷状态 (QuestionnaireState)
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
   - 所有人格权重初始化为0
   - 阶段设为'icebreaker'
   - 从localStorage恢复之前的状态（如果有）

2. **生成问题**
   - 调用`generateQuestionnaireQuestion()`，传入当前状态和上一题回答
   - AI根据未收敛的维度生成问题
   - 问题包含3-4个选项，每个选项包含权重变化

3. **用户回答**
   - 用户选择选项后，更新人格权重
   - 重新计算信心值
   - 检查维度收敛

4. **收敛判断**
   - MBTI维度：如果两个值的差距≥3且信心值≥0.8，则收敛
   - Holland维度：如果该类型与其他类型的最大差距≥3且信心值≥0.8，则收敛
   - 收敛的维度不再出题

5. **完成问卷**
   - 当所有维度都收敛时，问卷完成
   - 显示MBTI和Holland结果

## AI Prompt规则

系统向文心4.5T发送的prompt包含以下规则：

1. **禁止提及专业术语**
   - 不能在问题中提及"MBTI"、"Holland"、"性格测试"等

2. **问题风格**
   - 必须是生活化或校园情境
   - 贴近高中生的日常经验

3. **阶段控制**
   - 破冰阶段：轻松、简单的问题
   - 行为阶段：询问日常行为和偏好
   - 情境阶段：询问在特定情境下的选择

4. **输出格式**
   - 必须是有效的JSON
   - 包含问题内容和选项
   - 每个选项包含权重变化

## 配置要求

### 必需的API配置

**参考AIChatPage的实现方式**，系统支持多种配置方式：

#### 方式1：Supabase配置（推荐）

在Supabase的`api_configs`表中配置：

1. **百度API Key和Secret Key**
   - `baidu_api_key`
   - `baidu_secret_key`

2. **或者直接配置Bearer Token**
   - `baidu_api_token`（如果配置了则优先使用，无需再获取access token）

#### 方式2：LocalStorage配置（备用）

如果Supabase没有配置，系统会自动尝试从localStorage获取：
- `baidu_api_key`
- `baidu_secret_key`
- `baidu_api_token`

### 获取Bearer Token的流程

系统初始化API的流程（与AIChatPage完全一致）：

1. **优先使用apiToken**：如果Supabase中有`baidu_api_token`，直接使用
2. **使用OAuth获取**：如果有`apiKey`和`secretKey`，通过`getBaiduAccessToken()`获取
3. **LocalStorage备用**：如果Supabase没有配置，尝试从localStorage获取
4. **错误处理**：如果所有方式都失败，显示错误提示

### API调用方式

问卷系统使用与AI助手相同的API调用方式：
- 使用`callErnieChatAPI()`函数
- 直接调用千帆API（`https://qianfan.baidubce.com/v2/chat/completions`）
- 使用`ernie-4.5-turbo-128k`模型
- 支持自定义system prompt

## 使用示例

### 开始问卷

用户访问问卷页面后，系统会自动：
1. 检查localStorage中是否有未完成的问卷
2. 如果有，恢复状态并继续
3. 如果没有，从第一题开始

### 回答问题

1. 用户看到AI生成的问题
2. 选择选项
3. 系统自动更新权重并生成下一题

### 查看结果

问卷完成后，显示：
- MBTI性格类型（如INTJ、ENFP等）
- Holland职业兴趣类型（如RIS、AES等）
- 各维度的详细分数
- 推荐科系

## 状态保存

问卷状态会自动保存到localStorage：
- `adaptive_questionnaire_state` - 当前问卷状态
- `adaptive_questionnaire_final_state` - 最终完成状态
- `questionnaire_completed_at` - 完成时间

## 注意事项

1. **API Token**
   - 确保已正确配置百度API的Key和Secret
   - 或者直接配置Bearer Token

2. **JSON解析**
   - AI返回的响应必须是有效的JSON
   - 系统会尝试从响应中提取JSON（如果AI添加了其他文字）

3. **收敛条件**
   - 维度差距≥3且信心值≥0.8才会收敛
   - 如果所有维度都收敛，问卷自动完成

4. **问题数量**
   - 不固定，根据收敛情况动态调整
   - 通常需要10-20题

## 故障排除

### 问题：无法生成问题
- 检查API Token是否正确配置
- 检查网络连接
- 查看浏览器控制台的错误信息

### 问题：AI返回的格式不正确
- 系统会尝试从响应中提取JSON
- 如果仍然失败，会显示错误信息
- 可以重试或刷新页面

### 问题：问卷状态丢失
- 检查localStorage是否被清除
- 系统会在每次回答后自动保存状态

## 技术细节

### 信心值计算

- **MBTI维度**：计算两个值的差距，差距越大信心值越高
- **Holland维度**：计算该类型与其他类型的最大差距

### 权重更新

选择选项后，该选项的权重会直接加到当前权重上：
```typescript
newWeights.mbti.E += optionWeights.mbti.E || 0;
```

### 收敛检查

系统在每个问题后检查所有维度：
- 如果差距≥3且信心值≥0.8，标记为收敛
- 收敛的维度不再生成相关问题

## 未来改进

1. 支持更多人格类型评估
2. 优化AI prompt以提高问题质量
3. 添加问题历史记录
4. 支持导出问卷结果
5. 添加更多推荐科系的匹配算法
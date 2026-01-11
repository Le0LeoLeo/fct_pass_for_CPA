# Supabase API 配置指南

本文档说明如何将 API 密钥安全地存储到 Supabase 中。

## 📋 概述

API 密钥已存储在 Supabase 数据库的 `api_configs` 表中，而不是前端代码或 localStorage 中，这样可以：
- ✅ 避免密钥泄露到客户端代码
- ✅ 集中管理所有 API 配置
- ✅ 方便更新和维护
- ✅ 支持多环境配置

## 🗄️ 数据库结构

### 表：`api_configs`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| key_name | TEXT | 配置键名（唯一） |
| key_value | TEXT | 配置值（API 密钥） |
| description | TEXT | 描述 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 已存储的配置

- `baidu_api_key`: 百度 API Key
- `baidu_secret_key`: 百度 Secret Key
- `baidu_api_token`: 百度 API Token

## 🚀 设置步骤

### 1. 运行数据库迁移

在 Supabase Dashboard 中执行 SQL 迁移：

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 运行 `supabase/migrations/003_create_api_configs_table.sql` 文件中的 SQL

或者使用 Supabase CLI：

```bash
supabase db push
```

### 2. 验证数据

在 Supabase Dashboard 的 **Table Editor** 中查看 `api_configs` 表，确认以下记录已存在：

- `baidu_api_key`: `MzakylxwMs22DzBMokLqZvAN`
- `baidu_secret_key`: `FvFP2IZMErVOMyXqgQEXKDUdA9RFbG75`
- `baidu_api_token`: `bce-v3/ALTAK-ujQFLeNrekvVqtoSjmoTC/339cc1ef4a0ee8ad295c3b2e31d66712aee57980`

## 💻 代码使用

### 获取 API 配置

```typescript
import { getBaiduApiConfig, getApiConfig } from '../services/supabase';

// 获取所有百度 API 配置
const config = await getBaiduApiConfig();
console.log(config.apiKey);      // 百度 API Key
console.log(config.secretKey);   // 百度 Secret Key
console.log(config.apiToken);   // 百度 API Token

// 获取单个配置
const apiKey = await getApiConfig('baidu_api_key');
```

### 在组件中使用

代码已更新为自动从 Supabase 获取 API 配置：

```typescript
// InterviewPracticePage.tsx 已自动从 Supabase 加载配置
// 如果 Supabase 配置不存在，会回退到 localStorage（向后兼容）
```

## 🔒 安全注意事项

### Row Level Security (RLS)

`api_configs` 表已启用 RLS，当前策略允许：
- ✅ 已认证用户读取
- ✅ 匿名用户读取（用于应用配置）

### 建议的安全改进

1. **使用 Supabase Edge Functions**（推荐）
   - 创建 Edge Function 来代理 API 调用
   - 密钥仅存储在服务端
   - 客户端不直接访问密钥

2. **限制 RLS 策略**
   - 只允许特定用户角色读取
   - 或使用服务端函数来获取密钥

3. **环境变量**
   - 对于生产环境，考虑使用 Supabase Secrets
   - 通过 Edge Functions 访问

## 🔄 更新 API 密钥

如果需要更新 API 密钥，可以在 Supabase Dashboard 的 Table Editor 中直接编辑，或运行 SQL：

```sql
UPDATE api_configs 
SET key_value = '新的密钥值', updated_at = NOW()
WHERE key_name = 'baidu_api_key';
```

## 📝 添加新的 API 配置

```sql
INSERT INTO api_configs (key_name, key_value, description) 
VALUES ('new_api_key', 'your_key_value', '新 API 的描述')
ON CONFLICT (key_name) DO UPDATE SET
  key_value = EXCLUDED.key_value,
  updated_at = NOW();
```

## 🐛 故障排除

### 问题：无法获取 API 配置

1. **检查表是否存在**
   ```sql
   SELECT * FROM api_configs;
   ```

2. **检查 RLS 策略**
   - 确保 RLS 策略允许读取
   - 检查用户权限

3. **检查 Supabase 连接**
   - 确认 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 配置正确

### 问题：API 调用失败

- 检查密钥是否正确
- 检查密钥是否过期
- 查看浏览器控制台的错误信息

## 📚 相关文件

- `supabase/migrations/003_create_api_configs_table.sql` - 数据库迁移文件
- `src/services/supabase.ts` - Supabase 服务函数
- `src/components/InterviewPracticePage.tsx` - 使用 API 配置的组件

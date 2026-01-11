# 快速设置 API 配置表

## 问题
`api_configs` 表不存在，导致无法读取 API 密钥。

## 解决方案

### 方法 1：在 Supabase Dashboard 中运行（最简单）

1. **打开 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 登录你的账户
   - 选择项目：`qmwlvqkokhexpstglpwq`

2. **打开 SQL Editor**
   - 点击左侧菜单的 "SQL Editor"
   - 点击 "New query" 按钮

3. **运行 SQL**
   - 打开项目中的 `RUN_THIS_IN_SUPABASE_DASHBOARD.sql` 文件
   - 复制**所有内容**（从 `-- 首先創建表` 开始到文件末尾）
   - 粘贴到 SQL Editor 中
   - 点击 "Run" 按钮或按 `Ctrl+Enter`

4. **验证**
   - 运行后应该看到查询结果，显示 3 条记录：
     - `baidu_api_key`
     - `baidu_secret_key`
     - `baidu_api_token`

### 方法 2：使用 psql（如果已配置）

如果你有数据库连接字符串，可以使用 psql：

```bash
psql "你的连接字符串" -f RUN_THIS_IN_SUPABASE_DASHBOARD.sql
```

## 完成后

1. 刷新应用页面
2. 打开浏览器控制台（F12）
3. 应该看到：
   - `✅ api_configs 表可訪問`
   - `✅ 獲取 API 配置成功`
   - `✅ 文心 API 已就緒`
4. 发送一条消息测试，应该会调用真实的文心 API

## 如果还有问题

检查：
- RLS 策略是否正确设置
- 表是否真的创建成功
- 数据是否正确插入

# Render.com 部署指南

本指南将帮助您使用 Render.com 来部署 UptimeRobot-BarkPush 服务，实现免费的定时网站监控。

## 优势

- 提供免费的定时任务 (Cron Jobs)
- 设置简单，无需复杂配置
- 无需修改现有代码
- 可靠的云平台

## 步骤

### 1. 准备工作

1. 注册 [Render.com 账户](https://render.com/register)
2. 准备好您的 UptimeRobot API 密钥和 Bark 设备密钥
3. 将 UptimeRobot-BarkPush 代码推送到 GitHub 或 GitLab 仓库

### 2. 创建新的 Cron Job 服务

1. 登录到 Render.com 控制台
2. 点击 "New" 按钮
3. 在菜单中选择 "Cron Job"

### 3. 配置 Cron Job

填写表单中的以下信息：

- **Name**: `uptimerobot-bark-monitor` (或您喜欢的名称)
- **Repository**: 选择您包含 UptimeRobot-BarkPush 代码的 Git 仓库
- **Branch**: `main` (或您的主要分支)
- **Command**: `npm install && node index.js`
- **Schedule**: `*/5 * * * *` (每 5 分钟运行一次)

### 4. 添加环境变量

在 "Environment" 部分，添加以下环境变量：

- `UPTIMEROBOT_API_KEY`: 您的 UptimeRobot API 密钥
- `BARK_DEVICE_KEY`: 您的 Bark 设备密钥
- `BARK_SERVER_URL`(可选): 自定义 Bark 服务器 URL
- `MONITOR_IDS`(可选): 要监控的 UptimeRobot 监控器 ID，用逗号分隔
- `SEND_RECOVERY_NOTIFICATIONS`(可选): 设置为 'false' 以禁用恢复通知
- `DOWN_NOTIFICATION_SOUND`(可选): 自定义宕机通知声音
- `RECOVERY_NOTIFICATION_SOUND`(可选): 自定义恢复通知声音
- `SEND_STARTUP_NOTIFICATION`(可选): 设置为 'false' 以禁用启动通知
- `NOTIFICATION_LANGUAGE`(可选): 设置为 'zh' 使用中文或 'en' 使用英文（默认）

### 5. 创建服务

1. 点击 "Create Cron Job" 按钮
2. Render 将自动部署您的服务
3. 部署完成后，服务将根据您设置的计划自动运行

### 6. 测试服务

您可以手动触发 Cron Job 来测试服务：

1. 在 Render 控制台中，导航到您的 Cron Job
2. 点击 "Manual Run" 按钮
3. 监控运行日志，确保一切正常工作

### 7. 监控和维护

- 在 Render 控制台中查看您的 Cron Job 的运行历史和日志
- 您可以随时修改计划表达式或环境变量
- 如果代码仓库更新，Render 将在下次运行时自动使用新代码

## 常见问题

### Cron Job 运行失败

检查日志，常见问题包括：
- 依赖安装失败：确保 package.json 文件正确
- API 密钥错误：检查环境变量是否正确设置
- 代码错误：确保代码能在本地正常运行

### 如何修改检查频率

在 Render 控制台中编辑 Cron Job 的 "Schedule" 字段。例如：
- `*/10 * * * *`: 每 10 分钟运行一次
- `0 * * * *`: 每小时运行一次

### 如何停止服务

在 Render 控制台中，您可以：
1. 暂停服务：点击 "Suspend" 按钮
2. 删除服务：点击 "Delete" 按钮

## 限制

Render.com 免费计划有以下限制：
- 每个月 750 小时的运行时间
- 有限的系统资源
- 如果长时间不活动，服务可能会休眠

更多信息，请参阅 [Render.com 文档](https://render.com/docs)。

## 新功能

### 启动通知

服务可以在启动时发送通知，确认您的监控系统已激活。此功能默认启用。

- 要禁用启动通知，请将 `SEND_STARTUP_NOTIFICATION` 环境变量设置为 'false'
- 启用后，每次服务启动时您都会收到通知

### 多语言支持

通知可以以中文或英文显示：

- 将 `NOTIFICATION_LANGUAGE` 环境变量设置为 'zh' 使用中文或 'en' 使用英文（默认）
- 这会影响所有通知内容，包括启动、宕机和恢复消息
- 语言设置适用于通知标题和正文 
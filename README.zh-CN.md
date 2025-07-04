# UptimeRobot-BarkPush

[English](README.md) | [中文](README.zh-CN.md)

一个使用 UptimeRobot API (V3) 监控网站可用性，并在网站宕机时通过 Bark 发送通知的服务。

## 功能特点

- 使用 UptimeRobot API 监控网站状态
- 在网站宕机时通过 Bark 向 iOS 设备发送通知
- 在网站恢复时发送恢复通知（可配置）
- 可作为独立服务运行或部署到 Vercel
- 可配置的监控时间表
- 可选择监控特定网站
- 完全通过环境变量配置 - 无需更改代码
- 可自定义通知声音

## 系统要求

- Node.js 14 或更高版本
- UptimeRobot 账户及 API 密钥
- iOS 设备上安装的 Bark 应用

## 设置步骤

### 1. 克隆仓库

```bash
git clone https://github.com/yourusername/UptimeRobot-BarkPush.git
cd UptimeRobot-BarkPush
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置服务

您有两种配置方式：

#### 方式 A：环境变量（推荐）

设置以下环境变量：

- `UPTIMEROBOT_API_KEY`：您的 UptimeRobot API 密钥
- `BARK_DEVICE_KEY`：您的 Bark 设备密钥
- `BARK_SERVER_URL`（可选）：自定义 Bark 服务器 URL（默认：https://api.day.app）
- `CRON_SCHEDULE`（可选）：自定义检查时间表（默认：*/5 * * * *）
- `MONITOR_IDS`（可选）：要检查的监控 ID 列表，以逗号分隔
- `SEND_RECOVERY_NOTIFICATIONS`（可选）：设置为 'false' 可禁用恢复通知
- `DOWN_NOTIFICATION_SOUND`（可选）：宕机通知的自定义声音
- `RECOVERY_NOTIFICATION_SOUND`（可选）：恢复通知的自定义声音

示例：
```bash
export UPTIMEROBOT_API_KEY=your_api_key
export BARK_DEVICE_KEY=your_device_key
export SEND_RECOVERY_NOTIFICATIONS=false
```

#### 方式 B：配置文件

复制示例配置并编辑它：

```bash
cp config.example.js config.js
```

然后编辑 `config.js` 文件：

```javascript
module.exports = {
  uptimeRobotApiKey: 'your_uptimerobot_api_key',
  barkServerUrl: 'https://api.day.app',
  barkDeviceKey: 'your_bark_device_key',
  cronSchedule: '*/5 * * * *',
  // 可选：monitorIds: ['m1234567', 'm7654321'],
  // 可选：sendRecoveryNotifications: false,
  // 可选：downNotificationSound: 'alert',
  // 可选：recoveryNotificationSound: 'complete'
};
```

## 使用方法

### 作为独立服务运行

```bash
npm start
```

服务将根据配置中的计划表检查您的网站状态。

### 使用 Docker 运行

```bash
# 使用 docker-compose（推荐）
docker-compose up -d

# 或直接使用 Docker
docker build -t uptimerobot-bark .
docker run -e UPTIMEROBOT_API_KEY=your_key -e BARK_DEVICE_KEY=your_key uptimerobot-bark
```

### 部署到 Vercel

1. 将您的仓库推送到 GitHub
2. 在 Vercel 上创建一个新项目并连接到您的 GitHub 仓库
3. 在 Vercel 中添加以下环境变量：
   - `UPTIMEROBOT_API_KEY`：您的 UptimeRobot API 密钥
   - `BARK_DEVICE_KEY`：您的 Bark 设备密钥
   - 可选的 `BARK_SERVER_URL`：如果您使用自定义 Bark 服务器
   - 可选的 `MONITOR_IDS`：作为逗号分隔的监控 ID 列表

4. 部署项目

Vercel 的 cron 作业将每 5 分钟运行一次以检查您的网站。

## 测试

您可以通过访问带有 `trigger=manual` 查询参数的 API 端点手动触发检查：

```
https://your-vercel-deployment.vercel.app/api/cron?trigger=manual
```

## 工作原理

1. 服务使用 UptimeRobot API 检查您的网站状态
2. 如果网站状态从"正常"变为"似乎宕机"或"宕机"，通过 Bark 发送通知
3. 如果网站状态从"宕机"变为"正常"，发送恢复通知
4. 服务维护网站状态缓存以避免发送重复通知

## UptimeRobot 状态码

- 0：暂停
- 1：尚未检查
- 2：正常
- 8：似乎宕机
- 9：宕机

## 许可证

MIT 
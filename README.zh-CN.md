# UptimeRobot-BarkPush

[English](README.md) | [中文](README.zh-CN.md)

一个使用 UptimeRobot API 监控网站可用性，并在网站宕机时通过 Bark 发送通知的服务。

## 功能特点

- 使用 UptimeRobot API 监控网站状态
- 在网站宕机时通过 Bark 向 iOS 设备发送通知
- 在网站恢复时发送恢复通知（可配置）
- 可作为独立服务运行或部署到多种平台
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
git clone https://github.com/MaydayV/UptimeRobot-BarkPush.git
cd UptimeRobot-BarkPush
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置服务

您有两种配置方式：

#### 方式 A：环境变量（推荐）

通过复制提供的示例创建 `.env` 文件：

```bash
cp env.example .env
```

然后编辑 `.env` 文件，填入您的值：

```
UPTIMEROBOT_API_KEY=您的API密钥
BARK_DEVICE_KEY=您的设备密钥
```

您可以设置的其他环境变量：

- `BARK_SERVER_URL`（可选）：自定义 Bark 服务器 URL（默认：https://api.day.app）
- `CRON_SCHEDULE`（可选）：自定义检查时间表（默认：*/5 * * * *）
- `MONITOR_IDS`（可选）：要检查的监控 ID 列表，以逗号分隔
- `SEND_RECOVERY_NOTIFICATIONS`（可选）：设置为 'false' 可禁用恢复通知
- `DOWN_NOTIFICATION_SOUND`（可选）：宕机通知的自定义声音
- `RECOVERY_NOTIFICATION_SOUND`（可选）：恢复通知的自定义声音
- `SEND_STARTUP_NOTIFICATION`（可选）：设置为 'false' 可禁用启动通知
- `NOTIFICATION_LANGUAGE`（可选）：设置为 'zh' 使用中文或 'en' 使用英文（默认）
- `NOTIFY_ONLY_ON_STATUS_CHANGE`（可选）：设置为 'true' 可仅在网站状态出现问题时发送通知，不发送启动通知和恢复通知

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
  // 可选配置
  // monitorIds: ['m1234567', 'm7654321'],
  // sendRecoveryNotifications: false,
  // downNotificationSound: 'alert',
  // recoveryNotificationSound: 'complete',
  // sendStartupNotification: true,
  // notificationLanguage: 'zh'  // 使用 'en' 获取英文通知
  // notifyOnlyOnStatusChange: true  // 仅在网站状态出现问题时发送通知
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

> **注意**: Vercel 的免费计划 (Hobby) 仅支持每天运行一次 cron 作业，这对于网站监控来说不够频繁。建议使用以下替代方案之一。

如果您有 Vercel Pro 计划：

1. 将您的仓库推送到 GitHub
2. 在 Vercel 上创建一个新项目并连接到您的 GitHub 仓库
3. 在 Vercel 中添加以下环境变量：
   - `UPTIMEROBOT_API_KEY`：您的 UptimeRobot API 密钥
   - `BARK_DEVICE_KEY`：您的 Bark 设备密钥
   - 可选的 `BARK_SERVER_URL`：如果您使用自定义 Bark 服务器
   - 可选的 `MONITOR_IDS`：作为逗号分隔的监控 ID 列表

4. 部署项目

## 部署方案

本项目支持四种部署方式，选择最适合您的方案：

### 🌟 方案对比

| 方案 | 定时精确性 | 费用 | 难度 | 推荐场景 |
|------|----------|------|------|---------|
| **Vercel + cron-job.org** | ⭐⭐⭐⭐⭐ 精确 | ✅ 免费 | ⭐⭐ 简单 | **推荐首选** |
| GitHub Actions | ⭐⭐ 延迟10-30分钟 | ✅ 免费 | ⭐⭐ 简单 | 对时间要求不高 |
| Docker / 自托管 | ⭐⭐⭐⭐⭐ 完全控制 | 💰 需服务器 | ⭐⭐⭐ 中等 | 有服务器资源 |
| Cloudflare Workers | ⭐⭐⭐⭐ 较精确 | ✅ 免费 | ⭐⭐⭐⭐ 复杂 | 熟悉 Workers |

### 1️⃣ Vercel + cron-job.org（推荐）

**最佳方案**：定时精确、完全免费、配置简单

- ✅ 定时执行精确（误差<1分钟）
- ✅ 完全免费
- ✅ 配置简单（10分钟完成）
- ✅ 可靠稳定

[📖 详细部署指南：Vercel + cron-job.org](docs/zh/cron-job-org-guide.md)

### 2️⃣ GitHub Actions

**备选方案**：完全免费，但定时不太精确

- ⚠️ 定时可能延迟10-30分钟（GitHub Actions 限制）
- ✅ 完全免费
- ✅ 配置简单
- ⚠️ 适合对监控时间要求不严格的场景

[📖 详细部署指南：GitHub Actions](docs/zh/github-actions-guide.md)

### 3️⃣ Docker / 自托管

**专业方案**：完全控制，适合有服务器的用户

- ✅ 定时精确、完全控制
- ✅ 使用 Docker 一键部署
- 💰 需要服务器（VPS、NAS 等）
- ⭐⭐⭐ 需要一定技术基础

**快速开始：**

```bash
# 方式 1：使用 docker-compose（推荐）
docker-compose up -d

# 方式 2：直接使用 Docker
docker build -t uptimerobot-bark .
docker run -d \
  -e UPTIMEROBOT_API_KEY=your_key \
  -e BARK_DEVICE_KEY=your_key \
  -e NOTIFICATION_LANGUAGE=zh \
  uptimerobot-bark

# 方式 3：直接运行（需要 Node.js）
npm install
npm start
```

[📖 详细部署指南：自托管](docs/zh/self-hosting-guide.md)

### 4️⃣ 其他平台

**Cloudflare Workers**

- 适合熟悉 Cloudflare 的用户
- 免费计划支持 Cron Triggers

[📖 详细部署指南：Cloudflare Workers](docs/zh/cloudflare-workers-guide.md)

**Render.com**

- 免费的 cron jobs
- 每小时可运行多次

[📖 详细部署指南：Render.com](docs/zh/render-guide.md)

## 📚 文档索引

- **[部署方案对比](docs/zh/deployment-comparison.md)** - 详细对比四种部署方式
- **[项目结构说明](docs/zh/project-structure.md)** - 了解各文件用途和使用场景
- **[测试和日志说明](docs/zh/testing.md)** - 理解系统日志和通知逻辑
- **[GitHub Actions 修复说明](docs/zh/github-actions-fix.md)** - GitHub Actions 常见问题

## 测试

您可以通过手动运行代码来测试服务：

```bash
# 测试长期运行服务（Docker/自托管）
node index.js

# 测试单次检查（GitHub Actions）
node check-once.js
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
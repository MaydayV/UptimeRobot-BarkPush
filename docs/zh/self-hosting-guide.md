# 自托管部署指南

本指南将帮助您在自己的服务器或个人电脑上部署 UptimeRobot-BarkPush 服务，实现完全自主控制的网站监控。

## 优势

- 完全免费，没有任何使用限制
- 完全控制运行环境和频率
- 可以根据需要自定义代码
- 私密性更好，数据不经过第三方服务

## 选项 A: 使用 Docker（推荐）

### 1. 准备工作

1. 确保您的服务器已安装 [Docker](https://docs.docker.com/get-docker/) 和 [Docker Compose](https://docs.docker.com/compose/install/)
2. 准备好您的 UptimeRobot API 密钥和 Bark 设备密钥

### 2. 克隆仓库

```bash
git clone https://github.com/MaydayV/UptimeRobot-BarkPush.git
cd UptimeRobot-BarkPush
```

### 3. 配置环境变量

创建 `.env` 文件，添加必要的环境变量：

```
UPTIMEROBOT_API_KEY=your_api_key
BARK_DEVICE_KEY=your_device_key
BARK_SERVER_URL=https://api.day.app
# 可选配置
# MONITOR_IDS=m1234567,m7654321
# SEND_RECOVERY_NOTIFICATIONS=false
# DOWN_NOTIFICATION_SOUND=alert
# RECOVERY_NOTIFICATION_SOUND=complete
# SEND_STARTUP_NOTIFICATION=false
# NOTIFICATION_LANGUAGE=zh
```

### 4. 使用 Docker Compose 启动服务

```bash
docker-compose up -d
```

Docker 将构建容器并在后台启动服务。服务将每 5 分钟检查一次网站状态。

### 5. 查看日志

```bash
docker-compose logs -f
```

### 6. 更新服务

如果您需要更新服务，请拉取最新代码并重建容器：

```bash
git pull
docker-compose down
docker-compose up -d --build
```

## 选项 B: 直接使用 Node.js

### 1. 准备工作

1. 确保您的服务器已安装 [Node.js](https://nodejs.org/) (14.x 或更高版本)
2. 准备好您的 UptimeRobot API 密钥和 Bark 设备密钥

### 2. 克隆仓库并安装依赖

```bash
git clone https://github.com/MaydayV/UptimeRobot-BarkPush.git
cd UptimeRobot-BarkPush
npm install
```

### 3. 配置服务

编辑 `config.js` 文件，添加您的 API 密钥：

```javascript
module.exports = {
  uptimeRobotApiKey: 'your_uptimerobot_api_key',
  barkServerUrl: 'https://api.day.app',
  barkDeviceKey: 'your_bark_device_key',
  cronSchedule: '*/5 * * * *',
  
  
  
  
  
  
  
};
```

### 4. 使用 PM2 启动服务（推荐）

[PM2](https://pm2.keymetrics.io/) 是一个进程管理器，可以使您的应用保持运行并在系统重启后自动启动。

安装 PM2：

```bash
npm install -g pm2
```

启动服务：

```bash
pm2 start index.js --name "uptime-monitor"
```

设置开机启动：

```bash
pm2 startup
pm2 save
```

### 5. 或者使用系统 cron 定时运行

如果您不想使用 Node.js 的 cron 调度，可以使用系统的 cron 任务定期运行脚本：

编辑系统 crontab：

```bash
crontab -e
```

添加以下行，每 5 分钟运行一次：

```
*/5 * * * * cd /path/to/UptimeRobot-BarkPush && /usr/bin/node index.js >> /var/log/uptime-monitor.log 2>&1
```

### 6. 查看日志

如果使用 PM2：

```bash
pm2 logs uptime-monitor
```

如果使用系统 cron，查看日志文件：

```bash
tail -f /var/log/uptime-monitor.log
```

## 选项 C: 在 Raspberry Pi 上部署

Raspberry Pi 是运行此服务的理想选择，因为它功耗低，可以 24/7 运行。

### 1. 准备工作

1. 设置好的 Raspberry Pi，运行 Raspberry Pi OS
2. 确保已安装 Node.js：`sudo apt update && sudo apt install -y nodejs npm`

### 2. 按照选项 A 或 B 的步骤部署

根据您的偏好，按照上面的 Docker 或直接 Node.js 的方式部署。

### 3. 优化 Raspberry Pi 设置

为了延长 SD 卡寿命，建议：

1. 使用日志轮换来限制日志文件大小
2. 考虑使用 USB 驱动器而不是 SD 卡来存储数据
3. 减少写入操作，例如增加监控间隔

## 常见问题

### 如何修改检查频率？

如果使用 Docker 或 PM2：
- 编辑 `config.js` 中的 `cronSchedule` 值
- 重启服务

如果使用系统 cron：
- 编辑 crontab 中的时间表达式

### 如何临时停止服务？

如果使用 Docker：
```bash
docker-compose stop
```

如果使用 PM2：
```bash
pm2 stop uptime-monitor
```

如果使用系统 cron：
```bash
crontab -e
# 注释掉相关行，保存并退出
```

### 网络连接问题

如果您的服务器位于防火墙后或有网络限制：
1. 确保服务器可以访问 `api.uptimerobot.com` 和 `api.day.app`
2. 检查您的网络代理或 VPN 设置
3. 如果需要，配置相应的 HTTP 代理设置

## 安全提示

1. 不要在公共仓库中存储您的 API 密钥
2. 确保您的服务器防火墙设置正确
3. 定期更新系统和依赖项
4. 考虑为此服务创建一个专用的系统用户

## 资源使用

此服务资源需求非常低：
- 内存：~50-100 MB
- CPU：运行检查时的短暂使用
- 磁盘：~20 MB 加上日志文件
- 网络：每次检查的少量数据传输 

## 新功能

### 启动通知

服务可以在启动时发送通知，确认您的监控系统已激活。此功能默认启用。

- 要禁用启动通知，请将 `SEND_STARTUP_NOTIFICATION` 环境变量设置为 'false'（Docker/系统方式）或在 config.js 中设置 `sendStartupNotification: false`（Node.js 方式）
- 启用后，每次服务启动时您都会收到通知

### 多语言支持

通知可以以中文或英文显示：

- 将 `NOTIFICATION_LANGUAGE` 环境变量设置为 'zh' 使用中文或 'en' 使用英文（默认）（Docker/系统方式）或在 config.js 中设置 `notificationLanguage: 'zh'`（Node.js 方式）
- 这会影响所有通知内容，包括启动、宕机和恢复消息
- 语言设置适用于通知标题和正文 
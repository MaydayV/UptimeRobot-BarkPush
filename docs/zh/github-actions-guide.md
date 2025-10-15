# GitHub Actions 部署指南

本指南将帮助您使用 GitHub Actions 来部署 UptimeRobot-BarkPush 服务，实现免费的定时网站监控。

## 优势

- 完全免费，无需信用卡
- 可以每 5 分钟运行一次
- 无需修改现有代码
- 无需维护服务器

## 步骤

### 1. 准备工作

1. 确保您有一个 GitHub 账户
2. 准备好您的 UptimeRobot API 密钥和 Bark 设备密钥

### 2. 创建 GitHub 仓库

1. 在 GitHub 上创建一个新仓库（或 fork 现有仓库）
2. 将 UptimeRobot-BarkPush 代码克隆到本地，然后推送到新仓库

```bash
git clone https://github.com/MaydayV/UptimeRobot-BarkPush.git
cd UptimeRobot-BarkPush
# 先在 GitHub 上 Fork 仓库，然后：
git remote set-url origin https://github.com/你的用户名/UptimeRobot-BarkPush.git
git push -u origin main
```

### 3. 创建工作流文件

1. 在您的仓库中创建 `.github/workflows` 目录（如果不存在）
2. 在该目录中创建 `monitor.yml` 文件（已在代码仓库中提供）

文件内容应该类似于：

```yaml
name: Website Monitor

on:
  schedule:
    - cron: '*/5 * * * *'  # 每5分钟运行一次
  workflow_dispatch:  # 允许手动触发

jobs:
  check-websites:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run website check
        run: node index.js
        env:
          UPTIMEROBOT_API_KEY: ${{ secrets.UPTIMEROBOT_API_KEY }}
          BARK_DEVICE_KEY: ${{ secrets.BARK_DEVICE_KEY }}
          BARK_SERVER_URL: ${{ secrets.BARK_SERVER_URL }}
          MONITOR_IDS: ${{ secrets.MONITOR_IDS }}
          SEND_RECOVERY_NOTIFICATIONS: ${{ secrets.SEND_RECOVERY_NOTIFICATIONS }}
          DOWN_NOTIFICATION_SOUND: ${{ secrets.DOWN_NOTIFICATION_SOUND }}
          RECOVERY_NOTIFICATION_SOUND: ${{ secrets.RECOVERY_NOTIFICATION_SOUND }}
          SEND_STARTUP_NOTIFICATION: ${{ secrets.SEND_STARTUP_NOTIFICATION }}
          NOTIFICATION_LANGUAGE: ${{ secrets.NOTIFICATION_LANGUAGE }}
```

### 4. 添加 Secrets

1. 在 GitHub 仓库页面，点击 "Settings"
2. 在左侧边栏中，选择 "Secrets and variables" 下的 "Actions"
3. 点击 "New repository secret" 按钮
4. 添加以下 secrets：
   - `UPTIMEROBOT_API_KEY`: 您的 UptimeRobot API 密钥
   - `BARK_DEVICE_KEY`: 您的 Bark 设备密钥
   - `BARK_SERVER_URL` (可选): 自定义 Bark 服务器 URL
   - `MONITOR_IDS` (可选): 要监控的特定 UptimeRobot 监控器 ID，用逗号分隔
   - `SEND_RECOVERY_NOTIFICATIONS` (可选): 设置为 'false' 以禁用恢复通知
   - `DOWN_NOTIFICATION_SOUND` (可选): 自定义宕机通知声音
   - `RECOVERY_NOTIFICATION_SOUND` (可选): 自定义恢复通知声音
   - `SEND_STARTUP_NOTIFICATION` (可选): 设置为 'false' 以禁用启动通知
   - `NOTIFICATION_LANGUAGE` (可选): 通知语言，设置为 'zh' 使用中文，'en' 使用英文（默认）

### 5. 测试工作流

1. 在 GitHub 仓库页面，点击 "Actions" 标签
2. 在左侧找到 "Website Monitor" 工作流
3. 点击 "Run workflow" 按钮手动触发工作流
4. 查看运行结果，确保一切正常工作

### 6. 监控和维护

- 工作流会根据 cron 表达式（默认每 5 分钟）自动运行
- 您可以在 "Actions" 标签页查看所有运行记录和日志
- 如果需要更改配置，只需更新相应的 secrets 或修改工作流文件

## 常见问题

### GitHub Actions 运行失败

检查错误日志，常见原因包括：
- API 密钥错误：确保 UptimeRobot API 密钥和 Bark 设备密钥正确
- 依赖问题：确保 package.json 文件正确，包含所有必要的依赖

### 如何修改检查频率

编辑 `.github/workflows/monitor.yml` 文件中的 cron 表达式。例如：
- `*/10 * * * *`: 每 10 分钟运行一次
- `0 * * * *`: 每小时运行一次

### 如何停止监控

您可以：
1. 禁用工作流：在 GitHub Actions 页面，点击 "Website Monitor" 工作流，然后点击 "Disable workflow"
2. 或删除 `.github/workflows/monitor.yml` 文件

## 限制

GitHub Actions 有以下限制：
- 免费账户每月有 2,000 分钟的运行时间限制
- 每个仓库可以同时运行 20 个工作流
- 工作流文件大小不能超过 500KB

更多信息，请参阅 [GitHub Actions 文档](https://docs.github.com/en/actions)。 

## 新增功能

### 启动通知

服务启动时会发送一个通知，告知您服务已成功启动。通知内容包括：
- 监控频率（cron 表达式）
- 监控的网站数量

您可以通过设置 `SEND_STARTUP_NOTIFICATION=false` 来禁用此功能。

### 多语言支持

系统支持中文和英文两种语言的通知：
- 设置 `NOTIFICATION_LANGUAGE=zh` 使用中文通知
- 设置 `NOTIFICATION_LANGUAGE=en` 使用英文通知（默认）

语言设置会影响：
- 通知的标题和内容
- 网站状态描述（如"正常"、"宕机"等）
- 通知分组（在 Bark 应用中显示为"网站监控"或"Website Monitor"）

这使得通知更加友好，特别是对中文用户。 
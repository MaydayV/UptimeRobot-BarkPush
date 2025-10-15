# UptimeRobot-BarkPush

[English](README.md) | [中文](README.zh-CN.md)

A service that monitors website availability using UptimeRobot API and sends notifications via Bark when websites go down.

## Features

- Monitors websites using UptimeRobot API
- Sends notifications to your iOS devices via Bark when websites go down
- Sends recovery notifications when websites come back online (configurable)
- Can be run as a standalone service or deployed to various platforms
- Configurable monitoring schedule
- Filter monitoring to specific websites
- Fully configurable via environment variables - no code changes needed
- Customizable notification sounds

## Requirements

- Node.js 14 or higher
- UptimeRobot account with API key
- Bark app installed on your iOS device

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/UptimeRobot-BarkPush.git
cd UptimeRobot-BarkPush
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the service

You have two options for configuration:

#### Option A: Environment Variables (Recommended)

Create a `.env` file by copying the provided example:

```bash
cp env.example .env
```

Then edit the `.env` file with your values:

```
UPTIMEROBOT_API_KEY=your_api_key
BARK_DEVICE_KEY=your_device_key
```

Additional environment variables you can set:

- `BARK_SERVER_URL` (optional): Custom Bark server URL (default: https://api.day.app)
- `CRON_SCHEDULE` (optional): Custom check schedule (default: */5 * * * *)
- `MONITOR_IDS` (optional): Comma-separated list of monitor IDs to check
- `SEND_RECOVERY_NOTIFICATIONS` (optional): Set to 'false' to disable recovery notifications
- `DOWN_NOTIFICATION_SOUND` (optional): Custom sound for down notifications
- `RECOVERY_NOTIFICATION_SOUND` (optional): Custom sound for recovery notifications
- `SEND_STARTUP_NOTIFICATION` (optional): Set to 'false' to disable startup notifications
- `NOTIFICATION_LANGUAGE` (optional): Set to 'zh' for Chinese or 'en' for English (default)
- `NOTIFY_ONLY_ON_STATUS_CHANGE` (optional): Set to 'true' to only send notifications when websites go down, without startup and recovery notifications

#### Option B: Config File

Copy the example config and edit it:

```bash
cp config.example.js config.js
```

Then edit `config.js` with your values:

```javascript
module.exports = {
  uptimeRobotApiKey: 'your_uptimerobot_api_key',
  barkServerUrl: 'https://api.day.app',
  barkDeviceKey: 'your_bark_device_key',
  cronSchedule: '*/5 * * * *',
  // Optional configuration
  // monitorIds: ['m1234567', 'm7654321'],
  // sendRecoveryNotifications: false,
  // downNotificationSound: 'alert',
  // recoveryNotificationSound: 'complete',
  // sendStartupNotification: true,
  // notificationLanguage: 'en'  // Use 'zh' for Chinese
  // notifyOnlyOnStatusChange: true  // Only send notifications when websites go down
};
```

## Usage

### Run as a standalone service

```bash
npm start
```

The service will check the status of your websites according to the schedule in config.

### Run with Docker

```bash
# Using docker-compose (recommended)
docker-compose up -d

# Or with Docker directly
docker build -t uptimerobot-bark .
docker run -e UPTIMEROBOT_API_KEY=your_key -e BARK_DEVICE_KEY=your_key uptimerobot-bark
```

### Deploy to Vercel

> **Note**: Vercel's free plan (Hobby) only supports running cron jobs once per day, which is not frequent enough for website monitoring. Consider using one of the alternatives below.

If you have a Vercel Pro plan:

1. Push your repository to GitHub
2. Create a new project on Vercel and connect it to your GitHub repository
3. Add the following environment variables in Vercel:
   - `UPTIMEROBOT_API_KEY`: Your UptimeRobot API key
   - `BARK_DEVICE_KEY`: Your Bark device key
   - Optionally, `BARK_SERVER_URL` if you're using a custom Bark server
   - Optionally, `MONITOR_IDS` as a comma-separated list of monitor IDs

4. Deploy the project

## Deployment Options

This project supports four deployment methods. Choose the one that best fits your needs:

### 🌟 Comparison

| Method | Timing Accuracy | Cost | Difficulty | Best For |
|--------|----------------|------|-----------|----------|
| **Vercel + cron-job.org** | ⭐⭐⭐⭐⭐ Precise | ✅ Free | ⭐⭐ Easy | **Recommended** |
| GitHub Actions | ⭐⭐ 10-30 min delay | ✅ Free | ⭐⭐ Easy | Low timing requirements |
| Docker / Self-hosted | ⭐⭐⭐⭐⭐ Full control | 💰 Requires server | ⭐⭐⭐ Medium | Have server resources |
| Cloudflare Workers | ⭐⭐⭐⭐ Accurate | ✅ Free | ⭐⭐⭐⭐ Complex | Familiar with Workers |

### 1️⃣ Vercel + cron-job.org (Recommended)

**Best Option**: Accurate timing, completely free, easy setup

- ✅ Precise execution (< 1 min error)
- ✅ Completely free
- ✅ Simple configuration (10 min setup)
- ✅ Reliable and stable

[📖 Detailed Guide: Vercel + cron-job.org](docs/en/cron-job-org-guide.md)

### 2️⃣ GitHub Actions

**Alternative**: Completely free, but less precise timing

- ⚠️ May delay 10-30 minutes (GitHub Actions limitation)
- ✅ Completely free
- ✅ Simple configuration
- ⚠️ Suitable for non-critical timing requirements

[📖 Detailed Guide: GitHub Actions](docs/en/github-actions-guide.md)

### 3️⃣ Docker / Self-hosted

**Professional Option**: Full control, for users with servers

- ✅ Precise timing, full control
- ✅ One-click deployment with Docker
- 💰 Requires server (VPS, NAS, etc.)
- ⭐⭐⭐ Requires technical knowledge

**Quick Start:**

```bash
# Option 1: Using docker-compose (Recommended)
docker-compose up -d

# Option 2: Using Docker directly
docker build -t uptimerobot-bark .
docker run -d \
  -e UPTIMEROBOT_API_KEY=your_key \
  -e BARK_DEVICE_KEY=your_key \
  -e NOTIFICATION_LANGUAGE=en \
  uptimerobot-bark

# Option 3: Run directly (Requires Node.js)
npm install
npm start
```

[📖 Detailed Guide: Self-hosting](docs/en/self-hosting-guide.md)

### 4️⃣ Other Platforms

**Cloudflare Workers**

- For users familiar with Cloudflare
- Free plan supports Cron Triggers

[📖 Detailed Guide: Cloudflare Workers](docs/en/cloudflare-workers-guide.md)

**Render.com**

- Free cron jobs
- Can run multiple times per hour

[📖 Detailed Guide: Render.com](docs/en/render-guide.md)

## 📚 Documentation Index

- **[Deployment Comparison](docs/en/deployment-comparison.md)** - Detailed comparison of four deployment methods
- **[Project Structure](docs/en/project-structure.md)** - Understand file purposes and usage scenarios  
- **[Testing Guide](docs/en/testing.md)** - Understanding system logs and notification logic
- **[GitHub Actions Fix](docs/en/github-actions-fix.md)** - GitHub Actions common issues

## Testing

You can test the service by running the code manually:

```bash
# Test long-running service (Docker/Self-hosted)
node index.js

# Test single check (GitHub Actions)
node check-once.js
```

## How it works

1. The service uses the UptimeRobot API to check the status of your websites
2. If a website changes from "Up" to "Down" or "Seems Down", a notification is sent via Bark
3. If a website changes from "Down" to "Up", a recovery notification is sent
4. The service maintains a cache of website statuses to avoid sending duplicate notifications

## UptimeRobot Status Codes

- 0: Paused
- 1: Not checked yet
- 2: Up
- 8: Seems Down
- 9: Down

## License

MIT

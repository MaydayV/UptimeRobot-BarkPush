# UptimeRobot-BarkPush

[English](README.md) | [中文](README.zh-CN.md)

A service that monitors website availability using UptimeRobot API (V3) and sends notifications via Bark when websites go down.

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
cp .env.example .env
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
  // Optional: monitorIds: ['m1234567', 'm7654321'],
  // Optional: sendRecoveryNotifications: false,
  // Optional: downNotificationSound: 'alert',
  // Optional: recoveryNotificationSound: 'complete'
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

## Free Alternatives

If you don't have a Vercel Pro plan, consider these free alternatives:

### 1. Using GitHub Actions

GitHub Actions can run scheduled workflows for free, as frequently as every 5 minutes.

[📖 Detailed GitHub Actions Deployment Guide](docs/en/github-actions-guide.md)

### 2. Using Cloudflare Workers

Cloudflare Workers has a free plan that allows Cron Triggers:

[📖 Detailed Cloudflare Workers Deployment Guide](docs/en/cloudflare-workers-guide.md)

### 3. Using Render.com

Render offers free cron jobs that can be set to run multiple times per hour:

[📖 Detailed Render.com Deployment Guide](docs/en/render-guide.md)

### 4. Self-hosting

If you have a computer or server that's always online, you can run this service using Docker:

[📖 Detailed Self-hosting Guide](docs/en/self-hosting-guide.md)

## Testing

You can test the service by running the code manually:

```bash
node index.js
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

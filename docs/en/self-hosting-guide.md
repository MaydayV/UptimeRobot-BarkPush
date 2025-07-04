# Self-Hosting Deployment Guide

This guide will help you deploy the UptimeRobot-BarkPush service on your own server or personal computer, enabling complete control over your website monitoring.

## Benefits

- Completely free with no usage limits
- Full control over the runtime environment and frequency
- Ability to customize the code as needed
- Better privacy as data doesn't pass through third-party services

## Option A: Using Docker (Recommended)

### 1. Prerequisites

1. Ensure your server has [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed
2. Have your UptimeRobot API key and Bark device key ready

### 2. Clone the Repository

```bash
git clone https://github.com/yourusername/UptimeRobot-BarkPush.git
cd UptimeRobot-BarkPush
```

### 3. Configure Environment Variables

Create a `.env` file and add the necessary environment variables:

```
UPTIMEROBOT_API_KEY=your_api_key
BARK_DEVICE_KEY=your_device_key
BARK_SERVER_URL=https://api.day.app
# Optional configuration
# MONITOR_IDS=m1234567,m7654321
# SEND_RECOVERY_NOTIFICATIONS=false
# DOWN_NOTIFICATION_SOUND=alert
# RECOVERY_NOTIFICATION_SOUND=complete
# SEND_STARTUP_NOTIFICATION=false
# NOTIFICATION_LANGUAGE=en
```

### 4. Start the Service with Docker Compose

```bash
docker-compose up -d
```

Docker will build the container and start the service in the background. The service will check website status every 5 minutes.

### 5. View Logs

```bash
docker-compose logs -f
```

### 6. Update the Service

If you need to update the service, pull the latest code and rebuild the container:

```bash
git pull
docker-compose down
docker-compose up -d --build
```

## Option B: Using Node.js Directly

### 1. Prerequisites

1. Ensure your server has [Node.js](https://nodejs.org/) (14.x or higher) installed
2. Have your UptimeRobot API key and Bark device key ready

### 2. Clone the Repository and Install Dependencies

```bash
git clone https://github.com/yourusername/UptimeRobot-BarkPush.git
cd UptimeRobot-BarkPush
npm install
```

### 3. Configure the Service

Edit the `config.js` file to add your API keys:

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
  // recoveryNotificationSound: 'complete'
  // sendStartupNotification: false,
  // notificationLanguage: 'en'
};
```

### 4. Start the Service with PM2 (Recommended)

[PM2](https://pm2.keymetrics.io/) is a process manager that keeps your application running and automatically restarts it after system reboots.

Install PM2:

```bash
npm install -g pm2
```

Start the service:

```bash
pm2 start index.js --name "uptime-monitor"
```

Set up startup on boot:

```bash
pm2 startup
pm2 save
```

### 5. Or Use System Cron for Scheduled Runs

If you prefer not to use Node.js's cron scheduling, you can use the system's cron job to run the script periodically:

Edit the system crontab:

```bash
crontab -e
```

Add the following line to run every 5 minutes:

```
*/5 * * * * cd /path/to/UptimeRobot-BarkPush && /usr/bin/node index.js >> /var/log/uptime-monitor.log 2>&1
```

### 6. View Logs

If using PM2:

```bash
pm2 logs uptime-monitor
```

If using system cron, view the log file:

```bash
tail -f /var/log/uptime-monitor.log
```

## Option C: Deploying on a Raspberry Pi

A Raspberry Pi is an ideal choice for running this service because of its low power consumption and ability to run 24/7.

### 1. Prerequisites

1. A set-up Raspberry Pi running Raspberry Pi OS
2. Node.js installed: `sudo apt update && sudo apt install -y nodejs npm`

### 2. Follow Option A or B Steps

Deploy using either Docker or direct Node.js approach from above, based on your preference.

### 3. Optimize Raspberry Pi Setup

To extend the life of your SD card:

1. Use log rotation to limit log file size
2. Consider using a USB drive instead of the SD card for data storage
3. Reduce write operations, e.g., by increasing the monitoring interval

## Common Issues

### How to Change the Check Frequency?

If using Docker or PM2:
- Edit the `cronSchedule` value in `config.js`
- Restart the service

If using system cron:
- Edit the cron expression in the crontab

### How to Temporarily Stop the Service?

If using Docker:
```bash
docker-compose stop
```

If using PM2:
```bash
pm2 stop uptime-monitor
```

If using system cron:
```bash
crontab -e
# Comment out the relevant line, save and exit
```

### Network Connectivity Issues

If your server is behind a firewall or has network restrictions:
1. Ensure the server can access `api.uptimerobot.com` and `api.day.app`
2. Check your network proxy or VPN settings
3. Configure appropriate HTTP proxy settings if needed

## Security Tips

1. Don't store your API keys in public repositories
2. Ensure your server's firewall settings are properly configured
3. Keep your system and dependencies updated regularly
4. Consider creating a dedicated system user for this service

## Resource Usage

This service has very low resource requirements:
- Memory: ~50-100 MB
- CPU: Brief usage during checks
- Disk: ~20 MB plus log files
- Network: Small data transfers during checks 

## New Features

### Startup Notifications

The service can send a notification when it starts up, confirming that your monitoring system is active. This feature is enabled by default.

- To disable startup notifications, set the `SEND_STARTUP_NOTIFICATION` environment variable to 'false' (Docker/system approach) or `sendStartupNotification: false` in config.js (Node.js approach)
- When enabled, you'll receive a notification each time the service starts

### Multi-language Support

Notifications can be displayed in either English or Chinese:

- Set the `NOTIFICATION_LANGUAGE` environment variable to 'en' for English (default) or 'zh' for Chinese (Docker/system approach) or `notificationLanguage: 'en'` in config.js (Node.js approach)
- This affects all notification content, including startup, down, and recovery messages
- The language setting applies to both the notification title and body 
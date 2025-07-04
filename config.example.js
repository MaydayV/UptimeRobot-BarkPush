// Example configuration file
// You can use environment variables or modify this file directly
// Environment variables take precedence over values defined here

module.exports = {
  // UptimeRobot API Key (get from https://uptimerobot.com/ > My Settings > API Settings)
  // Can be set with UPTIMEROBOT_API_KEY environment variable
  uptimeRobotApiKey: process.env.UPTIMEROBOT_API_KEY || 'your_uptimerobot_api_key',

  // Bark Server URL (default: https://api.day.app)
  // Can be set with BARK_SERVER_URL environment variable
  barkServerUrl: process.env.BARK_SERVER_URL || 'https://api.day.app',

  // Bark Device Key (get from Bark app)
  // Can be set with BARK_DEVICE_KEY environment variable
  barkDeviceKey: process.env.BARK_DEVICE_KEY || 'your_bark_device_key',

  // Schedule for checking websites (cron format, default: every 5 minutes)
  // Can be set with CRON_SCHEDULE environment variable
  cronSchedule: process.env.CRON_SCHEDULE || '*/5 * * * *',

  // Optional: List of monitor IDs to check (array)
  // If not specified, all monitors from account will be checked
  // Can be set with MONITOR_IDS environment variable (comma-separated)
  monitorIds: process.env.MONITOR_IDS ? process.env.MONITOR_IDS.split(',') : undefined,
  
  // Whether to send recovery notifications when websites come back online
  // Default: true (send recovery notifications)
  // Can be set with SEND_RECOVERY_NOTIFICATIONS environment variable ('true' or 'false')
  sendRecoveryNotifications: process.env.SEND_RECOVERY_NOTIFICATIONS !== 'false',
  
  // Optional: Custom notification sound for down alerts
  // See Bark documentation for available sounds
  // Can be set with DOWN_NOTIFICATION_SOUND environment variable
  downNotificationSound: process.env.DOWN_NOTIFICATION_SOUND || 'alert',
  
  // Optional: Custom notification sound for recovery alerts
  // Can be set with RECOVERY_NOTIFICATION_SOUND environment variable
  recoveryNotificationSound: process.env.RECOVERY_NOTIFICATION_SOUND || 'complete',

  // Whether to send a test notification when the service starts
  // Default: true (send startup notification)
  // Can be set with SEND_STARTUP_NOTIFICATION environment variable ('true' or 'false')
  sendStartupNotification: process.env.SEND_STARTUP_NOTIFICATION !== 'false',

  // Language for notifications ('en' for English, 'zh' for Chinese)
  // Can be set with NOTIFICATION_LANGUAGE environment variable
  notificationLanguage: process.env.NOTIFICATION_LANGUAGE || 'en'
}; 
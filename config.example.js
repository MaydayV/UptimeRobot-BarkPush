



module.exports = {
  
  
  uptimeRobotApiKey: process.env.UPTIMEROBOT_API_KEY || 'your_uptimerobot_api_key',

  
  
  barkServerUrl: process.env.BARK_SERVER_URL || 'https://api.day.app',

  
  
  barkDeviceKey: process.env.BARK_DEVICE_KEY || 'your_bark_device_key',

  
  
  cronSchedule: process.env.CRON_SCHEDULE || '*/5 * * * *',

  
  
  
  monitorIds: process.env.MONITOR_IDS ? process.env.MONITOR_IDS.split(',') : undefined,
  
  
  
  
  sendRecoveryNotifications: process.env.SEND_RECOVERY_NOTIFICATIONS !== 'false',
  
  
  
  
  downNotificationSound: process.env.DOWN_NOTIFICATION_SOUND || 'alert',
  
  
  
  recoveryNotificationSound: process.env.RECOVERY_NOTIFICATION_SOUND || 'complete',

  
  
  
  sendStartupNotification: process.env.SEND_STARTUP_NOTIFICATION !== 'false',

  
  
  notificationLanguage: process.env.NOTIFICATION_LANGUAGE || 'en'
}; 
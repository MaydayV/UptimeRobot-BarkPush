require('dotenv').config();
const axios = require('axios');
const config = require('./config');

/**
 * Format a timestamp to a readable date/time string
 */
function formatTime(timestamp) {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Get monitor status from UptimeRobot API
 */
async function getMonitors() {
  try {
    console.log('Requesting monitors from UptimeRobot API...');
    
    const apiKey = config.uptimeRobotApiKey;
    
    const formData = new URLSearchParams();
    formData.append('api_key', apiKey);
    formData.append('format', 'json');
    formData.append('logs', '1');  // 获取最近的日志
    formData.append('logs_limit', '10');  // 获取最近10条日志
    
    if (config.monitorIds && config.monitorIds.length > 0) {
      formData.append('monitors', config.monitorIds.join('-'));
    }
    
    const response = await axios.post(
      'https://api.uptimerobot.com/v2/getMonitors',
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache'
        }
      }
    );
    
    if (response.data && response.data.stat === 'ok' && Array.isArray(response.data.monitors)) {
      console.log('API call successful! Found', response.data.monitors.length, 'monitors');
      return response.data.monitors;
    } else {
      console.error('Invalid response format:', JSON.stringify(response.data, null, 2));
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch monitors:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    return [];
  }
}

/**
 * Send a notification via Bark
 */
async function sendBarkNotification(title, message, url = '', sound = null) {
  try {
    console.log('Sending Bark notification...');
    
    const postData = new URLSearchParams();
    postData.append('title', title);
    postData.append('body', message);
    
    if (url) postData.append('url', url);
    if (sound) postData.append('sound', sound);
    
    if (config.notificationLanguage) {
      postData.append('group', config.notificationLanguage === 'zh' ? '网站监控' : 'Website Monitor');
    }
    
    const response = await axios.post(
      `${config.barkServerUrl}/${config.barkDeviceKey}`,
      postData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (response.data.code === 200) {
      console.log(`Notification sent: ${title}`);
      return true;
    } else {
      console.error('Bark notification failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('Failed to send Bark notification:', error.message);
    return false;
  }
}

/**
 * Get the status text for a monitor
 */
function getStatusText(statusCode) {
  if (config.notificationLanguage === 'zh') {
    switch (statusCode) {
      case 0: return '已暂停';
      case 1: return '未检查';
      case 2: return '正常';
      case 8: return '似乎宕机';
      case 9: return '宕机';
      default: return '未知';
    }
  } else {
    switch (statusCode) {
      case 0: return 'Paused';
      case 1: return 'Not checked yet';
      case 2: return 'Up';
      case 8: return 'Seems Down';
      case 9: return 'Down';
      default: return 'Unknown';
    }
  }
}

/**
 * Check if a log entry is recent (within the check interval + buffer)
 * GitHub Actions runs every 5 minutes, so we check for events in the last 6 minutes
 */
function isRecentLog(logTimestamp) {
  const now = Math.floor(Date.now() / 1000);
  const sixMinutesAgo = now - (6 * 60);
  return logTimestamp >= sixMinutesAgo;
}

/**
 * Check monitors and send notifications based on recent status changes
 */
async function checkMonitors() {
  console.log(`[${new Date().toISOString()}] Checking monitors...`);
  
  const monitors = await getMonitors();
  
  if (!monitors.length) {
    console.log('No monitors found or error occurred');
    return;
  }
  
  for (const monitor of monitors) {
    const currentStatus = monitor.status;
    console.log(`Monitor: ${monitor.friendly_name}, Current Status: ${getStatusText(currentStatus)}`);
    
    // 调试：显示日志数量
    if (monitor.logs) {
      console.log(`  Logs found: ${monitor.logs.length}`);
    }
    
    // 检查是否有最近的日志（状态变化）
    if (monitor.logs && monitor.logs.length > 0) {
      const latestLog = monitor.logs[0];
      const logType = latestLog.type;  // 1=宕机, 2=恢复
      
      console.log(`  Latest log: Type ${logType}, Time: ${formatTime(latestLog.datetime)}, Recent: ${isRecentLog(latestLog.datetime)}`);
      
      // 只处理最近的日志（在检查间隔内发生的）
      if (isRecentLog(latestLog.datetime)) {
        // Type 1 = 宕机, Type 2 = 恢复
        if (logType === 1 && (currentStatus === 8 || currentStatus === 9)) {
          // 网站宕机
          let title, message;
          
          if (config.notificationLanguage === 'zh') {
            title = `🔴 网站宕机: ${monitor.friendly_name}`;
            message = `状态: ${getStatusText(currentStatus)}\n`;
            message += `时间: ${formatTime(latestLog.datetime)}\n`;
            message += `原因: ${latestLog.reason.code || latestLog.reason.detail || '未知'}`;
          } else {
            title = `🔴 Website Down: ${monitor.friendly_name}`;
            message = `Status: ${getStatusText(currentStatus)}\n`;
            message += `Since: ${formatTime(latestLog.datetime)}\n`;
            message += `Reason: ${latestLog.reason.code || latestLog.reason.detail || 'Unknown'}`;
          }
          
          await sendBarkNotification(title, message, monitor.url, config.downNotificationSound);
          console.log(`  ✓ Sent down notification`);
        }
        else if (logType === 2 && currentStatus === 2 && config.sendRecoveryNotifications) {
          // 网站恢复
          let title, message;
          
          if (config.notificationLanguage === 'zh') {
            title = `🟢 网站恢复: ${monitor.friendly_name}`;
            message = `状态: ${getStatusText(currentStatus)}\n`;
            message += `时间: ${formatTime(latestLog.datetime)}`;
          } else {
            title = `🟢 Website Recovered: ${monitor.friendly_name}`;
            message = `Status: ${getStatusText(currentStatus)}\n`;
            message += `At: ${formatTime(latestLog.datetime)}`;
          }
          
          await sendBarkNotification(title, message, monitor.url, config.recoveryNotificationSound);
          console.log(`  ✓ Sent recovery notification`);
        }
      } else {
        console.log(`  No recent status changes`);
      }
    } else {
      console.log(`  No logs available`);
    }
  }
  
  console.log('Check completed.');
}

// 运行检查（不发送启动通知，只检查一次）
checkMonitors().catch(error => {
  console.error('Error during check:', error);
  process.exit(1);
});


// 添加dotenv支持
require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');
// Use a single configuration file that handles environment variables
const config = require('./config');

// Cache to track monitor states to avoid duplicate notifications
const monitorStateCache = new Map();

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
    console.log('Requesting monitors from UptimeRobot API using read-only API key...');
    
    const apiKey = config.uptimeRobotApiKey;
    console.log('API Key Format Check:', apiKey.length > 10 ? 'Valid length' : 'Invalid length', 
                'Starts with:', apiKey.substring(0, 2));
    
    // 根据提供的 curl 示例，使用 POST 请求和表单编码
    console.log('Using POST request to /v2/getMonitors endpoint with form-urlencoded data');
    
    try {
      // 创建表单数据
      const formData = new URLSearchParams();
      formData.append('api_key', apiKey);
      formData.append('format', 'json');
      formData.append('logs', '1');
      
      // 如果指定了监控器 ID，添加到请求中
      if (config.monitorIds && config.monitorIds.length > 0) {
        formData.append('monitors', config.monitorIds.join('-'));
      }
      
      // 发送请求
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
      
      console.log('API response received, checking format...');
      
      if (response.data && response.data.stat === 'ok' && Array.isArray(response.data.monitors)) {
        console.log('API call successful! Found', response.data.monitors.length, 'monitors');
        
        // 返回监控器数据
        return response.data.monitors;
      } else {
        console.error('Invalid response format:', JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      console.error('API call failed:', error.message);
      if (error.response) {
        console.error('  Status:', error.response.status);
        console.error('  Status Text:', error.response.statusText);
        console.error('  Response Data:', JSON.stringify(error.response.data, null, 2));
        
        // 检查是否是认证问题
        if (error.response.status === 401) {
          console.error('Authentication failed. Please check your API key.');
          console.error('Make sure you are using a valid API key with read access.');
          console.error('API keys can be found at: https://uptimerobot.com/ > My Settings > API Settings');
        }
      }
    }
    
    return [];
  } catch (outerError) {
    console.error('Failed to fetch monitors (outer):', outerError.message);
    return [];
  }
}

/**
 * Send a notification via Bark
 */
async function sendBarkNotification(title, message, url = '', sound = null) {
  try {
    console.log('Sending Bark notification...');
    
    // 使用 POST 请求发送 Bark 通知
    const postData = new URLSearchParams();
    postData.append('title', title);
    postData.append('body', message);
    
    // 添加可选参数
    if (url) postData.append('url', url);
    if (sound) postData.append('sound', sound);
    
    // 添加语言参数
    if (config.notificationLanguage) {
      postData.append('group', config.notificationLanguage === 'zh' ? '网站监控' : 'Website Monitor');
    }
    
    // 发送 POST 请求
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
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Response:', JSON.stringify(error.response.data, null, 2));
    }
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
 * Check monitors and send notifications for down websites
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
    const prevStatus = monitorStateCache.get(monitor.id);
    
    // Update the cache
    monitorStateCache.set(monitor.id, currentStatus);
    
    // If this is the first check or status changed to down, send notification
    if ((prevStatus === undefined || prevStatus === 2) && (currentStatus === 8 || currentStatus === 9)) {
      // 根据语言设置选择通知内容
      let title, message;
      
      if (config.notificationLanguage === 'zh') {
        title = `🔴 网站宕机: ${monitor.friendly_name}`;
        message = `状态: ${getStatusText(currentStatus)}\n`;
        
        // Add the latest log if available
        if (monitor.logs && monitor.logs.length > 0) {
          const latestLog = monitor.logs[0];
          message += `时间: ${formatTime(latestLog.datetime)}\n`;
          message += `原因: ${latestLog.reason.success || latestLog.reason.error || '未知'}`;
        }
      } else {
        title = `🔴 Website Down: ${monitor.friendly_name}`;
        message = `Status: ${getStatusText(currentStatus)}\n`;
        
        // Add the latest log if available
        if (monitor.logs && monitor.logs.length > 0) {
          const latestLog = monitor.logs[0];
          message += `Since: ${formatTime(latestLog.datetime)}\n`;
          message += `Reason: ${latestLog.reason.success || latestLog.reason.error || 'Unknown'}`;
        }
      }
      
      await sendBarkNotification(title, message, monitor.url, config.downNotificationSound);
    }
    
    // If status changed from down to up, send recovery notification if enabled
    else if ((prevStatus === 8 || prevStatus === 9) && currentStatus === 2 && config.sendRecoveryNotifications) {
      // 根据语言设置选择通知内容
      let title, message;
      
      if (config.notificationLanguage === 'zh') {
        title = `🟢 网站恢复: ${monitor.friendly_name}`;
        message = `状态: ${getStatusText(currentStatus)}\n`;
        
        // Add the latest log if available
        if (monitor.logs && monitor.logs.length > 0) {
          const latestLog = monitor.logs[0];
          message += `时间: ${formatTime(latestLog.datetime)}`;
        }
      } else {
        title = `🟢 Website Recovered: ${monitor.friendly_name}`;
        message = `Status: ${getStatusText(currentStatus)}\n`;
        
        // Add the latest log if available
        if (monitor.logs && monitor.logs.length > 0) {
          const latestLog = monitor.logs[0];
          message += `At: ${formatTime(latestLog.datetime)}`;
        }
      }
      
      await sendBarkNotification(title, message, monitor.url, config.recoveryNotificationSound);
    }
  }
}

/**
 * Initialize the monitoring service
 */
function init() {
  console.log('UptimeRobot to Bark notification service starting...');
  
  // 发送启动通知
  if (config.sendStartupNotification) {
    // 根据语言设置选择通知内容
    let title, message;
    
    if (config.notificationLanguage === 'zh') {
      title = '🚀 网站监控服务已启动';
      message = `监控服务已成功启动\n监控频率: ${config.cronSchedule}\n监控数量: ${config.monitorIds ? config.monitorIds.length : '全部'}`;
    } else {
      title = '🚀 Website Monitoring Started';
      message = `Monitoring service has started successfully\nSchedule: ${config.cronSchedule}\nMonitors: ${config.monitorIds ? config.monitorIds.length : 'All'}`;
    }
    
    sendBarkNotification(title, message, '', 'active');
    console.log('Startup notification sent');
  }
  
  // Check monitors immediately on startup
  checkMonitors();
  
  // Schedule regular checks
  cron.schedule(config.cronSchedule, checkMonitors);
  
  console.log(`Monitoring scheduled: ${config.cronSchedule}`);
}

// Start the service
init(); 
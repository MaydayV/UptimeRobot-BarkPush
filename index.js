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
    
    // 针对只读 API 密钥，使用 GET 请求
    console.log('Using GET request to /v3/getMonitors endpoint (for read-only API key)');
    
    try {
      const response = await axios.get('https://api.uptimerobot.com/v3/getMonitors', {
        params: {
          api_key: apiKey,
          format: 'json',
          logs: 1
        },
        headers: {
          'cache-control': 'no-cache'
        }
      });
      
      if (response.data && response.data.stat === 'ok' && Array.isArray(response.data.monitors)) {
        console.log('API call successful!');
        
        // If specific monitor IDs are configured, filter the results
        if (config.monitorIds && config.monitorIds.length > 0) {
          return response.data.monitors.filter(monitor => 
            config.monitorIds.includes(monitor.id.toString()));
        }
        
        return response.data.monitors;
      } else {
        console.error('Invalid response format:', JSON.stringify(response.data, null, 2));
        
        // 尝试第二种方法 - 使用 GET 请求和 monitors 端点
        console.log('Trying GET request to /v3/monitors endpoint...');
        const response2 = await axios.get('https://api.uptimerobot.com/v3/monitors', {
          params: {
            api_key: apiKey,
            format: 'json',
            logs: 1
          },
          headers: {
            'cache-control': 'no-cache'
          }
        });
        
        if (response2.data && response2.data.stat === 'ok' && Array.isArray(response2.data.monitors)) {
          console.log('Second attempt successful!');
          
          // If specific monitor IDs are configured, filter the results
          if (config.monitorIds && config.monitorIds.length > 0) {
            return response2.data.monitors.filter(monitor => 
              config.monitorIds.includes(monitor.id.toString()));
          }
          
          return response2.data.monitors;
        } else {
          console.error('Second attempt - Invalid response format:', JSON.stringify(response2.data, null, 2));
        }
      }
    } catch (error) {
      console.error('API call failed:', error.message);
      if (error.response) {
        console.error('  Status:', error.response.status);
        console.error('  Status Text:', error.response.statusText);
        console.error('  Response Data:', JSON.stringify(error.response.data, null, 2));
      }
      
      // 尝试 v2 API 格式 (不带 v3 路径)
      try {
        console.log('Trying v2 API format...');
        const responseV2 = await axios.get('https://api.uptimerobot.com/getMonitors', {
          params: {
            apiKey: apiKey,
            format: 'json',
            logs: 1,
            noJsonCallback: 1
          }
        });
        
        if (responseV2.data && responseV2.data.monitors) {
          console.log('v2 API call successful!');
          return responseV2.data.monitors;
        }
      } catch (errorV2) {
        console.error('v2 API call failed:', errorV2.message);
        if (errorV2.response) {
          console.error('  v2 Status:', errorV2.response.status);
          console.error('  v2 Response:', JSON.stringify(errorV2.response.data, null, 2));
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
    const encodedTitle = encodeURIComponent(title);
    const encodedMessage = encodeURIComponent(message);
    const barkUrl = `${config.barkServerUrl}/${config.barkDeviceKey}/${encodedTitle}/${encodedMessage}`;
    
    const params = new URLSearchParams();
    if (url) params.append('url', url);
    if (sound) params.append('sound', sound);
    
    const finalUrl = params.toString() ? `${barkUrl}?${params.toString()}` : barkUrl;
    
    const response = await axios.get(finalUrl);
    
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
  switch (statusCode) {
    case 0: return 'Paused';
    case 1: return 'Not checked yet';
    case 2: return 'Up';
    case 8: return 'Seems Down';
    case 9: return 'Down';
    default: return 'Unknown';
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
      const title = `🔴 Website Down: ${monitor.friendly_name}`;
      
      let message = `Status: ${getStatusText(currentStatus)}\n`;
      
      // Add the latest log if available
      if (monitor.logs && monitor.logs.length > 0) {
        const latestLog = monitor.logs[0];
        message += `Since: ${formatTime(latestLog.datetime)}\n`;
        message += `Reason: ${latestLog.reason.success || latestLog.reason.error || 'Unknown'}`;
      }
      
      await sendBarkNotification(title, message, monitor.url, config.downNotificationSound);
    }
    
    // If status changed from down to up, send recovery notification if enabled
    else if ((prevStatus === 8 || prevStatus === 9) && currentStatus === 2 && config.sendRecoveryNotifications) {
      const title = `🟢 Website Recovered: ${monitor.friendly_name}`;
      
      let message = `Status: ${getStatusText(currentStatus)}\n`;
      
      // Add the latest log if available
      if (monitor.logs && monitor.logs.length > 0) {
        const latestLog = monitor.logs[0];
        message += `At: ${formatTime(latestLog.datetime)}`;
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
  
  // Check monitors immediately on startup
  checkMonitors();
  
  // Schedule regular checks
  cron.schedule(config.cronSchedule, checkMonitors);
  
  console.log(`Monitoring scheduled: ${config.cronSchedule}`);
}

// Start the service
init(); 
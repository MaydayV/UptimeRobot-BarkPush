const axios = require('axios');

const config = require('../config');

// 使用 Map 存储状态缓存，与 index.js 保持一致
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
    const response = await axios({
      method: 'get',
      url: 'https://api.uptimerobot.com/v3/getMonitors',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      params: {
        api_key: config.uptimeRobotApiKey,
        format: 'json',
        logs: 1
      }
    });

    if (response.data.stat !== 'ok') {
      console.error('Error from UptimeRobot API:', response.data);
      return [];
    }

    
    if (config.monitorIds && config.monitorIds.length > 0) {
      return response.data.monitors.filter(monitor => 
        config.monitorIds.includes(monitor.id.toString()));
    }

    return response.data.monitors;
  } catch (error) {
    console.error('Failed to fetch monitors:', error.message);
    return [];
  }
}

/**
 * Send a notification via Bark
 */
async function sendBarkNotification(title, message, url = '', sound = null) {
  try {
    console.log('Sending Bark notification...');
    
    // 使用 POST 方式发送通知，与 index.js 保持一致
    const postData = new URLSearchParams();
    postData.append('title', title);
    postData.append('body', message);
    
    // 添加可选参数
    if (url) postData.append('url', url);
    if (sound) postData.append('sound', sound);
    
    // 添加分组（根据语言设置）
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
  
  if (!monitors || !monitors.length) {
    console.log('No monitors found or error occurred');
    return { message: 'No monitors found or error occurred' };
  }
  
  const results = [];
  
  for (const monitor of monitors) {
    const currentStatus = monitor.status;
    const prevStatus = monitorStateCache.get(monitor.id);
    
    // 只有当状态发生变化时才处理
    if (prevStatus !== currentStatus) {
      // 更新缓存中的状态
      monitorStateCache.set(monitor.id, currentStatus);
      
      // 网站从正常变为宕机时发送通知
      if (prevStatus === 2 && (currentStatus === 8 || currentStatus === 9)) {
        let title, message;
        
        if (config.notificationLanguage === 'zh') {
          title = `🔴 网站宕机: ${monitor.friendly_name}`;
          message = `状态: ${getStatusText(currentStatus)}\n`;
          
          // 添加日志信息（如果有）
          if (monitor.logs && monitor.logs.length > 0) {
            const latestLog = monitor.logs[0];
            message += `时间: ${formatTime(latestLog.datetime)}\n`;
            message += `原因: ${latestLog.reason.success || latestLog.reason.error || '未知'}`;
          }
        } else {
          title = `🔴 Website Down: ${monitor.friendly_name}`;
          message = `Status: ${getStatusText(currentStatus)}\n`;
          
          // 添加日志信息（如果有）
          if (monitor.logs && monitor.logs.length > 0) {
            const latestLog = monitor.logs[0];
            message += `Since: ${formatTime(latestLog.datetime)}\n`;
            message += `Reason: ${latestLog.reason.success || latestLog.reason.error || 'Unknown'}`;
          }
        }
        
        await sendBarkNotification(title, message, monitor.url, config.downNotificationSound);
        
        results.push({
          monitor: monitor.friendly_name,
          status: 'down',
          notified: true
        });
      }
      // 网站从宕机恢复时发送通知（如果配置允许）
      else if ((prevStatus === 8 || prevStatus === 9) && currentStatus === 2 && config.sendRecoveryNotifications) {
        let title, message;
        
        if (config.notificationLanguage === 'zh') {
          title = `🟢 网站恢复: ${monitor.friendly_name}`;
          message = `状态: ${getStatusText(currentStatus)}\n`;
          
          // 添加日志信息（如果有）
          if (monitor.logs && monitor.logs.length > 0) {
            const latestLog = monitor.logs[0];
            message += `时间: ${formatTime(latestLog.datetime)}`;
          }
        } else {
          title = `🟢 Website Recovered: ${monitor.friendly_name}`;
          message = `Status: ${getStatusText(currentStatus)}\n`;
          
          // 添加日志信息（如果有）
          if (monitor.logs && monitor.logs.length > 0) {
            const latestLog = monitor.logs[0];
            message += `At: ${formatTime(latestLog.datetime)}`;
          }
        }
        
        await sendBarkNotification(title, message, monitor.url, config.recoveryNotificationSound);
        
        results.push({
          monitor: monitor.friendly_name,
          status: 'recovered',
          notified: true
        });
      } else {
        // 状态发生了变化但不是上述情况（例如从未检查变为正常）
        results.push({
          monitor: monitor.friendly_name,
          status: getStatusText(currentStatus),
          notified: false,
          note: 'Status changed but no notification sent'
        });
      }
    } else {
      // 初次检查，记录状态但不发送通知
      if (prevStatus === undefined) {
        monitorStateCache.set(monitor.id, currentStatus);
        results.push({
          monitor: monitor.friendly_name,
          status: getStatusText(currentStatus),
          notified: false,
          note: 'Initial check'
        });
      } else {
        // 状态未变化，不发送通知
        results.push({
          monitor: monitor.friendly_name,
          status: getStatusText(currentStatus),
          notified: false
        });
      }
    }
  }
  
  return { 
    timestamp: new Date().toISOString(),
    monitors: results
  };
}


module.exports = async (req, res) => {
  try {
    
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    
    const isCron = req.headers['x-vercel-cron'] === 'true';
    const isManualTrigger = req.query.trigger === 'manual';
    
    if (!isCron && !isManualTrigger) {
      return res.status(400).json({ 
        error: 'This endpoint should be called by Vercel cron jobs or with ?trigger=manual'
      });
    }
    
    const result = await checkMonitors();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Cron job failed:', error);
    return res.status(500).json({ error: error.message });
  }
}; 
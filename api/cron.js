const axios = require('axios');

const config = require('../config');


let monitorStateCache = {};

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
      url: 'https://api.uptimerobot.com/v3/monitors',
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
  
  if (!monitors || !monitors.length) {
    console.log('No monitors found or error occurred');
    return { message: 'No monitors found or error occurred' };
  }
  
  const results = [];
  
  for (const monitor of monitors) {
    const currentStatus = monitor.status;
    const prevStatus = monitorStateCache[monitor.id];
    
    
    monitorStateCache[monitor.id] = currentStatus;
    
    
    if ((prevStatus === undefined || prevStatus === 2) && (currentStatus === 8 || currentStatus === 9)) {
      const title = `🔴 Website Down: ${monitor.friendly_name}`;
      
      let message = `Status: ${getStatusText(currentStatus)}\n`;
      
      
      if (monitor.logs && monitor.logs.length > 0) {
        const latestLog = monitor.logs[0];
        message += `Since: ${formatTime(latestLog.datetime)}\n`;
        message += `Reason: ${latestLog.reason.success || latestLog.reason.error || 'Unknown'}`;
      }
      
      await sendBarkNotification(title, message, monitor.url, config.downNotificationSound);
      
      results.push({
        monitor: monitor.friendly_name,
        status: 'down',
        notified: true
      });
    }
    
    
    else if ((prevStatus === 8 || prevStatus === 9) && currentStatus === 2 && config.sendRecoveryNotifications) {
      const title = `🟢 Website Recovered: ${monitor.friendly_name}`;
      
      let message = `Status: ${getStatusText(currentStatus)}\n`;
      
      
      if (monitor.logs && monitor.logs.length > 0) {
        const latestLog = monitor.logs[0];
        message += `At: ${formatTime(latestLog.datetime)}`;
      }
      
      await sendBarkNotification(title, message, monitor.url, config.recoveryNotificationSound);
      
      results.push({
        monitor: monitor.friendly_name,
        status: 'recovered',
        notified: true
      });
    } else {
      results.push({
        monitor: monitor.friendly_name,
        status: getStatusText(currentStatus),
        notified: false
      });
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
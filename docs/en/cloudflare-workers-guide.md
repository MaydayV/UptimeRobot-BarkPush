# Cloudflare Workers Deployment Guide

This guide will help you deploy the UptimeRobot-BarkPush service using Cloudflare Workers, enabling free scheduled website monitoring.

## Benefits

- Free plan provides 100,000 requests per day
- Supports cron triggers, can run every 5 minutes
- Global edge network with low latency
- No server maintenance required

## Steps

### 1. Prerequisites

1. Sign up for a [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. Have your UptimeRobot API key and Bark device key ready
3. Make sure you have Node.js and npm installed

### 2. Install Wrangler CLI

Wrangler is the command-line tool for Cloudflare Workers.

```bash
npm install -g wrangler
```

Then log in to your Cloudflare account:

```bash
wrangler login
```

### 3. Create a Workers Project

Create a new Workers project:

```bash
mkdir uptimerobot-bark-worker
cd uptimerobot-bark-worker
wrangler init
```

Follow the prompts to select configuration options:
- Select the "Worker" type
- You can choose TypeScript or JavaScript (JavaScript recommended for simplicity)

### 4. Configure the Cron Trigger

Edit the `wrangler.toml` file to add a cron trigger:

```toml
name = "uptimerobot-bark-worker"
main = "src/index.js"
compatibility_date = "2023-10-16"

[triggers]
crons = ["*/5 * * * *"]

[vars]
BARK_SERVER_URL = "https://api.day.app"
# The following variables should be set as Secrets in the Cloudflare Dashboard
# UPTIMEROBOT_API_KEY
# BARK_DEVICE_KEY
# MONITOR_IDS (optional)
# SEND_RECOVERY_NOTIFICATIONS (optional)
```

### 5. Set Environment Variables and Secrets

1. In the Cloudflare Dashboard, navigate to Workers & Pages > Your Worker > Settings > Variables
2. Add the following environment variables:
   - `UPTIMEROBOT_API_KEY`: Your UptimeRobot API key (set as encrypted)
   - `BARK_DEVICE_KEY`: Your Bark device key (set as encrypted)
   - `BARK_SERVER_URL`: Bark server URL (default: https://api.day.app)
   - `MONITOR_IDS` (optional): UptimeRobot monitor IDs to check, comma-separated
   - `SEND_RECOVERY_NOTIFICATIONS` (optional): Set to 'false' to disable recovery notifications
   - `DOWN_NOTIFICATION_SOUND` (optional): Custom sound for down notifications
   - `RECOVERY_NOTIFICATION_SOUND` (optional): Custom sound for recovery notifications

### 6. Implement the Worker Code

Edit the `src/index.js` file to implement the monitoring logic:

```javascript
// Monitor state cache (maintain state between calls)
let monitorStateCache = {};

// Format timestamp to readable string
function formatTime(timestamp) {
  return new Date(timestamp * 1000).toLocaleString();
}

// Get status text
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

// Get monitor status from UptimeRobot
async function getMonitors(env) {
  try {
    const response = await fetch('https://api.uptimerobot.com/v3/monitors', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cf: { cacheTtl: 0 },
      query: {
        api_key: env.UPTIMEROBOT_API_KEY,
        format: 'json',
        logs: 1
      }
    });
    
    const data = await response.json();
    
    if (data.stat !== 'ok') {
      console.error('Error from UptimeRobot API:', data);
      return [];
    }
    
    // Filter results if specific monitor IDs are specified
    if (env.MONITOR_IDS) {
      const monitorIds = env.MONITOR_IDS.split(',');
      return data.monitors.filter(monitor => monitorIds.includes(monitor.id.toString()));
    }
    
    return data.monitors;
  } catch (error) {
    console.error('Failed to fetch monitors:', error.message);
    return [];
  }
}

// Send Bark notification
async function sendBarkNotification(env, title, message, url = '', sound = null) {
  try {
    const encodedTitle = encodeURIComponent(title);
    const encodedMessage = encodeURIComponent(message);
    let barkUrl = `${env.BARK_SERVER_URL}/${env.BARK_DEVICE_KEY}/${encodedTitle}/${encodedMessage}`;
    
    const params = new URLSearchParams();
    if (url) params.append('url', url);
    if (sound) params.append('sound', sound);
    
    const finalUrl = params.toString() ? `${barkUrl}?${params.toString()}` : barkUrl;
    
    const response = await fetch(finalUrl);
    const data = await response.json();
    
    if (data.code === 200) {
      console.log(`Notification sent: ${title}`);
      return true;
    } else {
      console.error('Bark notification failed:', data);
      return false;
    }
  } catch (error) {
    console.error('Failed to send Bark notification:', error.message);
    return false;
  }
}

// Check monitors and send notifications
async function checkMonitors(env) {
  console.log(`[${new Date().toISOString()}] Checking monitors...`);
  
  const monitors = await getMonitors(env);
  
  if (!monitors || !monitors.length) {
    console.log('No monitors found or error occurred');
    return { message: 'No monitors found or error occurred' };
  }
  
  const results = [];
  
  for (const monitor of monitors) {
    const currentStatus = monitor.status;
    const prevStatus = monitorStateCache[monitor.id];
    
    // Update cache
    monitorStateCache[monitor.id] = currentStatus;
    
    // If first check or status changed from up to down, send notification
    if ((prevStatus === undefined || prevStatus === 2) && (currentStatus === 8 || currentStatus === 9)) {
      const title = `🔴 Website Down: ${monitor.friendly_name}`;
      
      let message = `Status: ${getStatusText(currentStatus)}\n`;
      
      // Add latest log if available
      if (monitor.logs && monitor.logs.length > 0) {
        const latestLog = monitor.logs[0];
        message += `Since: ${formatTime(latestLog.datetime)}\n`;
        message += `Reason: ${latestLog.reason.success || latestLog.reason.error || 'Unknown'}`;
      }
      
      await sendBarkNotification(
        env, 
        title, 
        message, 
        monitor.url, 
        env.DOWN_NOTIFICATION_SOUND || 'alert'
      );
      
      results.push({
        monitor: monitor.friendly_name,
        status: 'down',
        notified: true
      });
    }
    
    // If status changed from down to up, send recovery notification if enabled
    else if ((prevStatus === 8 || prevStatus === 9) && currentStatus === 2 && env.SEND_RECOVERY_NOTIFICATIONS !== 'false') {
      const title = `🟢 Website Recovered: ${monitor.friendly_name}`;
      
      let message = `Status: ${getStatusText(currentStatus)}\n`;
      
      // Add latest log if available
      if (monitor.logs && monitor.logs.length > 0) {
        const latestLog = monitor.logs[0];
        message += `At: ${formatTime(latestLog.datetime)}`;
      }
      
      await sendBarkNotification(
        env, 
        title, 
        message, 
        monitor.url, 
        env.RECOVERY_NOTIFICATION_SOUND || 'complete'
      );
      
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

// Worker entry point
export default {
  // Handle HTTP requests (for manual triggering and testing)
  async fetch(request, env, ctx) {
    const result = await checkMonitors(env);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  },
  
  // Handle scheduled events
  async scheduled(event, env, ctx) {
    await checkMonitors(env);
    return new Response('OK');
  }
};
```

### 7. Deploy the Worker

Deploy the Worker using the following command:

```bash
wrangler deploy
```

### 8. Test

1. In the Cloudflare Dashboard, find your Worker
2. Click "Quick Edit" to enter the editor
3. Click "Send" to manually trigger the Worker
4. Check the console output to ensure everything is working properly

### 9. Monitoring and Maintenance

- The Worker will run automatically according to the cron trigger (every 5 minutes by default)
- You can view invocation statistics and logs in the Cloudflare Dashboard
- To change the configuration, edit environment variables or update the code

## Common Issues

### Worker Fails to Run

Check the error logs, common causes include:
- API key errors: Make sure your UptimeRobot API key and Bark device key are correct
- Request quota exceeded: Cloudflare free plan has daily request limits

### State Cache Issues

Cloudflare Workers does not guarantee state persistence between invocations. For more reliable state storage:
1. Use Cloudflare KV or D1 database to store state
2. Or use an external storage service

### How to Change the Check Frequency

Edit the cron expression in the `wrangler.toml` file, for example:
- `*/10 * * * *`: Run every 10 minutes
- `0 * * * *`: Run once per hour

## Limitations

The Cloudflare Workers free plan has the following limitations:
- 100,000 requests per day
- Maximum of 10ms CPU time per request
- Up to 30 Workers
- Some advanced features not available

For more information, see the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/). 
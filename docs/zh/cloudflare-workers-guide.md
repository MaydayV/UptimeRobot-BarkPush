# Cloudflare Workers 部署指南

本指南将帮助您使用 Cloudflare Workers 来部署 UptimeRobot-BarkPush 服务，实现免费的定时网站监控。

## 优势

- 免费计划每天提供 100,000 次请求
- 支持 cron 触发器，可以每 5 分钟运行一次
- 全球边缘网络，低延迟
- 无需维护服务器

## 步骤

### 1. 准备工作

1. 注册 [Cloudflare 账户](https://dash.cloudflare.com/sign-up)
2. 准备好您的 UptimeRobot API 密钥和 Bark 设备密钥
3. 确保安装了 Node.js 和 npm

### 2. 安装 Wrangler CLI

Wrangler 是 Cloudflare Workers 的命令行工具。

```bash
npm install -g wrangler
```

然后登录到您的 Cloudflare 账户：

```bash
wrangler login
```

### 3. 创建 Workers 项目

创建一个新的 Workers 项目：

```bash
mkdir uptimerobot-bark-worker
cd uptimerobot-bark-worker
wrangler init
```

根据提示选择配置选项：
- 选择 "Worker" 类型
- 可以选择 TypeScript 或 JavaScript，推荐使用 JavaScript 简化设置

### 4. 配置 Cron 触发器

编辑 `wrangler.toml` 文件，添加 cron 触发器：

```toml
name = "uptimerobot-bark-worker"
main = "src/index.js"
compatibility_date = "2023-10-16"

[triggers]
crons = ["*/5 * * * *"]

[vars]
BARK_SERVER_URL = "https://api.day.app"
# 以下变量需要在 Cloudflare Dashboard 中设置为 Secret
# UPTIMEROBOT_API_KEY
# BARK_DEVICE_KEY
# MONITOR_IDS (可选)
# SEND_RECOVERY_NOTIFICATIONS (可选)
```

### 5. 设置环境变量和 Secrets

1. 在 Cloudflare Dashboard 中，导航到 Workers & Pages > 您的Worker > Settings > Variables
2. 添加以下环境变量：
   - `UPTIMEROBOT_API_KEY`: 您的 UptimeRobot API 密钥（设为加密）
   - `BARK_DEVICE_KEY`: 您的 Bark 设备密钥（设为加密）
   - `BARK_SERVER_URL`: Bark 服务器 URL（默认: https://api.day.app）
   - `MONITOR_IDS`(可选): 要监控的 UptimeRobot 监控器 ID，用逗号分隔
   - `SEND_RECOVERY_NOTIFICATIONS`(可选): 设置为 'false' 以禁用恢复通知
   - `DOWN_NOTIFICATION_SOUND`(可选): 自定义宕机通知声音
   - `RECOVERY_NOTIFICATION_SOUND`(可选): 自定义恢复通知声音

### 6. 实现 Worker 代码

编辑 `src/index.js` 文件，实现监控逻辑：

```javascript
// 监控状态缓存（在多次调用之间保持状态）
let monitorStateCache = {};

// 格式化时间戳为可读字符串
function formatTime(timestamp) {
  return new Date(timestamp * 1000).toLocaleString();
}

// 获取监控状态文本
function getStatusText(statusCode, language) {
  if (language === 'zh') {
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

// 从 UptimeRobot 获取监控状态
async function getMonitors(env) {
  try {
    // 创建表单数据
    const formData = new URLSearchParams();
    formData.append('api_key', env.UPTIMEROBOT_API_KEY);
    formData.append('format', 'json');
    formData.append('logs', '1');
    
    // 发送 POST 请求
    const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      cf: { cacheTtl: 0 },
      body: formData.toString()
    });
    
    const data = await response.json();
    
    if (data.stat !== 'ok') {
      console.error('Error from UptimeRobot API:', data);
      return [];
    }
    
    // 如果指定了监控 ID，过滤结果
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

// 发送 Bark 通知
async function sendBarkNotification(env, title, message, url = '', sound = null) {
  try {
    console.log('Sending Bark notification...');
    
    // 使用 POST 请求发送 Bark 通知
    const postData = new URLSearchParams();
    postData.append('title', title);
    postData.append('body', message);
    
    // 添加可选参数
    if (url) postData.append('url', url);
    if (sound) postData.append('sound', sound);
    
    // 添加语言分组
    if (env.NOTIFICATION_LANGUAGE) {
      postData.append('group', env.NOTIFICATION_LANGUAGE === 'zh' ? '网站监控' : 'Website Monitor');
    }
    
    // 发送 POST 请求
    const response = await fetch(`${env.BARK_SERVER_URL}/${env.BARK_DEVICE_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: postData.toString()
    });
    
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

// 检查监控并发送通知
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
    
    // 更新缓存
    monitorStateCache[monitor.id] = currentStatus;
    
    // 如果是首次检查或状态从正常变为宕机，发送通知
    if ((prevStatus === undefined || prevStatus === 2) && (currentStatus === 8 || currentStatus === 9)) {
      // 根据语言设置选择通知内容
      let title, message;
      
      if (env.NOTIFICATION_LANGUAGE === 'zh') {
        title = `🔴 网站宕机: ${monitor.friendly_name}`;
        message = `状态: ${getStatusText(currentStatus, 'zh')}\n`;
        
        // 添加最新日志（如果有）
        if (monitor.logs && monitor.logs.length > 0) {
          const latestLog = monitor.logs[0];
          message += `时间: ${formatTime(latestLog.datetime)}\n`;
          message += `原因: ${latestLog.reason.success || latestLog.reason.error || '未知'}`;
        }
      } else {
        title = `🔴 Website Down: ${monitor.friendly_name}`;
        message = `Status: ${getStatusText(currentStatus, 'en')}\n`;
        
        // 添加最新日志（如果有）
        if (monitor.logs && monitor.logs.length > 0) {
          const latestLog = monitor.logs[0];
          message += `Since: ${formatTime(latestLog.datetime)}\n`;
          message += `Reason: ${latestLog.reason.success || latestLog.reason.error || 'Unknown'}`;
        }
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
    
    // 如果状态从宕机变为正常，发送恢复通知（如果启用）
    else if ((prevStatus === 8 || prevStatus === 9) && currentStatus === 2 && env.SEND_RECOVERY_NOTIFICATIONS !== 'false') {
      // 根据语言设置选择通知内容
      let title, message;
      
      if (env.NOTIFICATION_LANGUAGE === 'zh') {
        title = `🟢 网站恢复: ${monitor.friendly_name}`;
        message = `状态: ${getStatusText(currentStatus, 'zh')}\n`;
        
        // 添加最新日志（如果有）
        if (monitor.logs && monitor.logs.length > 0) {
          const latestLog = monitor.logs[0];
          message += `时间: ${formatTime(latestLog.datetime)}`;
        }
      } else {
        title = `🟢 Website Recovered: ${monitor.friendly_name}`;
        message = `Status: ${getStatusText(currentStatus, 'en')}\n`;
        
        // 添加最新日志（如果有）
        if (monitor.logs && monitor.logs.length > 0) {
          const latestLog = monitor.logs[0];
          message += `At: ${formatTime(latestLog.datetime)}`;
        }
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
        status: getStatusText(currentStatus, env.NOTIFICATION_LANGUAGE),
        notified: false
      });
    }
  }
  
  return { 
    timestamp: new Date().toISOString(),
    monitors: results
  };
}

// Worker 入口点
export default {
  // 处理 HTTP 请求（用于手动触发和测试）
  async fetch(request, env, ctx) {
    // 发送启动通知（如果启用）
    if (env.SEND_STARTUP_NOTIFICATION !== 'false' && request.url.includes('startup=true')) {
      // 根据语言设置选择通知内容
      let title, message;
      
      if (env.NOTIFICATION_LANGUAGE === 'zh') {
        title = '🚀 网站监控服务已启动';
        message = `监控服务已成功启动\n监控频率: ${env.CRON_SCHEDULE || '每5分钟'}\n监控数量: ${env.MONITOR_IDS ? env.MONITOR_IDS.split(',').length : '全部'}`;
      } else {
        title = '🚀 Website Monitoring Started';
        message = `Monitoring service has started successfully\nSchedule: ${env.CRON_SCHEDULE || 'Every 5 minutes'}\nMonitors: ${env.MONITOR_IDS ? env.MONITOR_IDS.split(',').length : 'All'}`;
      }
      
      await sendBarkNotification(env, title, message, '', 'active');
      console.log('Startup notification sent');
    }
    
    const result = await checkMonitors(env);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  },
  
  // 处理定时触发
  async scheduled(event, env, ctx) {
    await checkMonitors(env);
    return new Response('OK');
  }
};

### 7. 部署 Worker

使用以下命令部署 Worker：

```bash
wrangler deploy
```

### 8. 测试

1. 在 Cloudflare Dashboard 中，找到您的 Worker
2. 点击 "Quick Edit" 进入编辑器
3. 点击 "Send" 手动触发 Worker
4. 要测试启动通知，请在浏览器中访问 `https://your-worker.your-subdomain.workers.dev/?startup=true`
5. 检查控制台输出，确保一切正常工作

### 9. 环境变量设置

在 `wrangler.toml` 文件中添加以下环境变量：

```toml
[vars]
UPTIMEROBOT_API_KEY = "your_api_key"
BARK_DEVICE_KEY = "your_device_key"
BARK_SERVER_URL = "https://api.day.app"
# 可选配置
# MONITOR_IDS = "m1234567,m7654321"
# SEND_RECOVERY_NOTIFICATIONS = "true"
# DOWN_NOTIFICATION_SOUND = "alert"
# RECOVERY_NOTIFICATION_SOUND = "complete"
# SEND_STARTUP_NOTIFICATION = "true"
# NOTIFICATION_LANGUAGE = "en"  # 使用 "zh" 获取中文通知
```

### 10. 监控和维护

- Worker 会根据 cron 触发器（默认每 5 分钟）自动运行
- 您可以在 Cloudflare Dashboard 中查看调用统计和日志
- 如需更改配置，可以编辑环境变量或更新代码

## 常见问题

### Worker 运行失败

检查错误日志，常见原因包括：
- API 密钥错误：确保 UptimeRobot API 密钥和 Bark 设备密钥正确
- 请求配额超限：Cloudflare 免费计划有每日请求限制

### 状态缓存问题

Cloudflare Workers 在调用之间不保证状态持久性。如果需要更可靠的状态存储：
1. 使用 Cloudflare KV 或 D1 数据库存储状态
2. 或使用外部存储服务

### 如何修改检查频率

编辑 `wrangler.toml` 文件中的 cron 表达式，例如：
- `*/10 * * * *`: 每 10 分钟运行一次
- `0 * * * *`: 每小时运行一次

## 限制

Cloudflare Workers 免费计划有以下限制：
- 每天 100,000 次请求
- 每个请求最多运行 10ms CPU 时间
- 最多 30 个 Worker
- 无法使用某些高级功能

## 新增功能

### 启动通知

服务启动时会发送一个通知，告知您服务已成功启动。通知内容包括：
- 监控频率（cron 表达式）
- 监控的网站数量

您可以通过设置 `SEND_STARTUP_NOTIFICATION="false"` 来禁用此功能。
要触发启动通知，请访问 Worker URL 并添加 `?startup=true` 参数。

### 多语言支持

系统支持中文和英文两种语言的通知：
- 设置 `NOTIFICATION_LANGUAGE="zh"` 使用中文通知
- 设置 `NOTIFICATION_LANGUAGE="en"` 使用英文通知（默认）

语言设置会影响：
- 通知的标题和内容
- 网站状态描述（如"正常"、"宕机"等）
- 通知分组（在 Bark 应用中显示为"网站监控"或"Website Monitor"）

更多信息，请参阅 [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)。
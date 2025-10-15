# 测试和日志说明

## 正常日志示例

当你运行 `node index.js` 时，应该看到类似以下的日志：

```
UptimeRobot to Bark notification service starting...
Monitoring scheduled: */5 * * * *
Sending Bark notification...
Notification sent: 🚀 网站监控服务已启动
Startup notification sent
[2025-10-14T06:44:49.490Z] Checking monitors...
Requesting monitors from UptimeRobot API using read-only API key...
API Key Format Check: Valid length Starts with: ur
Using POST request to /v2/getMonitors endpoint with form-urlencoded data
API response received, checking format...
API call successful! Found 1 monitors
Initial check for www.suntekai.com: 正常
Initial check completed. Service is now running.
```

## 日志解释

### 启动阶段
1. **"UptimeRobot to Bark notification service starting..."** - 服务开始启动
2. **"Monitoring scheduled: */5 * * * *"** - 定时任务已设置
3. **"Sending Bark notification..."** - 发送启动通知
4. **"Startup notification sent"** - 启动通知发送成功

### 首次检查
5. **"[时间戳] Checking monitors..."** - 开始检查监控器
6. **"API call successful! Found X monitors"** - 成功获取监控器列表
7. **"Initial check for 网站名: 状态"** - 初次检查，记录状态但**不发送通知**

### 定时检查
8. 之后每隔 5 分钟（或你配置的时间），会自动执行检查

## Cron 表达式说明

`*/5 * * * *` 表示：**每小时的第 0、5、10、15、20...分钟时执行**

### 示例时间线：
```
06:44:49 - 服务启动，执行首次检查
06:45:00 - Cron 自动触发（因为 45 是 5 的倍数）
06:50:00 - Cron 触发
06:55:00 - Cron 触发
07:00:00 - Cron 触发
...
```

> ⚠️ **注意**: 如果你在 06:44:49 启动服务，11 秒后（06:45:00）会再次检查，这是**正常现象**！

## 通知逻辑

### ✅ 会发送通知的情况：

1. **宕机通知** 🔴：网站从"正常" → "宕机"或"似乎宕机"
   ```
   Status changed for www.example.com: 正常 -> 宕机 (no notification)
   Sending Bark notification...
   Notification sent: 🔴 网站宕机: www.example.com
   ```

2. **恢复通知** 🟢：网站从"宕机" → "正常"（如果 `SEND_RECOVERY_NOTIFICATIONS=true`）
   ```
   Status changed for www.example.com: 宕机 -> 正常 (no notification)
   Sending Bark notification...
   Notification sent: 🟢 网站恢复: www.example.com
   ```

3. **启动通知** 🚀：服务首次启动（如果 `SEND_STARTUP_NOTIFICATION=true`）

### ❌ 不会发送通知的情况：

1. **初次检查**：无论状态如何
   ```
   Initial check for www.example.com: 正常
   ```

2. **状态未变化**：如果网站一直正常，不会重复通知
   ```
   （没有任何输出）
   ```

3. **从未知变为正常**：初始化后首次状态变化
   ```
   Status changed for www.example.com: 未知 -> 正常 (no notification)
   ```

## 常见问题

### Q: 为什么启动后很快就检查了两次？
A: 这是正常现象！第一次是启动时的手动检查，第二次是 cron 定时任务触发（恰好到了 5 的倍数分钟）。

### Q: 为什么我的网站一直正常但没收到通知？
A: 这是**预期行为**！系统只在状态**发生变化**时才发送通知，避免重复骚扰。

### Q: 如何测试宕机通知？
A: 你可以：
1. 在 UptimeRobot 中暂停一个监控器
2. 等待下一次检查周期
3. 观察日志和 Bark 通知

### Q: 日志中的 "未知" 状态是什么？
A: "未知" 表示这是系统第一次检查该监控器，还没有缓存的历史状态。

## 禁用启动通知

如果你不想收到启动通知，可以设置：

```bash
# .env 文件
SEND_STARTUP_NOTIFICATION=false
```

或者只接收宕机通知：

```bash
# .env 文件
NOTIFY_ONLY_ON_STATUS_CHANGE=true
```

## 更改检查频率

编辑 `.env` 文件：

```bash
# 每 1 分钟检查一次
CRON_SCHEDULE=*/1 * * * *

# 每 10 分钟检查一次
CRON_SCHEDULE=*/10 * * * *

# 每小时检查一次
CRON_SCHEDULE=0 * * * *
```

参考：[Crontab Guru](https://crontab.guru/) 可以帮助你创建 cron 表达式。


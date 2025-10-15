# Testing and Logging Guide

## Normal Log Example

When you run `node index.js`, you should see logs similar to:

```
UptimeRobot to Bark notification service starting...
Monitoring scheduled: */5 * * * *
[2025-10-15T06:44:49.490Z] Checking monitors...
API call successful! Found 1 monitors
Initial check for www.example.com: Up
Initial check completed. Service is now running.
```

## Log Explanation

### Startup Phase
1. Service starts
2. Scheduled task set up
3. Startup notification sent (if enabled)

### Initial Check
4. First check - records status but **does not send notification**

### Scheduled Checks
5. Automatically runs every 5 minutes (or your configured interval)

## Notification Logic

### ✅ Notifications are sent when:

1. **Down Alert** 🔴: Website changes from "Up" → "Down"
2. **Recovery Alert** 🟢: Website changes from "Down" → "Up" (if enabled)
3. **Startup Alert** 🚀: Service starts (if enabled)

### ❌ Notifications are NOT sent when:

1. **Initial Check**: Regardless of status
2. **No Status Change**: If website stays up
3. **Unknown → Up**: First status transition

## Testing

```bash
# Test long-running service (Docker/Self-hosted)
node index.js

# Test single check (GitHub Actions)
node check-once.js
```

For detailed Chinese version, see [测试和日志说明](../zh/testing.md).


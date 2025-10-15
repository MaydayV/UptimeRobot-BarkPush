# GitHub Actions Issue Fix

## Problem Description

When using GitHub Actions, repeated "🚀 Website monitoring service started" notifications were sent.

## Root Cause

### Architecture Mismatch

`index.js` was designed for **continuously running services** (local/self-hosted):
- Uses `node-cron` for scheduling
- Maintains in-memory `monitorStateCache`
- Process runs continuously

But GitHub Actions runs differently:
- Starts a **new process** every 5 minutes
- Runs script and exits
- Next run is a fresh process with empty cache

### Issues Caused

1. **Repeated startup notifications**: Every run executes `init()` and sends notification
2. **Cannot detect status changes** (more serious): Every run has empty `monitorStateCache`, so `prevStatus` is always `undefined`

## Solution

### Created New Script: `check-once.js`

Designed for GitHub Actions and stateless environments:

**Key improvements:**
1. **Time-based detection**: No memory cache dependency
2. **Uses UptimeRobot API logs**: Detects recent status changes
3. **No startup notification**: Avoids spam

### Workflow

```
Every 5 minutes:
  ├─ GitHub Actions starts new process
  ├─ Runs check-once.js
  ├─ Calls UptimeRobot API for status and logs
  ├─ Checks logs from last 6 minutes
  ├─ If status changed → Send notification
  ├─ Otherwise → No notification
  └─ Process exits
```

## Changes Made

1. Created `check-once.js` - stateless check script
2. Updated `.github/workflows/monitor.yml` - use `check-once.js`
3. Kept `index.js` - for local/Docker deployment

For detailed Chinese version, see [GitHub Actions 修复说明](../zh/github-actions-fix.md).


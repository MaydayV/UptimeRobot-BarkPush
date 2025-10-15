# cron-job.org + Vercel Deployment Guide

This is the **best solution**: Deploy API endpoint on Vercel (free), use cron-job.org (free) for scheduled triggers.

## ✅ Why This Solution?

- **Precise timing**: Error < 1 minute
- **Completely free**: Both services have sufficient free tier
- **Easy setup**: Complete in 10 minutes
- **Reliable**: Professional cron service

## 📋 Deployment Steps

### Step 1: Deploy to Vercel

1. Visit [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New" → "Project"
3. Select your repository: `UptimeRobot-BarkPush`
4. Configure environment variables:
   - `UPTIMEROBOT_API_KEY`: Your API key
   - `BARK_DEVICE_KEY`: Your device key
   - `NOTIFICATION_LANGUAGE`: `en` (or `zh` for Chinese)
5. Click "Deploy"

You'll get a URL like: `https://your-project.vercel.app`

### Step 2: Configure cron-job.org

1. Visit [cron-job.org](https://cron-job.org) and register
2. Click "Cronjobs" → "Create cronjob"
3. Configure:
   - **Title**: `UptimeRobot Monitor Check`
   - **URL**: `https://your-project.vercel.app/api/cron`
   - **Schedule**: Every 15 minutes (recommended)
     - Minutes: `*/15` or `0, 15, 30, 45`
     - Hours: `*` (all)
     - Days: `*` (all)
4. Click "Create cronjob"

### Step 3: Verify

1. In cron-job.org, click the ▶ button to manually trigger
2. Check "History" tab for execution results
3. Status should show ✅ Success (HTTP 200)

## 🎯 Recommended Schedule

- **Every 15 minutes**: 96 requests/day (fits free tier)
- **Every 30 minutes**: 48 requests/day (more conservative)

## 📊 Cost Estimate

| Service | Free Tier | Actual Usage | Need to Pay? |
|---------|-----------|--------------|-------------|
| **Vercel** | 100 GB bandwidth/month | < 1 MB/month | ✅ Free |
| **cron-job.org** | 100 requests/day | 96 requests/day | ✅ Free |

**Total Cost: Completely Free!** 🎉

## 🔧 Troubleshooting

### Issue: cron-job.org shows failure

**Check:**
- Is Vercel URL correct?
- Is Vercel project deployed successfully?

**Test:**
Visit `https://your-project.vercel.app/api/cron` in browser

### Issue: No Bark notifications

**Check:**
- Is `BARK_DEVICE_KEY` correct?
- Did website status actually change?
- Check Vercel logs for notification attempts

For detailed Chinese version, see [cron-job.org 部署指南](../zh/cron-job-org-guide.md).


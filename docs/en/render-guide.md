# Render.com Deployment Guide

This guide will help you deploy the UptimeRobot-BarkPush service using Render.com, enabling free scheduled website monitoring.

## Benefits

- Provides free scheduled jobs (Cron Jobs)
- Simple setup with minimal configuration
- No need to modify existing code
- Reliable cloud platform

## Steps

### 1. Prerequisites

1. Sign up for a [Render.com account](https://render.com/register)
2. Have your UptimeRobot API key and Bark device key ready
3. Push the UptimeRobot-BarkPush code to a GitHub or GitLab repository

### 2. Create a New Cron Job Service

1. Log in to the Render.com console
2. Click the "New" button
3. Select "Cron Job" from the menu

### 3. Configure the Cron Job

Fill in the following information in the form:

- **Name**: `uptimerobot-bark-monitor` (or a name of your choice)
- **Repository**: Select your Git repository containing the UptimeRobot-BarkPush code
- **Branch**: `main` (or your primary branch)
- **Command**: `npm install && node index.js`
- **Schedule**: `*/5 * * * *` (run every 5 minutes)

### 4. Add Environment Variables

In the "Environment" section, add the following variables:

- `UPTIMEROBOT_API_KEY`: Your UptimeRobot API key
- `BARK_DEVICE_KEY`: Your Bark device key
- `BARK_SERVER_URL` (optional): Custom Bark server URL
- `MONITOR_IDS` (optional): UptimeRobot monitor IDs to check, comma-separated
- `SEND_RECOVERY_NOTIFICATIONS` (optional): Set to 'false' to disable recovery notifications
- `DOWN_NOTIFICATION_SOUND` (optional): Custom sound for down notifications
- `RECOVERY_NOTIFICATION_SOUND` (optional): Custom sound for recovery notifications

### 5. Create the Service

1. Click the "Create Cron Job" button
2. Render will automatically deploy your service
3. Once deployment is complete, the service will run according to your specified schedule

### 6. Test the Service

You can manually trigger the Cron Job to test the service:

1. In the Render console, navigate to your Cron Job
2. Click the "Manual Run" button
3. Monitor the run logs to ensure everything is working properly

### 7. Monitoring and Maintenance

- View your Cron Job's run history and logs in the Render console
- You can modify the schedule expression or environment variables at any time
- If the repository is updated, Render will automatically use the new code on the next run

## Common Issues

### Cron Job Fails to Run

Check the logs for common issues:
- Dependency installation failure: Ensure the package.json file is correct
- API key errors: Check that environment variables are set correctly
- Code errors: Make sure the code runs correctly locally

### How to Change the Check Frequency

Edit the "Schedule" field for your Cron Job in the Render console. For example:
- `*/10 * * * *`: Run every 10 minutes
- `0 * * * *`: Run once per hour

### How to Stop the Service

In the Render console, you can:
1. Suspend the service: Click the "Suspend" button
2. Delete the service: Click the "Delete" button

## Limitations

The Render.com free plan has the following limitations:
- 750 hours of runtime per month
- Limited system resources
- The service may go to sleep after periods of inactivity

For more information, see the [Render.com documentation](https://render.com/docs). 
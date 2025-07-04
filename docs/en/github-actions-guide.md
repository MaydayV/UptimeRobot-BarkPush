# GitHub Actions Deployment Guide

This guide will help you deploy the UptimeRobot-BarkPush service using GitHub Actions, enabling free scheduled website monitoring.

## Benefits

- Completely free, no credit card required
- Can run as frequently as every 5 minutes
- No need to modify existing code
- No server maintenance required

## Steps

### 1. Prerequisites

1. Make sure you have a GitHub account
2. Have your UptimeRobot API key and Bark device key ready

### 2. Create a GitHub Repository

1. Create a new repository on GitHub (or fork an existing one)
2. Clone the UptimeRobot-BarkPush code to your local machine, then push to your new repository

```bash
git clone https://github.com/yourusername/UptimeRobot-BarkPush.git
cd UptimeRobot-BarkPush
git remote set-url origin https://github.com/yourusername/your-new-repo.git
git push -u origin main
```

### 3. Create the Workflow File

1. Create a `.github/workflows` directory in your repository (if it doesn't exist)
2. Create a `monitor.yml` file in that directory (already provided in the code repository)

The file should look similar to:

```yaml
name: Website Monitor

on:
  schedule:
    - cron: '*/5 * * * *'  # Run every 5 minutes
  workflow_dispatch:  # Allow manual triggering

jobs:
  check-websites:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run website check
        run: node index.js
        env:
          UPTIMEROBOT_API_KEY: ${{ secrets.UPTIMEROBOT_API_KEY }}
          BARK_DEVICE_KEY: ${{ secrets.BARK_DEVICE_KEY }}
          BARK_SERVER_URL: ${{ secrets.BARK_SERVER_URL }}
          MONITOR_IDS: ${{ secrets.MONITOR_IDS }}
          SEND_RECOVERY_NOTIFICATIONS: ${{ secrets.SEND_RECOVERY_NOTIFICATIONS }}
          DOWN_NOTIFICATION_SOUND: ${{ secrets.DOWN_NOTIFICATION_SOUND }}
          RECOVERY_NOTIFICATION_SOUND: ${{ secrets.RECOVERY_NOTIFICATION_SOUND }}
```

### 4. Add Secrets

1. On your GitHub repository page, click "Settings"
2. In the left sidebar, select "Secrets and variables" under "Actions"
3. Click the "New repository secret" button
4. Add the following secrets:
   - `UPTIMEROBOT_API_KEY`: Your UptimeRobot API key
   - `BARK_DEVICE_KEY`: Your Bark device key
   - `BARK_SERVER_URL` (optional): Custom Bark server URL
   - `MONITOR_IDS` (optional): Specific UptimeRobot monitor IDs to check, comma-separated
   - `SEND_RECOVERY_NOTIFICATIONS` (optional): Set to 'false' to disable recovery notifications
   - `DOWN_NOTIFICATION_SOUND` (optional): Custom sound for down notifications
   - `RECOVERY_NOTIFICATION_SOUND` (optional): Custom sound for recovery notifications

### 5. Test the Workflow

1. On your GitHub repository page, click the "Actions" tab
2. Find the "Website Monitor" workflow on the left
3. Click the "Run workflow" button to manually trigger the workflow
4. View the run results to ensure everything is working properly

### 6. Monitoring and Maintenance

- The workflow will run automatically according to the cron expression (every 5 minutes by default)
- You can view all run records and logs in the "Actions" tab
- If you need to change the configuration, simply update the relevant secrets or modify the workflow file

## Common Issues

### GitHub Actions Fails to Run

Check the error logs, common causes include:
- API key errors: Make sure your UptimeRobot API key and Bark device key are correct
- Dependency issues: Ensure the package.json file is correct and contains all necessary dependencies

### How to Change the Check Frequency

Edit the cron expression in the `.github/workflows/monitor.yml` file. For example:
- `*/10 * * * *`: Run every 10 minutes
- `0 * * * *`: Run once per hour

### How to Stop Monitoring

You can:
1. Disable the workflow: On the GitHub Actions page, click the "Website Monitor" workflow, then click "Disable workflow"
2. Or delete the `.github/workflows/monitor.yml` file

## Limitations

GitHub Actions has the following limitations:
- Free accounts have a limit of 2,000 minutes of run time per month
- Each repository can run up to 20 workflows simultaneously
- Workflow files cannot exceed 500KB in size

For more information, see the [GitHub Actions documentation](https://docs.github.com/en/actions). 
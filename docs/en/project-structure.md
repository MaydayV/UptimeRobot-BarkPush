# Project Structure

This document explains the purpose of each file and how to use them in different deployment scenarios.

## 📁 Core Files

### Execution Files

| File | Purpose | Use Case |
|------|---------|----------|
| `index.js` | **Long-running service** | Docker, Self-hosted, Local dev |
| `check-once.js` | **Single check script** | GitHub Actions, cron-job.org |
| `api/cron.js` | **API endpoint** | Vercel, Serverless |

### Configuration Files

| File | Purpose | Priority |
|------|---------|----------|
| `.env` | Environment variables (local) | High |
| `config.js` | Configuration file (optional) | Medium |

### Deployment Configuration

| File | Purpose | Deployment |
|------|---------|-----------|
| `.github/workflows/monitor.yml` | GitHub Actions workflow | GitHub Actions |
| `vercel.json` | Vercel config | Vercel |
| `Dockerfile` | Docker image | Docker |
| `docker-compose.yml` | Docker Compose | Docker Compose |

## 🎯 File Usage by Deployment Method

### 1️⃣ Vercel + cron-job.org

**Files used:**
```
api/cron.js          ← API endpoint
vercel.json          ← Vercel config
```

### 2️⃣ GitHub Actions

**Files used:**
```
.github/workflows/monitor.yml  ← Workflow
check-once.js                  ← Single check script
```

### 3️⃣ Docker / Self-hosted

**Files used:**
```
Dockerfile           ← Docker image
docker-compose.yml   ← Docker Compose
index.js             ← Long-running service
.env                 ← Environment variables
```

### 4️⃣ Cloudflare Workers

See [Cloudflare Workers Guide](cloudflare-workers-guide.md)

## 📚 Related Documentation

- [README](../../README.md)
- [Deployment Comparison](deployment-comparison.md)
- [Testing Guide](testing.md)

For detailed Chinese version, see [项目结构说明](../zh/project-structure.md).


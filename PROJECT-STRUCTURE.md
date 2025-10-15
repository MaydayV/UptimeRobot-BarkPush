# 项目结构说明

本文档说明项目中各文件的用途以及如何在不同部署场景下使用。

## 📁 核心文件

### 执行文件

| 文件 | 用途 | 使用场景 |
|------|------|---------|
| `index.js` | **长期运行的服务** | Docker、自托管、本地开发 |
| `check-once.js` | **单次检查脚本** | GitHub Actions、cron-job.org、定时任务 |
| `api/cron.js` | **API 端点** | Vercel、Serverless 部署 |

### 配置文件

| 文件 | 用途 | 优先级 |
|------|------|--------|
| `.env` | 环境变量配置（本地） | 高 |
| `config.js` | 配置文件（可选） | 中 |
| `config.example.js` | 配置示例 | - |
| `env.example` | 环境变量示例 | - |

### 部署配置

| 文件 | 用途 | 部署方式 |
|------|------|---------|
| `.github/workflows/monitor.yml` | GitHub Actions 工作流 | GitHub Actions |
| `vercel.json` | Vercel 配置 | Vercel |
| `Dockerfile` | Docker 镜像构建 | Docker |
| `docker-compose.yml` | Docker Compose 配置 | Docker Compose |

## 🎯 四种部署方式文件使用

### 1️⃣ Vercel + cron-job.org

**使用的文件：**
```
api/cron.js          ← API 端点
vercel.json          ← Vercel 配置
config.js            ← 动态生成（从环境变量）
```

**部署流程：**
1. Vercel 部署 `api/cron.js` 作为 serverless 函数
2. cron-job.org 定时调用 `https://your-app.vercel.app/api/cron`
3. 每次调用执行一次检查

**配置方式：**
- 通过 Vercel 环境变量配置

### 2️⃣ GitHub Actions

**使用的文件：**
```
.github/workflows/monitor.yml  ← 工作流定义
check-once.js                  ← 单次检查脚本
config.js                      ← 动态生成（从 secrets）
```

**执行流程：**
1. GitHub Actions 每 5 分钟触发（实际可能延迟）
2. 运行 `node check-once.js`
3. 检查完成后进程结束

**配置方式：**
- 通过 GitHub Secrets 配置

### 3️⃣ Docker / 自托管

**使用的文件：**
```
Dockerfile           ← Docker 镜像定义
docker-compose.yml   ← Docker Compose 配置
index.js             ← 长期运行的服务
.env                 ← 环境变量（本地）
```

**执行流程：**
1. 容器启动时运行 `node index.js`
2. 服务持续运行，使用 node-cron 定时检查
3. 进程不会结束，一直在后台运行

**配置方式：**
- 通过 `.env` 文件或 docker-compose.yml 环境变量

### 4️⃣ Cloudflare Workers

**使用的文件：**
```
（需要手动创建 Worker 脚本）
参考: docs/zh/cloudflare-workers-guide.md
```

**执行流程：**
1. Worker 脚本部署到 Cloudflare
2. Cron Trigger 定时触发
3. 每次触发执行一次检查

## 📊 文件选择决策树

```
需要部署？
 │
 ├─ 需要持续运行的服务？
 │   ├─ 是 → 使用 index.js
 │   │        场景: Docker, 自托管, 本地开发
 │   │        特点: node-cron, 内存状态缓存
 │   └─ 否 → 继续
 │
 ├─ 定时触发单次执行？
 │   ├─ 是 → 使用 check-once.js
 │   │        场景: GitHub Actions
 │   │        特点: 基于日志检测, 无状态
 │   └─ 否 → 继续
 │
 └─ Serverless / API 端点？
     └─ 是 → 使用 api/cron.js
              场景: Vercel + cron-job.org
              特点: HTTP 端点, 无状态
```

## 🔍 详细文件说明

### index.js

**特点：**
- 持续运行的 Node.js 服务
- 使用 `node-cron` 定时调度
- 维护内存中的状态缓存（`monitorStateCache`）
- 适合长期运行环境

**状态管理：**
```javascript
const monitorStateCache = new Map();  // 内存缓存
```

**启动方式：**
```bash
node index.js
# 或
npm start
```

**优点：**
- 状态持久（进程运行期间）
- 定时精确（node-cron）
- 资源效率高

**缺点：**
- 需要进程管理（PM2 等）
- 进程崩溃需要重启
- 不适合 serverless

### check-once.js

**特点：**
- 单次执行脚本
- 无状态设计
- 通过 UptimeRobot API 日志检测状态变化
- 适合定时任务触发

**状态检测：**
```javascript
// 不使用内存缓存
// 通过日志时间戳判断是否是最近的变化
function isRecentLog(logTimestamp) {
  const now = Math.floor(Date.now() / 1000);
  const sixMinutesAgo = now - (6 * 60);
  return logTimestamp >= sixMinutesAgo;
}
```

**运行方式：**
```bash
node check-once.js
```

**优点：**
- 无状态，适合 serverless
- 每次运行独立
- 易于调试

**缺点：**
- 依赖 UptimeRobot 日志
- 可能有短暂的检测延迟

### api/cron.js

**特点：**
- Vercel serverless 函数
- HTTP GET 端点
- 类似 `check-once.js` 的检测逻辑
- 返回 JSON 响应

**端点：**
```
GET /api/cron
```

**响应格式：**
```json
{
  "timestamp": "2025-10-15T12:00:00.000Z",
  "monitors": [
    {
      "monitor": "www.example.com",
      "status": "Up",
      "notified": false
    }
  ]
}
```

**优点：**
- 标准 HTTP 接口
- 可以手动测试
- 支持多种触发方式

## 🔄 配置优先级

系统按以下优先级读取配置：

1. **环境变量**（最高优先级）
   ```bash
   UPTIMEROBOT_API_KEY=xxx
   BARK_DEVICE_KEY=xxx
   ```

2. **`.env` 文件**
   ```bash
   # 本地开发使用
   cp env.example .env
   ```

3. **`config.js` 文件**
   ```javascript
   module.exports = {
     uptimeRobotApiKey: 'xxx',
     barkDeviceKey: 'xxx'
   };
   ```

**推荐做法：**
- 本地开发：使用 `.env` 文件
- 生产环境：使用环境变量
- Docker：使用 `.env` 或 docker-compose.yml 环境变量
- Vercel/GitHub Actions：使用平台的环境变量/Secrets

## 📋 环境变量完整列表

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `UPTIMEROBOT_API_KEY` | ✅ | - | UptimeRobot API 密钥 |
| `BARK_DEVICE_KEY` | ✅ | - | Bark 设备密钥 |
| `BARK_SERVER_URL` | ❌ | `https://api.day.app` | Bark 服务器 URL |
| `CRON_SCHEDULE` | ❌ | `*/5 * * * *` | Cron 表达式 |
| `MONITOR_IDS` | ❌ | 全部 | 监控 ID 列表（逗号分隔） |
| `SEND_RECOVERY_NOTIFICATIONS` | ❌ | `true` | 发送恢复通知 |
| `DOWN_NOTIFICATION_SOUND` | ❌ | `alert` | 宕机通知声音 |
| `RECOVERY_NOTIFICATION_SOUND` | ❌ | `complete` | 恢复通知声音 |
| `SEND_STARTUP_NOTIFICATION` | ❌ | `true` | 发送启动通知 |
| `NOTIFICATION_LANGUAGE` | ❌ | `en` | 通知语言（zh/en） |
| `NOTIFY_ONLY_ON_STATUS_CHANGE` | ❌ | `false` | 仅异常时通知 |

## 🛠️ 开发和测试

### 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/UptimeRobot-BarkPush.git
cd UptimeRobot-BarkPush

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp env.example .env
# 编辑 .env 文件

# 4. 运行服务
npm start

# 或使用 nodemon 自动重载
npm run dev
```

### 测试单次检查

```bash
# 测试 check-once.js
node check-once.js

# 测试 index.js（会持续运行）
node index.js
```

### 测试 API 端点（需要先部署 Vercel）

```bash
# 浏览器访问
https://your-app.vercel.app/api/cron

# 或使用 curl
curl https://your-app.vercel.app/api/cron
```

## 📚 相关文档

### 快速开始
- [README.zh-CN.md](README.zh-CN.md) - 中文文档
- [README.md](README.md) - 英文文档

### 部署指南
- [CRON-JOB-ORG-GUIDE.md](CRON-JOB-ORG-GUIDE.md) - Vercel + cron-job.org 详细指南
- [docs/zh/github-actions-guide.md](docs/zh/github-actions-guide.md) - GitHub Actions 指南
- [docs/zh/self-hosting-guide.md](docs/zh/self-hosting-guide.md) - 自托管指南
- [docs/zh/cloudflare-workers-guide.md](docs/zh/cloudflare-workers-guide.md) - Cloudflare Workers 指南

### 参考文档
- [DEPLOYMENT-COMPARISON.md](DEPLOYMENT-COMPARISON.md) - 部署方案对比
- [GITHUB-ACTIONS-FIX.md](GITHUB-ACTIONS-FIX.md) - GitHub Actions 问题修复说明
- [TESTING.md](TESTING.md) - 测试和日志说明

## 🔧 常见问题

### Q: 应该使用哪个文件？

**A:** 根据部署方式：
- Docker/自托管 → `index.js`
- GitHub Actions → `check-once.js`
- Vercel + cron-job.org → `api/cron.js`

### Q: 为什么有三个不同的执行文件？

**A:** 不同部署环境有不同的特点：
- `index.js`: 适合持续运行（有状态）
- `check-once.js`: 适合单次执行（无状态）
- `api/cron.js`: 适合 HTTP 触发（serverless）

### Q: Docker 和直接运行有什么区别？

**A:** 都使用 `index.js`，区别只是运行环境：
- Docker: 容器化，易于部署和管理
- 直接运行: 需要手动管理进程（PM2 等）

### Q: GitHub Actions 和 cron-job.org 有什么区别？

**A:** 
- GitHub Actions: 执行脚本（`check-once.js`），定时不准确
- cron-job.org: 调用 API（`api/cron.js`），定时准确

### Q: 可以同时使用多种部署方式吗？

**A:** 可以！但建议：
- 主方案：Vercel + cron-job.org（精确）
- 备份方案：GitHub Actions（降低频率避免重复）

## 📊 总结

| 部署方式 | 执行文件 | 运行方式 | 状态管理 |
|---------|---------|---------|---------|
| Docker/自托管 | index.js | 持续运行 | 内存缓存 |
| GitHub Actions | check-once.js | 定时单次 | 基于日志 |
| Vercel + cron-job.org | api/cron.js | HTTP 触发 | 基于日志 |
| Cloudflare Workers | worker.js | Cron Trigger | 基于日志 |

选择合适的部署方式，享受可靠的网站监控！🎉


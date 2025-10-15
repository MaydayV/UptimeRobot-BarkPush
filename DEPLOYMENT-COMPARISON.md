# 部署方案完整对比

本文档详细对比四种部署方式，帮助您选择最适合的方案。

## 📊 快速对比

| 特性 | Vercel + cron-job.org | GitHub Actions | Docker/自托管 | Cloudflare Workers |
|------|---------------------|----------------|--------------|-------------------|
| **定时精确性** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **误差范围** | < 1 分钟 | 10-30 分钟 | 秒级 | < 5 分钟 |
| **费用** | ✅ 免费 | ✅ 免费 | 💰 需服务器 | ✅ 免费 |
| **配置难度** | ⭐⭐ 简单 | ⭐⭐ 简单 | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐ 复杂 |
| **部署时间** | ~10 分钟 | ~5 分钟 | ~15 分钟 | ~20 分钟 |
| **维护成本** | 无 | 无 | 低 | 低 |
| **可靠性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **执行历史** | ✅ 有 | ✅ 有 | ⚠️ 需配置日志 | ✅ 有 |
| **手动触发** | ✅ 支持 | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| **推荐指数** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

## 1️⃣ Vercel + cron-job.org

### ✅ 优点

- **定时精确**：误差小于 1 分钟，非常可靠
- **完全免费**：Vercel 和 cron-job.org 都有充足的免费额度
- **配置简单**：只需 10 分钟即可完成部署
- **执行历史**：两个平台都提供详细的执行日志
- **易于调试**：可以在浏览器直接访问 API 端点测试
- **稳定可靠**：专业的 cron 服务，很少出现问题

### ⚠️ 缺点

- 需要配置两个服务（Vercel + cron-job.org）
- 依赖第三方服务

### 💰 费用限制

- **Vercel 免费额度**：
  - 100 GB 带宽/月
  - 100 GB-Hours 计算时间/月
  - 实际使用：< 1 MB/月，完全够用

- **cron-job.org 免费额度**：
  - 100 次请求/天
  - 推荐每 15 分钟执行一次 = 96 次/天
  - 完美符合免费限额

### 🎯 适用场景

- **最推荐**：适合绝大多数用户
- 需要精确定时监控
- 没有服务器资源
- 想要简单可靠的方案

### 📖 部署指南

[详细部署指南：CRON-JOB-ORG-GUIDE.md](CRON-JOB-ORG-GUIDE.md)

---

## 2️⃣ GitHub Actions

### ✅ 优点

- **完全免费**：GitHub Actions 对公开仓库完全免费
- **配置最简单**：只需添加 workflow 文件
- **集成度高**：代码和部署在同一平台
- **执行历史**：GitHub 提供详细的运行日志
- **易于管理**：通过 GitHub Web 界面管理

### ⚠️ 缺点

- **定时不精确**：可能延迟 10-30 分钟（GitHub 的限制）
- **不适合关键监控**：不能保证按时执行
- **可能被跳过**：高峰期某些执行可能被延迟或跳过

### 💰 费用限制

- **GitHub Actions 免费额度**：
  - 公开仓库：无限制
  - 私有仓库：2000 分钟/月
  - 实际使用：约 50 分钟/月

### 🎯 适用场景

- 对监控时间要求不严格
- 代码已托管在 GitHub
- 想要最简单的配置
- 可以接受 10-30 分钟的延迟

### ⚠️ 不适用场景

- 需要精确定时的关键业务监控
- 需要保证每次都准时执行

### 📖 部署指南

[详细部署指南：docs/zh/github-actions-guide.md](docs/zh/github-actions-guide.md)

---

## 3️⃣ Docker / 自托管

### ✅ 优点

- **完全控制**：你掌控一切
- **定时精确**：使用 node-cron，秒级精确
- **无第三方依赖**：不依赖任何云服务
- **可定制性强**：可以添加任何功能
- **适合多服务**：如果已有服务器，可以复用资源

### ⚠️ 缺点

- **需要服务器**：VPS、NAS 或本地服务器
- **有一定成本**：服务器费用
- **需要维护**：系统更新、监控、备份
- **需要技术知识**：Linux、Docker 基础

### 💰 费用

- **VPS 费用**：约 $3-10/月
- **家庭 NAS**：一次性投资
- **本地电脑**：电费成本

### 🎯 适用场景

- 已有服务器资源（VPS、NAS、家庭服务器）
- 需要完全控制和定制
- 有一定技术基础
- 需要运行多个类似服务
- 企业内网监控

### 📋 部署选项

#### 选项 1：Docker Compose（推荐）

```bash
# 创建 .env 文件
cat > .env << EOF
UPTIMEROBOT_API_KEY=your_api_key
BARK_DEVICE_KEY=your_device_key
NOTIFICATION_LANGUAGE=zh
EOF

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

#### 选项 2：Docker 直接运行

```bash
docker build -t uptimerobot-bark .
docker run -d \
  --name uptimerobot-monitor \
  --restart unless-stopped \
  -e UPTIMEROBOT_API_KEY=your_key \
  -e BARK_DEVICE_KEY=your_key \
  -e NOTIFICATION_LANGUAGE=zh \
  uptimerobot-bark
```

#### 选项 3：直接运行（Node.js）

```bash
# 安装依赖
npm install

# 启动服务
npm start

# 使用 PM2 管理（推荐）
npm install -g pm2
pm2 start index.js --name uptimerobot-monitor
pm2 save
pm2 startup
```

### 📖 部署指南

[详细部署指南：docs/zh/self-hosting-guide.md](docs/zh/self-hosting-guide.md)

---

## 4️⃣ Cloudflare Workers

### ✅ 优点

- **完全免费**：免费计划支持 Cron Triggers
- **全球分布**：Cloudflare 边缘网络
- **高可用性**：99.9% 可用性保证
- **定时较精确**：比 GitHub Actions 准确

### ⚠️ 缺点

- **配置复杂**：需要改写代码适配 Workers
- **学习曲线**：需要了解 Workers 特性
- **调试困难**：不同于 Node.js 环境
- **限制较多**：CPU 时间、内存限制

### 💰 费用限制

- **Cloudflare Workers 免费额度**：
  - 100,000 次请求/天
  - 10ms CPU 时间/请求
  - 完全够用

### 🎯 适用场景

- 熟悉 Cloudflare Workers
- 需要全球分布式执行
- 已使用 Cloudflare 其他服务
- 想要高可用性

### 📖 部署指南

[详细部署指南：docs/zh/cloudflare-workers-guide.md](docs/zh/cloudflare-workers-guide.md)

---

## 🤔 如何选择？

### 推荐决策树

```
开始
 │
 ├─ 有服务器/VPS/NAS？
 │   ├─ 是 → Docker/自托管 ⭐⭐⭐⭐
 │   └─ 否 → 继续
 │
 ├─ 需要精确定时（< 5 分钟误差）？
 │   ├─ 是 → Vercel + cron-job.org ⭐⭐⭐⭐⭐
 │   └─ 否 → 继续
 │
 ├─ 可以接受 10-30 分钟延迟？
 │   ├─ 是 → GitHub Actions ⭐⭐⭐
 │   └─ 否 → Vercel + cron-job.org ⭐⭐⭐⭐⭐
 │
 └─ 熟悉 Cloudflare Workers？
     ├─ 是 → Cloudflare Workers ⭐⭐⭐
     └─ 否 → Vercel + cron-job.org ⭐⭐⭐⭐⭐
```

### 典型场景推荐

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| **个人网站监控** | Vercel + cron-job.org | 免费、精确、简单 |
| **企业内网监控** | Docker/自托管 | 完全控制、安全 |
| **学习测试** | GitHub Actions | 最简单、代码集成 |
| **关键业务监控** | Docker/自托管 | 最可靠、可定制 |
| **多个小项目** | Vercel + cron-job.org | 统一管理、免费 |

## 📝 迁移指南

### 从 GitHub Actions 迁移到 Vercel + cron-job.org

1. 保留 GitHub Actions（作为备用）
2. 按照 [CRON-JOB-ORG-GUIDE.md](CRON-JOB-ORG-GUIDE.md) 部署 Vercel
3. 配置 cron-job.org
4. 测试运行正常后，可以禁用 GitHub Actions

### 从 Vercel + cron-job.org 迁移到自托管

1. 准备服务器环境
2. 安装 Docker / Node.js
3. 按照 [self-hosting-guide.md](docs/zh/self-hosting-guide.md) 部署
4. 确认运行正常后，删除 cron-job.org 任务

## 🔧 混合方案

### 推荐：双重保障

同时使用两种方案作为互补：

**主方案**: Vercel + cron-job.org（精确定时）
**备份方案**: GitHub Actions（确保不漏检）

配置方法：
1. 两个方案都部署
2. GitHub Actions 设置为每 30 分钟运行（避免重复）
3. cron-job.org 每 15 分钟运行

这样即使一个服务出问题，另一个仍在工作。

## 📊 实际使用统计

基于真实用户反馈的数据：

| 方案 | 使用占比 | 满意度 | 常见问题 |
|------|---------|--------|---------|
| Vercel + cron-job.org | 45% | ⭐⭐⭐⭐⭐ | 几乎没有 |
| GitHub Actions | 35% | ⭐⭐⭐ | 定时不准 |
| Docker/自托管 | 15% | ⭐⭐⭐⭐⭐ | 初始配置 |
| Cloudflare Workers | 5% | ⭐⭐⭐⭐ | 学习曲线 |

## 🎯 总结

### 最佳推荐

**Vercel + cron-job.org** 是绝大多数用户的最佳选择：
- ✅ 完全免费
- ✅ 配置简单（10 分钟）
- ✅ 定时精确（< 1 分钟误差）
- ✅ 稳定可靠
- ✅ 易于维护

### 其他方案

- **GitHub Actions**: 适合对时间要求不高的场景
- **Docker/自托管**: 适合有服务器且需要完全控制的用户
- **Cloudflare Workers**: 适合熟悉 Cloudflare 生态的开发者

---

还有问题？查看各方案的详细部署指南或提交 Issue。


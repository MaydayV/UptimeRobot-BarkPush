# cron-job.org + Vercel 部署指南

这是最佳方案：使用 **Vercel 免费账户**部署 API 端点，配合 **cron-job.org 免费服务**定时调用。

## ✅ 为什么选择这个方案？

### 对比其他方案

| 方案 | 优点 | 缺点 |
|------|------|------|
| **GitHub Actions** | 完全免费 | ❌ 定时不准确（延迟10-30分钟）|
| **Vercel Cron** | 集成简单 | ❌ 免费账户有限制 |
| **✅ cron-job.org + Vercel** | ✅ 免费 + 精确 + 稳定 | 需要两个服务 |
| 自托管 | 完全控制 | 需要服务器成本 |

### cron-job.org 的优势

- **免费额度充足**：每天 100 次请求（每 5 分钟 = 288 次/天，可以用每 15 分钟 = 96 次/天）
- **定时精确**：比 GitHub Actions 可靠得多
- **简单易用**：Web 界面配置，5 分钟搞定
- **无需编程**：图形化界面

## 📋 部署步骤

### 第一步：部署到 Vercel

#### 1.1 注册 Vercel 账户

访问 [vercel.com](https://vercel.com) 并使用 GitHub 账户登录（免费）。

#### 1.2 导入项目

1. 在 Vercel Dashboard，点击 "Add New" → "Project"
2. 选择你的 GitHub 仓库：`UptimeRobot-BarkPush`
3. 点击 "Import"

#### 1.3 配置环境变量

在 "Environment Variables" 部分添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `UPTIMEROBOT_API_KEY` | `你的API密钥` | 必填 |
| `BARK_DEVICE_KEY` | `你的设备密钥` | 必填 |
| `BARK_SERVER_URL` | `https://api.day.app` | 可选 |
| `NOTIFICATION_LANGUAGE` | `zh` | 可选，中文通知 |
| `SEND_RECOVERY_NOTIFICATIONS` | `true` | 可选，发送恢复通知 |
| `DOWN_NOTIFICATION_SOUND` | `alert` | 可选，宕机通知声音 |
| `RECOVERY_NOTIFICATION_SOUND` | `complete` | 可选，恢复通知声音 |

#### 1.4 部署

点击 "Deploy" 按钮，等待部署完成（约 1-2 分钟）。

部署成功后，你会得到一个 URL，例如：
```
https://your-project-name.vercel.app
```

#### 1.5 测试 API 端点

在浏览器访问：
```
https://your-project-name.vercel.app/api/cron
```

应该看到 JSON 响应，显示监控检查结果。

### 第二步：配置 cron-job.org

#### 2.1 注册账户

访问 [cron-job.org](https://cron-job.org) 并注册一个免费账户。

#### 2.2 创建定时任务

1. 登录后，点击 "Cronjobs" → "Create cronjob"

2. 填写配置：

   **Title (标题):**
   ```
   UptimeRobot Monitor Check
   ```

   **URL:**
   ```
   https://your-project-name.vercel.app/api/cron
   ```
   ⚠️ 替换为你的实际 Vercel URL

   **Schedule (执行频率):**
   
   根据你的需求选择：
   
   - **每 5 分钟**：`Every 5 minutes` 
     - ⚠️ 会超出免费限额（288次/天 > 100次/天）
   
   - **每 15 分钟**（推荐）：`Every 15 minutes`
     - ✅ 符合免费限额（96次/天 < 100次/天）
     - 足够监控大多数网站
   
   - **每 30 分钟**：`Every 30 minutes`
     - ✅ 更省配额（48次/天）
     - 适合不太关键的网站

   **Execution schedule 详细配置示例（每 15 分钟）:**
   - Minutes: `*/15` 或选择 `0, 15, 30, 45`
   - Hours: `*` (all)
   - Days: `*` (all)
   - Months: `*` (all)
   - Weekdays: `*` (all)

3. **其他设置**（可选）：
   
   - Request method: `GET`
   - Request timeout: `300` 秒（默认）
   - Follow redirects: ✅ 启用
   - Save responses: 可选（用于调试）

4. 点击 "Create cronjob" 保存

#### 2.3 启用任务

创建后，确保任务状态是 **Enabled**（已启用）。

### 第三步：验证运行

#### 3.1 手动触发测试

在 cron-job.org 的任务列表中，点击你的任务旁边的 "▶" 按钮手动执行一次。

#### 3.2 查看执行历史

点击任务名称，查看 "History" 标签，应该看到：
- Status: ✅ Success (HTTP 200)
- Duration: 几秒钟
- Response: JSON 数据

#### 3.3 检查通知

如果网站状态发生变化，你应该在 Bark 收到通知。

## 📊 监控和维护

### 查看 Vercel 日志

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 点击 "Logs" 查看运行日志

### 查看 cron-job.org 执行历史

1. 登录 [cron-job.org](https://cron-job.org)
2. 点击任务名称
3. 查看 "History" 标签

### 调整执行频率

如果你发现需要更频繁或更少的检查：

1. 在 cron-job.org，点击任务名称
2. 点击 "Edit"
3. 修改 Schedule 设置
4. 保存

## 🔧 故障排除

### 问题 1：cron-job.org 显示失败

**检查：**
- Vercel URL 是否正确
- Vercel 项目是否已部署成功
- 环境变量是否配置正确

**测试：**
在浏览器直接访问 `https://your-project-name.vercel.app/api/cron`

### 问题 2：没有收到 Bark 通知

**检查：**
- `BARK_DEVICE_KEY` 是否正确
- 网站状态是否真的发生了变化（从正常→宕机）
- 查看 Vercel 日志确认是否发送了通知

**测试：**
在 UptimeRobot 中暂停一个监控器，等待下次检查。

### 问题 3：收到太多通知

**检查：**
- 是否配置了多个定时服务（GitHub Actions、Vercel Cron、cron-job.org）
- 确保只启用一个定时触发器

### 问题 4：超出 cron-job.org 配额

**错误信息：** HTTP 429 (Too Many Requests)

**解决方案：**
- 降低检查频率（改为每 15 或 30 分钟）
- 或升级为 [cron-job.org 付费会员](https://cron-job.org/en/members/)（5000 次/天）

## 📈 费用估算

| 服务 | 免费额度 | 实际使用 | 是否需要付费 |
|------|---------|---------|-------------|
| **Vercel** | 100 GB 带宽/月 | < 1 MB/月 | ✅ 免费 |
| **cron-job.org** | 100 次/天 | 96 次/天（每15分钟） | ✅ 免费 |
| **UptimeRobot** | 50 个监控器 | 根据需要 | ✅ 免费 |
| **Bark** | 无限制 | 仅在状态变化时通知 | ✅ 免费 |

**总费用：完全免费！** 🎉

## 🆚 与 GitHub Actions 对比

| 项目 | GitHub Actions | cron-job.org + Vercel |
|------|----------------|----------------------|
| **定时精确性** | ❌ 不准确（延迟10-30分钟） | ✅ 准确（误差<1分钟） |
| **费用** | ✅ 免费 | ✅ 免费 |
| **配置难度** | 简单 | 简单 |
| **可靠性** | 中等 | ✅ 高 |
| **执行历史** | ✅ 有 | ✅ 有 |
| **手动触发** | ✅ 支持 | ✅ 支持 |

## 🎯 最佳实践

1. **推荐频率**：每 15 分钟（平衡监控效果和配额）
2. **启用恢复通知**：`SEND_RECOVERY_NOTIFICATIONS=true`
3. **保存响应**：在 cron-job.org 启用 "Save responses" 用于调试
4. **监控多个网站**：在 UptimeRobot 添加多个监控器，这个系统会自动检查所有
5. **定期检查**：每周查看一次 cron-job.org 的执行历史

## 📝 配置检查清单

部署前确认：

- [ ] Vercel 项目已部署成功
- [ ] 环境变量已全部配置
- [ ] `/api/cron` 端点可以访问
- [ ] cron-job.org 账户已注册
- [ ] 定时任务已创建并启用
- [ ] 执行频率设置合理（不超配额）
- [ ] 手动触发测试成功
- [ ] 能收到 Bark 通知

## 🔗 相关链接

- [Vercel 官网](https://vercel.com)
- [cron-job.org 官网](https://cron-job.org)
- [cron-job.org API 文档](https://docs.cron-job.org/rest-api.html)
- [UptimeRobot](https://uptimerobot.com)
- [Bark 推送服务](https://github.com/Finb/Bark)

## 🚀 开始部署

现在就可以开始了！整个过程只需要 **10-15 分钟**。

有任何问题，欢迎提 Issue！


# GitHub Actions 问题修复说明

## 问题描述

之前使用 GitHub Actions 时，出现重复发送"🚀 网站监控服务已启动"通知的问题。

## 根本原因

### 1. 架构不匹配

原来的 `index.js` 是为**持续运行的服务**设计的（本地运行或自托管服务器）：
- 使用 `node-cron` 创建定时任务
- 使用内存中的 `monitorStateCache` 来跟踪网站状态
- 进程持续运行，状态缓存在内存中保持

但 GitHub Actions 的运行方式完全不同：
- 每 5 分钟启动一个**全新的进程**
- 运行脚本后立即结束
- 下次运行时又是全新的进程，内存缓存为空

### 2. 导致的问题

**问题 1：重复的启动通知**
- 每次 GitHub Actions 运行都执行 `init()` 函数
- 每次都发送启动通知

**问题 2：无法检测状态变化**（更严重）
- 每次运行时 `monitorStateCache` 都是空的
- `prevStatus` 始终是 `undefined`
- **无法检测到网站从正常变为宕机！**
- 监控功能实际上完全失效

## 解决方案

### 创建新的脚本：`check-once.js`

这是专门为 GitHub Actions 等无状态环境设计的检查脚本：

**核心改进：**

1. **基于时间的检测**
   - 不依赖内存缓存
   - 通过 UptimeRobot API 的日志检测最近的状态变化
   - 只处理最近 6 分钟内的状态变化（检查间隔 + 缓冲）

2. **使用日志类型判断**
   - UptimeRobot API 返回的日志包含 `type` 字段：
     - `type: 1` = 宕机事件
     - `type: 2` = 恢复事件
   - 直接根据日志类型发送相应通知

3. **无启动通知**
   - 不发送启动通知，避免骚扰
   - 只在真正的状态变化时发送通知

### 工作流程

```
每 5 分钟:
  ├─ GitHub Actions 启动新进程
  ├─ 运行 check-once.js
  ├─ 调用 UptimeRobot API 获取监控器状态和日志
  ├─ 检查最近 6 分钟内的日志
  ├─ 如果有状态变化 → 发送通知
  ├─ 否则 → 不发送通知
  └─ 进程结束
```

## 修改内容

### 1. 新增文件：`check-once.js`
- 专为无状态环境设计的检查脚本
- 基于日志时间戳检测状态变化
- 不依赖内存缓存

### 2. 更新文件：`.github/workflows/monitor.yml`
- 从 `node index.js` 改为 `node check-once.js`
- 移除不需要的 `SEND_STARTUP_NOTIFICATION` 环境变量

### 3. 保留文件：`index.js`
- 仍然保留，用于本地运行或自托管服务器
- 适合需要持续运行的环境

## 使用说明

### GitHub Actions 部署

1. 推送代码到 GitHub
2. 确保已设置必要的 Secrets：
   - `UPTIMEROBOT_API_KEY`
   - `BARK_DEVICE_KEY`
   - `BARK_SERVER_URL`（可选）
   - `NOTIFICATION_LANGUAGE`（可选，设置为 'zh' 使用中文）
3. GitHub Actions 会自动运行，每 5 分钟检查一次

### 本地运行（持续服务）

如果你想在自己的服务器上持续运行：

```bash
node index.js
```

这会创建一个持续运行的服务，使用 cron 定时检查。

### 手动测试

测试 GitHub Actions 版本：

```bash
node check-once.js
```

## 优势

### ✅ 解决的问题

1. **不再重复发送启动通知**
2. **正确检测状态变化** - 监控功能真正有效
3. **避免误报** - 只通知最近的状态变化
4. **更适合无状态环境** - 专为 GitHub Actions 设计

### ✅ 保持的功能

1. 宕机通知 🔴
2. 恢复通知 🟢（可配置）
3. 多语言支持（中文/英文）
4. 自定义通知声音
5. 选择性监控特定网站

## 技术细节

### 时间窗口

- GitHub Actions 每 5 分钟运行一次
- 检查最近 **6 分钟**内的日志（5 分钟 + 1 分钟缓冲）
- 这确保了：
  - 不会错过任何状态变化
  - 不会重复通知同一个事件
  - 允许少量的时间偏差

### API 参数

```javascript
formData.append('logs', '1');           // 获取日志
formData.append('log_types', '1-2');    // 1=宕机, 2=恢复
```

### 日志结构

UptimeRobot API 返回的日志示例：

```json
{
  "type": 1,           // 1=宕机, 2=恢复
  "datetime": 1697123456,
  "reason": {
    "code": "Connection timeout",
    "detail": "..."
  }
}
```

## 部署步骤

1. 提交更改：
```bash
git add .
git commit -m "fix: GitHub Actions 监控逻辑修复"
git push
```

2. GitHub Actions 会自动使用新的 `check-once.js` 脚本

3. 观察日志确认正常工作：
   - 进入 GitHub 仓库的 "Actions" 标签
   - 查看最新的工作流运行
   - 检查日志输出

## 预期日志输出

正常运行时：
```
[timestamp] Checking monitors...
API call successful! Found 1 monitors
Monitor: www.example.com, Current Status: 正常
  Latest log: Type 2, Time: 2024-10-15 19:30:00, Recent: false
  No recent status changes
Check completed.
```

发现宕机时：
```
[timestamp] Checking monitors...
API call successful! Found 1 monitors
Monitor: www.example.com, Current Status: 宕机
  Latest log: Type 1, Time: 2024-10-15 19:55:30, Recent: true
Sending Bark notification...
Notification sent: 🔴 网站宕机: www.example.com
  ✓ Sent down notification
Check completed.
```

## 故障排除

### 如果仍然收到重复通知

1. 检查是否有多个工作流在运行
2. 检查 UptimeRobot 的检查频率设置
3. 查看 GitHub Actions 的运行日志

### 如果没有收到宕机通知

1. 检查 `SEND_RECOVERY_NOTIFICATIONS` 设置
2. 确认 UptimeRobot API Key 正确
3. 确认 Bark Device Key 正确
4. 查看 GitHub Actions 日志中的错误信息

## 总结

这个修复彻底解决了 GitHub Actions 环境下的监控问题：
- ✅ 不再重复发送启动通知
- ✅ 正确检测并通知网站状态变化
- ✅ 适应无状态运行环境
- ✅ 保持所有原有功能

现在监控系统可以真正有效地工作了！🎉


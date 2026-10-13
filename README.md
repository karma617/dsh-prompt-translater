# DSH 英文指令翻译插件

适配 DSH `0.2.1-alpha.2`。仅翻译对话框新提交的文本，使用 DSH 中已配置的独立 provider/model。默认关闭，避免未确认的模型费用。

## 安装与配置

本目录开发/本地链接安装前先执行 `npm ci --ignore-scripts --legacy-peer-deps` 安装运行依赖（本次已完成）。通过 DSH 插件管理安装此目录：`plugin_manager({ action: 'install_bundle', target: 'E:\\AI\\dsh-prompt-translater' })`。不需修改 DSH 源码、构建 Web 或启动其他服务器。

在 DSH 插件配置中找到 `prompt-translater`，设置：

```yaml
enabled: true
provider: YOUR_REGISTERED_PROVIDER_ID
model: YOUR_MODEL_ID
timeoutMs: 60000
maxOutputTokens: 8192
systemPrompt: '' # 可选：用户可自定义修改翻译提示词，留空时使用内置的标准指令翻译 Prompt
```

本次安装已保存，插件管理返回 `application: restart-required`，当前运行实例尚未加载成功；请重启 DSH 后确认配置 schema 与激活状态，不能只刷新浏览器代替重启。未测试真实翻译模型（尚未选择模型），图标的 GUI 渲染也未验证。

provider 是 DSH 注册的路由 ID，不是 API 地址；凭据和端点通过 DSH 模型设置配置。本插件不存 API key。不继承当前对话模型，避免切换聊天模型导致翻译费用或路由变化。修改配置后确认插件已激活；替换已安装的 JS 代码需要重启 DSH。

## 行为边界

- 使用正式 `agent/pre-step` waterfall，只处理本次 inbox 提议中的 `role: user`、`source.kind: user`、非空 `source.rpcId` 消息。普通会话和子会话中人工输入都覆盖。
- ASCII 英文输入直接通过。含任意非 ASCII 文本时，对该条输入发起一次独立翻译调用。对话框的单个 text block 原位替换，附件引用和顺序保留，不翻译附件内容、名称或路径。异常的多个 text block RPC 输入若需翻译则拒绝，避免跨附件合并改变语义。
- 翻译结果仅含 ASCII，中文和全角标点不会留在该条输入的 text block。保留 ASCII 代码、路径、URL；非 ASCII 字面量要求模型用 Unicode escape 表示，可能需要后续模型解码才能访问实际中文路径。
- 改写结果作为正式 `user/message` 持久化，后续步骤、远端请求重试、恢复历史都复用英文，不重新扫描历史。
- 同一 Agent/消息 ID 的重复或并发调用共享结果（包括失败）；同一输入共享首次调用的取消信号。缓存保留至 Agent 被回收，超长会话有内存增长风险。超时依赖 DSH 模型适配器遵守 AbortSignal，不是对不响应适配器的硬截止。不自动重译、不回退中文；超时、取消、空输出、截断、工具调用和非 ASCII 输出会使本次步骤报错，主对话模型不会收到这条原文。需要重新提交时由用户显式操作。
- 工具结果、助手消息、目标自动续轮、定时提醒、其他 Agent 转发、系统上下文与历史消息不翻译。不拦截 `llm/stream`，不改写远端请求整体。

**限制：** `rpcId` 标识 DSH Session RPC 入站，不是不可伪造的 GUI 来源证明；程序主动调用同一 Session RPC 也会视为人工提交。只检查 ASCII，不可能仅凭字符保证模型确实忠实翻译英文。原始中文会发给所配置的翻译模型，这是翻译所需。既有历史、系统提示、工具结果及附件元数据仍可能含中文，因此本插件不保证整个远端模型请求完全无中文。启用前的历史不会被修改。插件不额外存储原文；DSH 自身 inbox 日志仍保留原文，正式聊天消息显示译文。失败时消息已被 inbox 取出，不会自动恢复队列，请重新提交。

## 验证与停用

`npm test` 测试来源筛选、单次及并发去重、ASCII 输出约束、失败不回退、取消与附件保留；`npm run check` 做 JS 语法检查。安装后在真实 DSH 配置面板检查 schema 和激活状态，再选择翻译模型测试真实调用。

设置 `enabled: false` 或禁用插件即可停用；已写入的英文历史保持不变。

图标为本项目原创 SVG。

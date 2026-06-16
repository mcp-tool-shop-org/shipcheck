<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/shipcheck/readme.jpg" alt="Shipcheck" width="400">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/shipcheck/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  Product standards for MCP Tool Shop.<br>
  Templates, contracts, and adoption guides that define what "done" means before anything ships.
</p>

---

## 为什么？

过去，“完成”意味着代码可以正常工作。现在，这还不够。一个产品是代码 + 安全性 + 错误处理 + 文档 + 身份 + 发布卫生标准。Shipcheck 定义了标准。

## 这里有什么？

| 标准 | 它涵盖的内容 |
|----------|----------------|
| [Ship Gate](templates/SHIP_GATE.md) | 31 个硬性检查点 + 4 个软性检查点的预发布清单 |
| [Error Contract](contracts/error-contract.md) | 带有代码注册表的两层结构化错误标准 |
| [Security Baseline](templates/SECURITY.md) | 报告电子邮件、响应时间表、威胁范围 |
| [Handbook](templates/HANDBOOK.md) | 复杂工具的操作手册 |
| [Scorecard](templates/SCORECARD.md) | 修复前/后的评分 |
| [Adoption Guide](ADOPTION.md) | 在不到 30 分钟内将 Shipcheck 应用于任何仓库 |

## CLI 用法

```bash
npx @mcptoolshop/shipcheck init        # Copy templates into current repo
npx @mcptoolshop/shipcheck audit       # Check SHIP_GATE.md progress
npx @mcptoolshop/shipcheck dogfood     # Check dogfood freshness (Gate F)
npx @mcptoolshop/shipcheck front-door  # Verify the AI-native front door (Gate G)
npx @mcptoolshop/shipcheck help        # Show help
npx @mcptoolshop/shipcheck --version   # Show version
```

设置 `SHIPCHECK_JSON=1` 以获得结构化的 JSON 错误输出，而不是彩色文本。

## 快速入门

1. 阅读 [ADOPTION.md](ADOPTION.md)
2. 在你的仓库根目录下运行 `npx @mcptoolshop/shipcheck init`
3. 在 `SHIP_GATE.md` 中勾选适用的项目，并使用 `SKIP:` 标记不适用的项目。
4. 运行 `npx @mcptoolshop/shipcheck audit`——当所有硬性检查点都通过时，退出代码为 0。
5. 当审核通过时发布。

## 它的工作原理

**硬性检查点**（A-D）会阻止发布：

- **A. 安全基线**——SECURITY.md、威胁模型、无密钥、无遥测数据、默认安全姿态。
- **B. 错误处理**——结构化的错误格式（代码/消息/提示/可重试）、安全的输出、优雅的降级。
- **C. 操作文档**——README、CHANGELOG、LICENSE、工具文档。
- **D. 发布卫生标准**——验证脚本、版本对齐、依赖项扫描、锁文件。

**软性检查点**（E）不会阻止，但定义了“整体”：

- **E. 身份**——徽标、翻译、登录页面、仓库元数据。

**检查点 F — Dogfood 新鲜度**（可选，需要 dogfood-labs）：

- 检查是否存在新的、经过验证的、通过的 dogfood 记录。
- 支持强制执行模式：`required`、`warn-only`、`exempt`。
- 可配置的新鲜度窗口（默认值：30 天）。

**检查点 G — AI 原生前端**（可选，需要 `@mcptoolshop/site-theme` >=2.0.0）：

- 验证仓库的 AI 原生前端（README / AGENTS.md / llms.txt）是否说真话——这是机器可读的补充，用于操作文档（C）和身份（E）检查点。
- 委托给 site-theme 的 [`front-door`](https://github.com/mcp-tool-shop-org/site-theme) 验证器 (`verify({ root })`)，该验证器将记录的声明路由到证据通道并返回一个按严重程度排序的评分表。
- 显示按严重程度分类的数量（矛盾 · 未支持 · 过时 · 冗余 · 卫生 · 样式），以及检查点结果；如果存在矛盾/未支持/过时的声明，则**失败（退出代码为 1）**。
- site-theme 是一个**可选的对等依赖项**（硬性依赖会将 astro 拉入这个零依赖 CLI）。如果没有安装它，该检查点将**优雅地跳过**（退出代码为 0），绝不会导致审核崩溃。

检查点说明了**什么**必须为真，而不是**如何**实现它。适用性标签（`[all]`、`[npm]`、`[mcp]`、`[cli]`、`[desktop]`、`[vsix]`、`[container]`）可以防止在某些项目不适用的仓库中出现复选框羞耻感。

## 错误约定一览

**第一层 — 格式（所有地方都必须）：**

```json
{
  "code": "INPUT_TEXT_EMPTY",
  "message": "Text must not be empty",
  "hint": "Provide at least one character of text",
  "retryable": false
}
```

**第二层 — 基本类型 + 退出代码（CLI/MCP/桌面）：**

| 退出代码 | 含义 |
|-----------|---------|
| 0 | OK |
| 1 | 用户错误（错误的输入、缺少配置） |
| 2 | 运行时错误（崩溃、后端故障） |
| 3 | 部分成功（某些项目已成功） |

错误代码使用命名空间前缀：`IO_`、`CONFIG_`、`PERM_`、`DEP_`、`RUNTIME_`、`PARTIAL_`、`INPUT_`、`STATE_`。代码一旦发布就不会更改。

## 信任模型

**涉及的数据：**读取当前工作目录中的 `package.json`、`pyproject.toml` 和 `SHIP_GATE.md`。仅将模板文件（`SHIP_GATE.md`、`SECURITY.md`、`CHANGELOG.md`、`SCORECARD.md`）写入当前目录。
**没有网络请求。**所有操作都是本地文件读取和写入。
**不处理密钥。**不会读取、存储或传输凭据。
**不收集遥测数据**或发送。

## 参考实现

[mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) 是第一个通过 Ship Gate 的仓库——修复后，得分**46/50**。

## 评分表

| 类别 | 分数 | 备注 |
|----------|-------|-------|
| A. 安全性 | 6/8 | SECURITY.md、信任模型、无密钥/遥测数据。跳过 MCP 项目（不是 MCP 服务器）。 |
| B. 错误处理 | 3/7 | 结构化的错误格式 + 退出代码 + 无原始堆栈跟踪。跳过 MCP/桌面/vscode。 |
| C. 操作文档 | 4/7 | README、CHANGELOG、LICENSE、--help。跳过日志记录/MCP/复杂项目。 |
| D. 发布卫生标准 | 6/9 | 验证脚本、版本=标签、在 CI 中进行 npm 审核、engines.node、锁文件。零依赖 = 没有更新机制。 |
| E. 身份 | 4/4 | 徽标、翻译、登录页面、元数据。 |
| **Total** | **23/31** | 14 个项目已跳过，并提供了理由 · `shipcheck audit` 通过率为 100%。 |

## 许可证

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>

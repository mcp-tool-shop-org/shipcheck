<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/shipcheck/readme.png" alt="Shipcheck" width="400">
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

## 为什么

“完成”过去意味着代码可以正常运行。但这还不够。一个产品包括代码、安全性、错误处理、文档、身份标识以及发布流程。Shipcheck 定义了标准。

## 内容

| 标准 | 涵盖内容 |
|----------|----------------|
| [Ship Gate](templates/SHIP_GATE.md) | 27 个硬性检查项 + 4 个软性检查项的预发布清单 |
| [Error Contract](contracts/error-contract.md) | 具有代码注册表的两级结构化错误标准 |
| [Security Baseline](templates/SECURITY.md) | 报告邮件、响应时间、风险范围 |
| [Handbook](templates/HANDBOOK.md) | 复杂工具的操作手册 |
| [Scorecard](templates/SCORECARD.md) | 修复前/后的评分 |
| [Adoption Guide](ADOPTION.md) | 将 Shipcheck 应用于任何仓库，只需 30 分钟 |

## 快速开始

1. 阅读 [ADOPTION.md](ADOPTION.md)
2. 将 `templates/SHIP_GATE.md` 复制到您的仓库根目录
3. 检查适用项，对于不适用项，使用 `SKIP:` 标记
4. 在所有硬性检查项通过后发布

## 工作原理

**硬性检查项 (A-D)** 会阻止发布：

- **A. 安全基线** — SECURITY.md，威胁模型，无敏感信息，无遥测，默认安全姿态
- **B. 错误处理** — 结构化的错误格式（代码/消息/提示/可重试），安全输出，优雅降级
- **C. 操作文档** — README，CHANGELOG，LICENSE，工具文档
- **D. 发布流程** — 验证脚本，版本对齐，依赖项扫描，锁定文件

**软性检查项 (E)** 不会阻止发布，但定义了“完整性”：

- **E. 身份标识** — logo，翻译，着陆页，仓库元数据

检查项说明的是**必须**满足什么，而不是**如何**实现。适用性标签 (`[all]`, `[npm]`, `[mcp]`, `[cli]`, `[desktop]`, `[vsix]`, `[container]`) 避免在不适用的仓库中出现“未完成”的检查框。

## 错误合约一览

**第一层 — 结构 (所有地方都必须满足):**

```json
{
  "code": "INPUT_TEXT_EMPTY",
  "message": "Text must not be empty",
  "hint": "Provide at least one character of text",
  "retryable": false
}
```

**第二层 — 基本类型 + 退出码 (CLI/MCP/桌面):**

| 退出码 | 含义 |
|-----------|---------|
| 0 | OK |
| 1 | 用户错误（无效输入，缺少配置） |
| 2 | 运行时错误（崩溃，后端故障） |
| 3 | 部分成功（某些项已成功） |

错误代码使用命名空间前缀：`IO_`, `CONFIG_`, `PERM_`, `DEP_`, `RUNTIME_`, `PARTIAL_`, `INPUT_`, `STATE_`。代码在发布后会保持稳定。

## 参考实现

[mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) 是第一个通过 Ship Gate 的仓库，在修复后获得了 **46/50** 的评分。

## 评分卡

| 类别 | 评分 | 备注 |
|----------|-------|-------|
| A. 安全性 | 10/10 | SECURITY.md，无可执行代码，无数据收集 |
| B. 错误处理 | N/A | 标准仓库 — 没有代码产生错误 |
| C. 操作文档 | 10/10 | README，CHANGELOG，ADOPTION，所有模板均已记录 |
| D. 发布流程 | 8/10 | 无代码可验证/测试，所有标准均已版本控制 |
| E. 身份标识 | 10/10 | Logo，翻译，着陆页，元数据 |
| **Total** | **38/40** | B 排除（不适用） |

## 许可证

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>

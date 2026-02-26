<p align="center">
  <img src="assets/logo.png" alt="MCP ShipCheck" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-shipcheck/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-shipcheck/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-shipcheck/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

别名：“NPM 准备情况监管员”。

给定一个本地软件包文件夹，`mcp-shipcheck` 会生成一份可预测的发布准备报告，其中包含以下信息：将包含在压缩包中的内容、潜在的问题（例如缺少类型定义、导出错误、缺少LICENSE文件等），以及具体的修复建议列表。

它将“发布焦虑”转化为一个可以进行机器验证的成果。

## 功能特点

- **代码审计：** 分析 `package.json`、`tsconfig.json` 文件，以及导出的模块和文件是否存在，以评估项目的准备状态。
- **打包预览：** 运行 `npm pack --json` 命令，以显示将被打包的精确文件列表（以及它们的大小），无需手动解压 tarball 文件。
- **错误解释：** 提供易于理解的上下文信息和针对特定错误代码的解决方案。

所有工具均为**只读模式**（不进行自动修复），因此它们对MCP主机来说是安全的，可以自动调用。

## 工具

### `shipcheck.audit` (可以理解为“船舶检查的审计”或“船舶检查的审核”)
- **输入**: `{ path: string }` (软件包的绝对路径或相对路径)
- **输出**: JSON 格式的报告，包含一个分数（0-100）、结构化的检测结果（失败、警告、信息）以及汇总统计信息。

### `shipcheck.packPreview` (暂无明确含义，可根据上下文进行翻译，例如：打包预览、包裹预览等)
- **输入：** `{ path: string }`
- **输出：** JSON 格式的文件列表，这些文件将包含在发布的压缩包中，并附带元数据。

### `shipcheck.解释失败原因`
- **输入：** `{ code: string }` (例如：`PKG.EXPORTS.MISSING`)
- **输出：** 详细的错误解释以及建议的解决方案。

## 安装与使用说明

### 与MCP的配合使用

该工具旨在与 MCP 客户端（例如 Claude 桌面版或 IDE 插件）一起使用。

**配置 (mcp-settings.json)：**

```json
{
  "mcpServers": {
    "shipcheck": {
      "command": "node",
      "args": ["/path/to/mcp-shipcheck/build/index.js"]
    }
  }
}
```

### 本地化构建

```bash
npm install
npm run build
```

## 许可

麻省理工学院。

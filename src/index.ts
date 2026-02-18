import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { auditPackage, packPreview, explainFailure } from "./shipcheck.js";

const server = new McpServer({ name: "mcp-shipcheck", version: "0.1.0" });

server.registerTool(
  "shipcheck.audit",
  {
    description:
      "Audit a local Node/TypeScript package for npm publish readiness (read-only).",
    inputSchema: {
      path: z.string().describe("Absolute or relative path to the package folder"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ path }) => {
    const report = await auditPackage(path);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(report, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "shipcheck.packPreview",
  {
    description:
      "Show which files would be included by `npm pack` and report size totals (read-only).",
    inputSchema: {
      path: z.string().describe("Absolute or relative path to the package folder"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ path }) => {
    const preview = await packPreview(path);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(preview, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "shipcheck.explainFailure",
  {
    description: "Explain a shipcheck failure code and suggest fixes (read-only).",
    inputSchema: {
      code: z.string().min(1).describe("Failure code, e.g. PKG.EXPORTS.MISSING"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ code }) => ({
    content: [{ type: "text", text: JSON.stringify(explainFailure(code), null, 2) }],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // IMPORTANT: log to stderr (stdout is reserved for MCP JSON-RPC)
  console.error("mcp-shipcheck running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

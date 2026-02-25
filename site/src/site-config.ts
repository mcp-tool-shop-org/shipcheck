import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'mcp-shipcheck',
  description: 'Publish-readiness auditor for npm packages — scores package.json, previews tarball contents, explains failures',
  logoBadge: 'SC',
  brandName: 'mcp-shipcheck',
  repoUrl: 'https://github.com/mcp-tool-shop-org/mcp-shipcheck',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Read-only MCP auditor',
    headline: 'Stop guessing if your package is ready.',
    headlineAccent: 'ShipCheck it.',
    description: 'Publish-readiness auditor for npm packages — scores package.json, previews tarball contents, explains failures.',
    primaryCta: { href: '#tools', label: 'See the tools' },
    secondaryCta: { href: '#usage', label: 'Quick start' },
    previews: [
      { label: 'Audit', code: 'shipcheck.audit({ "path": "/your/package" })' },
      { label: 'Preview', code: 'shipcheck.packPreview({ "path": "/your/package" })' },
      { label: 'Explain', code: 'shipcheck.explainFailure({ "code": "PKG.EXPORTS.MISSING" })' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Everything you need to ship with confidence.',
      features: [
        {
          title: 'Deterministic Score',
          desc: 'Every package gets a 0–100 readiness score driven by real findings: fails, warnings, and info-level signals. No magic, no guesses.',
        },
        {
          title: 'Tarball Reality Check',
          desc: 'Runs npm pack --json under the hood to show exactly which files will ship and their sizes — before you publish anything.',
        },
        {
          title: 'Human-Readable Fixes',
          desc: 'Every failure code like PKG.EXPORTS.MISSING maps to a plain-English explanation and a concrete step to resolve it.',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'tools',
      title: 'Tools',
      subtitle: 'Three read-only tools. Safe for MCP hosts to call automatically.',
      columns: ['Tool', 'Input', 'Returns'],
      rows: [
        ['shipcheck.audit', '{ path: string }', 'Score (0–100), structured findings (fails / warnings / infos), summary counts'],
        ['shipcheck.packPreview', '{ path: string }', 'Files that will be included in the tarball, with sizes and metadata'],
        ['shipcheck.explainFailure', '{ code: string }', 'Explanation of the failure code and suggested fixes'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Quick Start',
      cards: [
        {
          title: 'Build & configure',
          code: `# 1. Build the server
npm install && npm run build

# 2. Add to mcp-settings.json
{
  "mcpServers": {
    "shipcheck": {
      "command": "node",
      "args": ["/path/to/mcp-shipcheck/build/index.js"]
    }
  }
}`,
        },
        {
          title: 'Audit a package',
          code: `// Via your MCP host (e.g. Claude Desktop):
shipcheck.audit({ "path": "/your/package" })

// Returns:
{
  "score": 82,
  "fails": ["PKG.EXPORTS.MISSING"],
  "warnings": ["NO_CHANGELOG"],
  "infos": ["TYPES_INFERRED"],
  "summary": { "fail": 1, "warn": 1, "info": 1 }
}`,
        },
      ],
    },
  ],
};

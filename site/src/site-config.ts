import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Shipcheck',
  description: 'Product standards for MCP Tool Shop — Ship Gate checklist, error contract, templates, and adoption guides that define what "done" means.',
  logoBadge: 'SC',
  brandName: 'Shipcheck',
  repoUrl: 'https://github.com/mcp-tool-shop-org/shipcheck',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'Product Standards',
    headline: 'Ship products,',
    headlineAccent: 'not prototypes.',
    description: '27 hard gates, 4 soft gates, a structured error contract, and an adoption guide. Define what "done" means before anything ships.',
    primaryCta: { href: '#quickstart', label: 'Get started' },
    secondaryCta: { href: '#standards', label: 'See the standards' },
    previews: [
      {
        label: 'Quick start',
        code: '# 1. Read the adoption guide\ncat ADOPTION.md\n\n# 2. Copy the gate into your repo\ncp templates/SHIP_GATE.md ./SHIP_GATE.md\n\n# 3. Check off items, mark N/A with SKIP:\n# 4. Ship when all hard gates pass',
      },
      {
        label: 'Error shape',
        code: '// Tier 1: mandatory for all user-facing errors\n{\n  "code": "INPUT_TEXT_EMPTY",\n  "message": "Text must not be empty",\n  "hint": "Provide at least one character",\n  "retryable": false\n}',
      },
      {
        label: 'Gate summary',
        code: '# Hard gates (block release):\nA. Security Baseline     4 + 4 items\nB. Error Handling         6 items\nC. Operator Docs          7 items\nD. Shipping Hygiene       9 items\n\n# Soft gate (defines "whole"):\nE. Identity               4 items',
      },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'why',
      title: 'Why shipcheck',
      subtitle: '"Done" used to mean the code works. That\'s not enough.',
      features: [
        {
          title: 'What, not how',
          desc: 'The gate says what must be true, not how to implement it. TypeScript, Python, .NET, Go — the standard is language-agnostic.',
        },
        {
          title: 'No checkbox shame',
          desc: 'Applicability tags ([all], [npm], [mcp], [cli], [desktop]) let you skip what doesn\'t apply. A standards repo doesn\'t need error handling gates.',
        },
        {
          title: '30-minute adoption',
          desc: 'ADOPTION.md walks you through applying shipcheck to any repo in under 30 minutes. Copy the gate, check items, ship.',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'standards',
      title: 'Standards',
      subtitle: 'Everything a product needs to be "done."',
      columns: ['Standard', 'What it covers'],
      rows: [
        ['Ship Gate', '27 hard-gate + 4 soft-gate checks across all repo types'],
        ['Error Contract', 'Tier 1: error shape (all repos) / Tier 2: base type + exit codes (CLI/MCP/desktop)'],
        ['Security Baseline', 'Report email, response timeline, threat scope template'],
        ['Handbook', 'Operational field manual for complex tools'],
        ['Scorecard', 'Pre/post remediation scoring for tracking maturity'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'quickstart',
      title: 'Get started',
      cards: [
        {
          title: 'Copy the gate',
          code: '# Copy SHIP_GATE.md into your repo root\ncp templates/SHIP_GATE.md ./SHIP_GATE.md\n\n# Check off items as you go:\n# - [x] `[all]` SECURITY.md exists (2026-02-27)\n# - [ ] SKIP: not a CLI tool\n# - [ ] unchecked = needs work',
        },
        {
          title: 'Error shape (Tier 1)',
          code: '// Every user-facing error must have:\ninterface StructuredError {\n  code: string;      // e.g. "INPUT_TEXT_EMPTY"\n  message: string;   // human-readable\n  hint: string;      // actionable guidance\n  cause?: string;    // upstream error\n  retryable?: boolean;\n}',
        },
        {
          title: 'Exit codes (Tier 2)',
          code: '// For CLI, MCP, and desktop apps:\n// 0 = OK\n// 1 = User error (bad input, missing config)\n// 2 = Runtime error (crash, backend failure)\n// 3 = Partial success (some items succeeded)\n\n// Codes use namespaced prefixes:\n// IO_, CONFIG_, PERM_, DEP_,\n// RUNTIME_, PARTIAL_, INPUT_, STATE_',
        },
        {
          title: 'Reference repo',
          code: '# mcp-voice-soundboard scored 46/50\n# after applying shipcheck:\n#\n# A. Security      10/10\n# B. Error Handling  8/10\n# C. Operator Docs   9/10\n# D. Shipping        9/10\n# E. Identity       10/10',
        },
      ],
    },
  ],
};

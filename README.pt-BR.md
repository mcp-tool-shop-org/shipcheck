<p align="center">
  <img src="assets/logo.png" alt="MCP ShipCheck" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-shipcheck/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-shipcheck/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-shipcheck/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

A.k.a. "Fiscalizador de Preparação para o NPM"

Dado um diretório de pacote local, o `mcp-shipcheck` gera um relatório determinístico sobre a prontidão para publicação: o que será incluído no arquivo tar, possíveis problemas óbvios (tipos ausentes, exportações incorretas, ausência de LICENSE, etc.) e uma lista concreta de correções.

Transforma a "ansiedade de lançamento" em um artefato verificável por máquina.

## Funcionalidades

- **Auditoria**: Analisa `package.json`, `tsconfig.json`, exportações e a existência de arquivos para avaliar a prontidão.
- **Visualização da Embalagem**: Executa `npm pack --json` para mostrar exatamente quais arquivos serão incluídos (e seus tamanhos), sem a necessidade de descompactar manualmente um arquivo tar.
- **Explicação de Falhas**: Fornece contexto legível por humanos e correções para códigos de erro específicos.

Todas as ferramentas são **somente de leitura** (sem correções automáticas), o que as torna seguras para serem chamadas automaticamente pelos hosts MCP.

## Ferramentas

### `shipcheck.audit`
- **Entrada**: `{ path: string }` (Caminho absoluto ou relativo para o pacote)
- **Saída**: Relatório JSON contendo uma pontuação (0-100), resultados estruturados (falhas, avisos, informações) e contagens resumidas.

### `shipcheck.packPreview`
- **Entrada**: `{ path: string }`
- **Saída**: Lista JSON de arquivos que seriam incluídos no arquivo tar da versão, juntamente com metadados.

### `shipcheck.explainFailure`
- **Entrada**: `{ code: string }` (por exemplo, `PKG.EXPORTS.MISSING`)
- **Saída**: Explicação detalhada do erro e sugestões de correção.

## Instalação e Uso

### Uso com MCP

Esta ferramenta foi projetada para ser usada com um cliente MCP (como Claude Desktop ou uma extensão de IDE).

**Configuração (mcp-settings.json):**

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

### Construção Local

```bash
npm install
npm run build
```

## Licença

MIT

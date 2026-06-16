<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
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

## Por que

"Concluído" costumava significar que o código funcionava. Isso não é suficiente. Um produto é código + segurança + tratamento de erros + documentação + identidade + higiene no envio. O Shipcheck define o padrão.

## O que há aqui

| Padrão | O que ele cobre |
|----------|----------------|
| [Ship Gate](templates/SHIP_GATE.md) | Lista de verificação pré-lançamento com 31 itens obrigatórios + 4 itens opcionais |
| [Error Contract](contracts/error-contract.md) | Padrão estruturado de erros em duas camadas, com registro de código |
| [Security Baseline](templates/SECURITY.md) | Relatório por e-mail, cronograma de resposta, escopo da ameaça |
| [Handbook](templates/HANDBOOK.md) | Manual operacional para ferramentas complexas |
| [Scorecard](templates/SCORECARD.md) | Pontuação pré/pós correção |
| [Adoption Guide](ADOPTION.md) | Aplique o Shipcheck a qualquer repositório em menos de 30 minutos |

## Uso da CLI

```bash
npx @mcptoolshop/shipcheck init        # Copy templates into current repo
npx @mcptoolshop/shipcheck audit       # Check SHIP_GATE.md progress
npx @mcptoolshop/shipcheck dogfood     # Check dogfood freshness (Gate F)
npx @mcptoolshop/shipcheck front-door  # Verify the AI-native front door (Gate G)
npx @mcptoolshop/shipcheck help        # Show help
npx @mcptoolshop/shipcheck --version   # Show version
```

Defina `SHIPCHECK_JSON=1` para obter uma saída estruturada em JSON para erros, em vez de texto colorido.

## Guia rápido

1. Leia [ADOPTION.md](ADOPTION.md)
2. Execute `npx @mcptoolshop/shipcheck init` na raiz do seu repositório
3. Marque os itens aplicáveis em `SHIP_GATE.md`, marque os itens não aplicáveis com `SKIP:`
4. Execute `npx @mcptoolshop/shipcheck audit` — sai com código 0 quando todos os itens obrigatórios são aprovados
5. Envie o projeto quando a auditoria for aprovada

## Como funciona

**Itens obrigatórios** (A-D) bloqueiam o lançamento:

- **A. Linha de base de segurança** — SECURITY.md, modelo de ameaças, sem segredos, sem telemetria, postura de segurança padrão
- **B. Tratamento de erros** — formato estruturado de erro (código/mensagem/dica/reprocessável), saída segura, degradação gradual
- **C. Documentação para operadores** — README, CHANGELOG, LICENSE, documentação da ferramenta
- **D. Higiene no envio** — script de verificação, alinhamento de versão, análise de dependências, arquivo de bloqueio

**Item opcional** (E) não bloqueia, mas define o "todo":

- **E. Identidade** — logotipo, traduções, página inicial, metadados do repositório

**Item F — Frescor do Dogfood** (opcional, requer dogfood-labs):

- Verifica se há um registro de "dogfood" recente, verificado e aprovado
- Suporta modos de aplicação: `required` (obrigatório), `warn-only` (apenas aviso), `exempt` (isento)
- Janela de frescor configurável (padrão: 30 dias)

**Item G — Porta de entrada nativa para IA** (opcional, requer `@mcptoolshop/site-theme` >=2.0.0):

- Verifica se a porta de entrada nativa para IA do repositório (README / AGENTS.md / llms.txt) diz a verdade — o complemento legível por máquina da documentação para operadores (C) e dos itens de identidade (E)
- Delega ao verificador [`front-door`](https://github.com/mcp-tool-shop-org/site-theme) do site-theme (`verify({ root })`), que encaminha as declarações documentadas para os canais de evidência e retorna uma pontuação ordenada por risco
- Apresenta contagens por gravidade (contraditório · não comprovado · desatualizado · excesso · higiene · estilo), além do resultado do item; **falha (código de saída 1) em declarações contraditórias / não comprovadas / desatualizadas**
- O site-theme é uma **dependência opcional** (uma dependência obrigatória incluiria o Astro nesta CLI sem dependências). Quando não está instalado, o item **é ignorado com segurança** (código de saída 0) — nunca interrompe a auditoria

O item diz **o que** deve ser verdade, e não **como** implementá-lo. As tags de aplicabilidade (`[all]`, `[npm]`, `[mcp]`, `[cli]`, `[desktop]`, `[vsix]`, `[container]`) evitam constrangimento ao marcar itens em repositórios onde eles não se aplicam.

## Contrato de erro, resumido

**Nível 1 — Formato (obrigatório em todos os lugares):**

```json
{
  "code": "INPUT_TEXT_EMPTY",
  "message": "Text must not be empty",
  "hint": "Provide at least one character of text",
  "retryable": false
}
```

**Nível 2 — Tipo base + códigos de saída (CLI/MCP/desktop):**

| Código de saída | Significado |
|-----------|---------|
| 0 | OK |
| 1 | Erro do usuário (entrada inválida, configuração ausente) |
| 2 | Erro de tempo de execução (travamento, falha no backend) |
| 3 | Sucesso parcial (alguns itens foram bem-sucedidos) |

Os códigos de erro usam prefixos com espaços de nomes: `IO_`, `CONFIG_`, `PERM_`, `DEP_`, `RUNTIME_`, `PARTIAL_`, `INPUT_`, `STATE_`. Os códigos são estáveis após o lançamento.

## Modelo de confiança

**Dados acessados:** lê os arquivos `package.json`, `pyproject.toml` e `SHIP_GATE.md` no diretório de trabalho atual. Escreve arquivos de modelo (`SHIP_GATE.md`, `SECURITY.md`, `CHANGELOG.md`, `SCORECARD.md`) apenas no diretório atual.
**Nenhuma solicitação de rede.** Todas as operações são leituras e gravações locais de arquivos.
**Sem tratamento de segredos.** Não lê, armazena ou transmite credenciais.
**Nenhuma telemetria** coletada ou enviada.

## Implementação de referência

[mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) foi o primeiro repositório a passar no Ship Gate — obtendo uma pontuação de **46/50** após a correção.

## Pontuação

| Categoria | Pontuação | Observações |
|----------|-------|-------|
| A. Segurança | 6/8 | SECURITY.md, modelo de confiança, sem segredos/telemetria. Itens MCP ignorados (não é um servidor MCP) |
| B. Tratamento de erros | 3/7 | Formato estruturado de erro + códigos de saída + sem pilhas brutas. MCP/desktop/vscode ignorado |
| C. Documentação para operadores | 4/7 | README, CHANGELOG, LICENSE, --help. Registro/MCP/complexo ignorado |
| D. Higiene no envio | 6/9 | Script de verificação, versão=tag, npm audit no CI, engines.node, arquivo de bloqueio. Zero dependências = sem mecanismo de atualização |
| E. Identidade | 4/4 | Logotipo, traduções, página inicial, metadados |
| **Total** | **23/31** | 14 itens ignorados com justificativa · `shipcheck audit` passa 100% |

## Licença

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>

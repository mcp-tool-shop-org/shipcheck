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

"Concluído" costumava significar que o código funcionava. Isso não é suficiente. Um produto é código + segurança + tratamento de erros + documentação + identidade + higiene no processo de lançamento. O Shipcheck define o padrão.

## O que está incluído aqui

| Padrão | O que isso cobre |
|----------|----------------|
| [Ship Gate](templates/SHIP_GATE.md) | Lista de verificação de pré-lançamento com 27 itens obrigatórios + 4 itens opcionais. |
| [Error Contract](contracts/error-contract.md) | Padrão estruturado de tratamento de erros com registro de código. |
| [Security Baseline](templates/SECURITY.md) | E-mail de relatório, tempo de resposta, escopo das ameaças. |
| [Handbook](templates/HANDBOOK.md) | Manual operacional para ferramentas complexas. |
| [Scorecard](templates/SCORECARD.md) | Pontuação antes e depois da correção. |
| [Adoption Guide](ADOPTION.md) | Aplique o Shipcheck a qualquer repositório em menos de 30 minutos. |

## Como começar

1. Leia [ADOPTION.md](ADOPTION.md)
2. Copie `templates/SHIP_GATE.md` para a raiz do seu repositório.
3. Marque os itens aplicáveis, e marque os itens não aplicáveis com `SKIP:`.
4. Lance quando todos os itens obrigatórios forem aprovados.

## Como funciona

**Itens obrigatórios** (A-D) bloqueiam o lançamento:

- **A. Segurança básica** — SECURITY.md, modelo de ameaças, sem segredos, sem telemetria, postura de segurança padrão.
- **B. Tratamento de erros** — estrutura de erro padronizada (código/mensagem/dica/tentável), saída segura, degradação graciosa.
- **C. Documentação para o usuário** — README, CHANGELOG, LICENÇA, documentação da ferramenta.
- **D. Higiene no processo de lançamento** — verificação de script, alinhamento de versão, análise de dependências, arquivo de bloqueio.

**Item opcional** (E) não bloqueia, mas define o "todo":

- **E. Identidade** — logotipo, traduções, página de destino, metadados do repositório.

O item indica **o que** deve ser verdadeiro, não **como** implementá-lo. As tags de aplicabilidade (`[all]`, `[npm]`, `[mcp]`, `[cli]`, `[desktop]`, `[vsix]`, `[container]`) evitam constrangimentos em repositórios onde os itens não se aplicam.

## Contrato de erro em resumo

**Nível 1 — Estrutura (obrigatório em todos os lugares):**

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
| 2 | Erro em tempo de execução (falha, falha no backend) |
| 3 | Sucesso parcial (alguns itens foram bem-sucedidos) |

Os códigos de erro usam prefixos com namespace: `IO_`, `CONFIG_`, `PERM_`, `DEP_`, `RUNTIME_`, `PARTIAL_`, `INPUT_`, `STATE_`. Os códigos são estáveis após o lançamento.

## Implementação de referência

[mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) foi o primeiro repositório a passar no Ship Gate — obtendo uma pontuação de **46/50** após a correção.

## Tabela de pontuação

| Categoria | Pontuação | Observações |
|----------|-------|-------|
| A. Segurança | 10/10 | SECURITY.md, sem código executável, sem coleta de dados. |
| B. Tratamento de erros | N/A | Repositório de padrões — sem código para tratamento de erros. |
| C. Documentação para o usuário | 10/10 | README, CHANGELOG, ADOPTION, todos os modelos documentados. |
| D. Higiene no processo de lançamento | 8/10 | Sem código para verificar/testar, todas as versões dos padrões versionadas. |
| E. Identidade | 10/10 | Logotipo, traduções, página de destino, metadados. |
| **Total** | **38/40** | B excluído (não aplicável) |

## Licença

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>

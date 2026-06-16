<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## Perché

"Fatto" significava che il codice funzionava. Ma non è sufficiente. Un prodotto è dato da: codice + sicurezza + gestione degli errori + documentazione + identità + procedure di rilascio corrette. Shipcheck definisce lo standard.

## Cosa contiene

| Standard | A cosa si applica |
|----------|----------------|
| [Ship Gate](templates/SHIP_GATE.md) | 31 controlli obbligatori + 4 controlli facoltativi nella lista di controllo pre-rilascio |
| [Error Contract](contracts/error-contract.md) | Standard strutturato a due livelli per la gestione degli errori con registro del codice |
| [Security Baseline](templates/SECURITY.md) | Email di segnalazione, tempistiche di risposta, ambito delle minacce |
| [Handbook](templates/HANDBOOK.md) | Manuale operativo sul campo per strumenti complessi |
| [Scorecard](templates/SCORECARD.md) | Valutazione pre/post correzione |
| [Adoption Guide](ADOPTION.md) | Applica Shipcheck a qualsiasi repository in meno di 30 minuti |

## Utilizzo della CLI

```bash
npx @mcptoolshop/shipcheck init        # Copy templates into current repo
npx @mcptoolshop/shipcheck audit       # Check SHIP_GATE.md progress
npx @mcptoolshop/shipcheck dogfood     # Check dogfood freshness (Gate F)
npx @mcptoolshop/shipcheck front-door  # Verify the AI-native front door (Gate G)
npx @mcptoolshop/shipcheck help        # Show help
npx @mcptoolshop/shipcheck --version   # Show version
```

Imposta `SHIPCHECK_JSON=1` per ottenere un output strutturato in formato JSON degli errori invece del testo colorato.

## Guida rapida

1. Leggi [ADOPTION.md](ADOPTION.md)
2. Esegui `npx @mcptoolshop/shipcheck init` nella directory principale del tuo repository
3. Spunta gli elementi applicabili in `SHIP_GATE.md`, contrassegna quelli non applicabili con `SKIP:`
4. Esegui `npx @mcptoolshop/shipcheck audit`: l'esecuzione termina con codice 0 quando tutti i controlli obbligatori sono superati
5. Rilascia il prodotto quando l'audit è superato

## Come funziona

**Controlli obbligatori** (A-D) bloccano il rilascio:

- **A. Baseline di sicurezza:** SECURITY.md, modello delle minacce, nessuna informazione sensibile, nessun tracciamento, configurazione di sicurezza predefinita
- **B. Gestione degli errori:** struttura strutturata per gli errori (codice/messaggio/suggerimento/riproducibile), output sicuro, gestione elegante dei problemi
- **C. Documentazione per l'operatore:** README, CHANGELOG, LICENSE, documentazione dello strumento
- **D. Procedure di rilascio corrette:** script di verifica, allineamento delle versioni, scansione delle dipendenze, file di blocco

**Controllo facoltativo** (E) non blocca, ma definisce il "tutto":

- **E. Identità:** logo, traduzioni, pagina di destinazione, metadati del repository

**Controllo F — Freschezza dei test interni** (facoltativo, richiede dogfood-labs):

- Verifica la presenza di un record di test interni recente, verificato e superato
- Supporta le modalità di applicazione: `required` (obbligatorio), `warn-only` (solo avviso), `exempt` (escluso)
- Finestra di tempo configurabile per la freschezza (predefinito: 30 giorni)

**Controllo G — Porta d'accesso nativa AI** (facoltativo, richiede `@mcptoolshop/site-theme` >=2.0.0):

- Verifica che la porta d'accesso nativa AI del repository (README / AGENTS.md / llms.txt) dica la verità: il complemento leggibile dalla macchina della documentazione per l'operatore (C) e dei controlli di identità (E)
- Delega al verificatore [`front-door`](https://github.com/mcp-tool-shop-org/site-theme) di site-theme (`verify({ root })`), che indirizza le affermazioni documentate ai canali di evidenza e restituisce un punteggio ordinato in base al rischio
- Mostra il numero di elementi per livello di gravità (contraddittorio · non supportato · obsoleto · eccessivo · procedure corrette · stile) più il risultato del controllo; **fallisce (exit 1) in caso di affermazioni contraddittorie / non supportate / obsolete**
- site-theme è una **dipendenza facoltativa** (una dipendenza obbligatoria includerebbe Astro in questa CLI senza dipendenze). Quando non è installato, il controllo **viene saltato correttamente** (exit 0): non causa mai l'interruzione dell'audit.

Il controllo indica **cosa** deve essere vero, non **come** implementarlo. I tag di applicabilità (`[all]`, `[npm]`, `[mcp]`, `[cli]`, `[desktop]`, `[vsix]`, `[container]`) impediscono che vengano visualizzate caselle di controllo inutili nei repository in cui gli elementi non sono applicabili.

## Contratto sugli errori, a colpo d'occhio

**Livello 1 — Struttura (obbligatorio ovunque):**

```json
{
  "code": "INPUT_TEXT_EMPTY",
  "message": "Text must not be empty",
  "hint": "Provide at least one character of text",
  "retryable": false
}
```

**Livello 2 — Tipo di base + codici di uscita (CLI/MCP/desktop):**

| Codice di uscita | Significato |
|-----------|---------|
| 0 | OK |
| 1 | Errore dell'utente (input errato, configurazione mancante) |
| 2 | Errore in fase di esecuzione (crash, errore del backend) |
| 3 | Successo parziale (alcuni elementi sono riusciti) |

I codici di errore utilizzano prefissi con nomi specifici: `IO_`, `CONFIG_`, `PERM_`, `DEP_`, `RUNTIME_`, `PARTIAL_`, `INPUT_`, `STATE_`. I codici sono stabili una volta rilasciati.

## Modello di fiducia

**Dati elaborati:** legge i file `package.json`, `pyproject.toml` e `SHIP_GATE.md` nella directory di lavoro corrente. Scrive i file modello (`SHIP_GATE.md`, `SECURITY.md`, `CHANGELOG.md`, `SCORECARD.md`) solo nella directory corrente.
**Nessuna richiesta di rete.** Tutte le operazioni sono letture e scritture locali dei file.
**Nessuna gestione delle informazioni sensibili.** Non legge, memorizza o trasmette credenziali.
**Nessun tracciamento** raccolto o inviato.

## Implementazione di riferimento

[mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) è stato il primo repository a superare Ship Gate, ottenendo un punteggio di **46/50** dopo la correzione.

## Punteggio

| Categoria | Punteggio | Note |
|----------|-------|-------|
| A. Sicurezza | 6/8 | SECURITY.md, modello di fiducia, nessuna informazione sensibile/tracciamento. Gli elementi MCP sono stati saltati (non è un server MCP) |
| B. Gestione degli errori | 3/7 | Struttura strutturata per gli errori + codici di uscita + nessun stack non elaborato. MCP/desktop/vscode sono stati saltati |
| C. Documentazione per l'operatore | 4/7 | README, CHANGELOG, LICENSE, --help. Logging/MCP/complessi sono stati saltati |
| D. Procedure di rilascio corrette | 6/9 | Script di verifica, versione=tag, npm audit in CI, engines.node, file di blocco. Zero dipendenze = nessun meccanismo di aggiornamento |
| E. Identità | 4/4 | Logo, traduzioni, pagina di destinazione, metadati |
| **Total** | **23/31** | 14 elementi saltati con giustificazione · `shipcheck audit` supera il 100% |

## Licenza

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>

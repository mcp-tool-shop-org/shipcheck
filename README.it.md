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

"Fatto" significava che il codice funzionava. Questo non è sufficiente. Un prodotto è costituito da codice + sicurezza + gestione degli errori + documentazione + identità + pratiche di rilascio. Shipcheck definisce gli standard.

## Cosa c'è qui

| Standard | Cosa copre |
|----------|----------------|
| [Ship Gate](templates/SHIP_GATE.md) | 27 controlli preliminari "hard" + 4 controlli preliminari "soft" |
| [Error Contract](contracts/error-contract.md) | Standard strutturato per la gestione degli errori con registro del codice |
| [Security Baseline](templates/SECURITY.md) | Email di segnalazione, tempi di risposta, ambito delle minacce |
| [Handbook](templates/HANDBOOK.md) | Manuale operativo per strumenti complessi |
| [Scorecard](templates/SCORECARD.md) | Valutazione pre/post correzione |
| [Adoption Guide](ADOPTION.md) | Applica Shipcheck a qualsiasi repository in meno di 30 minuti |

## Guida rapida

1. Leggere [ADOPTION.md](ADOPTION.md)
2. Copiare `templates/SHIP_GATE.md` nella directory principale del repository
3. Spuntare le voci applicabili, contrassegnare le voci non applicabili con `SKIP:`
4. Rilasciare quando tutti i controlli preliminari "hard" sono superati

## Come funziona

I **controlli preliminari "hard"** (A-D) bloccano il rilascio:

- **A. Sicurezza di base** — SECURITY.md, modello delle minacce, nessuna informazione sensibile, nessuna telemetria, impostazione di sicurezza predefinita
- **B. Gestione degli errori** — struttura degli errori (codice/messaggio/suggerimento/riprovabile), output sicuro, gestione degli errori controllata
- **C. Documentazione per l'utente** — README, CHANGELOG, LICENZA, documentazione dello strumento
- **D. Pratiche di rilascio** — verifica dello script, allineamento delle versioni, scansione delle dipendenze, file di blocco

Il **controllo preliminare "soft"** (E) non blocca, ma definisce il "quadro generale":

- **E. Identità** — logo, traduzioni, pagina di presentazione, metadati del repository

Il controllo preliminare indica **cosa** deve essere vero, non **come** implementarlo. I tag di applicabilità (`[all]`, `[npm]`, `[mcp]`, `[cli]`, `[desktop]`, `[vsix]`, `[container]`) impediscono che si verifichino situazioni imbarazzanti in repository in cui le voci non sono applicabili.

## Panoramica del contratto di gestione degli errori

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
| 2 | Errore di runtime (crash, errore del backend) |
| 3 | Successo parziale (alcuni elementi hanno avuto successo) |

I codici di errore utilizzano prefissi con spazi dei nomi: `IO_`, `CONFIG_`, `PERM_`, `DEP_`, `RUNTIME_`, `PARTIAL_`, `INPUT_`, `STATE_`. I codici sono stabili una volta rilasciati.

## Implementazione di riferimento

[mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) è stato il primo repository a superare il controllo preliminare Ship Gate, ottenendo un punteggio di **46/50** dopo la correzione.

## Scheda di valutazione

| Categoria | Punteggio | Note |
|----------|-------|-------|
| A. Sicurezza | 10/10 | SECURITY.md, nessun codice eseguibile, nessuna raccolta dati |
| B. Gestione degli errori | N/A | Repository standard — nessun codice per la gestione degli errori |
| C. Documentazione per l'utente | 10/10 | README, CHANGELOG, ADOPTION, tutte le voci documentate |
| D. Pratiche di rilascio | 8/10 | Nessun codice da verificare/testare, tutte le versioni degli standard sono gestite |
| E. Identità | 10/10 | Logo, traduzioni, pagina di presentazione, metadati |
| **Total** | **38/40** | B escluso (non applicabile) |

## Licenza

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>

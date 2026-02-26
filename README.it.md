<p align="center">
  <img src="assets/logo.png" alt="MCP ShipCheck" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-shipcheck/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-shipcheck/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-shipcheck/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

A.k.a. "Supervisore della preparazione per NPM"

Dato un percorso di una cartella di pacchetti, `mcp-shipcheck` genera un report deterministico sullo stato di preparazione per la pubblicazione: indica quali file saranno inclusi nell'archivio, i potenziali problemi evidenti (tipi mancanti, esportazioni errate, assenza di una licenza, ecc.) e una lista concreta di correzioni da effettuare.

Trasforma l'"ansia da rilascio" in un artefatto verificabile tramite software.

## Funzionalità

- **Audit**: Analizza `package.json`, `tsconfig.json`, le esportazioni e l'esistenza dei file per valutare lo stato di preparazione.
- **Anteprima dell'impacchettamento**: Esegue `npm pack --json` per mostrare esattamente quali file vengono inclusi (e le loro dimensioni), senza la necessità di estrarre manualmente un archivio.
- **Spiegazione degli errori**: Fornisce un contesto leggibile e suggerimenti per la correzione di specifici codici di errore.

Tutti gli strumenti sono **solo in lettura** (nessuna correzione automatica), quindi sono sicuri per essere utilizzati automaticamente dai server MCP.

## Strumenti

### `shipcheck.audit`
- **Input**: `{ path: string }` (Percorso assoluto o relativo alla cartella del pacchetto)
- **Output**: Report JSON contenente un punteggio (0-100), risultati strutturati (errori, avvisi, informazioni) e conteggi riassuntivi.

### `shipcheck.packPreview`
- **Input**: `{ path: string }`
- **Output**: Lista JSON dei file che sarebbero inclusi nell'archivio di rilascio, insieme ai metadati.

### `shipcheck.explainFailure`
- **Input**: `{ code: string }` (ad esempio, `PKG.EXPORTS.MISSING`)
- **Output**: Spiegazione dettagliata dell'errore e suggerimenti per la correzione.

## Installazione e utilizzo

### Utilizzo con MCP

Questo strumento è progettato per essere utilizzato con un client MCP (come Claude Desktop o un'estensione IDE).

**Configurazione (mcp-settings.json):**

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

### Compilazione locale

```bash
npm install
npm run build
```

## Licenza

MIT

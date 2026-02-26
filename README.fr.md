<p align="center">
  <img src="assets/logo.png" alt="MCP ShipCheck" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-shipcheck/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-shipcheck/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-shipcheck/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

A.k.a. "Sheriff de la préparation NPM"

Étant donné un dossier de paquet local, `mcp-shipcheck` génère un rapport de préparation à la publication, précis et déterministe : il indique ce qui sera inclus dans l'archive, les erreurs évidentes (types manquants, exports incorrects, absence de LICENSE, etc.), et une liste de corrections concrètes.

Il transforme l'"anxiété liée aux publications" en un artefact vérifiable par une machine.

## Fonctionnalités

- **Audit**: Analyse les fichiers `package.json`, `tsconfig.json`, les exports et l'existence des fichiers pour évaluer le niveau de préparation.
- **Aperçu de l'archive**: Exécute `npm pack --json` pour afficher précisément les fichiers inclus (et leur taille), sans avoir à décompresser manuellement une archive.
- **Explication des erreurs**: Fournit un contexte lisible par l'homme et des corrections pour les codes d'erreur spécifiques.

Tous les outils sont en **lecture seule** (aucune correction automatique), ce qui les rend sûrs pour que les hôtes MCP les appellent automatiquement.

## Outils

### `shipcheck.audit`
- **Entrée**: `{ path: string }` (Chemin absolu ou relatif vers le paquet)
- **Sortie**: Rapport JSON contenant un score (0-100), des résultats structurés (erreurs, avertissements, informations) et des compteurs récapitulatifs.

### `shipcheck.packPreview`
- **Entrée**: `{ path: string }`
- **Sortie**: Liste JSON des fichiers qui seraient inclus dans l'archive de publication, ainsi que des métadonnées.

### `shipcheck.explainFailure`
- **Entrée**: `{ code: string }` (par exemple, `PKG.EXPORTS.MISSING`)
- **Sortie**: Explication détaillée de l'erreur et suggestions de corrections.

## Installation et utilisation

### Utilisation avec MCP

Cet outil est conçu pour être utilisé avec un client MCP (comme Claude Desktop ou une extension IDE).

**Configuration (mcp-settings.json):**

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

### Compilation locale

```bash
npm install
npm run build
```

## Licence

MIT

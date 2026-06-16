<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## Pourquoi

« Terminé » signifiait autrefois que le code fonctionnait. Ce n’est plus suffisant. Un produit, c’est du code + de la sécurité + une gestion des erreurs + de la documentation + une identité + une hygiène d’expédition. Shipcheck définit les critères.

## Qu’y a-t-il ici ?

| Standard | Ce que cela couvre |
|----------|----------------|
| [Ship Gate](templates/SHIP_GATE.md) | 31 contrôles obligatoires + 4 contrôles facultatifs avant la publication |
| [Error Contract](contracts/error-contract.md) | Norme d’erreur structurée à deux niveaux avec registre de code |
| [Security Baseline](templates/SECURITY.md) | Rapport par e-mail, délai de réponse, portée des menaces |
| [Handbook](templates/HANDBOOK.md) | Manuel opérationnel pour les outils complexes |
| [Scorecard](templates/SCORECARD.md) | Évaluation avant/après la correction |
| [Adoption Guide](ADOPTION.md) | Appliquer Shipcheck à n’importe quel dépôt en moins de 30 minutes |

## Utilisation de l’interface en ligne de commande (CLI)

```bash
npx @mcptoolshop/shipcheck init        # Copy templates into current repo
npx @mcptoolshop/shipcheck audit       # Check SHIP_GATE.md progress
npx @mcptoolshop/shipcheck dogfood     # Check dogfood freshness (Gate F)
npx @mcptoolshop/shipcheck front-door  # Verify the AI-native front door (Gate G)
npx @mcptoolshop/shipcheck help        # Show help
npx @mcptoolshop/shipcheck --version   # Show version
```

Définissez `SHIPCHECK_JSON=1` pour obtenir une sortie d’erreur JSON structurée au lieu d’un texte coloré.

## Démarrage rapide

1. Lisez [ADOPTION.md](ADOPTION.md)
2. Exécutez `npx @mcptoolshop/shipcheck init` dans le répertoire racine de votre dépôt
3. Cochez les éléments applicables dans `SHIP_GATE.md`, marquez ceux qui ne le sont pas avec `SKIP :`
4. Exécutez `npx @mcptoolshop/shipcheck audit` — s’arrête avec le code 0 lorsque tous les contrôles obligatoires sont réussis
5. Publiez une fois que l’audit est réussi

## Comment cela fonctionne

**Contrôles obligatoires** (A à D) : bloquent la publication :

- **A. Base de sécurité** — SECURITY.md, modèle de menace, pas de secrets, pas de télémétrie, posture de sécurité par défaut
- **B. Gestion des erreurs** — structure d’erreur structurée (code/message/indice/réessayable), sortie sécurisée, dégradation progressive
- **C. Documentation pour les opérateurs** — README, CHANGELOG, LICENSE, documentation de l’outil
- **D. Hygiène d’expédition** — script de vérification, alignement des versions, analyse des dépendances, fichier de verrouillage

**Contrôle facultatif** (E) : ne bloque pas, mais définit le « tout » :

- **E. Identité** — logo, traductions, page d’accueil, métadonnées du dépôt

**Contrôle F — Fraîcheur de la version test** (facultatif, nécessite dogfood-labs) :

- Vérifie qu’il existe un enregistrement de version test récent et vérifié
- Prend en charge les modes d’application : `required` (obligatoire), `warn-only` (alerte uniquement), `exempt` (exemption)
- Fenêtre de fraîcheur configurable (par défaut : 30 jours)

**Contrôle G — Porte d’entrée native pour l’IA** (facultatif, nécessite `@mcptoolshop/site-theme` >=2.0.0) :

- Vérifie que la porte d’entrée native pour l’IA du dépôt (README / AGENTS.md / llms.txt) dit la vérité — le complément lisible par machine de la documentation pour les opérateurs (C) et des contrôles d’identité (E)
- Délègue au vérificateur [`front-door`](https://github.com/mcp-tool-shop-org/site-theme) de site-theme (`verify({ root })`), qui dirige les affirmations documentées vers des canaux de preuve et renvoie un tableau de bord classé par ordre de risque
- Affiche le nombre par niveau de gravité (en contradiction · non étayé · obsolète · superflu · hygiène · style), ainsi que le verdict du contrôle ; **échoue (code de sortie 1) en cas d’affirmations contradictoires / non étayées / obsolètes**
- site-theme est une **dépendance facultative** (une dépendance obligatoire entraînerait l’inclusion d’astro dans cette interface CLI sans dépendances). Lorsqu’il n’est pas installé, le contrôle **passe en douceur** (code de sortie 0) — il ne provoque jamais l’échec de l’audit

Le contrôle indique **ce qui** doit être vrai, et non **comment** le mettre en œuvre. Les balises d’applicabilité (`[all]`, `[npm]`, `[mcp]`, `[cli]`, `[desktop]`, `[vsix]`, `[container]`) évitent que des éléments ne soient cochés inutilement dans les dépôts où ils ne s’appliquent pas.

## Contrat d’erreur en un coup d’œil

**Niveau 1 — Forme (obligatoire partout) :**

```json
{
  "code": "INPUT_TEXT_EMPTY",
  "message": "Text must not be empty",
  "hint": "Provide at least one character of text",
  "retryable": false
}
```

**Niveau 2 — Type de base + codes de sortie (CLI/MCP/bureau) :**

| Code de sortie | Signification |
|-----------|---------|
| 0 | OK |
| 1 | Erreur utilisateur (mauvaise entrée, configuration manquante) |
| 2 | Erreur d’exécution (plantage, échec du serveur principal) |
| 3 | Succès partiel (certains éléments ont réussi) |

Les codes d’erreur utilisent des préfixes avec espace de noms : `IO_`, `CONFIG_`, `PERM_`, `DEP_`, `RUNTIME_`, `PARTIAL_`, `INPUT_`, `STATE_`. Les codes sont stables une fois publiés.

## Modèle de confiance

**Données traitées :** lit les fichiers `package.json`, `pyproject.toml` et `SHIP_GATE.md` dans le répertoire de travail actuel. Écrit des fichiers modèles (`SHIP_GATE.md`, `SECURITY.md`, `CHANGELOG.md`, `SCORECARD.md`) uniquement dans le répertoire actuel.
**Aucune requête réseau.** Toutes les opérations sont des lectures et écritures de fichiers locales.
**Aucune gestion des secrets.** Ne lit, ne stocke ni ne transmet pas d’informations d’identification.
**Aucune télémétrie** collectée ou envoyée.

## Implémentation de référence

[mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) a été le premier dépôt à passer Ship Gate — avec un score de **46/50** après correction.

## Tableau de bord

| Catégorie | Score | Notes |
|----------|-------|-------|
| A. Sécurité | 6/8 | SECURITY.md, modèle de confiance, pas de secrets/télémétrie. Les éléments MCP sont ignorés (ce n’est pas un serveur MCP) |
| B. Gestion des erreurs | 3/7 | Structure d’erreur structurée + codes de sortie + pas de piles brutes. Ignoré pour MCP/bureau/vscode |
| C. Documentation pour les opérateurs | 4/7 | README, CHANGELOG, LICENSE, --help. Ignoré pour la journalisation/MCP/complexité |
| D. Hygiène d’expédition | 6/9 | Script de vérification, version=balise, npm audit dans CI, engines.node, fichier de verrouillage. Zéro dépendance = pas de mécanisme de mise à jour |
| E. Identité | 4/4 | Logo, traductions, page d’accueil, métadonnées |
| **Total** | **23/31** | 14 éléments ignorés avec justification · `shipcheck audit` réussit à 100 % |

## Licence

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>

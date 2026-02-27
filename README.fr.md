<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/shipcheck/readme.png" alt="Shipcheck" width="400">
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

"Terminé" signifiait autrefois que le code fonctionnait. Ce n'est pas suffisant. Un produit est constitué de code + sécurité + gestion des erreurs + documentation + identité + bonnes pratiques de déploiement. Shipcheck définit les exigences.

## Ce qui se trouve ici

| Standard | Ce que cela couvre |
|----------|----------------|
| [Ship Gate](templates/SHIP_GATE.md) | Liste de contrôle de pré-publication avec 27 critères obligatoires et 4 critères optionnels. |
| [Error Contract](contracts/error-contract.md) | Norme structurée en deux niveaux pour la gestion des erreurs, avec un registre de code. |
| [Security Baseline](templates/SECURITY.md) | Email de rapport, délai de réponse, étendue des risques. |
| [Handbook](templates/HANDBOOK.md) | Manuel d'utilisation pour les outils complexes. |
| [Scorecard](templates/SCORECARD.md) | Notation avant et après la correction des problèmes. |
| [Adoption Guide](ADOPTION.md) | Appliquez Shipcheck à n'importe quel dépôt en moins de 30 minutes. |

## Démarrage rapide

1. Lisez [ADOPTION.md](ADOPTION.md)
2. Copiez `templates/SHIP_GATE.md` dans la racine de votre dépôt.
3. Cochez les éléments applicables, indiquez "SKIP:" pour les éléments non applicables.
4. Déployez lorsque tous les critères obligatoires sont remplis.

## Comment cela fonctionne

Les **critères obligatoires** (A à D) bloquent la publication :

- **A. Sécurité de base** — SECURITY.md, modèle de menace, pas de secrets, pas de télémétrie, posture de sécurité par défaut.
- **B. Gestion des erreurs** — structure des erreurs (code/message/indice/réessayable), sortie sécurisée, dégradation progressive.
- **C. Documentation pour l'utilisateur** — README, CHANGELOG, LICENSE, documentation de l'outil.
- **D. Bonnes pratiques de déploiement** — vérification du script, alignement des versions, analyse des dépendances, fichier de verrouillage.

Le **critère optionnel** (E) ne bloque pas, mais définit l'ensemble du produit :

- **E. Identité** — logo, traductions, page d'accueil, métadonnées du dépôt.

Le critère indique **ce qui** doit être vrai, et non **comment** l'implémenter. Les balises d'applicabilité (`[all]`, `[npm]`, `[mcp]`, `[cli]`, `[desktop]`, `[vsix]`, `[container]`) évitent les situations embarrassantes dans les dépôts où certains éléments ne sont pas applicables.

## Vue d'ensemble du contrat de gestion des erreurs

**Niveau 1 — Structure (obligatoire partout) :**

```json
{
  "code": "INPUT_TEXT_EMPTY",
  "message": "Text must not be empty",
  "hint": "Provide at least one character of text",
  "retryable": false
}
```

**Niveau 2 — Type de base + codes de sortie (CLI/MCP/bureau) :**

| Code de sortie | Signification |
|-----------|---------|
| 0 | OK |
| 1 | Erreur utilisateur (mauvaise entrée, configuration manquante) |
| 2 | Erreur d'exécution (plantage, panne du serveur) |
| 3 | Succès partiel (certains éléments ont réussi) |

Les codes d'erreur utilisent des préfixes spécifiques : `IO_`, `CONFIG_`, `PERM_`, `DEP_`, `RUNTIME_`, `PARTIAL_`, `INPUT_`, `STATE_`. Les codes sont stables une fois publiés.

## Implémentation de référence

[mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) était le premier dépôt à avoir passé Ship Gate, avec un score de **46/50** après correction des problèmes.

## Tableau de bord

| Catégorie | Score | Notes |
|----------|-------|-------|
| A. Sécurité | 10/10 | SECURITY.md, pas de code exécutable, pas de collecte de données. |
| B. Gestion des erreurs | N/A | Dépôt de normes — pas de code pour la gestion des erreurs. |
| C. Documentation pour l'utilisateur | 10/10 | README, CHANGELOG, ADOPTION, tous les modèles documentés. |
| D. Bonnes pratiques de déploiement | 8/10 | Pas de code à vérifier/tester, toutes les normes versionnées. |
| E. Identité | 10/10 | Logo, traductions, page d'accueil, métadonnées. |
| **Total** | **38/40** | B exclu (non applicable). |

## Licence

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>

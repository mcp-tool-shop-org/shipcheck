<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## ¿Por qué?

Antes, "hecho" significaba que el código funcionaba. Eso ya no es suficiente. Un producto es código + seguridad + manejo de errores + documentación + identidad + buenas prácticas de publicación. Shipcheck define el estándar.

## ¿Qué hay aquí?

| Estándar | ¿Qué cubre? |
|----------|----------------|
| [Ship Gate](templates/SHIP_GATE.md) | Lista de verificación de pre-lanzamiento con 27 puntos obligatorios + 4 puntos opcionales. |
| [Error Contract](contracts/error-contract.md) | Estándar estructurado de manejo de errores con registro de código. |
| [Security Baseline](templates/SECURITY.md) | Correo electrónico de informe, plazo de respuesta, alcance de las amenazas. |
| [Handbook](templates/HANDBOOK.md) | Manual de operación para herramientas complejas. |
| [Scorecard](templates/SCORECARD.md) | Puntuación antes/después de la corrección. |
| [Adoption Guide](ADOPTION.md) | Aplica Shipcheck a cualquier repositorio en menos de 30 minutos. |

## Cómo empezar

1. Lee [ADOPTION.md](ADOPTION.md)
2. Copia `templates/SHIP_GATE.md` en la raíz de tu repositorio.
3. Marca los elementos aplicables, y marca los no aplicables con `SKIP:`.
4. Publica cuando todos los puntos obligatorios hayan sido superados.

## Cómo funciona

Las **etapas obligatorias** (A-D) bloquean el lanzamiento:

- **A. Seguridad básica** — SECURITY.md, modelo de amenazas, sin secretos, sin telemetría, postura de seguridad predeterminada.
- **B. Manejo de errores** — estructura de errores definida (código/mensaje/sugerencia/reintentable), salida segura, degradación controlada.
- **C. Documentación para el usuario** — README, CHANGELOG, LICENCIA, documentación de la herramienta.
- **D. Buenas prácticas de publicación** — verificación de scripts, alineación de versiones, análisis de dependencias, archivo de bloqueo.

La **etapa opcional** (E) no bloquea, pero define el "conjunto completo":

- **E. Identidad** — logotipo, traducciones, página de inicio, metadatos del repositorio.

La etapa indica **qué** debe ser cierto, no **cómo** implementarlo. Las etiquetas de aplicabilidad (`[all]`, `[npm]`, `[mcp]`, `[cli]`, `[desktop]`, `[vsix]`, `[container]`) evitan que se marquen casillas de verificación innecesariamente en repositorios donde los elementos no son aplicables.

## Contrato de errores de un vistazo

**Nivel 1 — Estructura (obligatorio en todas partes):**

```json
{
  "code": "INPUT_TEXT_EMPTY",
  "message": "Text must not be empty",
  "hint": "Provide at least one character of text",
  "retryable": false
}
```

**Nivel 2 — Tipo base + códigos de salida (CLI/MCP/escritorio):**

| Código de salida | Significado |
|-----------|---------|
| 0 | OK |
| 1 | Error del usuario (entrada incorrecta, configuración faltante) |
| 2 | Error en tiempo de ejecución (fallo, fallo del backend) |
| 3 | Éxito parcial (algunos elementos tuvieron éxito) |

Los códigos de error utilizan prefijos con espacio de nombres: `IO_`, `CONFIG_`, `PERM_`, `DEP_`, `RUNTIME_`, `PARTIAL_`, `INPUT_`, `STATE_`. Los códigos son estables una vez que se publican.

## Implementación de referencia

[mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) fue el primer repositorio en superar la etapa de publicación, obteniendo una puntuación de **46/50** después de la corrección.

## Cuadro de puntuación

| Categoría | Puntuación | Notas |
|----------|-------|-------|
| A. Seguridad | 10/10 | SECURITY.md, sin código ejecutable, sin recopilación de datos. |
| B. Manejo de errores | N/A | Repositorio de estándares — no hay código para generar errores. |
| C. Documentación para el usuario | 10/10 | README, CHANGELOG, ADOPTION, todas las plantillas documentadas. |
| D. Buenas prácticas de publicación | 8/10 | Sin código para verificar/probar, todas las versiones de los estándares. |
| E. Identidad | 10/10 | Logotipo, traducciones, página de inicio, metadatos. |
| **Total** | **38/40** | B excluido (no aplicable). |

## Licencia

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>

<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## ¿Por qué?

"Hecho" solía significar que el código funciona. Eso no es suficiente. Un producto es código + seguridad + manejo de errores + documentación + identidad + higiene de lanzamiento. Shipcheck define el estándar.

## ¿Qué hay aquí?

| Estándar | Qué cubre |
|----------|----------------|
| [Ship Gate](templates/SHIP_GATE.md) | Lista de verificación de pre-lanzamiento con 31 elementos obligatorios + 4 elementos opcionales |
| [Error Contract](contracts/error-contract.md) | Estándar estructurado de errores en dos niveles con registro de código |
| [Security Baseline](templates/SECURITY.md) | Informe por correo electrónico, cronograma de respuesta, alcance de la amenaza |
| [Handbook](templates/HANDBOOK.md) | Manual operativo de campo para herramientas complejas |
| [Scorecard](templates/SCORECARD.md) | Puntuación pre/post-remediación |
| [Adoption Guide](ADOPTION.md) | Aplicar Shipcheck a cualquier repositorio en <30 minutos |

## Uso de la CLI

```bash
npx @mcptoolshop/shipcheck init        # Copy templates into current repo
npx @mcptoolshop/shipcheck audit       # Check SHIP_GATE.md progress
npx @mcptoolshop/shipcheck dogfood     # Check dogfood freshness (Gate F)
npx @mcptoolshop/shipcheck front-door  # Verify the AI-native front door (Gate G)
npx @mcptoolshop/shipcheck help        # Show help
npx @mcptoolshop/shipcheck --version   # Show version
```

Establece `SHIPCHECK_JSON=1` para obtener una salida de errores JSON estructurada en lugar de texto con colores.

## Guía rápida

1. Lee [ADOPTION.md](ADOPTION.md)
2. Ejecuta `npx @mcptoolshop/shipcheck init` en la raíz de tu repositorio
3. Marca los elementos aplicables en `SHIP_GATE.md`, marca los no aplicables con `SKIP:`
4. Ejecuta `npx @mcptoolshop/shipcheck audit`; sale con 0 cuando todas las puertas obligatorias se superan
5. Lanza el producto cuando la auditoría sea exitosa

## Cómo funciona

**Puertas obligatorias** (A-D) bloquean el lanzamiento:

- **A. Línea de base de seguridad:** SECURITY.md, modelo de amenazas, sin secretos, sin telemetría, postura de seguridad predeterminada
- **B. Manejo de errores:** forma estructurada de error (código/mensaje/sugerencia/reintentable), salida segura, degradación gradual
- **C. Documentación para operadores:** README, CHANGELOG, LICENSE, documentación de la herramienta
- **D. Higiene de lanzamiento:** script de verificación, alineación de versiones, análisis de dependencias, archivo de bloqueo

**Puerta opcional** (E) no bloquea pero define el "conjunto completo":

- **E. Identidad:** logotipo, traducciones, página de destino, metadatos del repositorio

**Puerta F: Frescura de Dogfood** (opcional, requiere dogfood-labs):

- Verifica si hay un registro de dogfood reciente, verificado y exitoso
- Admite modos de aplicación: `required` (obligatorio), `warn-only` (solo advertencia), `exempt` (exento)
- Ventana de frescura configurable (predeterminada: 30 días)

**Puerta G: Puerta frontal nativa de IA** (opcional, requiere `@mcptoolshop/site-theme` >=2.0.0):

- Verifica que la puerta frontal nativa de IA del repositorio (README / AGENTS.md / llms.txt) diga la verdad: el complemento legible por máquina de la documentación para operadores (C) y las puertas de identidad (E)
- Delega al verificador [`front-door`](https://github.com/mcp-tool-shop-org/site-theme) de site-theme (`verify({ root })`), que enruta las afirmaciones documentadas a los canales de evidencia y devuelve una puntuación ordenada por riesgo
- Muestra recuentos por gravedad (contradictorio · sin respaldo · obsoleto · hinchazón · higiene · estilo) más el veredicto de la puerta; **falla (sale con 1) en las afirmaciones contradictorias / sin respaldo / obsoletas**
- site-theme es una **dependencia opcional** (una dependencia estricta incluiría astro en esta CLI de cero dependencias). Cuando no está instalado, la puerta **se omite correctamente** (sale con 0); nunca interrumpe la auditoría

La puerta indica **qué** debe ser verdadero, no **cómo** implementarlo. Las etiquetas de aplicabilidad (`[all]`, `[npm]`, `[mcp]`, `[cli]`, `[desktop]`, `[vsix]`, `[container]`) evitan la vergüenza de las casillas de verificación en los repositorios donde los elementos no aplican.

## Contrato de errores a primera vista

**Nivel 1: Forma (obligatorio en todas partes):**

```json
{
  "code": "INPUT_TEXT_EMPTY",
  "message": "Text must not be empty",
  "hint": "Provide at least one character of text",
  "retryable": false
}
```

**Nivel 2: Tipo base + códigos de salida (CLI/MCP/escritorio):**

| Código de salida | Significado |
|-----------|---------|
| 0 | OK |
| 1 | Error del usuario (entrada incorrecta, configuración faltante) |
| 2 | Error en tiempo de ejecución (fallo, fallo del backend) |
| 3 | Éxito parcial (algunos elementos tuvieron éxito) |

Los códigos de error utilizan prefijos con nombres: `IO_`, `CONFIG_`, `PERM_`, `DEP_`, `RUNTIME_`, `PARTIAL_`, `INPUT_`, `STATE_`. Los códigos son estables una vez que se lanzan.

## Modelo de confianza

**Datos afectados:** lee `package.json`, `pyproject.toml` y `SHIP_GATE.md` en el directorio de trabajo actual. Escribe archivos de plantilla (`SHIP_GATE.md`, `SECURITY.md`, `CHANGELOG.md`, `SCORECARD.md`) solo en el directorio actual.
**No se realizan solicitudes a la red.** Todas las operaciones son lecturas y escrituras locales de archivos.
**No se manejan secretos.** No lee, almacena ni transmite credenciales.
**No se recopila ni envía telemetría**.

## Implementación de referencia

[mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) fue el primer repositorio en pasar la Puerta Ship, obteniendo una puntuación de **46/50** después de la remediación.

## Puntuación

| Categoría | Puntuación | Notas |
|----------|-------|-------|
| A. Seguridad | 6/8 | SECURITY.md, modelo de confianza, sin secretos/telemetría. Los elementos de MCP se omitieron (no es un servidor MCP) |
| B. Manejo de errores | 3/7 | Forma estructurada de error + códigos de salida + sin pilas en bruto. Se omitieron los elementos de MCP/escritorio/vscode |
| C. Documentación para operadores | 4/7 | README, CHANGELOG, LICENSE, --help. Se omitió la documentación/MCP/compleja |
| D. Higiene de lanzamiento | 6/9 | script de verificación, versión=etiqueta, auditoría npm en CI, engines.node, archivo de bloqueo. Cero dependencias = sin mecanismo de actualización |
| E. Identidad | 4/4 | Logotipo, traducciones, página de destino, metadatos |
| **Total** | **23/31** | 14 elementos omitidos con justificación · `shipcheck audit` pasa al 100% |

## Licencia

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>

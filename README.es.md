<p align="center">
  <img src="assets/logo.png" alt="MCP ShipCheck" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-shipcheck/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-shipcheck/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-shipcheck/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

A.k.a. "Supervisor de Preparación para NPM"

Dado un directorio de paquete local, `mcp-shipcheck` genera un informe determinista sobre la preparación para la publicación: qué se incluirá en el archivo tar, posibles problemas evidentes (tipos faltantes, exportaciones incorrectas, ausencia de la licencia, etc.), y una lista concreta de soluciones.

Transforma la "ansiedad por la publicación" en un artefacto verificable por una máquina.

## Características

- **Auditoría**: Analiza `package.json`, `tsconfig.json`, las exportaciones y la existencia de archivos para evaluar el nivel de preparación.
- **Vista Previa del Empaquetado**: Ejecuta `npm pack --json` para mostrar exactamente qué archivos se incluirán (y sus tamaños), sin necesidad de desempaquetar manualmente un archivo tar.
- **Explicación de Errores**: Proporciona contexto legible por humanos y soluciones para códigos de error específicos.

Todas las herramientas son de **solo lectura** (no realizan correcciones automáticas), por lo que son seguras para que los hosts de MCP las llamen automáticamente.

## Herramientas

### `shipcheck.audit`
- **Entrada**: `{ path: string }` (Ruta absoluta o relativa al paquete)
- **Salida**: Informe JSON que contiene una puntuación (0-100), resultados estructurados (fallos, advertencias, información) y recuentos resumidos.

### `shipcheck.packPreview`
- **Entrada**: `{ path: string }`
- **Salida**: Lista JSON de archivos que se incluirían en el archivo tar de la publicación, junto con metadatos.

### `shipcheck.explainFailure`
- **Entrada**: `{ code: string }` (por ejemplo, `PKG.EXPORTS.MISSING`)
- **Salida**: Explicación detallada del error y soluciones sugeridas.

## Instalación y Uso

### Uso con MCP

Esta herramienta está diseñada para ser utilizada con un cliente de MCP (como Claude Desktop o una extensión de IDE).

**Configuración (mcp-settings.json):**

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

### Compilación Local

```bash
npm install
npm run build
```

## Licencia

MIT

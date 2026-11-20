# dropmind-web-guidance — notas del fork

Fork de [`GoogleChrome/modern-web-guidance-src`](https://github.com/GoogleChrome/modern-web-guidance-src) (Apache-2.0).
Base upstream: `e53cb7b6e8713c2903786735f251521679380b18` (2026-11-20).

**Principio de diseño:** el diff contra upstream en `src/` se mantiene mínimo. El rebrand y la reescritura de comandos se hacen **en el post-build** (`src/build/fork-postbuild.mjs`), así `git rebase upstream/main` casi nunca choca.

## Cambios en el código fuente

| Archivo | Cambio |
|---|---|
| `src/cli/telemetry/clearcut-logger.ts` | `ClearcutLogger` es no-op (misma API). No lanza procesos ni hace POST a `play.googleapis.com`. |
| `src/cli/telemetry/watchdog/*`, `watchdog-client.ts` | Eliminados. |
| `src/cli/telemetry/{clearcut-logger,telemetry-optout}.test.ts` | Eliminados (probaban la telemetría). |
| `src/build/build-dist.ts` | Ya no empaqueta `watchdog/main.js`. |
| `src/cli/modern-web.ts` | `install`/`update`/`uninstall` deshabilitados (exit 2): ejecutaban `npx skills` (telemetría propia a `skills.sh/tele`) y reinstalaban los skills oficiales. |
| `src/cli/modern-web.test.ts` | Los tests de install/uninstall se reemplazaron por un test que verifica el bloqueo. |
| `.github/workflows/*` de upstream, `dependabot.yml`, `atls.json`, templates, `CODEOWNERS` | Eliminados (publish a npm, crons de triage/sync, deploy de páginas). En su lugar va `fork-ci.yml`. |
| `package.json` | `name: dropmind-web-guidance-src` y script `build:fork`. |
| `AGENTS.md` | Nota al inicio: las reglas de PR/CLA de Google aplican solo a contribuciones hacia upstream. |
| `fork/assets/logo.{svg,png}` (nuevo) | Logo propio del fork (gota con `</>`), sin relación con el de upstream. |
| `.github/README.md`, `.github/CONTRIBUTING.md`, `.github/SECURITY.md`, `NOTICE` (nuevos) | Portada del repo en GitHub, a dónde va cada contribución (upstream o fork), política de seguridad y atribución de Apache-2.0. |

## Post-build (`pnpm build:fork`)

`fork-postbuild.mjs` toma `dist/skills-cli` y:
1. Renombra `skills/modern-web-guidance` → `skills/dropmind-web-guidance` y `chrome-extensions` → `dropmind-chrome-extensions`.
2. Cambia el binario, los nombres de los skills, los manifests de plugins (Claude, Codex, Cursor, Gemini, Kimi, Grok, Copilot), las URLs y los **textos que generan los bundles al ejecutarse** (`legacy-scan` `retrieveCommand`, mensajes de feature gates y de uso).
3. Reescribe toda invocación `npx|pnpx modern-web-guidance@latest` al binario local, en `.md`, `.json`, `.json.gz` y `.mjs`.
4. Reemplaza `assets/logo.png` por el logo del fork y quita `.github/img` (las imágenes de marca de upstream).
5. Marca el `package.json` publicado como `private: true` para evitar un `npm publish` accidental.
6. **Falla el build** si quedan el logo de upstream, telemetría, algún `npx` al paquete, el nombre `modern-web-guidance` o las URLs de upstream.

La identidad del fork (nombre, owner, autor) son constantes al inicio de `fork-postbuild.mjs`.

## Build e instalación

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm build:fork
SKILLS_DIR=~/.claude/skills ./scripts/install-local.sh
```

## Sincronizar con upstream

```bash
git remote add upstream https://github.com/GoogleChrome/modern-web-guidance-src.git   # una vez
git fetch upstream && git rebase upstream/main
# si upstream vuelve a agregar workflows: git rm -r <esos archivos> antes de continuar el rebase
pnpm build:fork && node --test "src/cli/**/*.test.ts"
grep -rnE "fetch\(|https?://|spawn" src/cli    # revisión manual de salidas nuevas
```

## Notas

- **Embeddings:** las guías agregadas después del último release de upstream no tienen vector en la caché y se buscan solo con BM25 (el build lo avisa).
- **CDNs en las guías:** algunas guías sugieren polyfills desde `unpkg`/`jsdelivr`. La herramienta no los carga, pero un agente los puede escribir en tu código. Si necesitas offline/on-prem, dilo en tu `CLAUDE.md`/`AGENTS.md`.
- **`.mwgrc`:** se conserva el mismo nombre de archivo de config (baseline, opt-ins) que upstream.
- **Licencia:** Apache-2.0. Ver `LICENSE` y `NOTICE`. Los archivos de código modificados lo indican con un comentario.

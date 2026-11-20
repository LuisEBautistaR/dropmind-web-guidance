# Contribuir a dropmind-web-guidance

Este repo es un **fork** de [`GoogleChrome/modern-web-guidance-src`](https://github.com/GoogleChrome/modern-web-guidance-src). Antes de abrir un issue o PR, revisa a dónde va:

| Quieres… | Va a… |
|---|---|
| Corregir o agregar **contenido de una guía** (`guides/`, `skills-src/`) | **Upstream** (Google). Sigue su [`CONTRIBUTING.md`](../CONTRIBUTING.md), que pide firmar el CLA de Google. Cuando lo acepten, llega aquí con el siguiente rebase. |
| Algo del **fork**: telemetría, offline, rebrand, `fork-postbuild.mjs`, `install-local.sh`, CI | **Aquí**. No se necesita CLA. |

## Reglas para PRs de este fork

- El diff contra upstream en `src/` debe quedar **mínimo**. Siempre que se pueda, el cambio va en `src/build/fork-postbuild.mjs` y no en el código de upstream, para que los rebases no choquen.
- Nada que salga a la red en tiempo de ejecución. `pnpm build:fork` y el job `fork-ci` (que verifica cero red) tienen que pasar.
- Al contribuir aceptas que tu aporte se licencie bajo Apache-2.0 (ver [`LICENSE`](../LICENSE) y [`NOTICE`](../NOTICE)).

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm build:fork
node --test "src/cli/**/*.test.ts"
```

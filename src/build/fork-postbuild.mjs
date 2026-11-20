#!/usr/bin/env node
// dropmind-web-guidance — post-build sobre dist/skills-cli.
// 1) Rebrand completo (paquete, binario, skills, manifests, URLs, textos runtime de los bundles)
// 2) Reescribe toda invocación `npx|pnpx modern-web-guidance[@latest]` al binario local
// 3) Guardas: el build FALLA si queda telemetría, npx al paquete oficial o el nombre/URLs de upstream.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// ---- Identidad del fork (cambia aquí si renombras) --------------------------------------
const NAME = 'dropmind-web-guidance';           // paquete, binario y skill principal
const TITLE = 'Dropmind Web Guidance';
const CE_NAME = 'dropmind-chrome-extensions';   // skill secundario
const OWNER = 'LuisEBautistaR';
const AUTHOR = 'dropmind';
const REPO = `https://github.com/${OWNER}/${NAME}`;
const UPSTREAM = 'https://github.com/GoogleChrome/modern-web-guidance-src';
// ----------------------------------------------------------------------------------------

const root = path.resolve(process.argv[2] ?? 'dist/skills-cli');
const S = (...p) => path.join(root, ...p);
if (!fs.existsSync(S('skills/modern-web-guidance/modern-web.mjs'))) {
  console.error(`No hay build upstream en ${root}; corre primero: pnpm build`); process.exit(1);
}

// 1. Renombrar carpetas
fs.renameSync(S('skills/modern-web-guidance'), S('skills', NAME));
if (fs.existsSync(S('skills/chrome-extensions'))) fs.renameSync(S('skills/chrome-extensions'), S('skills', CE_NAME));
if (fs.existsSync(S('policies/modern-web-guidance.toml'))) fs.renameSync(S('policies/modern-web-guidance.toml'), S('policies', `${NAME}.toml`));
fs.rmSync(S('skills', NAME, 'watchdog'), { recursive: true, force: true });

// 2. Reglas de texto (el orden importa: URLs antes del reemplazo genérico del nombre)
const rules = [
  [/\b(?:npx(?:\.cmd)? -y|npx(?:\.cmd)?|pnpx|pnpm dlx|yarn dlx) modern-web-guidance(?:@latest)?/g, NAME],
  [/modern-web-guidance@latest/g, NAME],
  [/ --skill-version [0-9_a-f-]+/g, ''],
  [/https:\/\/googlechrome\.github\.io\/modern-web-guidance-src\/?/g, REPO],
  [/https:\/\/github\.com\/GoogleChrome\/modern-web-guidance(?:-src)?(?:\.git)?/g, REPO],
  [/https:\/\/developer\.chrome\.com\/docs\/modern-web-guidance/g, REPO],
  [/https:\/\/policies\.google\.com\/(?:privacy|terms)/g, REPO],
  [/GoogleChrome\/modern-web-guidance(?:-src)?/g, `${OWNER}/${NAME}`],
  [/modern-web-guidance@(?:googlechrome|claude-plugins-official)/g, `${NAME}@${AUTHOR}`],
  [/^name: chrome-extensions$/m, `name: ${CE_NAME}`],
  [/`chrome-extensions` skill/g, `\`${CE_NAME}\` skill`],
  [/\bmodern-web-guidance(?![-\w])/g, NAME],
  [/Modern Web Guidance/g, TITLE],
  [/Stewarded by the Google Chrome, Microsoft Edge, Mozilla Firefox, and MDN teams, it injects/g,
    `Telemetry-free, offline fork of Google's Modern Web Guidance (Apache-2.0). It injects`],
  [/"(?:Google Chrome|googlechrome|GoogleChrome)"/g, `"${AUTHOR}"`],
  [/"commandRegex": "modern-web"|commandRegex = "modern-web"/g, (m) => m.replace('modern-web', 'dropmind-web')],
  // SKILL.md: sección de runner/red
  [/directly with `npx` using/g, 'directly (local binary on PATH) using'],
  [/^## Using npx \/ pnpx$/m, '## Running the CLI'],
  [/^- \*\*Runner & Permissions\*\*:.*$/m, `- **Runner**: call the \`${NAME}\` binary directly (it is on PATH). Allowlist \`${NAME} *\`.`],
  [/^- \*\*Sandboxes & Network\*\*:.*$/m, `- **Offline**: this is a local, telemetry-free build that needs no network access. Never invoke it through npx/pnpx.`],
  [/^- \*\*Offline\*\*: If the command hangs.*\n/m, ''],
];
const rewrite = (s) => rules.reduce((acc, [re, to]) => acc.replace(re, to), s);
const SKIP = new Set(['LICENSE', 'THIRD_PARTY_NOTICES', 'README.md', 'NOTICE']);
const TEXT = /\.(md|json|mjs|js|toml|txt)$/;

let changed = 0;
const walk = (dir, fn) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, fn); } else fn(p, e.name);
  }
};
walk(root, (p, name) => {
  if (SKIP.has(name) && path.dirname(p) === root) return;
  if (TEXT.test(name)) {
    const s = fs.readFileSync(p, 'utf8'); const t = rewrite(s);
    if (t !== s) { fs.writeFileSync(p, t); changed++; }
  } else if (name.endsWith('.json.gz')) {
    const s = zlib.gunzipSync(fs.readFileSync(p)).toString('utf8'); const t = rewrite(s);
    if (t !== s) { fs.writeFileSync(p, zlib.gzipSync(t, { level: 9 })); changed++; }
  }
});

// 3. package.json publicado
const pkgPath = S('package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
Object.assign(pkg, {
  name: NAME,
  displayName: TITLE,
  description: 'Telemetry-free, offline fork of Google Modern Web Guidance for coding agents.',
  version: `${pkg.version}-${AUTHOR}`,
  publisher: AUTHOR,
  homepage: REPO,
  repository: { type: 'git', url: `${REPO}.git` },
  bugs: { url: `${REPO}/issues` },
  bin: { [NAME]: `skills/${NAME}/modern-web.mjs` },
  private: true, // evita un `npm publish` accidental con este nombre
});
pkg.contributes = { chatSkills: [{ path: `./skills/${NAME}/SKILL.md` }] };
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

// 4. README + NOTICE de la distribución
fs.writeFileSync(S('README.md'), `# ${TITLE}

Fork **sin telemetría y 100% offline** de [Modern Web Guidance](${UPSTREAM}) de Google (Apache-2.0).
No es un producto de Google ni está respaldado por Google.

- CLI: \`${NAME}\` (search, list, retrieve, legacy-scan, set-baseline…)
- Skills: \`${NAME}\`, \`${CE_NAME}\`
- Sin watchdog ni Clearcut, sin \`npx\`, y \`install\`/\`update\`/\`uninstall\` deshabilitados.

Fuente, cambios y cómo actualizar: ${REPO}
`);
fs.writeFileSync(S('NOTICE'), `${TITLE}
Copyright 2026 ${AUTHOR}

This product is a modified version of "Modern Web Guidance"
(${UPSTREAM}), Copyright 2026 Google LLC, licensed under the Apache License 2.0.
Modifications: telemetry removed, network-based install/update disabled, rebranded.
"Google" and "Chrome" are trademarks of Google LLC; no endorsement is implied.
`);

// 5. Guardas
const bad = [];
const cli = fs.readFileSync(S('skills', NAME, 'modern-web.mjs'), 'utf8');
if (/play\.googleapis\.com|clearcut-sender|WatchdogClient|skills\.sh/.test(cli)) bad.push('telemetría en modern-web.mjs');
const leftovers = { npx: [], name: [], upstream: [] };
walk(root, (p, name) => {
  if (SKIP.has(name) && path.dirname(p) === root) return;
  let s;
  if (TEXT.test(name)) s = fs.readFileSync(p, 'utf8');
  else if (name.endsWith('.json.gz')) s = zlib.gunzipSync(fs.readFileSync(p)).toString('utf8');
  else return;
  const rel = path.relative(root, p);
  if (/(?:npx|pnpx|dlx)[^\n]{0,8}(?:modern-web-guidance|dropmind-web-guidance)/.test(s)) leftovers.npx.push(rel);
  if (/\bmodern-web-guidance(?![-\w])/.test(s)) leftovers.name.push(rel);
  if (/GoogleChrome\/modern-web-guidance/.test(s)) leftovers.upstream.push(rel);
});
for (const [k, v] of Object.entries(leftovers)) if (v.length) bad.push(`${k} restante en: ${v.slice(0, 8).join(', ')}${v.length > 8 ? ` (+${v.length - 8})` : ''}`);

if (bad.length) { console.error('fork-postbuild FALLÓ:\n - ' + bad.join('\n - ')); process.exit(1); }
console.log(`fork-postbuild OK (${NAME}): ${changed} archivos reescritos; sin telemetría, sin npx, sin referencias al paquete oficial.`);

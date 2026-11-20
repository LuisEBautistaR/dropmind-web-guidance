#!/usr/bin/env bash
# install-local.sh — instala dropmind-web-guidance (build sin telemetría) en tu máquina.
# Uso:  pnpm build:fork && SKILLS_DIR=~/.claude/skills ./scripts/install-local.sh
set -euo pipefail
NAME="dropmind-web-guidance"
SKILLS=("dropmind-web-guidance" "dropmind-chrome-extensions")
here="$(cd "$(dirname "$0")/.." && pwd)"
DIST="${DIST:-$here/dist/skills-cli}"
PREFIX="${PREFIX:-$HOME/.local/share/$NAME}"
BIN_DIR="${BIN_DIR:-$HOME/.local/bin}"
SKILLS_DIR="${SKILLS_DIR:-$HOME/.claude/skills}"

[[ -f "$DIST/skills/$NAME/modern-web.mjs" ]] || { echo "No hay build del fork en $DIST. Corre: pnpm build:fork"; exit 1; }
[[ ! -d "$DIST/skills/$NAME/watchdog" ]] || { echo "El build trae watchdog/: abortando"; exit 1; }

rm -rf "$PREFIX"; mkdir -p "$PREFIX" "$BIN_DIR" "$SKILLS_DIR"
cp -R "$DIST/." "$PREFIX/"

cat > "$BIN_DIR/$NAME" <<EOF
#!/usr/bin/env bash
exec node "$PREFIX/skills/$NAME/modern-web.mjs" "\$@"
EOF
chmod +x "$BIN_DIR/$NAME"

for s in "${SKILLS[@]}"; do
  rm -rf "$SKILLS_DIR/$s"; mkdir -p "$SKILLS_DIR/$s"
  cp "$PREFIX/skills/$s/SKILL.md" "$SKILLS_DIR/$s/"
  for d in guides references; do [[ -d "$PREFIX/skills/$s/$d" ]] && cp -R "$PREFIX/skills/$s/$d" "$SKILLS_DIR/$s/"; done
done

echo "OK -> CLI: $BIN_DIR/$NAME | skills: ${SKILLS[*]} en $SKILLS_DIR"
for old in modern-web-guidance chrome-extensions; do
  [[ -d "$SKILLS_DIR/$old" ]] && echo "⚠ Tienes instalado el skill oficial '$old' en $SKILLS_DIR (con telemetría). Bórralo para que el agente no lo use."
done
command -v modern-web-guidance >/dev/null && echo "⚠ Hay un binario 'modern-web-guidance' (oficial) en tu PATH: $(command -v modern-web-guidance)"
case ":$PATH:" in *":$BIN_DIR:"*) ;; *) echo "⚠ Agrega $BIN_DIR a tu PATH";; esac
"$BIN_DIR/$NAME" search "light dismiss dialog" | head -c 160; echo

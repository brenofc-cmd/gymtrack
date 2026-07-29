#!/usr/bin/env bash
# Pacote limpo de entrega: usa o índice do git como fonte, então nada de
# node_modules, .next, .env*, caches ou artefatos locais entra no zip
# (P1.8 da auditoria final — o zip anterior tinha 264 MB com node_modules).
set -euo pipefail

cd "$(dirname "$0")/.."

if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "Erro: precisa ser executado dentro do repositório git." >&2
  exit 1
fi

STAMP="$(date +%Y-%m-%d)"
OUT="gymtrack-${STAMP}.zip"

git archive --format=zip --prefix="gymtrack/" -o "${OUT}" HEAD

echo "Pacote gerado: ${OUT}"
unzip -l "${OUT}" | tail -1
if unzip -l "${OUT}" | grep -qE "node_modules/|\.next/|\.env"; then
  echo "ERRO: o pacote contém artefatos proibidos." >&2
  exit 1
fi
echo "Verificado: sem node_modules, .next ou .env no pacote."

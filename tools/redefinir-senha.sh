#!/usr/bin/env bash
#
# Redefine a senha de um participante do bolao gerando uma senha temporaria.
#
# Por que existe: os e-mails do bolao (@bolao.com) sao ficticios e servem
# apenas como login. Por isso o link "esqueci a senha" do Firebase nao chega
# a lugar nenhum, e o painel admin (que usa so a chave web) nao pode definir a
# senha de outro usuario. Este script usa as credenciais do Firebase CLI
# (a mesma conta do 'firebase login') para chamar o endpoint administrativo do
# Identity Toolkit e setar uma nova senha direto na conta.
#
# Uso:
#   ./tools/redefinir-senha.sh vigilcius-junior@bolao.com
#   ./tools/redefinir-senha.sh paimei@bolao.com "MinhaSenhaEscolhida"
#
# Requisitos: firebase CLI logado (firebase login) e python3.
# A conta, o UID, o perfil e os palpites do usuario sao preservados.

set -euo pipefail

PROJECT="bolao-copa-2026-cba87"
EMAIL="${1:-}"
CHOSEN_PWD="${2:-}"

if [ -z "$EMAIL" ]; then
  echo "uso: $0 <email> [senha]" >&2
  exit 1
fi

if ! command -v firebase >/dev/null 2>&1; then
  echo "Firebase CLI nao encontrado. Instale com: npm i -g firebase-tools" >&2
  exit 1
fi

# Forca o CLI a renovar o access_token no cache antes de lermos.
if ! firebase projects:list >/dev/null 2>&1; then
  echo "Nao autenticado. Rode 'firebase login' e tente de novo." >&2
  exit 1
fi

TOKEN=$(python3 -c "import json,os;print(json.load(open(os.path.expanduser('~/.config/configstore/firebase-tools.json')))['tokens']['access_token'])")

# Senha: usa a informada ou gera uma temporaria forte.
if [ -n "$CHOSEN_PWD" ]; then
  NEW_PWD="$CHOSEN_PWD"
else
  NEW_PWD=$(python3 -c "import secrets,string;a=string.ascii_letters+string.digits;print(''.join(secrets.choice(a) for _ in range(10)))")
fi

# Descobre o UID a partir do e-mail.
ACCOUNT_ID=$(curl -s -X POST "https://identitytoolkit.googleapis.com/v1/projects/$PROJECT/accounts:lookup" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"email\":[\"$EMAIL\"]}" \
  | python3 -c "import json,sys;u=json.load(sys.stdin).get('users',[]);print(u[0]['localId'] if u else '')")

if [ -z "$ACCOUNT_ID" ]; then
  echo "Usuario $EMAIL nao encontrado no Authentication." >&2
  exit 1
fi

# Define a nova senha.
RESULT=$(curl -s -X POST "https://identitytoolkit.googleapis.com/v1/projects/$PROJECT/accounts:update" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"localId\":\"$ACCOUNT_ID\",\"password\":\"$NEW_PWD\"}")

if echo "$RESULT" | python3 -c "import json,sys;sys.exit(0 if 'localId' in json.load(sys.stdin) else 1)"; then
  echo "Senha redefinida com sucesso."
  echo "  E-mail: $EMAIL"
  echo "  UID:    $ACCOUNT_ID"
  echo "  Senha:  $NEW_PWD"
  echo
  echo "Envie a senha ao participante. Ele pode troca-la depois em Perfil."
else
  echo "Falha ao redefinir senha:" >&2
  echo "$RESULT" | python3 -c "import json,sys;print('  '+json.load(sys.stdin).get('error',{}).get('message','erro desconhecido'))" >&2
  exit 1
fi

# Instruções Para Agentes/IA

Antes de responder sobre capacidade do projeto, diagnosticar bugs ou alterar
código, leia os documentos locais da pasta. Este repositório contém informações
operacionais fora do código-fonte principal, inclusive arquivos ignorados pelo
Git.

## Leitura Obrigatória

Leia pelo menos:

- `PRD_MATA_MATA_COPA_2026.md`
- `DOC_Projeto_Bolao.md`
- `MANUAL_ADMIN.md`
- `Guia_Configuracao_GitHub_Firebase.md`
- `docs/superpowers/plans/2026-06-26-mata-mata-copa-2026.md`
- `copa_2026_resultados_regras_cruzamentos_ate_2026-06-26.md`
- `regras-pontuacao.txt`
- `.firebaserc`
- `firebase.json`
- `firestore.rules`
- `tools/redefinir-senha.sh`

Também verifique arquivos auxiliares ignorados pelo Git quando existirem
localmente, como `usuarios-firebase.txt`, `sdk-firebase-npm-e-script.txt`,
`firestore-rules.txt`, `relatorio-simulacao-teste.md` e
`prompt-simulacao-teste.md`.

## Git e Publicação

O projeto usa Git local/remoto. Publicação do site ocorre por push em `main`
para GitHub Pages.

Antes de publicar:

```bash
git status --short --branch
node tests/worldcup-bracket.test.mjs
node tests/worldcup-standings.test.mjs
git diff --check
```

## Firebase e Firestore

O projeto usa Firebase Auth e Cloud Firestore. A configuração local fica em:

- `.firebaserc`
- `firebase.json`
- `firestore.rules`
- `js/auth.js`

A Firebase CLI pode estar autenticada localmente. Antes de afirmar que não há
acesso ao Firestore, cheque:

```bash
command -v firebase
firebase projects:list
```

É possível consultar/atualizar Firestore usando a Firebase CLI autenticada e a
REST API do Firestore, quando autorizado pelo usuário. Nunca imprima tokens,
senhas ou credenciais.

## Segurança

- Não exponha conteúdo de arquivos com credenciais.
- Não cole tokens, senhas ou access tokens na resposta.
- Use credenciais apenas para operações explicitamente autorizadas.
- Prefira resumir o estado operacional sem revelar segredos.

## Mata-Mata 2026

A fonte operacional dos confrontos eliminatórios é `bracketMatches` no
Firestore. `data/matches.json` é fallback.

Fluxo admin recomendado:

1. Inserir resultados manuais.
2. Aba `Mata-Mata` -> `Recalcular Classificação`.
3. Aba `Mata-Mata` -> `Gerar/Atualizar Mata-Mata`.
4. Aba `Resultados` -> `Sincronizar Travas`.
5. Recarregar `palpites.html`.

O ranking do bolão usa apenas o placar dos 90 minutos. Prorrogação e pênaltis
servem somente para definir quem avança no bracket.

# Guia de Configuração - GitHub Pages + Firebase

Este documento detalha o passo a passo para configurar o GitHub Pages (hospedagem do site) e o Firebase (banco de dados e autenticação), que são a base do nosso sistema de Bolão da Copa 2026.

---

## Parte 1: Configuração do GitHub Pages — CONCLUÍDA

### O que é?
O GitHub Pages transforma um repositório do GitHub em um site acessível pela internet. Ele serve arquivos HTML, CSS e JavaScript gratuitamente.

### Status: Site no ar

- **URL:** https://eliascorreajr.github.io/copa-2026/
- **Repositório:** https://github.com/eliascorreajr/copa-2026
- **Branch de publicação:** `main` / `/ (root)`

### Passo a passo (já executado)

#### 1. Criar o repositório — CONCLUÍDO
- Repositório `copa-2026` criado em `eliascorreajr`, público, com README.

#### 2. Ativar o GitHub Pages — CONCLUÍDO
- Settings → Pages → Source: `main` / `/ (root)` → Save.
- Site disponível em `https://eliascorreajr.github.io/copa-2026/`.

#### 3. Enviar os arquivos do projeto — CONCLUÍDO
- Commit: `Versão inicial do Bolão Copa 2026 - Fase 1 completa`
- Deploy automático via `git push`. Atualização em 1-2 minutos.

---

## Parte 2: Configuração do Firebase — CONCLUÍDA

### O que é?
O Firebase é uma plataforma do Google que oferece serviços de backend (banco de dados, autenticação, etc.) sem precisar montar um servidor. Para o nosso projeto usamos:
- **Firebase Authentication** — gerencia login dos 5 usuários com e-mail e senha.
- **Cloud Firestore** — banco de dados que salva palpites, resultados e pontuação.
- **Fotos de perfil** — armazenadas como base64 diretamente no Firestore (não usamos Firebase Storage).

### Plano gratuito (Spark)
- **Firestore:** 1 GB de armazenamento + 50.000 leituras/dia — mais que suficiente para 5 pessoas.
- **Authentication:** Sem limite de usuários no plano gratuito.
- **Custo:** R$ 0,00.

### Passo a passo (já executado)

#### 1. Criar uma conta no Firebase — CONCLUÍDO
- Conta Google utilizada para acesso ao console.

#### 2. Criar um projeto — CONCLUÍDO
- **Nome do projeto:** `bolao-copa-2026-cba87`
- **ID do projeto:** `bolao-copa-2026-cba87`
- Google Analytics desativado.

#### 3. Registrar um app Web — CONCLUÍDO
- **Apelido do app:** `bolao-copa-2026`
- Firebase Hosting **NÃO** marcado (usamos GitHub Pages).
- Configuração do Firebase utilizada no código:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBKO44OapqYsf8tpqH8kXaBMa8XNLcUUE0",
  authDomain: "bolao-copa-2026-cba87.firebaseapp.com",
  projectId: "bolao-copa-2026-cba87",
  storageBucket: "bolao-copa-2026-cba87.firebasestorage.app",
  messagingSenderId: "53318338358",
  appId: "1:53318338358:web:dd7f2770d9ced1380e1597"
};
```

- **SDK Firebase utilizado:** v12.13.0 (via CDN `https://www.gstatic.com/firebasejs/12.13.0/`).

#### 4. Ativar a Autenticação (login com e-mail/senha) — CONCLUÍDO
- Método "E-mail/senha" ativado. "Link por e-mail" desativado.

#### 5. Criar os 5 usuários manualmente — CONCLUÍDO
5 usuários criados em Authentication:

| E-mail | Senha provisória | Apelido no sistema |
|---|---|---|
| `admin@bolao.com` | *(senha forte)* | **AdminSuper** (conta oculta, controlada por você) |
| `paimei@bolao.com` | `copa2026` | **Pai Mei** |
| `falso9@bolao.com` | `copa2026` | **Falso 9** |
| `gildacio@bolao.com` | `copa2026` | **Gildácio** |
| `whiteglauber@bolao.com` | `copa2026` | **White Glauber** |

**Nota:** As senhas provisórias (`copa2026`) serão trocadas por cada usuário no primeiro acesso via tela `primeiro-acesso.html`.

**Importante:** O AdminSuper não aparece no ranking nem em nenhuma lista visível. É apenas a conta de gestão.

#### 6. Criar o banco de dados (Firestore) — CONCLUÍDO
- Localização: `southamerica-east1` (São Paulo).
- Modo de produção.

#### 7. Regras de segurança do Firestore — CONCLUÍDO
Regras publicadas com restrição de admin para `matches` e `config`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /guesses/{guessId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /matches/{matchId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email == "admin@bolao.com";
    }
    match /config/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email == "admin@bolao.com";
    }
  }
}
```

**Nota:** Apenas o admin (`admin@bolao.com`) pode escrever em `matches` e `config`. Palpites em `guesses` podem ser escritos por qualquer usuário autenticado, mas são travados no frontend (campo `locked: true`).

#### 8. Firebase Storage — NÃO UTILIZADO
Optamos por **não usar o Firebase Storage**. As fotos de perfil são compactadas para base64 (máx. 200px, qualidade 70%) e armazenadas diretamente no campo `photoURL` do documento do usuário no Firestore. Isso simplifica a arquitetura e evita custos/complexidade adicionais.

---

## Parte 3: Estrutura do Projeto

### Arquivos do site

```
copa-2026/
├── index.html              # Login
├── primeiro-acesso.html    # Cadastro inicial (nome, sobrenome, foto, troca de senha)
├── palpites.html           # Tela de palpites por rodada
├── ranking.html            # Tela de ranking
├── admin.html              # Painel admin (sincronizar resultados, inserir manual, gerenciar usuários)
├── perfil.html             # Perfil do usuário (foto, senha)
├── css/
│   └── style.css           # Estilos globais (tema escuro, responsivo)
├── js/
│   ├── auth.js             # Firebase init, auth, helpers (checkAuth, setupNavbar, showToast, etc.)
│   ├── firebase-config.js  # Configuração do Firebase (export)
│   ├── matches.js          # Carregamento de dados de jogos (matches.json + SofaScore)
│   ├── guesses.js           # CRUD de palpites no Firestore
│   ├── ranking.js           # Cálculo e exibição do ranking
│   ├── scoring.js           # Motor de pontuação (7 pts exato, 3 pts resultado, -1 pts erro)
│   ├── admin.js             # Funções admin (criar usuário, inserir resultado manual)
│   ├── profile.js           # Upload e atualização de foto de perfil
│   └── sofascore.js         # Integração com API SofaScore (sincronização de resultados)
├── data/
│   └── matches.json         # Dados estáticos dos jogos da Copa 2026
└── img/
    └── quinta-categoria-show-logo.jpg  # Logo do bolão
```

### Arquivos auxiliares (não versionados)

- `sdk-firebase-npm-e-script.txt` — Referência do SDK (ignorado via .gitignore)
- `usuarios-firebase.txt` — Credenciais dos usuários (ignorado via .gitignore)
- `firestore-rules.txt` — Regras do Firestore (ignorado via .gitignore)

### Coleções do Firestore

| Coleção | Descrição | Permissões |
|---|---|---|
| `users` | Perfil dos usuários (nickname, nome, foto base64, etc.) | Cada usuário lê/escreve apenas o próprio documento |
| `guesses` | Palpites dos usuários (formato: `{userId}_match_{matchId}`) | Leitura: todos autenticados. Escrita: todos autenticados. |
| `matches` | Resultados dos jogos (SofaScore ou manual) | Leitura: todos autenticados. Escrita: apenas admin. |
| `config` | Configurações gerais do sistema | Leitura: todos autenticados. Escrita: apenas admin. |

---

## Parte 4: Como tudo se conecta

```
┌─────────────────────┐        ┌──────────────────────┐
│   GitHub Pages      │        │   Firebase           │
│   (Seu site)        │        │   (Backend na nuvem)  │
│                     │        │                       │
│  HTML/CSS/JS ───────────────►│  Authentication       │
│  index.html         │  JS    │  (login dos 5 users)  │
│  palpites.html      │ fetch  │                       │
│  ranking.html       │────────►│  Firestore Database   │
│  admin.html         │        │  (palpites, jogos,    │
│  perfil.html        │        │   pontuação, perfis)   │
└─────────────────────┘        └──────────────────────┘
                                        ▲
                                        │ API (JSON)
                               ┌────────┴──────────┐
                               │   SofaScore API    │
                               │   (resultados)     │
                               └───────────────────┘
```

1. O usuário acessa `https://eliascorreajr.github.io/copa-2026/`.
2. O JavaScript se conecta ao Firebase para autenticar o login.
3. Se for primeiro acesso, redireciona para `primeiro-acesso.html` (cadastro + troca de senha).
4. Após login, o JS lê os jogos de `data/matches.json` e exibe para o usuário palpitar.
5. Quando o Admin clica em "Sincronizar", o JS chama a API do SofaScore, pega os resultados e grava no Firestore.
6. O motor de pontuação roda no JS e atualiza o ranking no Firestore.
7. Fotos de perfil são compactadas em base64 e salvas no documento do usuário no Firestore.

---

## Resumo de Custos

| Serviço | Custo |
|---|---|
| GitHub Pages | Gratuito |
| Firebase (plano Spark) | Gratuito |
| API SofaScore | Gratuita (uso moderado) |
| **Total** | **R$ 0,00** |

---

## Pontuação

| Tipo de acerto | Pontos |
|---|---|
| Placar exato | +7 |
| Resultado correto (vitória/empate) | +3 |
| Resultado errado | -1 |

---
*Toda a configuração está concluída. O projeto está em fase de desenvolvimento ativo.*

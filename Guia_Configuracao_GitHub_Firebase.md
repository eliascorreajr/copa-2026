# Guia de Configuração - GitHub Pages + Firebase

Este documento detalha o passo a passo para configurar o GitHub Pages (hospedagem do site) e o Firebase (banco de dados e autenticação), que serão a base do nosso sistema de Bolão da Copa 2026.

---

## Parte 1: Configuração do GitHub Pages

### O que é?
O GitHub Pages transforma um repositório do GitHub em um site acessível pela internet. Ele serve arquivos HTML, CSS e JavaScript gratuitamente.

### Passo a passo

#### 1. Criar o repositório
1. Acesse [github.com](https://github.com) e faça login na sua conta (`eliascorreajr`).
2. Clique no botão **"New"** (ou "Novo repositório").
3. Preencha:
   - **Nome do repositório:** `copa-2026` (ou o nome que preferir)
   - **Visibilidade:** Public (obrigatório para GitHub Pages no plano gratuito)
   - **Marque:** "Add a README file"
4. Clique em **"Create repository"**.

#### 2. Ativar o GitHub Pages
1. No repositório criado, vá em **Settings** (Configurações) → aba lateral **Pages**.
2. Em **"Source"**, selecione:
   - **Branch:** `main`
   - **Folder:** `/ (root)`
3. Clique em **Save**.
4. Após alguns segundos, o GitHub vai gerar a URL do seu site:
   - `https://eliascorreajr.github.io/copa-2026/`

#### 3. Enviar os arquivos do projeto
Depois que criarmos os arquivos HTML/CSS/JS do projeto, você enviará para o repositório:
```bash
# Na pasta do projeto, no terminal:
git init
git remote add origin https://github.com/eliascorreajr/copa-2026.git
git add .
git commit -m "Versão inicial do Bolão Copa 2026"
git branch -M main
git push -u origin main
```

Toda vez que fizer `git push`, o site será atualizado automaticamente em 1-2 minutos.

---

## Parte 2: Configuração do Firebase

### O que é?
O Firebase é uma plataforma do Google que oferece serviços de backend (banco de dados, autenticação, etc.) sem precisar montar um servidor. Para o nosso projeto usaremos:
- **Firebase Authentication** — gerencia login dos 5 usuários com e-mail e senha.
- **Cloud Firestore** — banco de dados que salva palpites, resultados e pontuação.

### Plano gratuito (Spark)
- **Firestore:** 1 GB de armazenamento + 50.000 leituras/dia — mais que suficiente para 5 pessoas.
- **Authentication:** Sem limite de usuários no plano gratuito.
- **Custo:** R$ 0,00.

### Passo a passo

#### 1. Criar uma conta no Firebase
1. Acesse [console.firebase.google.com](https://console.firebase.google.com/).
2. Faça login com sua **conta Google** (a mesma do Gmail).

#### 2. Criar um projeto
1. Clique em **"Adicionar projeto"** (ou "Create a project").
2. **Nome do projeto:** `bolao-copa-2026`.
3. Na tela de Google Analytics, pode **desativar** (não precisamos). Clique em "Criar projeto".
4. Aguarde a criação e clique em **"Continuar"**.

#### 3. Registrar um app Web
1. Na página inicial do projeto, clique no ícone **</>** (Web) para adicionar um app.
2. **Apelido do app:** `bolao-copa-2026`.
3. **NÃO** marque "Firebase Hosting" (vamos usar GitHub Pages).
4. Clique em **"Registrar app"**.
5. O Firebase vai exibir um bloco de configuração. **Copie e salve esses dados**, pois vamos usá-los no código:

```javascript
// Exemplo (seus valores serão diferentes):
const firebaseConfig = {
  apiKey: "AIzaSyD...........................",
  authDomain: "bolao-copa-2026.firebaseapp.com",
  projectId: "bolao-copa-2026",
  storageBucket: "bolao-copa-2026.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

6. Clique em **"Continuar para o console"**.

#### 4. Ativar a Autenticação (login com e-mail/senha)
1. No menu lateral, clique em **"Authentication"** (ou "Autenticação").
2. Clique em **"Começar"** (ou "Get started").
3. Na aba **"Método de login"**, clique em **"E-mail/senha"**.
4. **Ative** o toggle "E-mail/senha". **NÃO** ative o "Link por e-mail".
5. Clique em **"Salvar"**.

#### 5. Criar os 5 usuários manualmente
1. Ainda em **Authentication**, vá na aba **"Usuários"** (ou "Users").
2. Clique em **"Adicionar usuário"** e crie os 5 usuários iniciais (4 participantes + 1 admin oculto):

| E-mail (provisório) | Senha (provisória) | Apelido no sistema |
|---|---|---|
| `admin@bolao.com` | *(gerar uma senha forte e salvar)* | **AdminSuper** (conta oculta, controlada por você) |
| `paimei@bolao.com` | `copa2026` | **Pai Mei** (você) |
| `falso9@bolao.com` | `copa2026` | **Falso 9** |
| `gildacio@bolao.com` | `copa2026` | **Gildácio** |
| `whiteglauber@bolao.com` | `copa2026` | **White Glauber** |

**Nota:** Os e-mails podem ser reais ou fictícios — servem apenas como login. Os apelidos serão cadastrados no Firestore. As senhas provisórias (`copa2026`) serão trocadas por cada usuário no primeiro acesso.

**Importante:** O AdminSuper não aparecerá no ranking nem em nenhuma lista visível. É apenas a sua conta de gestão.

#### 6. Criar o banco de dados (Firestore)
1. No menu lateral, clique em **"Firestore Database"**.
2. Clique em **"Criar banco de dados"** (ou "Create database").
3. Selecione o **modo de produção** (vamos configurar as regras de segurança depois).
4. Escolha a **localização:** `southamerica-east1` (São Paulo) para melhor performance.
5. Clique em **"Ativar"**.

#### 7. Configurar as regras de segurança (Firestore)
1. Em **Firestore Database**, clique na aba **"Regras"** (ou "Rules").
2. Substitua o conteúdo pelas regras abaixo (serão refinadas na fase de desenvolvimento):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Usuários só podem ler/escrever seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Palpites: usuário lê/escreve os próprios; admin lê todos
    match /guesses/{guessId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Jogos e resultados: todos autenticados lêem; só admin escreve
    match /matches/{matchId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Configuração geral (admin role, etc)
    match /config/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

3. Clique em **"Publicar"**.

**Nota:** Essas regras são simplificadas para início. Na fase de desenvolvimento, vamos refinar para garantir que apenas o AdminSuper possa alterar resultados e que palpites travados não possam ser modificados.

#### 8. Ativar o Firebase Storage (para fotos de perfil)
1. No menu lateral, clique em **"Storage"**.
2. Clique em **"Começar"** (ou "Get started").
3. Selecione **modo de produção** e a mesma localização (`southamerica-east1`).
4. Clique em **"Concluído"**.
5. Vá na aba **"Rules"** e substitua pelas regras abaixo:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Fotos de perfil: usuário logado pode ler qualquer foto, mas só escreve a própria
    match /profile-photos/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

6. Clique em **"Publicar"**.

**Limite gratuito do Storage:** 5 GB de armazenamento + 1 GB/dia de download. Para 8 fotos de perfil, isso sobra imensamente.

---

## Parte 3: Como tudo se conecta

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
│                     │        │   pontuação)           │
└─────────────────────┘        └──────────────────────┘
                                        ▲
                                        │ API (JSON)
                               ┌────────┴──────────┐
                               │   SofaScore API    │
                               │   (resultados)     │
                               └───────────────────┘
```

1. O usuário acessa `https://eliascorreajr.github.io/copa-2026/`.
2. O JavaScript da página se conecta ao Firebase para autenticar o login.
3. Após login, o JS lê os jogos do Firestore e exibe para o usuário palpitar.
4. Quando o Admin clica em "Sincronizar", o JS chama a API do SofaScore, pega os resultados e grava no Firestore.
5. O motor de pontuação roda no JS e atualiza o ranking no Firestore.

---

## Resumo de Custos

| Serviço | Custo |
|---|---|
| GitHub Pages | Gratuito |
| Firebase (plano Spark) | Gratuito |
| API SofaScore | Gratuita (uso moderado) |
| **Total** | **R$ 0,00** |

---
*Após configurar ambas as plataformas seguindo este guia, estaremos prontos para iniciar a Fase 1 de desenvolvimento.*

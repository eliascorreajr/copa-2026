# Bolão Quinta Categoria Show - Copa do Mundo 2026

Este documento apresenta a análise completa dos dados disponíveis, a arquitetura proposta e o planejamento das fases do projeto para o sistema de palpites do grupo **Quinta Categoria Show** na Copa do Mundo 2026.

> **Nota de atualização (2026-06-03):** Este documento registra o plano inicial. A implementação atual está consolidada em `DOC_Projeto_Bolao.md`, `Guia_Configuracao_GitHub_Firebase.md` e `relatorio-simulacao-teste.md`.
>
> Diferenças importantes em relação ao plano original:
> - Firebase Storage não é usado; fotos ficam como base64 comprimido no Firestore.
> - Firestore Rules são mantidas em `firestore.rules` e publicadas via Firebase CLI.
> - A trava de palpites é canônica por dia (`locks/{dayKey}`), reforçada nas Firestore Rules.
> - Correções pós-simulação em 2026-06-03 adicionaram validação de perfil, proteção contra XSS armazenado e deploy real das rules para `bolao-copa-2026-cba87`.

---

## 1. Análise Completa dos Documentos

### 1.1. Planilha de Jogos (`TABELA-DA-COPA-2026.xlsx`)

A planilha contém 4 abas com dados estruturados sobre toda a Copa:

#### Aba "Instruções"
*   Contém o passo-a-passo de uso da planilha original (selecionar repescagem, inserir placares, etc). 
*   Informação relevante: a planilha é uma versão gratuita e **protegida com senha** (não editável). Extrairemos os dados via script Python.

#### Aba "Repescagem"
*   Lista as 6 seleções que vieram da repescagem e os respectivos grupos em que foram alocadas:
    - Europa 1: Bósnia e Herzegovina → Grupo B
    - Europa 2: Suécia → Grupo F
    - Europa 3: Turquia → Grupo D
    - Europa 4: República Tcheca → Grupo A
    - Intercontinental 1: RD do Congo → Grupo K
    - Intercontinental 2: Iraque → Grupo I

#### Aba "Grupos" — Dados Extraídos
*   **72 jogos** da fase de grupos, distribuídos igualmente em **12 grupos** (A a L), com **6 jogos por grupo**.
*   **48 seleções** participantes.
*   **Período:** 11/06/2026 a 27/06/2026.

**Composição dos Grupos:**

| Grupo | Seleções |
|-------|----------|
| A | México, Coréia do Sul, República Tcheca, África do Sul |
| B | Canadá, Catar, Suíça, Bósnia e Herzegovina |
| C | Brasil, Haiti, Escócia, Marrocos |
| D | Estados Unidos, Austrália, Turquia, Paraguai |
| E | Alemanha, Costa do Marfim, Equador, Curaçao |
| F | Holanda, Suécia, Tunísia, Japão |
| G | Bélgica, Irã, Nova Zelândia, Egito |
| H | Espanha, Arábia Saudita, Uruguai, Cabo Verde |
| I | França, Iraque, Noruega, Senegal |
| J | Argentina, Áustria, Jordânia, Argélia |
| K | Portugal, Uzbequistão, Colômbia, RD do Congo |
| L | Inglaterra, Gana, Panamá, Croácia |

#### Aba "Mata-Mata" — Dados Extraídos
*   **32 jogos** no total do mata-mata:
    - **Fase de 32** (16 jogos): 28/06 a 03/07/2026
    - **Oitavas de Final** (8 jogos): 04/07 a 07/07/2026
    - **Quartas de Final** (4 jogos): 09/07 a 12/07/2026
    - **Semifinais** (2 jogos): 14/07 e 15/07/2026
    - **Disputa de 3º lugar** (1 jogo): 18/07/2026
    - **Final** (1 jogo): 19/07/2026

### 1.2. Arquivos HTML do SofaScore
*   Os arquivos HTML salvos localmente **não servem para extração de dados** — o SofaScore é uma SPA com classes CSS dinâmicas.
*   A análise técnica completa da API está em **`Analise_Scraper_SofaScore.md`** (endpoints testados, estrutura JSON, mapeamento de nomes).

### 1.3. Arquivo de texto (`enderecos.txt`)
*   Repositório GitHub: `https://github.com/eliascorreajr`
*   URL do SofaScore: `https://www.sofascore.com/pt/football/tournament/world/world-championship/16#id:58210`
*   ID da temporada 2026 na API: **`58210`**.

---

## 2. Regras de Negócio e Funcionalidades

### 2.1. Usuários
*   **4 usuários iniciais** predefinidos + **1 AdminSuper** (oculto).
*   O sistema deve suportar a **adição de até 3 usuários extras** posteriormente (total máximo: 7 participantes visíveis + AdminSuper).
*   Formato de exibição: `Apelido - vulgo Nome Verdadeiro Sobrenome`.
*   **Primeiro acesso**: preencher nome verdadeiro, sobrenome, e-mail, fazer upload de **foto de perfil** e criar nova senha.
*   **Foto de perfil**: cada usuário poderá enviar uma foto à sua escolha. Será exibida na navbar, no ranking e na página de palpites. Armazenada no **Firebase Storage**.

**Usuários definidos:**

| # | Apelido (login) | Observação |
|---|---|---|
| 1 | **Pai Mei** | Criador do sistema (também controla o AdminSuper) |
| 2 | **Falso 9** | — |
| 3 | **Gildácio** | — |
| 4 | **White Glauber** | — |

### 2.2. Administrador
*   Usuário: **`AdminSuper`** — conta oculta, **não aparece no ranking, nos palpites e nem em nenhuma lista visível** para os demais usuários. Serve exclusivamente para gerenciamento do sistema.
*   Quem controla o AdminSuper é o **Pai Mei** (criador do projeto).
*   Senha gerada na criação do projeto.
*   Poderes totais: alterar qualquer dado, inserir resultados manualmente, disparar sincronização via SofaScore e **adicionar novos usuários** (até 3 extras).

### 2.3. Regra de Travamento
*   **30 minutos antes do primeiro jogo de cada rodada**, o sistema bloqueia inserção e alteração de palpites.
*   Rodadas: Rodada 1, 2, 3 (grupos), Fase de 32, Oitavas, Quartas, Semifinais, 3º Lugar, Final.

### 2.4. Imutabilidade
*   Palpite confirmado = definitivo. Modal de confirmação antes de salvar.

### 2.5. Pontuação

| Situação | Pontos |
|---|---|
| Cravou o placar exato | **+7** |
| Acertou o resultado (vencedor ou empate, placar diferente) | **+3** |
| Errou tudo | **-1** |

*   Aplica-se a todas as fases. Pode ficar negativa.

### 2.6. Classificação e Progressão
*   Classificam-se os 2 primeiros de cada grupo + os 8 melhores 3º colocados (32 times para a Fase de 32).

---

## 3. Arquitetura Proposta

### GitHub Pages + Firebase (100% gratuito)

*   **Frontend (GitHub Pages):** HTML, CSS moderno (dark mode, paleta laranja/azul marinho do logo) e JavaScript.
*   **Identidade Visual:** Baseada no logo do **Quinta Categoria Show**. Detalhada em **`Identidade_Visual.md`**.
*   **Backend (Firebase):**
    - **Firebase Authentication** — login dos 4+1 usuários (expansível até 8) com e-mail/senha.
    - **Cloud Firestore** — banco de dados NoSQL (palpites, jogos, resultados, pontuação).
    - **Firebase Storage** — armazenamento das fotos de perfil dos usuários.
    - **Firestore Security Rules** — regras de segurança (quem lê/escreve o quê).
*   **Automação de Resultados:** JavaScript no navegador do Admin chama a API do SofaScore e grava no Firestore.
*   **Hospedagem:** Todo o código no GitHub, site publicado automaticamente via GitHub Pages.
*   **Custo total: R$ 0,00.**

Os guias de configuração e identidade visual estão nos arquivos:
- **`Guia_Configuracao_GitHub_Firebase.md`** — passo a passo de GitHub Pages e Firebase.
- **`Identidade_Visual.md`** — paleta de cores, tipografia e componentes visuais.

---

## 4. Estrutura de Arquivos do Projeto

```
copa-2026/
├── index.html                  ← Tela de login
├── primeiro-acesso.html        ← Formulário do primeiro acesso (nome, foto, senha)
├── perfil.html                 ← Página do perfil (ver/trocar foto)
├── palpites.html               ← Tela principal de palpites por rodada
├── ranking.html                ← Ranking geral dos participantes
├── admin.html                  ← Painel do AdminSuper
├── img/
│   └── quinta-categoria-show-logo.jpg  ← Logo do grupo
├── css/
│   └── style.css               ← Estilos (paleta do logo, dark mode, animações)
├── js/
│   ├── firebase-config.js      ← Configuração de conexão com Firebase
│   ├── auth.js                 ← Lógica de login/logout/primeiro acesso
│   ├── profile.js              ← Upload e exibição da foto de perfil
│   ├── matches.js              ← Lógica de exibição dos jogos
│   ├── guesses.js              ← Lógica de inserção e travamento de palpites
│   ├── scoring.js              ← Motor de pontuação (+7, +3, -1)
│   ├── ranking.js              ← Cálculo e exibição do ranking
│   ├── sofascore.js            ← Integração com API do SofaScore
│   └── admin.js                ← Funções exclusivas do admin (incluindo adicionar usuários)
├── data/
│   └── matches.json            ← Dados dos 104 jogos (gerado pelo script Python)
└── docs/
    ├── Documento_Inicial_Bolao.md
    ├── Analise_Scraper_SofaScore.md
    ├── Guia_Configuracao_GitHub_Firebase.md
    └── Identidade_Visual.md
```

---

## 5. Fases de Implementação do Projeto

### Fase 1: Fundação e Configuração
*   Configuração do GitHub Pages e Firebase (seguindo o guia), incluindo **Firebase Storage** para fotos.
*   Criação do script Python para extrair os 104 jogos da planilha e gerar o arquivo `matches.json`.
*   Estrutura inicial do Firestore (collections: `users`, `matches`, `guesses`, `config`).
*   Upload dos dados dos jogos para o Firestore.
*   Desenvolvimento do layout visual (HTML/CSS) seguindo a **identidade visual** do logo Quinta Categoria Show.

### Fase 2: Login, Palpites e Travamento
*   Implementação do login via Firebase Auth.
*   Fluxo de "Primeiro Acesso" (nome, sobrenome, e-mail, **upload de foto de perfil**, nova senha).
*   Página de perfil para ver/trocar foto.
*   Tela de palpites com listagem por rodadas.
*   Regra de bloqueio automático (30 minutos antes do primeiro jogo da rodada).
*   Modal de confirmação e gravação definitiva do palpite no Firestore.

### Fase 3: Pontuação, Ranking e Painel Admin
*   Motor de pontuação (+7, +3, -1) que recalcula quando resultados são inseridos.
*   Ranking Geral dos participantes (tabela dinâmica com fotos de perfil e destaques 🏆🥈🥉).
*   Painel do AdminSuper: entrada manual de resultados, visualização de todos os palpites, **função de adicionar novos usuários** (até 3 extras).

### Fase 4: Automação SofaScore e Finalização
*   Implementação do consumo da API do SofaScore via JavaScript (endpoints em `Analise_Scraper_SofaScore.md`).
*   Botão no painel Admin para sincronizar resultados automaticamente.
*   Testes gerais de todo o fluxo (do cadastro ao ranking final).
*   Publicação final no GitHub Pages.

---
*Este documento serve como guia. Aguardando aprovação para iniciar a Fase 1.*

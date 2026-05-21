# Identidade Visual - Bolão Quinta Categoria Show

Este documento define a paleta de cores, tipografia e diretrizes visuais do site, baseado na análise do logo do grupo **Quinta Categoria Show**.

---

## 1. Análise do Logo

O logo apresenta:
*   **Bola de futebol** com chamas (energia, competição).
*   **Microfone retrô** (referência ao "Show" do nome).
*   **Estrelas/sparkles** laranja (destaque, vibração).
*   **Escudo/badge** com borda branca e base em gradiente vermelho→laranja.
*   **Tipografia** estilo neon/luminoso para "QUINTA CATEGORIA" e estêncil para "SHOW".
*   **Fundo:** azul marinho escuro profundo.

O estilo geral é **esportivo, vibrante e divertido** — perfeito para um bolão entre amigos.

---

## 2. Paleta de Cores Extraída

| Nome | Código Hex | Uso |
|---|---|---|
| **Azul Marinho Profundo** | `#0f1b2d` | Fundo principal do site (background) |
| **Azul Escuro** | `#1a2a44` | Cards, painéis, navbar |
| **Azul Médio** | `#243553` | Bordas, separadores, hover sutil |
| **Laranja Vibrante** | `#f47c20` | Cor de destaque principal (botões, links, ícones ativos) |
| **Laranja Neon** | `#ff9a3c` | Hover de botões, brilhos, estrelas |
| **Vermelho Fogo** | `#d4391c` | Alertas, indicador de rodada travada, pontos negativos |
| **Branco Puro** | `#ffffff` | Textos principais, bordas do logo |
| **Branco Suave** | `#e0e6ed` | Textos secundários, descrições |
| **Cinza Azulado** | `#7a8ba3` | Textos terciários, placeholders |
| **Verde Sucesso** | `#2ecc71` | Palpite confirmado, pontos positivos |
| **Dourado** | `#f0c040` | Primeiro lugar no ranking, destaques especiais |

### Gradientes
*   **Botão principal:** `linear-gradient(135deg, #f47c20, #d4391c)` (laranja → vermelho)
*   **Header/Banner:** `linear-gradient(180deg, #0f1b2d, #1a2a44)` (azul profundo → azul escuro)
*   **Card hover:** sutil glow laranja `box-shadow: 0 0 15px rgba(244, 124, 32, 0.15)`

---

## 3. Tipografia

| Elemento | Fonte | Peso | Tamanho |
|---|---|---|---|
| Logo/Nome do site | **Orbitron** (Google Fonts) | Bold | 28-32px |
| Títulos (h1, h2) | **Inter** | Bold (700) | 24-32px |
| Subtítulos (h3, h4) | **Inter** | Semi-Bold (600) | 18-20px |
| Corpo do texto | **Inter** | Regular (400) | 14-16px |
| Placares / Números | **Orbitron** | Bold | 36-48px |
| Botões | **Inter** | Semi-Bold (600) | 14-16px |

**Importação:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Orbitron:wght@700&display=swap');
```

---

## 4. Componentes Visuais

### Navbar
*   Fundo: `#1a2a44` com borda inferior `1px solid #243553`.
*   Logo do Quinta Categoria Show à esquerda (imagem reduzida).
*   Nome do usuário + foto circular à direita.

### Cards de Jogo
*   Fundo: `#1a2a44`, borda: `1px solid #243553`, border-radius: `12px`.
*   Hover: borda muda para `#f47c20` com glow sutil.
*   Jogo travado: borda vermelha `#d4391c` + ícone de cadeado.
*   Jogo finalizado: exibe placar oficial em destaque com fonte Orbitron.

### Botões
*   **Primário:** gradiente laranja→vermelho, texto branco, border-radius `8px`.
*   **Secundário:** fundo transparente, borda laranja, texto laranja.
*   **Hover:** leve `translateY(-2px)` + aumento de brilho.

### Ranking
*   1º lugar: borda dourada `#f0c040` + ícone de troféu 🏆.
*   2º lugar: borda prata `#c0c0c0`.
*   3º lugar: borda bronze `#cd7f32`.
*   Demais: borda padrão azul.

### Foto de Perfil do Usuário
*   Formato circular (border-radius: 50%), tamanho 80x80px na página do perfil, 36x36px na navbar.
*   Borda de 2px na cor laranja `#f47c20`.
*   Placeholder padrão: ícone de silhueta em cinza azulado quando o usuário ainda não tiver enviado foto.
*   A foto será armazenada no **Firebase Storage** (incluso no plano gratuito).

---

## 5. Efeitos e Animações

*   **Transição de cards:** `transition: all 0.2s ease` em hover.
*   **Entrada de página:** fade-in suave (`opacity 0→1, translateY 10px→0`) nos cards.
*   **Contagem regressiva:** timer pulsando em laranja neon quando faltar menos de 1 hora para o travamento.
*   **Confirmação de palpite:** animação de check verde (✓) ao salvar.
*   **Atualização de ranking:** números sobem/descem com micro-animação.

---

## 6. Responsividade

*   **Desktop (>992px):** layout em 2-3 colunas para jogos.
*   **Tablet (768-992px):** 2 colunas.
*   **Mobile (<768px):** coluna única, cards empilhados, navbar com menu hambúrguer.

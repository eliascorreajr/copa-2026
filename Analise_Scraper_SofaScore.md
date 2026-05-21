# Análise de Extração de Dados (Scraping) - SofaScore

Este documento detalha as estratégias técnicas para automatizar a captura de resultados dos jogos da Copa do Mundo 2026 a partir do SofaScore.

## 1. Resultado da Análise dos Arquivos HTML Locais
Ao analisar os arquivos salvos na pasta (`Copa do Mundo 2026 – placar ao vivo...html`), concluímos que:
*   O SofaScore é construído com Next.js/React (SPA). O HTML salvo localmente **não contém os dados dos jogos de forma útil** para scraping — as classes CSS são geradas dinamicamente (ex: `.sc-a8b2c3d`) e mudam a cada deploy.
*   **Conclusão:** Os arquivos HTML são úteis como referência visual, mas **não servem** como fonte de dados para automação.

## 2. A Estratégia Confirmada: API REST Pública do SofaScore

Realizamos testes reais acessando a API do SofaScore e **confirmamos que ela responde sem autenticação**, retornando dados estruturados em JSON. Segue o mapeamento completo:

### 2.1. Endpoints Mapeados e Testados

| Endpoint | Descrição | Testado? |
|---|---|---|
| `/api/v1/unique-tournament/16/seasons` | Lista todas as temporadas (Copas do Mundo). A Copa 2026 tem **`id: 58210`**. | ✅ Funcional |
| `/api/v1/unique-tournament/16/season/58210/rounds` | Lista todas as rodadas/fases da Copa 2026. | ✅ Funcional |
| `/api/v1/unique-tournament/16/season/58210/events/round/{round}` | Lista todos os jogos de uma rodada específica. | ✅ Funcional |

**URL base:** `https://api.sofascore.com`

### 2.2. Mapeamento de Rodadas (rounds)
A API retorna as seguintes rodadas para a Copa 2026:

| Rodada (round) | Nome | Slug |
|---|---|---|
| 1 | *(Grupos - Rodada 1)* | — |
| 2 | *(Grupos - Rodada 2)* | — |
| 3 | *(Grupos - Rodada 3)* | — |
| 6 | Round of 32 | `round-of-32` |
| 5 | Round of 16 | `round-of-16` |
| 27 | Quarterfinals | `quarterfinals` |
| 28 | Semifinals | `semifinals` |
| 50 | Match for 3rd place | `match-for-3rd-place` |
| 29 | Final | `final` |

### 2.3. Estrutura do JSON de Cada Jogo (Campos Relevantes)
Ao consultar `/events/round/1`, cada evento (jogo) retorna um objeto com os seguintes campos úteis:

```
{
  "id":           15186710,           // ID único do jogo no SofaScore
  "slug":         "mexico-south-africa",
  "startTimestamp": 1781204400,       // Data/hora em Unix Timestamp (UTC)
  
  "status": {
    "code":        0,                  // 0 = Não iniciado, 100 = Finalizado
    "description": "Not started",
    "type":        "notstarted"
  },
  
  "tournament": {
    "groupName":   "Group A",
    "groupSign":   "A"
  },
  
  "homeTeam": {
    "name":     "Mexico",
    "nameCode": "MEX",
    "id":       4781
  },
  
  "awayTeam": {
    "name":     "South Africa",
    "nameCode": "RSA",
    "id":       4736
  },
  
  "homeScore": {
    "current": null    // Preenchido quando o jogo ocorrer (ex: 2)
  },
  "awayScore": {
    "current": null    // Preenchido quando o jogo ocorrer (ex: 1)
  }
}
```

### 2.4. Lógica de Status do Jogo
| `status.code` | `status.type` | Significado |
|---|---|---|
| 0 | `notstarted` | Jogo não iniciou |
| 6 | `inprogress` | 1º Tempo |
| 7 | `inprogress` | 2º Tempo |
| 100 | `finished` | Jogo encerrado (tempo normal) |
| 110 | `finished` | Encerrado após prorrogação |
| 120 | `finished` | Encerrado nos pênaltis |

### 2.5. Diferenças de Nomes (API → Planilha)
Os nomes dos times na API estão em inglês. Precisaremos de um mapa de tradução. Exemplos detectados:

| API (inglês) | Planilha (português) |
|---|---|
| South Africa | África do Sul |
| South Korea | Coréia do Sul |
| Czechia | República Tcheca |
| USA | Estados Unidos |
| Bosnia & Herzegovina | Bósnia e Herzegovina |
| Türkiye | Turquia |
| Côte d'Ivoire | Costa do Marfim |
| Netherlands | Holanda |
| DR Congo | RD do Congo |
| Cabo Verde | Cabo Verde |

## 3. Fluxo de Automação Proposto

1. O **AdminSuper** acessa o painel e clica em **"Sincronizar Resultados"**.
2. O backend faz uma requisição `GET` para `api.sofascore.com/api/v1/unique-tournament/16/season/58210/events/round/{rodada}`.
3. Para cada evento com `status.code >= 100` (finalizado):
    *   Identifica os times pelo `nameCode` ou `id` (mais confiável que o nome).
    *   Lê `homeScore.current` e `awayScore.current`.
    *   Localiza o jogo correspondente no banco de dados do sistema.
    *   Preenche o placar e marca como `finished = True`.
    *   Dispara automaticamente o cálculo de pontos para todos os palpites daquele jogo.
4. O AdminSuper visualiza um resumo dos jogos atualizados.

## 4. Plano B: Inserção Manual
Caso a API do SofaScore bloqueie requisições do nosso servidor (ex: rate limiting, Cloudflare), o AdminSuper terá no painel a opção de inserir os resultados manualmente, jogo a jogo, diretamente na interface administrativa do Django.

## 5. Resumo
*   A API do SofaScore é **pública, funcional e retorna dados estruturados** — não precisamos de scraping de HTML.
*   A implementação na Fase 4 será simples: uma função Python com `requests.get()` que consome o JSON e atualiza o banco de dados.
*   O mapeamento de nomes inglês→português será feito uma única vez no início do projeto.

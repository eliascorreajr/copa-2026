# PRD - Atualizacao Mata-Mata Copa 2026

**Data:** 2026-06-26  
**Projeto:** Bolao Quinta Categoria Show - Copa do Mundo 2026  
**Status:** Implementado (branch `feature/mata-mata-copa-2026`), mergeado em `main`, deploy das `firestore.rules` concluído em 2026-06-26. Ajustes pós-deploy aplicados.  
**Fonte principal de regras:** `copa_2026_resultados_regras_cruzamentos_ate_2026-06-26.md`  

---

## 1. Diagnostico do Projeto Atual

O projeto atual e um aplicativo estatico em HTML, CSS e JavaScript vanilla, publicado no GitHub Pages e conectado ao Firebase Auth e Cloud Firestore. Ele ja permite login, primeiro acesso, cadastro de perfil, upload de foto em base64, registro de palpites, lancamento de resultados, ranking, historico e painel administrativo.

O arquivo `data/matches.json` contem 104 jogos: 72 da fase de grupos e 32 de mata-mata. A fase de grupos possui grupos, rodadas, times, datas e horarios. Os 32 jogos de mata-mata ainda estao com `homeTeam: "TBD"` e `awayTeam: "TBD"`, portanto ainda nao podem receber palpites reais por confronto sem atualizacao.

O Firestore usa as seguintes colecoes principais:

- `users`: perfis dos participantes.
- `guesses`: palpites, com documentos no formato `{uid}_match_{matchId}`.
- `matches`: resultados oficiais, manuais ou vindos da integracao historica do SofaScore.
- `locks`: travas por dia.
- `matchLocks`: travas canonicas por jogo usadas pelas regras de seguranca.
- `logs`: auditoria administrativa.

As regras atuais de seguranca ja validam perfil, placares, dono do palpite e trava por jogo. A regra autoritativa para salvar palpite depende de `matchLocks/{matchId}`, com `dayKey` e `lockAt` correspondentes.

## 2. O Que o Sistema Ja Faz

- Autentica usuarios via Firebase Auth.
- Redireciona perfis incompletos para primeiro acesso.
- Permite foto de perfil compactada em base64 no Firestore.
- Exibe jogos por dia na pagina de palpites.
- Permite criar, alterar e limpar palpites enquanto o dia ainda esta aberto.
- Bloqueia palpites 30 minutos antes do primeiro jogo do dia.
- Reforca o bloqueio no Firestore por meio de `matchLocks`.
- Calcula pontuacao do bolao:
  - placar exato: `+7`;
  - resultado correto: `+3`;
  - resultado errado: `-1`.
- Exibe ranking geral, historico pessoal e resultados oficiais.
- Permite o AdminSuper inserir/corrigir resultados manualmente.
- Permite sincronizar travas a partir do `matches.json`.
- Permite gerenciar usuarios, migrar e-mail, remover participante e exportar CSV.
- Mantem modulo de SofaScore, com fallback de CORS e preservacao de resultado manual.

## 3. O Que Deve Ser Preservado

- Nenhum palpite existente deve ser removido.
- Nenhum resultado existente deve ser apagado automaticamente.
- A regra de pontuacao do bolao deve permanecer exatamente igual.
- O formato de documento dos palpites deve continuar compativel com `{uid}_match_{matchId}`.
- O fluxo de login, primeiro acesso, perfil, ranking, historico, resultados e admin deve continuar funcionando.
- `firestore.rules` deve continuar protegendo `guesses` por dono e trava.
- O modulo `js/sofascore.js` deve permanecer no projeto, mas nao deve ser fonte ativa do fluxo principal nesta atualizacao.
- A insercao manual de resultados deve continuar tendo prioridade operacional.

## 4. Limitacoes Atuais

- `data/matches.json` ainda nao contem os confrontos reais do mata-mata.
- A classificacao dos grupos nao e calculada pelo sistema; ela precisa ser derivada dos resultados.
- O sistema nao calcula melhores terceiros colocados.
- O sistema nao possui modelo explicito para origem de vagas, por exemplo `1A`, `2B`, `3C`, `W73`, `L101`.
- O painel admin nao possui tela para revisar classificacao, classificados, melhores terceiros ou bracket.
- A logica atual de resultados e pontuacao e suficiente para o bolao, mas nao para montar automaticamente a competicao.
- A API SofaScore nao deve ser usada como fonte ativa neste momento.
- O arquivo Markdown de resultados e regras e uma referencia documental, nao uma fonte estruturada pronta para leitura automatica confiavel.

## 5. Objetivo da Atualizacao

Preparar o sistema para sair da fase de grupos e entrar no mata-mata, calculando automaticamente:

- classificacao final de cada grupo;
- classificados diretos: 12 primeiros e 12 segundos;
- ranking dos 12 terceiros colocados;
- 8 melhores terceiros classificados;
- preenchimento possivel da fase de 32;
- propagacao de vencedores para oitavas, quartas, semifinais, terceiro lugar e final.

O sistema deve manter pendentes todos os confrontos que dependam de jogos sem resultado ou de combinacoes ainda indefinidas. O AdminSuper deve poder corrigir manualmente resultados, classificacoes, confrontos, horarios e vencedores.

## 6. Regras Oficiais de Classificacao da Fase de Grupos

Cada grupo possui 4 selecoes. Cada selecao joga uma vez contra cada adversario do grupo.

### 6.1 Pontuacao da Competicao

- Vitoria: 3 pontos.
- Empate: 1 ponto.
- Derrota: 0 ponto.

### 6.2 Estatisticas por Selecao

Para cada selecao, o sistema deve calcular:

- `played`: jogos disputados;
- `wins`: vitorias;
- `draws`: empates;
- `losses`: derrotas;
- `goalsFor`: gols pro;
- `goalsAgainst`: gols contra;
- `goalDifference`: saldo de gols;
- `points`: pontos;
- `groupPosition`: posicao no grupo;
- `groupComplete`: se todos os jogos do grupo possuem resultado oficial completo.

### 6.3 Criterios de Desempate Dentro do Grupo

Conforme o arquivo de regras enviado, quando duas ou mais selecoes terminam empatadas em pontos no mesmo grupo, a ordem e:

1. Maior numero de pontos nos confrontos diretos entre as selecoes empatadas.
2. Melhor saldo de gols nos confrontos diretos entre as selecoes empatadas.
3. Maior numero de gols marcados nos confrontos diretos entre as selecoes empatadas.
4. Se ainda houver empate, reaplicar os criterios de confronto direto apenas entre as selecoes que permanecerem empatadas, quando couber.
5. Melhor saldo de gols em todos os jogos do grupo.
6. Maior numero de gols marcados em todos os jogos do grupo.
7. Melhor pontuacao de conduta da equipe.
8. Melhor posicao no Ranking Mundial Masculino FIFA/Coca-Cola mais recente.
9. Ranking FIFA imediatamente anterior, sucessivamente, se ainda necessario.

### 6.4 Dados de Desempate que o Sistema Nao Tem Hoje

O projeto atual nao armazena:

- cartoes;
- pontuacao de conduta;
- ranking FIFA atual;
- historico de rankings FIFA anteriores.

Por isso, a implementacao deve separar:

- classificacao automatica deterministica com dados disponiveis;
- estado `needsManualTiebreak` quando o empate exigir conduta/ranking FIFA;
- override manual pelo AdminSuper para fechar posicoes se necessario.

## 7. Melhores Terceiros Colocados

A Copa de 2026 classifica os 12 primeiros, os 12 segundos e os 8 melhores terceiros.

O sistema deve criar uma lista com os terceiros colocados dos 12 grupos e ordenar por:

1. Maior numero de pontos.
2. Melhor saldo de gols.
3. Maior numero de gols marcados.
4. Melhor pontuacao de conduta.
5. Melhor posicao no Ranking FIFA/Coca-Cola mais recente.
6. Ranking FIFA anterior, sucessivamente, se ainda necessario.

Se os criterios automaticos nao resolverem um empate por falta de dados, o sistema deve marcar esses terceiros como `needsManualTiebreak` e permitir correcao manual.

Cada terceiro colocado deve conter:

- grupo;
- selecao;
- pontos;
- gols pro;
- gols contra;
- saldo;
- posicao provisoria;
- `qualifiedAsThird`: verdadeiro/falso;
- `manualOverride`: verdadeiro/falso;
- observacao administrativa opcional.

## 8. Calculo da Classificacao Final de Cada Grupo

O sistema deve:

1. Carregar os jogos do grupo a partir de `data/matches.json`.
2. Carregar resultados oficiais a partir da collection `matches`.
3. Ignorar jogos sem resultado completo.
4. Atualizar estatisticas de cada selecao com base nos resultados.
5. Marcar o grupo como incompleto se qualquer jogo do grupo estiver sem resultado.
6. Ordenar selecoes pelos criterios oficiais aplicaveis.
7. Marcar empates que dependam de dados externos como `needsManualTiebreak`.
8. Aplicar overrides manuais, se existirem.
9. Persistir snapshots de classificacao para auditoria e exibicao administrativa.

O sistema nao deve inventar resultado ou fechar classificacao definitiva de grupo incompleto.

## 9. Preenchimento Automatico da Fase de 32

Os jogos da fase de 32 sao `M73` a `M88`, correspondendo aos `matchId` 73 a 88.

Estrutura prevista:

| Jogo | Lado A | Lado B | Proximo |
|---|---|---|---|
| M73 | 2A | 2B | W73 -> M90 |
| M74 | 1E | melhor 3o de A/B/C/D/F | W74 -> M89 |
| M75 | 1F | 2C | W75 -> M90 |
| M76 | 1C | 2F | W76 -> M91 |
| M77 | 1I | melhor 3o de C/D/F/G/H | W77 -> M89 |
| M78 | 2E | 2I | W78 -> M91 |
| M79 | 1A | melhor 3o de C/E/F/H/I | W79 -> M92 |
| M80 | 1L | melhor 3o de E/H/I/J/K | W80 -> M92 |
| M81 | 1D | melhor 3o de B/E/F/I/J | W81 -> M94 |
| M82 | 1G | melhor 3o de A/E/H/I/J | W82 -> M94 |
| M83 | 2K | 2L | W83 -> M93 |
| M84 | 1H | 2J | W84 -> M93 |
| M85 | 1B | melhor 3o de E/F/G/I/J | W85 -> M96 |
| M86 | 1J | 2H | W86 -> M95 |
| M87 | 1K | melhor 3o de D/E/I/J/L | W87 -> M96 |
| M88 | 2D | 2G | W88 -> M95 |

### 9.1 Terceiros Dependentes de Combinacao

Os slots de terceiros nao sao preenchidos apenas escolhendo qualquer terceiro elegivel dentro da lista. Eles dependem da combinacao final dos 8 grupos que classificaram terceiros.

A implementacao deve conter uma tabela explicita de alocacao oficial de terceiros por combinacao. Caso essa tabela ainda nao esteja codificada ou a combinacao nao esteja resolvida, o slot deve permanecer pendente com origem textual, por exemplo:

```text
melhor 3o de A/B/C/D/F
```

Nao e permitido preencher adversario de terceiro colocado por heuristica nao oficial.

## 10. Atualizacao dos Cruzamentos das Fases Seguintes

O sistema deve modelar um bracket com origens e destinos.

### 10.1 Fase de 32 para Oitavas

- M89: W74 x W77.
- M90: W73 x W75.
- M91: W76 x W78.
- M92: W79 x W80.
- M93: W83 x W84.
- M94: W81 x W82.
- M95: W86 x W88.
- M96: W85 x W87.

### 10.2 Oitavas para Quartas

- M97: W89 x W90.
- M98: W93 x W94.
- M99: W91 x W92.
- M100: W95 x W96.

### 10.3 Quartas para Semifinais

- M101: W97 x W98.
- M102: W99 x W100.

### 10.4 Semifinais para Terceiro Lugar e Final

- M103: L101 x L102.
- M104: W101 x W102.

### 10.5 Vencedores

Para jogos eliminatorios, o sistema deve registrar:

- placar oficial;
- vencedor;
- perdedor, quando necessario;
- se houve prorrogação ou penaltis, caso o projeto passe a registrar essa informacao;
- status do jogo.

Enquanto o projeto registrar apenas placar simples, o AdminSuper deve poder escolher manualmente o vencedor em jogos empatados de mata-mata. Isso evita tratar empate como vencedor indefinido quando houver penaltis.

## 11. Jogos Sem Resultado

Se um jogo nao tiver resultado oficial completo:

- nao deve alterar estatisticas definitivas;
- nao deve fechar grupo;
- nao deve definir classificados finais;
- nao deve preencher confronto dependente dele;
- deve aparecer como pendente no painel admin.

Um resultado completo exige:

- `homeScore` inteiro de 0 a 30;
- `awayScore` inteiro de 0 a 30;
- `status: "finished"` ou equivalente;
- `matchId` conhecido quando for jogo da tabela local.

## 12. Confrontos Indefinidos

Um confronto deve poder existir parcialmente definido.

Exemplos:

- `Brasil x TBD`
- `1I x melhor 3o de C/D/F/G/H`
- `W74 x W77`

Estados recomendados:

- `pending`: depende de resultados/classificacao.
- `partially_defined`: apenas um lado definido.
- `defined`: dois lados definidos.
- `in_progress`: jogo em andamento, se esse estado for usado futuramente.
- `finished`: resultado final registrado.
- `manual_corrected`: algum campo principal foi corrigido manualmente.

## 13. Edicao Manual e Prioridade

O AdminSuper deve poder corrigir manualmente:

- resultado oficial;
- posicao de grupo;
- lista de classificados;
- ordem dos melhores terceiros;
- time de qualquer lado de confronto;
- data e horario;
- vencedor/perdedor de jogo eliminatorio;
- observacoes.

Quando um campo tiver `manualOverride: true`, o recalculo automatico nao deve sobrescrever esse campo sem confirmacao explicita.

Toda alteracao manual deve registrar:

- entidade alterada;
- campo alterado;
- valor anterior;
- valor novo;
- e-mail do admin;
- data e hora;
- justificativa opcional.

Esses registros podem usar a collection `logs` existente, mas mudancas de bracket mais complexas devem ter collection propria de auditoria para facilitar revisao.

## 14. Modelo de Dados Sugerido

### 14.1 `matches`

Continuar usando para resultados oficiais, mantendo compatibilidade:

```json
{
  "matchId": 73,
  "homeTeam": "Africa do Sul",
  "awayTeam": "Canada",
  "homeScore": 1,
  "awayScore": 0,
  "status": "finished",
  "manualEntry": true,
  "winner": "Africa do Sul",
  "loser": "Canada",
  "stage": "round-of-32",
  "updatedAt": "2026-06-28T20:00:00.000Z"
}
```

### 14.2 `standings/{group}`

Snapshot calculado ou corrigido:

```json
{
  "group": "A",
  "complete": true,
  "generatedAt": "2026-06-27T23:30:00.000Z",
  "manualOverride": false,
  "teams": [
    {
      "team": "Mexico",
      "position": 1,
      "played": 3,
      "wins": 3,
      "draws": 0,
      "losses": 0,
      "goalsFor": 6,
      "goalsAgainst": 0,
      "goalDifference": 6,
      "points": 9,
      "needsManualTiebreak": false
    }
  ]
}
```

### 14.3 `thirdPlaceRanking/current`

```json
{
  "complete": true,
  "generatedAt": "2026-06-27T23:40:00.000Z",
  "manualOverride": false,
  "teams": [
    {
      "rank": 1,
      "group": "F",
      "team": "Suecia",
      "points": 4,
      "goalDifference": 0,
      "goalsFor": 7,
      "qualified": true,
      "needsManualTiebreak": false
    }
  ]
}
```

### 14.4 `bracketMatches/{matchId}`

Fonte estruturada para confrontos eliminatorios:

```json
{
  "matchId": 73,
  "code": "M73",
  "stage": "round-of-32",
  "date": "2026-06-28T16:00:00-03:00",
  "homeTeam": "Africa do Sul",
  "awayTeam": "Canada",
  "homeSource": "2A",
  "awaySource": "2B",
  "homeResolved": true,
  "awayResolved": true,
  "status": "defined",
  "nextMatchId": 90,
  "nextSlot": "home",
  "winner": null,
  "loser": null,
  "manualOverride": false,
  "notes": ""
}
```

### 14.5 `manualOverrides/{id}`

```json
{
  "entityType": "bracketMatch",
  "entityId": "73",
  "field": "homeTeam",
  "previousValue": "TBD",
  "newValue": "Africa do Sul",
  "adminEmail": "admin@bolao.com",
  "reason": "Ajuste conforme classificacao oficial",
  "createdAt": "2026-06-27T23:50:00.000Z"
}
```

## 15. Alteracoes Necessarias no Banco de Dados

Nao ha migration obrigatoria no sentido tradicional, porque Firestore e schemaless. Ainda assim, ha necessidade de criar novas collections ou documentos:

- `standings/{group}` para classificacao calculada.
- `thirdPlaceRanking/current` para melhores terceiros.
- `bracketMatches/{matchId}` para bracket estruturado.
- `manualOverrides/{id}` para auditoria de correcoes manuais.

Tambem sera necessario atualizar `firestore.rules` para permitir:

- leitura autenticada dessas novas collections;
- escrita apenas pelo AdminSuper;
- opcionalmente escrita restrita por funcoes futuras, se o projeto passar a usar backend privilegiado.

## 16. Alteracoes Necessarias no Backend

O projeto nao possui backend proprio. A camada "backend" e o Firestore mais as regras de seguranca.

Alteracoes necessarias:

- novas regras em `firestore.rules`;
- novas collections de dados;
- funcoes JavaScript client-side para calcular classificacao e bracket;
- persistencia dos snapshots pelo AdminSuper no painel.

Nao sera criada Cloud Function nesta etapa, salvo decisao futura. Manter tudo em client-side admin preserva o custo zero e o padrao atual do projeto.

## 17. Alteracoes Necessarias no Frontend

Criar ou alterar:

- modulo de regras da competicao;
- modulo de classificacao;
- modulo de bracket;
- tela ou aba admin para revisar classificacao e mata-mata;
- exibicao de confrontos indefinidos/definidos na pagina de resultados;
- tela de palpites para usar nomes atualizados dos confrontos quando o mata-mata for definido;
- sincronizacao de `locks` e `matchLocks` apos alteracao de datas ou confrontos.

## 18. Alteracoes Necessarias no Painel Administrativo

Adicionar ao painel Admin:

- botao "Recalcular Classificacao";
- visualizacao dos grupos com status completo/incompleto;
- visualizacao dos melhores terceiros;
- indicador `needsManualTiebreak`;
- botao "Gerar/Atualizar Mata-Mata";
- editor de confronto;
- editor de data/hora;
- seletor de vencedor para jogo eliminatorio empatado;
- historico de overrides;
- botao "Recalcular preservando correcoes manuais".

## 19. Estrategia para Reaproveitar o Que Ja Existe

Reaproveitar:

- `data/matches.json` como tabela base de jogos.
- `matches` como fonte de resultados oficiais.
- `js/scoring.js` apenas para pontuacao do bolao, sem misturar com classificacao da Copa.
- `js/matches.js` para datas, dias e travas.
- `admin.html` para a operacao administrativa.
- `firestore.rules` e padrao de AdminSuper.
- `logs` para auditoria simples.
- `buildResultLookup()` para localizar resultados por `matchId`.

Separar:

- pontuacao do bolao (`+7/+3/-1`);
- pontuacao da Copa (`3/1/0`).

Essas duas regras nao podem ficar no mesmo conceito.

## 20. Estrategia para Nao Usar SofaScore

Nesta atualizacao:

- nao chamar `syncAllResults()` no fluxo principal;
- manter o botao existente apenas como recurso legado ou desabilitado visualmente com aviso;
- adicionar flag de configuracao client-side, por exemplo `ENABLE_SOFASCORE_SYNC = false`;
- manter `js/sofascore.js` no repositorio para historico e compatibilidade;
- usar apenas resultados manuais em `matches` e o arquivo Markdown como referencia humana.

## 21. Criterios de Aceite

A atualizacao sera aceita se:

- fase de grupos continuar funcionando.
- palpites existentes permanecerem intactos.
- resultados existentes permanecerem intactos.
- ranking do bolao continuar calculando com `+7/+3/-1`.
- classificacao dos grupos for calculada com `3/1/0`.
- grupos incompletos permanecerem incompletos.
- melhores terceiros forem calculados quando houver dados suficientes.
- empates sem dados de conduta/ranking forem marcados para revisao manual.
- fase de 32 for preenchida apenas quando os classificados e combinacoes permitirem.
- confrontos indefinidos permanecerem pendentes.
- vencedores avancem automaticamente nas fases eliminatorias.
- empates em mata-mata permitam escolha manual de vencedor.
- AdminSuper consiga corrigir manualmente resultados, classificados e confrontos.
- toda correcao manual gere log/auditoria.
- datas e horarios sejam exibidos no horario local do Brasil.
- SofaScore permaneça no projeto, mas fora do fluxo principal.
- haja testes ou casos de teste documentados para classificacao, terceiros, bracket e overrides.

## 22. Plano de Testes

### 22.1 Classificacao de Grupo

- grupo completo sem empate;
- grupo completo com empate resolvido por confronto direto;
- grupo completo com empate resolvido por saldo geral;
- grupo completo com empate que exige conduta/ranking FIFA;
- grupo incompleto com jogos pendentes;
- resultado corrigido manualmente recalculando tabela.

### 22.2 Melhores Terceiros

- 12 terceiros com ranking claro;
- empate por pontos resolvido por saldo;
- empate por saldo resolvido por gols pro;
- empate que exige criterio manual;
- grupo incompleto impedindo fechamento definitivo.

### 22.3 Bracket

- preencher slots fixos como `2A x 2B`;
- manter pendente slot de terceiro sem combinacao resolvida;
- preencher terceiro quando combinacao oficial estiver disponivel;
- nao sobrescrever confronto com override manual;
- atualizar `matchLocks` quando data/hora mudar.

### 22.4 Eliminatorias

- vencedor normal avanca para proximo jogo;
- perdedores das semifinais vao para terceiro lugar;
- vencedores das semifinais vao para final;
- jogo empatado exige vencedor manual;
- correcao de vencedor recalcula fases seguintes sem apagar overrides.

### 22.5 Regressao

- login;
- primeiro acesso;
- salvar palpite aberto;
- bloquear palpite travado;
- ranking do bolao;
- historico;
- resultado manual;
- exportacao CSV;
- remocao/migracao de usuario.

## 23. Riscos

- Cruzamentos de terceiros classificados dependem de tabela oficial de combinacoes; sem essa tabela, nao preencher automaticamente esses slots.
- Criterios de conduta e ranking FIFA exigem dados que o projeto nao armazena.
- Alterar `matches.json` muda base de palpites do mata-mata; e preciso sincronizar `matchLocks` imediatamente depois.
- Jogos de mata-mata empatados nao tem vencedor dedutivel apenas pelo placar simples.
- Como tudo roda no client-side admin, calculos dependem do AdminSuper executar a acao de recalculo/publicacao no painel.
- `firestore-rules.txt` esta defasado e nao deve ser usado como fonte de deploy.

## 24. Proximos Passos de Implementacao

1. Criar modulos puros de classificacao e bracket, sem Firebase.
2. Criar fixtures/testes locais baseados no arquivo Markdown.
3. Adicionar colecoes e regras Firestore para `standings`, `thirdPlaceRanking`, `bracketMatches` e `manualOverrides`.
4. Adicionar tela admin de revisao da classificacao.
5. Adicionar tela admin de revisao/edicao do bracket.
6. Integrar atualizacao de `data/matches.json` ou leitura preferencial de `bracketMatches`.
7. Desativar SofaScore no fluxo principal por flag.
8. Rodar testes de regressao da fase de grupos.
9. Publicar e sincronizar travas.

---

## 25. Status de Implementacao (Pipeline Concluido)

Implementado e deployado em 2026-06-26 (commit `0c3aac2`, merge `--ff` para `main`, push para `origin/main` e `firebase deploy --only firestore:rules` no projeto `bolao-copa-2026-cba87`).

### 25.1 Arquivos entregues

- `js/worldcup-standings.js`: classificacao de grupos (3/1/0) e melhores terceiros, com confronto direto e `needsManualTiebreak`.
- `js/worldcup-bracket.js`: template M73-M104, resolucao de slots fixos (`1A`, `2B`), slots de terceiros (`3A/B/C/D/F...`) pendentes por combinacao oficial, propagacao de vencedores (`Wxx`) e perdedores (`Lxx`) com preservacao de `manualOverride`.
- `js/worldcup-admin.js`: persistencia Firestore AdminSuper-only em `standings/{group}`, `thirdPlaceRanking/current`, `bracketMatches/{matchId}`, `manualOverrides/{id}` e carregadores `loadBracketMatches`, `loadStandingsSnapshot`, `loadThirdPlaceRanking`.
- `firestore.rules`: regras para `standings`, `thirdPlaceRanking`, `bracketMatches` e `manualOverrides` (leitura autenticada, escrita AdminSuper).
- `admin.html`: aba `Mata-Mata` com Recalcular, Gerar/Atualizar, modal de edicao de confronto com auditoria em `manualOverrides`, exportacao Excel (CSV) de classificacao+terceiros+confrontos, e recarga automatica dos snapshots ao abrir/reabrir a aba.
- `resultados.html` e `palpites.html`: leem `bracketMatches` com fallback para `matches.json`; palpites pendentes/parciais permanecem desativados.
- `tests/fixtures/worldcup-sample-data.mjs`, `tests/worldcup-standings.test.mjs`, `tests/worldcup-bracket.test.mjs`: testes Node passando.
- SofaScore desativado via `ENABLE_SOFASCORE_SYNC = false`; modulo preservado.
- Plano e log de execucao em `docs/superpowers/plans/2026-06-26-mata-mata-copa-2026.md`.

### 25.2 Ajustes Pós-Deploy (2026-06-26)

1. **Horarios oficiais da fase de 32 corrigidos.** Os horarios de M73-M88 estavam como `T00:00:00` em `js/worldcup-bracket.js` e `data/matches.json`, fazendo placares, travas e countdown apontarem meia-noite em vez do kickoff real. Atualizado para horario de Brasilia conforme secao 7 de `copa_2026_resultados_regras_cruzamentos_ate_2026-06-26.md`:
   - M73 16:00, M74 17:30, M75 22:00, M76 14:00, M77 18:00, M78 14:00, M79 22:00, M80 13:00, M81 21:00, M82 17:00, M83 20:00, M84 16:00, M85 00:00 (30/06), M86 19:00, M87 22:30, M88 15:00.
   - M85 corrigido tambem na data (era 02/07 no fallback, agora 03/07 conforme oficial).
   - Fases seguintes (M89-M104) permanecem com `T00:00:00` pois a programacao oficial de kickoff ainda nao esta no documento de referencia; o AdminSuper podera editar pelo modal de confronto quando a FIFA confirmar.
   - Para aplicar na base ja publicada, o AdminSuper deve clicar `Gerar/Atualizar Mata-Mata` (reescreve `bracketMatches` no Firestore) e depois `Sincronizar Travas`.
   - Horarios sao interpretados no fuso local do navegador; para participantes no Brasil equivalem a Brasilia (UTC-03:00), alinhado ao criterio de aceite de exibir horario local do Brasil.

2. **Aba Mata-Mata agora persiste visualmente.** Antes, ao recalculas/gerar e sair/reabrir a aba, os cards voltavam ao placeholder. Adicionada `loadKnockoutSnapshots()` em `admin.html` que le `standings`, `thirdPlaceRanking` e `bracketMatches` do Firestore (via novos carregadores em `js/worldcup-admin.js`) e os renderiza na abertura da aba e no `init`.

3. **Exportacao Excel adicionada na aba Mata-Mata.** Botao `Exportar Mata-Mata (Excel)` gera CSV (compativel com Excel, BOM UTF-8) com tres secoes: Classificacao (todos os grupos com PJ/V/E/D/GP/GC/SG/Pts/Status/Obs), Melhores Terceiros (rank/grupo/selecao/pts/SG/GP/status/obs) e Confrontos (jogo/fase/data/mandante/visitante/origens/status/vencedor/manual).

4. **Exportacao de palpites ja cobre a fase mata-mata.** O export Excel da aba `Palpites` le todos os documentos de `guesses` e cruza com `matches` (resultados oficiais), independentemente da fase. Palpites do mata-mata sao incluidos automaticamente conforme os participantes os inserem.

5. **Sincronizar Travas vs mata-mata.** O botao `Sincronizar Travas` da aba `Resultados` JA considera o mata-mata: `getMatchesDataForLocks` sobrepoe as datas de `bracketMatches` (editadas pelo admin) sobre `matches.json` antes de recalcular `locks/{dayKey}` e `matchLocks/{matchId}`. Por isso nao foi removido; ele e o mecanismo correto para atualizar travas quando datas/horarios de mata-mata mudam. Apos editar um confronto no modal, o admin tambem pode clicar `Sincronizar Travas` (ou o proprio fluxo de edicao ja dispara a sincronizacao).

### 25.3 Pendencias operacionais (manual, AdminSuper)

- Logar como AdminSuper, abrir `Mata-Mata`, clicar `Gerar/Atualizar Mata-Mata` para regravar `bracketMatches` no Firestore com os novos horarios e dados de classificacao, e clicar `Sincronizar Travas` para atualizar `locks`/`matchLocks`.
- Validar no navegador os horarios exibidos em `palpites.html` (Fase de 32) contra a programacao oficial.
- Quando a FIFA divulgar horarios de M89-M104 (oitavas em diante), o AdminSuper edita cada confronto no modal e sincroniza travas; `data/matches.json` permanece intocado ate confirmacao oficial (conforme PRD secao 17 e plano Task 9).

### 25.4 Avanço do mata-mata: prorrogação, pênaltis e quem avança (2026-06-26)

**Regra confirmada:** a pontuação do bolão usa **apenas o placar ao fim dos 90 minutos** (em `js/scoring.js`). Prorrogação e pênaltis **não entram** para o ranking geral. O ranking é separado do avanço da competição.

**Implementado:**

1. Campos extras em `matches/match_{matchId}` para confrontos de mata-mata:
   - `winner`: `"home"` | `"away"` | `null` — selecionado manualmente quando o placar dos 90 min fica empatado.
   - `winnerMethod`: `"extra-time"` (prorrogação) | `"penalties"` (pênaltis) | `null`.
   - `extraTimeHome`, `extraTimeAway`: placar agregado da prorrogação (opcional).
   - `penaltiesHome`, `penaltiesAway`: placar dos pênaltis (opcional).
2. `admin.html`:
   - **Inserir / Corrigir Resultado Manualmente**: quando o jogo selecionado é de mata-mata, exibe bloco "Avanço (mata-mata)" com rádio "Quem avançou" (Mandante/Visitante) — obrigatório quando o placar dos 90 min empata —, seletor de Método, placar da prorrogação e placar dos pênaltis.
   - **Editar Resultado** (modal): mesmos campos extras, pré-preenchidos com os valores salvos.
   - **Resultados Cadastrados**: cada linha mostra um badge `→ {seleção} (prorr.|pên.)` quando `winner` está definido.
   - Ao salvar/editar resultado de mata-mata, chama `propagateKnockoutResult` que usa `propagateKnockoutWinner` (em `js/worldcup-bracket.js`) para marcar o jogo como `finished`, gravar `winner`/`loser` e preencher o slot do próximo confronto em `bracketMatches/{matchId}` automaticamente.
3. `resultados.html`: em jogos de mata-mata finalizados mostra "→ {seleção} avançou · {Prorrogação|Pênaltis} · Prorr.: X x Y · Pên.: A x B" (apenas os campos presentes).
4. **Pontuação do ranking**: sem alteração — `calculateScore` em `js/scoring.js` segue usando só `homeScore`/`awayScore` (90 min), conforme `regras-pontuacao.txt`.
5. **Travas**: sem alteração — `locks`/`matchLocks` basica-se na data/hora do jogo (já relacionados).

**Persistência:** o avançar do mata-mata (gerar próxima fase) não invalida palpites já salvos para esse jogo, pois o palpite está vinculado à partida (por `matchId`), independente de quem avança. O bolão pontua pelo placar dos 90 min, e o bracket segue seu fluxo paralelo de vencedores.

### 25.5 Resultados manuais: filtragem, edição e correções pós-deploy (2026-06-26)

**Melhorias no formulário de inserção manual (admin, aba Resultados):**

1. **`populateMatchSelect` (async)** em `admin.html` agora:
   - Lê `matches` + `bracketMatches` do Firestore;
   - Omite do `<select>` os jogos que já têm resultado cadastrado (filtro por `matchId`, `match_{id}` e `sofaScoreId`);
   - Para confrontos de mata-mata, sobrepõe os times do `bracketMatches` sobre o `matches.json` (mostra seleções reais quando o bracket já está resolvido);
   - Oculta jogos de mata-mata ainda `TBD` (sem ambos os lados definidos).
2. **Botão Editar** ao lado de Excluir em cada linha de "Resultados Cadastrados": abre um modal pré-preenchido para corrigir o placar (e os campos extras de mata-mata) sem criar duplicata — grava no mesmo `matches/match_{id}` via `setDoc` com `merge`.
3. Após inserir/excluir/editar, o select e a lista recarregam (`loadResults` + `populateMatchSelect`).

**Bug corrigido (commit `05e0182`):** template literal em `admin.html` com aspas desbalanceadas dentro de `${...}` quebrava o parse do `<script type="module">` inteiro — isso abortava `init()`, impedindo `setupNavbar` (logout e imagem paravam) e todas as funções do admin. Sintoma percebido pelo AdminSuper: logout não funcionava, imagem não carregava e a aba Resultados travava. Corrigido com expressão template refeita e `init` de `resultados.html` envolvido em `try/catch` para resiliência. Cache-bust bumped (`v=8` em resultados, `v=9` em admin).

### 25.6 Validação operacional (AdminSuper, 2026-06-26)

Teste ponta-a-ponta realizado pelo AdminSuper com o jogo **Brasil x Japão** (M76 da Fase de 32):
- Seleção do jogo no `<select>` exibiu os times corretos (oriundos do `bracketMatches`).
- Preenchimento do placar dos 90 minutos e clicar em **Salvar Resultado** gravou em `matches/match_76`.
- Linha "Resultados Cadastrados" exibiu o placar com badge de avanço quando aplicável.
- **Excluir** removeu o documento de `matches` e o jogo voltou a aparecer no `<select>` de inserção manual.
- Ranking e palpites não foram afetados pela inserção/exclusão do resultado de teste (o teste não contemplou empate/prorrogação/pênaltis, mas o fluxo de campos extras é análogo).

Resultado: fluxo de inserção/edição/exclusão de resultados manuais **confirmado funcional** para a fase de mata-mata.

### 25.7 Fluxo operacional recomendado (AdminSuper)

Para cada rodada/jornada do mata-mata, siga esta ordem:

1. **Inserir resultados** (aba Resultados → Inserir/Corrigir Resultado Manualmente): o `<select>` mostra apenas jogos pendentes. Para empate nos 90 min, selicione Quem avançou + Método (Prorrogação/Pênaltis) + placares extras (opcionais). Ao salvar, o vencedor é propagado automaticamente para o próximo confronto em `bracketMatches`.
2. **Recalcular Classificação** (aba Mata-Mata): reprocessa `standings` e `thirdPlaceRanking` com base nos resultados oficiais inseridos.
3. **Gerar/Atualizar Mata-Mata** (aba Mata-Mata): reescreve `bracketMatches` no Firestore com os classificados atualizados, preservando `manualOverride`.
4. **Sincronizar Travas** (aba Resultados): atualiza `locks/{dayKey}` e `matchLocks/{matchId}` com as datas/horários reais dos jogos (incluindo datas editadas de mata-mata).
5. **Exportar Mata-Mata** (aba Mata-Mata, opcional): CSV com classificação, melhores terceiros e confrontos para auditoria/compartilhamento.

**Observações:**
- A pontuação do ranking usa só os 90 minutos; prorrogação/pênaltis não entram.
- O avançar de um confronto (quem vai à próxima fase) está separado da pontuação do bolão.
- Palpites já salvos não são invalidados quando o bracket avança — ficam vinculados à partida por `matchId`.
- Grupos incompletos ou terceiros com `needsManualTiebreak` exigem ação manual do AdminSuper (override no modal de edição de confronto ou em `standings`).

### 25.8 Correção de produção: terceiros definidos e documentos `bracketMatches` defasados (2026-06-27)

**Sintoma reportado:** após o AdminSuper lançar resultados de jogos da fase de grupos e seguir o fluxo de `Mata-Mata` + `Resultados` + `Sincronizar Travas`, alguns confrontos da fase de 32 continuavam indefinidos em `palpites.html`. Exemplos percebidos:

- M74 aparecia como `Alemanha x TBD`, mas o calendário oficial já indicava `Alemanha x Paraguai`.
- M77 aparecia como `França x TBD`, mas o calendário oficial já indicava `França x Suécia`.
- M81 aparecia como `Estados Unidos x TBD`, mas o calendário oficial já indicava `Estados Unidos x Bósnia e Herzegovina`.
- M86 aparecia como `TBD x Cabo Verde`, mas o calendário oficial já indicava `Argentina x Cabo Verde`.

**Causa 1:** a implementação inicial respeitou o PRD seção 9.1 e não aplicava heurística para terceiros colocados. Como a tabela oficial de combinação de terceiros ainda não estava codificada, `resolveFixedSlots()` resolvia apenas fontes diretas (`1A`, `2B`, `1I`, `2G`, etc.) e deixava slots `3A/B/C/D/F`, `3C/D/F/G/H` e `3B/E/F/I/J` pendentes.

**Solução 1:** adicionada uma tabela explícita de alocações já publicadas/confirmadas em `js/worldcup-bracket.js`:

```javascript
CONFIRMED_THIRD_PLACE_ASSIGNMENTS = {
  "M74.away": "D",
  "M77.away": "F",
  "M81.away": "B",
  "M86.home": "Argentina"
}
```

Essa tabela não inventa novos cruzamentos: ela só fixa slots já confirmados pelo calendário informado pelo AdminSuper. Os demais slots de terceiros permanecem pendentes.

**Causa 2:** alguns documentos `bracketMatches` no Firestore foram criados antes da correção e continuavam com `homeTeam`/`awayTeam` em `TBD` ou com `homeResolved`/`awayResolved` desatualizados. Assim, mesmo com o código corrigido, a tela pública continuava lendo o estado antigo do Firestore.

**Solução 2:** usando Firebase CLI autenticada + REST API do Firestore, foram inspecionados e corrigidos diretamente em produção os documentos:

- `bracketMatches/74`: `Alemanha x Paraguai`, `awayResolved: true`, `status: "defined"`.
- `bracketMatches/77`: `França x Suécia`, `awayResolved: true`, `status: "defined"`.
- `bracketMatches/81`: `Estados Unidos x Bósnia e Herzegovina`, `awayResolved: true`, `status: "defined"`.
- `bracketMatches/86`: `Argentina x Cabo Verde`, `homeResolved: true`, `status: "defined"`.

**Estado verificado no Firestore após a correção:**

```text
M73: África do Sul x Canadá | defined
M74: Alemanha x Paraguai | defined
M75: Holanda x Marrocos | defined
M76: Brasil x Japão | defined
M77: França x Suécia | defined
M78: Costa do Marfim x Noruega | defined
M79: México x TBD | partially_defined
M80: TBD x TBD | pending
M81: Estados Unidos x Bósnia e Herzegovina | defined
M82: Bélgica x TBD | partially_defined
M83: TBD x TBD | pending
M84: Espanha x TBD | partially_defined
M85: Suíça x TBD | partially_defined
M86: Argentina x Cabo Verde | defined
M87: TBD x TBD | pending
M88: Austrália x Egito | defined
```

### 25.9 Correção de produção: preservação de overrides por campo (2026-06-27)

**Erro encontrado:** `manualOverride: true` era tratado como se todo o confronto estivesse protegido contra atualização automática. Isso era amplo demais: se o AdminSuper tivesse editado apenas a data, status ou observação, o sistema podia preservar indevidamente `homeTeam`/`awayTeam` antigos e impedir atualização dos times.

**Solução:** `js/worldcup-bracket.js` e `admin.html` passaram a preservar overrides por campo:

- `manualFields.homeTeam === true` preserva somente mandante.
- `manualFields.awayTeam === true` preserva somente visitante.
- `homeManualOverride` e `awayManualOverride` continuam aceitos por compatibilidade com documentos antigos.
- Edição de data, status, notas ou motivo não bloqueia mais a resolução automática dos times.

**Correção complementar em `palpites.html`:** a tela de palpites passou a considerar um confronto palpável quando os dois lados têm nomes reais de seleções, independentemente de flags antigos salvos no Firestore. Valores como `TBD`, `A definir`, `1I`, `3C/D/F/G/H`, `W73` e `L101` continuam tratados como não resolvidos.

### 25.10 Commits publicados relacionados ao incidente (2026-06-27)

- `317bc96 fix(mata-mata): resolver terceiros definidos`
  - Adicionou alocações confirmadas de terceiros M74, M77 e M81.
- `75a7e75 fix(mata-mata): normalizar confrontos salvos`
  - Recalculou `homeResolved`/`awayResolved` a partir dos nomes reais e liberou palpites quando ambos os times estão resolvidos.
- `d5427ea fix(mata-mata): preservar overrides por campo`
  - Corrigiu a preservação ampla demais de `manualOverride`.
  - Adicionou testes para tabela atual da fase de 32 e casos de override por data.
- `25f2cde fix(mata-mata): fixar Argentina no M86`
  - Protegeu M86 contra regressão enquanto `standings/J` estiver incompleto no Firestore.

**Validações executadas:**

```bash
node tests/worldcup-bracket.test.mjs
node tests/worldcup-standings.test.mjs
node --check js/worldcup-bracket.js
node --check /tmp/copa-admin-inline.js
git diff --check
```

### 25.11 Correções de produção: fechamento dos terceiros e reprocessamento de vencedores (2026-06-29)

Relatório detalhado: `docs/relatorio-operacional-mata-mata-2026-06-29.md`.

**Erro 1:** após o AdminSuper inserir os resultados faltantes da terceira rodada
da fase de grupos, a combinação final dos melhores terceiros ficou
`B/D/E/F/I/J/K/L`, mas nem todos os confrontos M73-M88 foram atualizados em
`bracketMatches`. M79, M80, M82, M85 e M87 ainda tinham slots `TBD`/parciais.

**Causa:** a opção oficial do Anexo C para `BDEFIJKL` ainda não estava
codificada. O sistema deixava slots de terceiros pendentes por segurança quando
não havia mapeamento explícito.

**Solução:** commit `dde9b78 fix(mata-mata): completar terceiros`.

- `js/worldcup-bracket.js`: adicionou a opção oficial `BDEFIJKL` em
  `KNOWN_THIRD_PLACE_ASSIGNMENT_OPTIONS` e a função
  `getThirdPlaceAssignmentsForRanking(thirdPlaceRanking)`.
- `admin.html`: passou a calcular os encaixes dos terceiros a partir de
  `thirdPlaceRanking/current`.
- `tests/worldcup-bracket.test.mjs`: adicionou teste da combinação final e dos
  16 confrontos da fase de 32.
- Produção: `bracketMatches/79`, `/80`, `/82`, `/85` e `/87` foram corrigidos
  diretamente no Firestore; M73-M88 ficaram todos definidos.

**Erro 2:** após inserir `M73 = África do Sul 0 x 1 Canadá`, o resultado ficou
gravado em `matches/match_73`, mas `bracketMatches/73` continuou sem
`winner`/`loser` e `bracketMatches/90` continuou `TBD x TBD`.

**Causa:** a propagação existia, mas dependia do momento em que o resultado era
salvo. Se o admin estivesse com cache antigo ou se a propagação falhasse após
gravar `matches`, o botão `Gerar/Atualizar Mata-Mata` não reaplicava resultados
de mata-mata já existentes.

**Solução:** commit `bfe8bd5 fix(mata-mata): reprocessar resultados`.

- `js/worldcup-bracket.js`: adicionou
  `applyKnockoutResults(bracket, resultsByMatchId)`, que percorre M73-M104 em
  ordem e reaplica os resultados já salvos, usando `propagateKnockoutWinner`.
- `admin.html`: `Gerar/Atualizar Mata-Mata` agora executa a cadeia
  `resolveFixedSlots` -> `mergeManualBracketOverrides` ->
  `applyKnockoutResults` -> `saveBracketMatches`.
- `tests/worldcup-bracket.test.mjs`: cobre o caso Canadá no M73 e uma cadeia
  até quartas, semi, final e terceiro lugar.
- Produção: `bracketMatches/73` foi marcado `finished` com vencedor `Canadá` e
  `bracketMatches/90` ficou `Canadá x TBD`, aguardando `W75`.

**Onde paramos em produção:**

```text
M73: África do Sul 0 x 1 Canadá | finished | W73 = Canadá
M90: Canadá x TBD | partially_defined | aguarda W75
M97: TBD x TBD | pending | aguarda W89 e W90
M101: TBD x TBD | pending | aguarda W97 e W98
M103: TBD x TBD | pending | aguarda L101 e L102
M104: TBD x TBD | pending | aguarda W101 e W102
```

Regra prática: o Canadá entrou corretamente no M90. Ele só deve entrar nas
quartas se vencer M90, na semi se vencer M97 e na final se vencer M101. Se
perder M101, entra no M103.

**Validações executadas:**

```bash
node tests/worldcup-bracket.test.mjs
node tests/worldcup-standings.test.mjs
node --check js/worldcup-bracket.js
node --check /tmp/copa-admin-inline.js
git diff --check
```

### 25.12 Instrução obrigatória para futuras IAs/agentes

Antes de diagnosticar ou negar capacidade neste projeto, a IA/agente deve:

1. Ler todos os documentos Markdown/TXT relevantes da pasta do projeto, incluindo arquivos versionados e auxiliares ignorados pelo Git quando estiverem disponíveis localmente.
2. Verificar `.firebaserc`, `firebase.json`, `firestore.rules`, `tools/redefinir-senha.sh`, `usuarios-firebase.txt`, `Guia_Configuracao_GitHub_Firebase.md`, `DOC_Projeto_Bolao.md`, `MANUAL_ADMIN.md`, `PRD_MATA_MATA_COPA_2026.md` e `docs/superpowers/plans/2026-06-26-mata-mata-copa-2026.md`.
3. Reconhecer que o projeto possui Git local/remoto e Firebase/Firestore configurado.
4. Checar se a Firebase CLI está autenticada antes de afirmar que não há acesso ao Firestore.
5. Nunca expor senhas, tokens ou credenciais lidas nos arquivos locais; usar esses dados apenas para operação autorizada e responder com resumos seguros.

Motivo desta instrução: em 2026-06-27, a IA inicialmente não leu todos os documentos solicitados, deixou de reconhecer acesso ao Firestore já documentado na pasta e negou uma capacidade que estava disponível via Firebase CLI local.

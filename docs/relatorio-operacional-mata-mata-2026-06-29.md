# Relatorio operacional do mata-mata - 2026-06-29

## Objetivo

Registrar os problemas encontrados apos a terceira rodada da fase de grupos,
as correcoes aplicadas em codigo e em producao, e o ponto exato onde o
mata-mata ficou em 2026-06-29.

## Erro 1: terceiros classificados nao completaram todos os jogos da fase de 32

**Sintoma:** apos inserir os resultados faltantes da terceira rodada da fase de
grupos e gerar o mata-mata, nem todos os confrontos M73-M88 foram atualizados.
Os documentos `bracketMatches/79`, `bracketMatches/80`, `bracketMatches/82`,
`bracketMatches/85` e `bracketMatches/87` ainda estavam parciais ou `TBD`.

**Causa:** a combinacao final dos oito melhores terceiros ficou
`B/D/E/F/I/J/K/L`, mas essa opcao oficial ainda nao estava codificada. Sem a
tabela explicita, `resolveFixedSlots()` mantinha esses slots pendentes por
seguranca.

**Correcao em codigo:** commit `dde9b78 fix(mata-mata): completar terceiros`.

- `js/worldcup-bracket.js`
  - adicionou `KNOWN_THIRD_PLACE_ASSIGNMENT_OPTIONS.BDEFIJKL`;
  - adicionou `getThirdPlaceAssignmentsForRanking(thirdPlaceRanking)`;
  - manteve `CONFIRMED_THIRD_PLACE_ASSIGNMENTS` como base de seguranca.
- `admin.html`
  - passou a calcular `thirdPlaceAssignments` a partir do
    `thirdPlaceRanking/current`;
  - atualizou o cache-bust do modulo de bracket para `v=14`.
- `tests/worldcup-bracket.test.mjs`
  - adicionou teste cobrindo a combinacao final `BDEFIJKL` e os 16 confrontos
    da fase de 32.

**Correcao direta em producao:** os documentos defasados em `bracketMatches`
foram atualizados no Firestore via Firebase CLI autenticada + REST API:

```text
M79: Mexico x Equador
M80: Inglaterra x RD do Congo
M82: Belgica x Senegal
M85: Suica x Argelia
M87: Colombia x Gana
```

Depois disso, todos os jogos M73-M88 ficaram definidos.

## Erro 2: Canada venceu M73, mas nao apareceu no M90

**Sintoma:** o resultado `matches/match_73` foi salvo como
`Africa do Sul 0 x 1 Canada`, mas o documento operacional
`bracketMatches/73` continuou com `status: defined`, sem `winner`/`loser`, e
`bracketMatches/90` continuou `TBD x TBD`.

**Causa:** a propagacao do vencedor existia, mas dependia do fluxo do momento
em que o resultado era salvo. Se o admin estivesse com cache antigo, ou se a
propagacao falhasse depois de gravar `matches/match_73`, o botao
`Gerar/Atualizar Mata-Mata` nao reaplicava resultados de mata-mata ja
existentes.

**Correcao em codigo:** commit `bfe8bd5 fix(mata-mata): reprocessar resultados`.

- `js/worldcup-bracket.js`
  - adicionou `applyKnockoutResults(bracket, resultsByMatchId)`;
  - a funcao percorre M73-M104 em ordem e reaplica resultados ja salvos,
    chamando `propagateKnockoutWinner`.
- `admin.html`
  - `calculateAndSaveStandings()` passou a devolver tambem `resultsByMatchId`;
  - `Gerar/Atualizar Mata-Mata` agora faz:
    `resolveFixedSlots` -> `mergeManualBracketOverrides` ->
    `applyKnockoutResults` -> `saveBracketMatches`;
  - cache-bust do modulo de bracket atualizado para `v=15`.
- `tests/worldcup-bracket.test.mjs`
  - adicionou teste do caso Canada: resultado M73 0 x 1 preenche M90;
  - adicionou teste de cadeia ate quartas, semi, final e terceiro lugar.

**Correcao direta em producao:** os documentos operacionais foram atualizados:

```text
bracketMatches/73:
  Africa do Sul 0 x 1 Canada
  winner: Canada
  loser: Africa do Sul
  status: finished

bracketMatches/90:
  Canada x TBD
  homeSource: W73
  awaySource: W75
  status: partially_defined
```

## Regras de caminho apos a fase de 32

O sistema usa origens fixas `Wxx` e `Lxx` em `js/worldcup-bracket.js`.
O vencedor de um jogo so aparece na fase seguinte correspondente; nao deve
preencher quartas, semi ou final antes de vencer os jogos intermediarios.

```text
Oitavas:
M89 = W74 x W77
M90 = W73 x W75
M91 = W76 x W78
M92 = W79 x W80
M93 = W83 x W84
M94 = W81 x W82
M95 = W86 x W88
M96 = W85 x W87

Quartas:
M97  = W89 x W90
M98  = W93 x W94
M99  = W91 x W92
M100 = W95 x W96

Semifinais:
M101 = W97 x W98
M102 = W99 x W100

Terceiro lugar:
M103 = L101 x L102

Final:
M104 = W101 x W102
```

Portanto, no caso atual:

```text
Canada venceu M73 -> entra no M90.
Canada so entra no M97 se vencer M90.
Canada so entra no M101 se vencer M97.
Canada so entra no M104 se vencer M101.
Se perder M101, entra no M103.
```

## Onde paramos

Estado confirmado no Firestore em 2026-06-29:

```text
M73: Africa do Sul 0 x 1 Canada | finished | W73 = Canada
M90: Canada x TBD | partially_defined | aguarda W75
M97: TBD x TBD | pending | aguarda W89 e W90
M101: TBD x TBD | pending | aguarda W97 e W98
M103: TBD x TBD | pending | aguarda L101 e L102
M104: TBD x TBD | pending | aguarda W101 e W102
```

Codigo publicado em `main`:

```text
dde9b78 fix(mata-mata): completar terceiros
bfe8bd5 fix(mata-mata): reprocessar resultados
```

Arvore local ao final da correcao de codigo: limpa em
`main...origin/main`.

## Validacoes executadas

```bash
node tests/worldcup-bracket.test.mjs
node tests/worldcup-standings.test.mjs
node --check js/worldcup-bracket.js
node --check /tmp/copa-admin-inline.js
git diff --check
```

## Proximo passo operacional

1. Para o proximo jogo da fase de 32, inserir o resultado manualmente na aba
   `Resultados`.
2. Se o vencedor nao aparecer automaticamente no confronto seguinte, dar
   `Ctrl + Shift + R` no admin e clicar `Mata-Mata` ->
   `Gerar/Atualizar Mata-Mata`; esse botao agora reaplica resultados antigos.
3. Clicar `Sincronizar Travas` somente se datas/horarios/confrontos tiverem
   mudado para jogos ainda abertos a palpites.
4. Recarregar `palpites.html` com `Ctrl + Shift + R` para conferir a visao dos
   participantes.

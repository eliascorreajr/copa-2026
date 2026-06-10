import { normalizeScore } from "./scoring.js";

const SOFASCORE_BASE_URL = "https://api.sofascore.com/api/v1/unique-tournament/16/season/58210";
const SEASON_ID = 58210;

const NAME_TRANSLATION = {
  "Mexico": "México", "South Korea": "Coréia do Sul", "Czechia": "República Tcheca",
  "South Africa": "África do Sul", "Canada": "Canadá", "Qatar": "Catar",
  "Switzerland": "Suíça", "Bosnia & Herzegovina": "Bósnia e Herzegovina",
  "Brazil": "Brasil", "Haiti": "Haiti", "Scotland": "Escócia", "Morocco": "Marrocos",
  "USA": "Estados Unidos", "Australia": "Austrália", "Türkiye": "Turquia",
  "Paraguay": "Paraguai", "Germany": "Alemanha", "Côte d'Ivoire": "Costa do Marfim",
  "Ecuador": "Equador", "Curaçao": "Curaçao", "Netherlands": "Holanda",
  "Sweden": "Suécia", "Tunisia": "Tunísia", "Japan": "Japão", "Belgium": "Bélgica",
  "Iran": "Irã", "New Zealand": "Nova Zelândia", "Egypt": "Egito", "Spain": "Espanha",
  "Saudi Arabia": "Arábia Saudita", "Uruguay": "Uruguai", "Cape Verde": "Cabo Verde",
  "France": "França", "Iraq": "Iraque", "Norway": "Noruega", "Senegal": "Senegal",
  "Argentina": "Argentina", "Austria": "Áustria", "Jordan": "Jordânia",
  "Algeria": "Argélia", "Portugal": "Portugal", "Uzbekistan": "Uzbequistão",
  "Colombia": "Colômbia", "DR Congo": "RD do Congo", "England": "Inglaterra",
  "Ghana": "Gana", "Panama": "Panamá", "Croatia": "Croácia",
  "Ivory Coast": "Costa do Marfim"
};

const ROUNDS_MAP = {
  1: { stage: "group", round: 1 },
  2: { stage: "group", round: 2 },
  3: { stage: "group", round: 3 },
  6: { stage: "round-of-32" },
  5: { stage: "round-of-16" },
  27: { stage: "quarterfinals" },
  28: { stage: "semifinals" },
  50: { stage: "third-place" },
  29: { stage: "final" }
};

function translateName(englishName) {
  return NAME_TRANSLATION[englishName] || englishName;
}

function buildMatchLookup(matchesData) {
  const lookup = {};
  if (!matchesData) return lookup;
  const allMatches = [
    ...(matchesData.groupMatches || []),
    ...(matchesData.knockoutMatches || [])
  ];
  for (const m of allMatches) {
    if (m.homeTeam && m.awayTeam && m.homeTeam !== "TBD" && m.awayTeam !== "TBD") {
      lookup[`${m.homeTeam}|${m.awayTeam}`] = { match: m, reversed: false };
      lookup[`${m.awayTeam}|${m.homeTeam}`] = { match: m, reversed: true };
    }
  }
  return lookup;
}

// Estrategias de busca: primeiro direto; se o CORS bloquear (comum no
// GitHub Pages), tenta proxies CORS publicos. A insercao manual de
// resultados continua sendo o fallback final caso tudo falhe.
const FETCH_STRATEGIES = [
  (u) => u,
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`
];

async function fetchWithTimeout(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRoundEvents(round) {
  const url = `${SOFASCORE_BASE_URL}/events/round/${round}`;
  let lastError = null;

  for (const wrap of FETCH_STRATEGIES) {
    try {
      const response = await fetchWithTimeout(wrap(url));
      if (!response.ok) {
        lastError = new Error(`Erro na API: ${response.status}`);
        continue;
      }
      return await response.json();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Falha ao buscar eventos do SofaScore");
}

export async function syncAllResults(db, matchesData) {
  const { doc, setDoc, getDoc } = await import("https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js");
  const rounds = [1, 2, 3, 6, 5, 27, 28, 50, 29];
  let updated = 0;
  let errors = 0;
  let skipped = 0;

  const matchLookup = buildMatchLookup(matchesData);

  for (const round of rounds) {
    try {
      const data = await fetchRoundEvents(round);
      const events = data.events || [];

      for (const event of events) {
        const status = event.status?.code || 0;
        if (status >= 100) {
          const homeScore = normalizeScore(event.homeScore?.current);
          const awayScore = normalizeScore(event.awayScore?.current);

          if (homeScore !== null && awayScore !== null) {
            const apiHomeTeam = translateName(event.homeTeam.name);
            const apiAwayTeam = translateName(event.awayTeam.name);
            const stageInfo = ROUNDS_MAP[round] || {};

            const matchKey = `${apiHomeTeam}|${apiAwayTeam}`;
            const matched = matchLookup[matchKey];

            let docId, matchId, homeTeam, awayTeam, localHomeScore, localAwayScore;
            if (matched) {
              docId = `match_${matched.match.id}`;
              matchId = matched.match.id;
              homeTeam = matched.match.homeTeam;
              awayTeam = matched.match.awayTeam;
              localHomeScore = matched.reversed ? awayScore : homeScore;
              localAwayScore = matched.reversed ? homeScore : awayScore;
            } else {
              docId = `sofa_${event.id}`;
              matchId = null;
              homeTeam = apiHomeTeam;
              awayTeam = apiAwayTeam;
              localHomeScore = homeScore;
              localAwayScore = awayScore;
            }

            // Nao sobrescrever um resultado lancado/corrigido manualmente.
            const existingSnap = await getDoc(doc(db, "matches", docId));
            if (existingSnap.exists() && existingSnap.data().manualEntry === true) {
              skipped++;
              continue;
            }

            await setDoc(doc(db, "matches", docId), {
              sofaScoreId: event.id,
              matchId: matchId,
              homeTeam,
              awayTeam,
              homeTeamOriginal: event.homeTeam.name,
              awayTeamOriginal: event.awayTeam.name,
              homeTeamCode: event.homeTeam.nameCode,
              awayTeamCode: event.awayTeam.nameCode,
              homeScore: localHomeScore,
              awayScore: localAwayScore,
              status: "finished",
              round: round,
              stage: stageInfo.stage || "unknown",
              groupRound: stageInfo.round || null,
              timestamp: event.startTimestamp,
              updatedAt: new Date().toISOString()
            });
            updated++;
          }
        }
      }
    } catch (err) {
      console.warn(`Erro na rodada ${round}:`, err.message);
      errors++;
    }
  }

  return { updated, errors, skipped };
}

export function buildResultLookup(matchesSnap) {
  const lookup = {};
  matchesSnap.forEach(d => {
    const data = d.data();
    const hasScore = data.homeScore !== null && data.homeScore !== undefined
                  && data.awayScore !== null && data.awayScore !== undefined;
    if (!hasScore) return;

    if (data.matchId != null) {
      lookup[data.matchId] = data;
      lookup[String(data.matchId)] = data;
    }

    const teamKey = `${data.homeTeam}|${data.awayTeam}`;
    lookup[teamKey] = data;

    if (d.id) {
      const numericId = d.id.replace("match_", "").replace("sofa_", "");
      lookup[numericId] = data;
    }

    if (data.sofaScoreId) {
      lookup[`sofa_${data.sofaScoreId}`] = data;
      lookup[String(data.sofaScoreId)] = data;
    }
  });
  return lookup;
}

export { NAME_TRANSLATION, ROUNDS_MAP };

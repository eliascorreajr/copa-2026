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
      const key = `${m.homeTeam}|${m.awayTeam}`;
      lookup[key] = m;
    }
  }
  return lookup;
}

export async function fetchRoundEvents(round) {
  const url = `${SOFASCORE_BASE_URL}/events/round/${round}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erro na API: ${response.status}`);
  return await response.json();
}

export async function syncAllResults(db, matchesData) {
  const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js");
  const rounds = [1, 2, 3, 6, 5, 27, 28, 50, 29];
  let updated = 0;
  let errors = 0;

  const matchLookup = buildMatchLookup(matchesData);

  for (const round of rounds) {
    try {
      const data = await fetchRoundEvents(round);
      const events = data.events || [];

      for (const event of events) {
        const status = event.status?.code || 0;
        if (status >= 100) {
          const homeScore = event.homeScore?.current;
          const awayScore = event.awayScore?.current;

          if (homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined) {
            const homeTeam = translateName(event.homeTeam.name);
            const awayTeam = translateName(event.awayTeam.name);
            const stageInfo = ROUNDS_MAP[round] || {};

            const matchKey = `${homeTeam}|${awayTeam}`;
            const matchedMatch = matchLookup[matchKey];

            let docId, matchId;
            if (matchedMatch) {
              docId = `match_${matchedMatch.id}`;
              matchId = matchedMatch.id;
            } else {
              docId = `sofa_${event.id}`;
              matchId = null;
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
              homeScore,
              awayScore,
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

  return { updated, errors };
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
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

export async function fetchRoundEvents(round) {
  const url = `${SOFASCORE_BASE_URL}/events/round/${round}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erro na API: ${response.status}`);
  return await response.json();
}

export async function syncAllResults(db) {
  const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js");
  const rounds = [1, 2, 3, 6, 5, 27, 28, 50, 29];
  let updated = 0;
  let errors = 0;

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
            const stageInfo = ROUNDS_MAP[round] || {};
            await setDoc(doc(db, "matches", `sofa_${event.id}`), {
              sofaScoreId: event.id,
              homeTeam: translateName(event.homeTeam.name),
              awayTeam: translateName(event.awayTeam.name),
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

export { NAME_TRANSLATION, ROUNDS_MAP };
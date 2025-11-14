import React, { useEffect, useState, useCallback } from "react";
import api from "../pages/api";
import "../assets/css/GerenciarPartidas.css";

export default function VerPartidasTab({ eventId, evento }) {
  // Estados para Round Robin
  const [schedule, setSchedule] = useState([]);
  const [ranking, setRanking] = useState([]);
  
  // Estados para Leaderboard
  const [teams, setTeams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Estados para Single Elimination
  const [bracket, setBracket] = useState([]);
  
  // Estados compartilhados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Carregar agenda de partidas
  const loadSchedule = useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await api.get(`/events/${eventId}/round-robin/schedule`);
      if (response.data?.success) {
        setSchedule(response.data.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar agenda:", err);
      if (err.response?.status !== 404) {
        console.warn("Agenda ainda não foi gerada ou erro ao carregar.");
      }
    }
  }, [eventId]);

  // Carregar ranking
  const loadRanking = useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await api.get(`/events/${eventId}/round-robin/ranking`);
      if (response.data?.success) {
        setRanking(response.data.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar ranking:", err);
    }
  }, [eventId]);

  // Carregar times para Leaderboard
  const loadTeams = useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await api.get(`/events/${eventId}/teams`);
      if (response.data?.success) {
        // Filtrar apenas times aprovados
        const approvedTeams = (response.data.data || []).filter(team => team.status === "Approved");
        setTeams(approvedTeams);
      }
    } catch (err) {
      console.error("Erro ao carregar times:", err);
    }
  }, [eventId]);

  // Carregar rodadas do Leaderboard
  const loadRounds = useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await api.get(`/events/${eventId}/leaderboard/rounds`);
      // Nota: Este endpoint retorna um array diretamente, não um objeto com success
      if (Array.isArray(response.data)) {
        setRounds(response.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar rodadas:", err);
      // Não é erro fatal se as rodadas ainda não existem
      if (err.response?.status !== 404) {
        console.warn("Rodadas ainda não foram criadas ou erro ao carregar.");
      }
    }
  }, [eventId]);

  // Carregar ranking do Leaderboard
  const loadLeaderboard = useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await api.get(`/events/${eventId}/leaderboard`);
      if (response.data?.success) {
        setLeaderboard(response.data.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar leaderboard:", err);
      // Não é erro fatal se o ranking ainda não existe
    }
  }, [eventId]);

  // Carregar bracket do Single Elimination
  const loadBracket = useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await api.get(`/events/${eventId}/single-elimination/bracket`);
      if (response.data?.success) {
        setBracket(response.data.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar bracket:", err);
      // Não é erro fatal se o bracket ainda não foi gerado
      if (err.response?.status !== 404) {
        console.warn("Bracket ainda não foi gerado ou erro ao carregar.");
      }
    }
  }, [eventId]);

  // Carregar dados iniciais
  useEffect(() => {
    if (!evento || !eventId) {
      setLoading(false);
      return;
    }

    // Verificar se é Round Robin, Leaderboard ou Single Elimination
    const isRoundRobin = evento.mode === "Round Robin";
    const isLeaderboard = evento.mode === "Leaderboard";
    const isSingleElimination = evento.mode === "Single Elimination";
    
    if (!isRoundRobin && !isLeaderboard && !isSingleElimination) {
      setError("Esta página é apenas para eventos do tipo Round Robin, Leaderboard ou Single Elimination.");
      setLoading(false);
      return;
    }

    // Carregar dados baseado no modo
    if (isRoundRobin) {
      Promise.all([loadSchedule(), loadRanking()]).finally(() => {
        setLoading(false);
      });
    } else if (isLeaderboard) {
      Promise.all([loadTeams(), loadRounds(), loadLeaderboard()]).finally(() => {
        setLoading(false);
      });
    } else if (isSingleElimination) {
      Promise.all([loadBracket()]).finally(() => {
        setLoading(false);
      });
    }
  }, [eventId, evento, loadSchedule, loadRanking, loadTeams, loadRounds, loadLeaderboard, loadBracket]);

  if (loading) {
    return <div className="loading-state">Carregando informações...</div>;
  }

  if (error && !evento) {
    return (
      <div className="error-state">
        <strong>Erro:</strong> {error}
      </div>
    );
  }

  const hasSchedule = schedule.length > 0;
  const hasRanking = ranking.length > 0;
  const isRoundRobin = evento?.mode === "Round Robin";
  const isLeaderboard = evento?.mode === "Leaderboard";
  const isSingleElimination = evento?.mode === "Single Elimination";
  const hasRounds = rounds.length > 0;
  const hasLeaderboardData = leaderboard.length > 0;
  const hasBracket = bracket.length > 0;

  // Organizar bracket por rodadas
  const organizeBracketByRounds = (matches) => {
    const roundsMap = {};
    matches.forEach(match => {
      const roundNum = match.RoundNumber;
      if (!roundsMap[roundNum]) {
        roundsMap[roundNum] = [];
      }
      roundsMap[roundNum].push(match);
    });
    // Ordenar rodadas (maior número = primeira rodada, menor = final)
    return Object.keys(roundsMap)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .map(roundNum => ({
        roundNumber: parseInt(roundNum),
        matches: roundsMap[roundNum].sort((a, b) => a.MatchNumber - b.MatchNumber)
      }));
  };

  const bracketRounds = hasBracket ? organizeBracketByRounds(bracket) : [];

  // Renderizar UI do Single Elimination
  if (isSingleElimination) {
    return (
      <div className="gerenciar-partidas-tab">
        {error && (
          <div className="error-banner">
            <strong>⚠️</strong> {error}
          </div>
        )}

        {/* Seção: Bracket */}
        {hasBracket ? (
          <section className="section-card">
            <div className="section-header">
              <h2>Chaveamento (Bracket)</h2>
              <button onClick={loadBracket} className="btn-refresh" disabled={loading}>
                🔄 Atualizar
              </button>
            </div>

            <div className="bracket-container">
              {bracketRounds.map((round) => (
                <div key={round.roundNumber} className="bracket-round">
                  <h3 className="bracket-round-title">
                    {round.roundNumber === Math.max(...bracketRounds.map(r => r.roundNumber)) 
                      ? "Final" 
                      : round.roundNumber === Math.max(...bracketRounds.map(r => r.roundNumber)) - 1
                      ? "Semi-Final"
                      : round.roundNumber === Math.max(...bracketRounds.map(r => r.roundNumber)) - 2
                      ? "Quartas de Final"
                      : `Rodada ${round.roundNumber}`}
                  </h3>
                  <div className="bracket-matches">
                    {round.matches.map((match) => (
                      <div key={match.MatchID} className="bracket-match">
                        <div className="bracket-match-display">
                          <div className="bracket-match-team">
                            <span className={match.Winner_ID === match.Team1_ID ? "bracket-winner" : ""}>
                              {match.Team1_Name || "Aguardando..."}
                            </span>
                            <span className="bracket-score">
                              {match.Team1_Score !== null ? match.Team1_Score : "-"}
                            </span>
                          </div>
                          <div className="bracket-match-vs">×</div>
                          <div className="bracket-match-team">
                            <span className={match.Winner_ID === match.Team2_ID ? "bracket-winner" : ""}>
                              {match.Team2_Name || "Aguardando..."}
                            </span>
                            <span className="bracket-score">
                              {match.Team2_Score !== null ? match.Team2_Score : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="section-card">
            <h2>Chaveamento (Bracket)</h2>
            <p>O chaveamento ainda não foi gerado pelo organizador do evento.</p>
          </section>
        )}
      </div>
    );
  }

  // Renderizar UI do Leaderboard
  if (isLeaderboard) {
    return (
      <div className="gerenciar-partidas-tab">
        {error && (
          <div className="error-banner">
            <strong>⚠️</strong> {error}
          </div>
        )}

        {/* Seção: Rodadas */}
        {hasRounds ? (
          <section className="section-card">
            <div className="section-header">
              <h2>Rodadas</h2>
              <button onClick={loadRounds} className="btn-refresh" disabled={loading}>
                🔄 Atualizar
              </button>
            </div>
            <p>Visualize os pontos de cada time por rodada.</p>

            <div className="rounds-table-container">
              <table className="rounds-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    {rounds.map((round) => (
                      <th key={round.roundNumber}>
                        <div className="rounds-table-header">
                          <span>Rodada {round.roundNumber}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.teamId}>
                      <td className="rounds-table-team-cell">
                        {team.teamName}
                      </td>
                      {rounds.map((round) => {
                        const score = round.scores?.find(s => s.TeamId === team.teamId);
                        return (
                          <td key={round.roundNumber} className="rounds-table-score-cell">
                            <span className="rounds-table-score-display">
                              {score?.Points !== null && score?.Points !== undefined ? score.Points : "-"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="section-card">
            <h2>Rodadas</h2>
            <p>As rodadas ainda não foram criadas pelo organizador do evento.</p>
          </section>
        )}

        {/* Seção: Leaderboard (Ranking) */}
        {hasLeaderboardData && (
          <section className={`section-card ${evento?.status === "Finished" ? "ranking-final" : ""}`}>
            <div className="section-header">
              <h2>
                {evento?.status === "Finished" ? "🏆 Ranking Final" : "Classificação (Leaderboard)"}
              </h2>
              <button onClick={loadLeaderboard} className="btn-refresh" disabled={loading}>
                🔄 Atualizar
              </button>
            </div>

            <div className="ranking-table-container">
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th>Pos.</th>
                    <th>Time</th>
                    <th>Pontos Totais</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((team, index) => (
                    <tr key={team.TeamId} className={index < 3 ? "top-three" : ""}>
                      <td className="rank-cell">{team.Rank}</td>
                      <td className="team-name">{team.TeamName}</td>
                      <td className="points-cell">{team.TotalPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!hasRounds && !hasLeaderboardData && !error && (
          <section className="section-card">
            <h2>Partidas</h2>
            <p>As informações sobre as rodadas serão exibidas aqui assim que o organizador criar as rodadas.</p>
          </section>
        )}
      </div>
    );
  }

  // Renderizar UI do Round Robin (código existente)
  return (
    <div className="gerenciar-partidas-tab">
      {error && (
        <div className="error-banner">
          <strong>⚠️</strong> {error}
        </div>
      )}

      {!hasSchedule && (
        <section className="section-card">
          <h2>Agenda de Partidas</h2>
          <p>A agenda de partidas ainda não foi gerada pelo organizador do evento.</p>
        </section>
      )}

      {/* Seção: Agenda de Partidas */}
      {hasSchedule && (
        <section className="section-card">
          <div className="section-header">
            <h2>Agenda de Partidas</h2>
            <button onClick={loadSchedule} className="btn-refresh" disabled={loading}>
              🔄 Atualizar
            </button>
          </div>

          <div className="matches-table-container">
            <table className="matches-table">
              <thead>
                <tr>
                  <th>Time 1</th>
                  <th>Placar</th>
                  <th>Time 2</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((match) => (
                  <tr key={match.MatchID}>
                    <td className="team-name">{match.Team1_Name}</td>
                    <td className="score-cell">
                      <span className="score-display">
                        {match.Team1_Score !== null ? match.Team1_Score : "-"} ×{" "}
                        {match.Team2_Score !== null ? match.Team2_Score : "-"}
                      </span>
                    </td>
                    <td className="team-name">{match.Team2_Name}</td>
                    <td>
                      <span className={`status-badge status-${match.Status?.toLowerCase() || "pending"}`}>
                        {match.Status === "Finished" ? "Finalizada" : match.Status === "Pending" ? "Pendente" : match.Status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Seção: Ranking */}
      {hasRanking && (
        <section className={`section-card ${evento?.status === "Finished" ? "ranking-final" : ""}`}>
          <div className="section-header">
            <h2>
              {evento?.status === "Finished" ? "🏆 Ranking Final" : "Classificação (Ranking)"}
            </h2>
            <button onClick={loadRanking} className="btn-refresh" disabled={loading}>
              🔄 Atualizar
            </button>
          </div>

          <div className="ranking-table-container">
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>Pos.</th>
                  <th>Time</th>
                  <th>Pontos</th>
                  <th>Vitórias</th>
                  <th>Empates</th>
                  <th>Derrotas</th>
                  <th>Gols Pró</th>
                  <th>Gols Contra</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((team, index) => (
                  <tr key={team.TeamID} className={index < 3 ? "top-three" : ""}>
                    <td className="rank-cell">{team.Rank}</td>
                    <td className="team-name">{team.TeamName}</td>
                    <td className="points-cell">{team.Points}</td>
                    <td>{team.Wins}</td>
                    <td>{team.Draws}</td>
                    <td>{team.Losses}</td>
                    <td>{team.GoalsFor}</td>
                    <td>{team.GoalsAgainst}</td>
                    <td className={team.GoalDifference >= 0 ? "positive" : "negative"}>
                      {team.GoalDifference >= 0 ? "+" : ""}
                      {team.GoalDifference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!hasSchedule && !hasRanking && !error && (
        <section className="section-card">
          <h2>Partidas</h2>
          <p>As informações sobre as partidas serão exibidas aqui assim que o organizador gerar a agenda.</p>
        </section>
      )}
    </div>
  );
}


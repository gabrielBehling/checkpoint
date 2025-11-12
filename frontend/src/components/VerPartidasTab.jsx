import React, { useEffect, useState, useCallback } from "react";
import api from "../pages/api";
import "../assets/css/GerenciarPartidas.css";

export default function VerPartidasTab({ eventId, evento }) {
  const [schedule, setSchedule] = useState([]);
  const [ranking, setRanking] = useState([]);
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

  // Carregar dados iniciais
  useEffect(() => {
    if (!evento || !eventId) {
      setLoading(false);
      return;
    }

    // Verificar se é Round Robin
    if (evento.mode !== "Round Robin") {
      setError("Esta página é apenas para eventos do tipo Round Robin.");
      setLoading(false);
      return;
    }

    // Carregar agenda e ranking
    Promise.all([loadSchedule(), loadRanking()]).finally(() => {
      setLoading(false);
    });
  }, [eventId, evento, loadSchedule, loadRanking]);

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


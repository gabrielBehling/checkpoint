import React, { useEffect, useState } from "react";
import api from "../pages/api";
import "../assets/css/GerenciarPartidas.css";

export default function RankingFinal({ eventId }) {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRanking() {
      if (!eventId) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get(`/events/${eventId}/round-robin/ranking`);
        if (response.data?.success) {
          setRanking(response.data.data || []);
        }
      } catch (err) {
        console.error("Erro ao carregar ranking:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRanking();
  }, [eventId]);

  if (loading) {
    return <div className="loading-state">Carregando ranking...</div>;
  }

  if (ranking.length === 0) {
    return null;
  }

  return (
    <section className="section-card ranking-final" style={{ marginTop: "40px" }}>
      <div className="section-header">
        <h2>🏆 Ranking Final</h2>
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
  );
}


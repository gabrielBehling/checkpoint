import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import "../assets/css/GerenciarPartidas.css";

export default function GerenciarPartidas() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [evento, setEvento] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [editingMatch, setEditingMatch] = useState(null);
  const [matchScores, setMatchScores] = useState({ team1Score: "", team2Score: "" });

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
      // Não é erro fatal se a agenda ainda não foi gerada
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
      // Não é erro fatal se o ranking ainda não existe
    }
  }, [eventId]);

  // Carregar dados do evento e verificar permissões
  useEffect(() => {
    async function loadEvent() {
      if (!eventId) {
        setError("ID do evento não fornecido.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/events/${eventId}`);
        if (response.data?.success) {
          const eventData = response.data.data;
          setEvento(eventData);

          // Verificar se é Round Robin
          if (eventData.mode !== "Round Robin") {
            setError("Esta página é apenas para eventos do tipo Round Robin.");
            return;
          }

          // Verificar se o usuário é o organizador
          const isOrganizer =
            (eventData.createdBy?.userId === user?.userId) ||
            (eventData.createdBy === user?.userId) ||
            (user?.userRole === "Organizer" && eventData.createdBy?.userId === user?.userId);

          if (!isOrganizer) {
            setError("Apenas o organizador do evento pode gerenciar partidas.");
            return;
          }

          // Carregar agenda e ranking
          await Promise.all([loadSchedule(), loadRanking()]);
        }
      } catch (err) {
        console.error("Erro ao carregar evento:", err);
        setError("Erro ao carregar informações do evento.");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadEvent();
    }
  }, [eventId, user, loadSchedule, loadRanking]);

  // Gerar agenda de partidas
  const handleGenerateSchedule = async () => {
    if (!window.confirm("Deseja gerar a agenda de partidas para este evento? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      setActionLoading("generate");
      setError("");

      const response = await api.post(`/events/${eventId}/round-robin/generate-schedule`);

      if (response.data?.success) {
        alert(`Agenda gerada com sucesso! ${response.data.data?.matchesCreated || 0} partidas criadas.`);
        await loadSchedule();
      }
    } catch (err) {
      console.error("Erro ao gerar agenda:", err);
      const errorMsg = err.response?.data?.message || "Erro ao gerar agenda de partidas.";
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  // Iniciar edição de placar
  const handleEditScore = (match) => {
    setEditingMatch(match.MatchID);
    setMatchScores({
      team1Score: match.Team1_Score !== null ? match.Team1_Score.toString() : "",
      team2Score: match.Team2_Score !== null ? match.Team2_Score.toString() : "",
    });
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditingMatch(null);
    setMatchScores({ team1Score: "", team2Score: "" });
  };

  // Salvar placar
  const handleSaveScore = async (matchId) => {
    const team1Score = parseInt(matchScores.team1Score);
    const team2Score = parseInt(matchScores.team2Score);

    if (isNaN(team1Score) || isNaN(team2Score)) {
      alert("Por favor, insira placares válidos.");
      return;
    }

    if (team1Score < 0 || team2Score < 0) {
      alert("Os placares não podem ser negativos.");
      return;
    }

    try {
      setActionLoading(`save-${matchId}`);
      setError("");

      await api.post(`/events/${eventId}/round-robin/match/${matchId}`, {
        team1Score,
        team2Score,
      });

      alert("Placar atualizado com sucesso!");
      setEditingMatch(null);
      setMatchScores({ team1Score: "", team2Score: "" });
      await Promise.all([loadSchedule(), loadRanking()]);
    } catch (err) {
      console.error("Erro ao atualizar placar:", err);
      const errorMsg = err.response?.data?.message || "Erro ao atualizar placar.";
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  // Finalizar evento
  const handleFinishEvent = async () => {
    if (!window.confirm("Tem certeza que deseja finalizar este evento? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      setActionLoading("finish");
      setError("");

      await api.post(`/events/${eventId}/round-robin/finish`);

      alert("Evento finalizado com sucesso!");
      navigate(`/evento/${eventId}`);
    } catch (err) {
      console.error("Erro ao finalizar evento:", err);
      const errorMsg = err.response?.data?.message || "Erro ao finalizar evento.";
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <main className="gerenciar-partidas-container">
          <div className="loading-state">Carregando informações...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !evento) {
    return (
      <div>
        <Header />
        <main className="gerenciar-partidas-container">
          <div className="error-state">
            <strong>Erro:</strong> {error}
            <button onClick={() => navigate("/dashboardOrganizador")} className="btn-back">
              Voltar ao Dashboard
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!evento) {
    return null;
  }

  const hasSchedule = schedule.length > 0;
  const hasRanking = ranking.length > 0;

  return (
    <div>
      <Header />
      <main className="gerenciar-partidas-container">
        <div className="gerenciar-header">
          <div>
            <h1>Gerenciar Partidas - Round Robin</h1>
            <p className="event-title">{evento.title}</p>
          </div>
          <div className="header-actions">
            <button onClick={() => navigate(`/evento/${eventId}`)} className="btn-secondary">
              Ver Evento
            </button>
            <button onClick={() => navigate("/dashboardOrganizador")} className="btn-secondary">
              Dashboard
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <strong>⚠️</strong> {error}
          </div>
        )}

        {/* Seção: Gerar Agenda */}
        {!hasSchedule && (
          <section className="section-card">
            <h2>Gerar Agenda de Partidas</h2>
            <p>Gere a agenda de partidas (todos contra todos) para as equipes aprovadas.</p>
            <button
              onClick={handleGenerateSchedule}
              disabled={actionLoading === "generate"}
              className="btn-primary"
            >
              {actionLoading === "generate" ? "Gerando..." : "Gerar Agenda"}
            </button>
          </section>
        )}

        {/* Seção: Agenda de Partidas */}
        {hasSchedule && (
          <section className="section-card">
            <div className="section-header">
              <h2>Agenda de Partidas</h2>
              <button onClick={loadSchedule} className="btn-refresh" disabled={actionLoading}>
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
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((match) => (
                    <tr key={match.MatchID}>
                      <td className="team-name">{match.Team1_Name}</td>
                      <td className="score-cell">
                        {editingMatch === match.MatchID ? (
                          <div className="score-edit">
                            <input
                              type="number"
                              min="0"
                              value={matchScores.team1Score}
                              onChange={(e) =>
                                setMatchScores({ ...matchScores, team1Score: e.target.value })
                              }
                              className="score-input"
                            />
                            <span>×</span>
                            <input
                              type="number"
                              min="0"
                              value={matchScores.team2Score}
                              onChange={(e) =>
                                setMatchScores({ ...matchScores, team2Score: e.target.value })
                              }
                              className="score-input"
                            />
                          </div>
                        ) : (
                          <span className="score-display">
                            {match.Team1_Score !== null ? match.Team1_Score : "-"} ×{" "}
                            {match.Team2_Score !== null ? match.Team2_Score : "-"}
                          </span>
                        )}
                      </td>
                      <td className="team-name">{match.Team2_Name}</td>
                      <td>
                        <span className={`status-badge status-${match.Status?.toLowerCase() || "pending"}`}>
                          {match.Status === "Finished" ? "Finalizada" : match.Status === "Pending" ? "Pendente" : match.Status}
                        </span>
                      </td>
                      <td className="actions-cell">
                        {editingMatch === match.MatchID ? (
                          <div className="edit-actions">
                            <button
                              onClick={() => handleSaveScore(match.MatchID)}
                              disabled={actionLoading === `save-${match.MatchID}`}
                              className="btn-save"
                            >
                              {actionLoading === `save-${match.MatchID}` ? "Salvando..." : "Salvar"}
                            </button>
                            <button onClick={handleCancelEdit} className="btn-cancel">
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditScore(match)}
                            disabled={match.Status === "Finished" || editingMatch !== null}
                            className="btn-edit"
                          >
                            Editar
                          </button>
                        )}
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
          <section className="section-card">
            <div className="section-header">
              <h2>Classificação (Ranking)</h2>
              <button onClick={loadRanking} className="btn-refresh" disabled={actionLoading}>
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

        {/* Botão Finalizar Evento */}
        {hasSchedule && evento.status === "Active" && (
          <section className="section-card finish-section">
            <h2>Finalizar Evento</h2>
            <p>Finalize o evento após todas as partidas serem concluídas.</p>
            <button
              onClick={handleFinishEvent}
              disabled={actionLoading === "finish"}
              className="btn-finish"
            >
              {actionLoading === "finish" ? "Finalizando..." : "Finalizar Evento"}
            </button>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}


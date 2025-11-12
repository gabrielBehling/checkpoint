import React, { useEffect, useState, useCallback } from "react";
import api from "../pages/api";
import { useAuth } from "../contexts/AuthContext";
import "../assets/css/GerenciarPartidas.css";

export default function GerenciarPartidasTab({ eventId, evento }) {
  const { user } = useAuth();

  const [schedule, setSchedule] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [editingMatch, setEditingMatch] = useState(null);
  const [matchScores, setMatchScores] = useState({ team1Score: "", team2Score: "" });
  const [pointsSettings, setPointsSettings] = useState({
    pointsPerWin: "3",
    pointsPerDraw: "1",
    pointsPerLoss: "0",
  });
  const [pointsConfigured, setPointsConfigured] = useState(false);
  const [editingPoints, setEditingPoints] = useState(false);

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

    // Verificar se o usuário é o organizador
    const isOrganizer =
      (evento.createdBy?.userId === user?.userId) ||
      (evento.createdBy === user?.userId) ||
      (user?.userRole === "Organizer" && evento.createdBy?.userId === user?.userId);

    if (!isOrganizer) {
      setError("Apenas o organizador do evento pode gerenciar partidas.");
      setLoading(false);
      return;
    }

    // Carregar agenda e ranking
    Promise.all([loadSchedule(), loadRanking()]).finally(() => {
      setLoading(false);
    });
  }, [eventId, evento, user, loadSchedule, loadRanking]);

  // Configurar pontos
  const handleConfigurePoints = async () => {
    // Garantir que os valores sejam números válidos, usando valores padrão se necessário
    const pointsPerWin = pointsSettings.pointsPerWin !== "" && !isNaN(parseInt(pointsSettings.pointsPerWin))
      ? parseInt(pointsSettings.pointsPerWin)
      : 3;
    const pointsPerDraw = pointsSettings.pointsPerDraw !== "" && !isNaN(parseInt(pointsSettings.pointsPerDraw))
      ? parseInt(pointsSettings.pointsPerDraw)
      : 1;
    const pointsPerLoss = pointsSettings.pointsPerLoss !== "" && !isNaN(parseInt(pointsSettings.pointsPerLoss))
      ? parseInt(pointsSettings.pointsPerLoss)
      : 0;

    if (pointsPerWin < 0 || pointsPerDraw < 0 || pointsPerLoss < 0) {
      alert("Os valores de pontuação não podem ser negativos.");
      return;
    }

    try {
      setActionLoading("configure-points");
      setError("");

      await api.post(`/events/${eventId}/round-robin/settings`, {
        pointsPerWin,
        pointsPerDraw,
        pointsPerLoss,
      });

      // Atualizar o estado com os valores salvos (como strings)
      setPointsSettings({
        pointsPerWin: pointsPerWin.toString(),
        pointsPerDraw: pointsPerDraw.toString(),
        pointsPerLoss: pointsPerLoss.toString(),
      });

      alert("Pontuação configurada com sucesso!");
      setPointsConfigured(true);
      setEditingPoints(false);
    } catch (err) {
      console.error("Erro ao configurar pontos:", err);
      const errorMsg = err.response?.data?.message || "Erro ao configurar pontuação.";
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  // Gerar agenda de partidas
  const handleGenerateSchedule = async () => {
    if (!pointsConfigured) {
      alert("⚠️ Por favor, configure os pontos antes de gerar a agenda de partidas.");
      setEditingPoints(true);
      return;
    }

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
      window.location.reload(); // Recarregar para atualizar o status do evento
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

      {/* Seção: Configurar Pontos */}
      {!hasSchedule && (
        <section className="section-card">
          <h2>Configurar Pontuação</h2>
          <p>Configure os pontos para vitória, empate e derrota antes de gerar a agenda de partidas. Os valores padrão são: 3 pontos por vitória, 1 ponto por empate e 0 pontos por derrota.</p>
          
          {editingPoints || !pointsConfigured ? (
            <div className="points-settings-form">
              <div className="points-input-group">
                <label>
                  Pontos por Vitória:
                  <input
                    type="number"
                    min="0"
                    value={pointsSettings.pointsPerWin}
                    onChange={(e) =>
                      setPointsSettings({ ...pointsSettings, pointsPerWin: e.target.value })
                    }
                    className="points-input"
                    placeholder="3"
                  />
                </label>
                <label>
                  Pontos por Empate:
                  <input
                    type="number"
                    min="0"
                    value={pointsSettings.pointsPerDraw}
                    onChange={(e) =>
                      setPointsSettings({ ...pointsSettings, pointsPerDraw: e.target.value })
                    }
                    className="points-input"
                    placeholder="1"
                  />
                </label>
                <label>
                  Pontos por Derrota:
                  <input
                    type="number"
                    min="0"
                    value={pointsSettings.pointsPerLoss}
                    onChange={(e) =>
                      setPointsSettings({ ...pointsSettings, pointsPerLoss: e.target.value })
                    }
                    className="points-input"
                    placeholder="0"
                  />
                </label>
              </div>
              <div className="points-actions">
                <button
                  onClick={handleConfigurePoints}
                  disabled={actionLoading === "configure-points"}
                  className="btn-primary"
                >
                  {actionLoading === "configure-points" ? "Salvando..." : "Salvar Configuração"}
                </button>
                {pointsConfigured && (
                  <button
                    onClick={() => setEditingPoints(false)}
                    className="btn-cancel"
                    style={{ marginLeft: "10px" }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="points-display">
              <div className="points-info">
                <span><strong>Vitória:</strong> {pointsSettings.pointsPerWin} pontos</span>
                <span><strong>Empate:</strong> {pointsSettings.pointsPerDraw} pontos</span>
                <span><strong>Derrota:</strong> {pointsSettings.pointsPerLoss} pontos</span>
              </div>
              <button
                onClick={() => setEditingPoints(true)}
                className="btn-secondary"
                style={{ marginTop: "15px" }}
              >
                Editar Pontuação
              </button>
            </div>
          )}
        </section>
      )}

      {/* Seção: Gerar Agenda */}
      {!hasSchedule && (
        <section className="section-card">
          <h2>Gerar Agenda de Partidas</h2>
          <p>Gere a agenda de partidas (todos contra todos) para as equipes aprovadas.</p>
          <button
            onClick={handleGenerateSchedule}
            disabled={actionLoading === "generate" || !pointsConfigured}
            className="btn-primary"
            style={!pointsConfigured ? { opacity: 0.6, cursor: "not-allowed" } : {}}
          >
            {actionLoading === "generate" ? "Gerando..." : "Gerar Agenda"}
          </button>
          {!pointsConfigured && (
            <p style={{ color: "#ff8080", marginTop: "10px", fontSize: "0.9rem" }}>
              ⚠️ Configure os pontos acima antes de gerar a agenda.
            </p>
          )}
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
      {hasSchedule && evento?.status === "Active" && (
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
    </div>
  );
}


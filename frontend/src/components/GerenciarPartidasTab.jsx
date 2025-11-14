import React, { useEffect, useState, useCallback } from "react";
import api from "../pages/api";
import { useAuth } from "../contexts/AuthContext";
import { useCustomModal } from "../hooks/useCustomModal";
import "../assets/css/GerenciarPartidas.css";

export default function GerenciarPartidasTab({ eventId, evento }) {
  const { user } = useAuth();
  const { showError, showSuccess, showWarning } = useCustomModal();
  
  // Estados compartilhados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  
  // Estados para Round Robin
  const [schedule, setSchedule] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [editingMatch, setEditingMatch] = useState(null);
  const [matchScores, setMatchScores] = useState({ team1Score: "", team2Score: "" });
  const [pointsSettings, setPointsSettings] = useState({
    pointsPerWin: "3",
    pointsPerDraw: "1",
    pointsPerLoss: "0",
  });
  const [pointsConfigured, setPointsConfigured] = useState(false);
  const [editingPoints, setEditingPoints] = useState(false);
  
  // Estados para Leaderboard
  const [teams, setTeams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [editingRound, setEditingRound] = useState(null);
  const [roundScores, setRoundScores] = useState({});
  const [currentRoundNumber, setCurrentRoundNumber] = useState(1);

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
        const roundsData = response.data || [];
        setRounds(roundsData);
        // Determinar o próximo número de rodada
        if (roundsData.length > 0) {
          const maxRound = Math.max(...roundsData.map(r => r.roundNumber));
          setCurrentRoundNumber(maxRound + 1);
        } else {
          // Se não há rodadas, começar na rodada 1
          setCurrentRoundNumber(1);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar rodadas:", err);
      // Não é erro fatal se as rodadas ainda não existem
      if (err.response?.status !== 404) {
        console.warn("Rodadas ainda não foram criadas ou erro ao carregar.");
      }
      // Se houver erro mas não for 404, manter currentRoundNumber como 1
      setCurrentRoundNumber(1);
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

  // Carregar dados iniciais
  useEffect(() => {
    if (!evento || !eventId) {
      setLoading(false);
      return;
    }

    // Verificar se é Round Robin ou Leaderboard
    const isRoundRobin = evento.mode === "Round Robin";
    const isLeaderboard = evento.mode === "Leaderboard";
    
    if (!isRoundRobin && !isLeaderboard) {
      setError("Esta página é apenas para eventos do tipo Round Robin ou Leaderboard.");
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

    // Carregar dados baseado no modo
    if (isRoundRobin) {
      Promise.all([loadSchedule(), loadRanking()]).finally(() => {
        setLoading(false);
      });
    } else if (isLeaderboard) {
      Promise.all([loadTeams(), loadRounds(), loadLeaderboard()]).finally(() => {
        setLoading(false);
      });
    }
  }, [eventId, evento, user, loadSchedule, loadRanking, loadTeams, loadRounds, loadLeaderboard]);

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

      showSuccess("Pontuação configurada com sucesso!");
      setPointsConfigured(true);
      setEditingPoints(false);
    } catch (err) {
      console.error("Erro ao configurar pontos:", err);
      const errorMsg = err.response?.data?.message || "Erro ao configurar pontuação.";
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  // Gerar agenda de partidas
  const handleGenerateSchedule = async () => {
    if (!pointsConfigured) {
      showWarning("⚠️ Por favor, configure os pontos antes de gerar a agenda de partidas.");
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
        showSuccess(`Agenda gerada com sucesso! ${response.data.data?.matchesCreated || 0} partidas criadas.`);
        await loadSchedule();
      }
    } catch (err) {
      console.error("Erro ao gerar agenda:", err);
      const errorMsg = err.response?.data?.message || "Erro ao gerar agenda de partidas.";
      setError(errorMsg);
      showError(errorMsg);
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
      showWarning("Por favor, insira placares válidos.");
      return;
    }

    if (team1Score < 0 || team2Score < 0) {
      showWarning("Os placares não podem ser negativos.");
      return;
    }

    try {
      setActionLoading(`save-${matchId}`);
      setError("");

      await api.post(`/events/${eventId}/round-robin/match/${matchId}`, {
        team1Score,
        team2Score,
      });

      showSuccess("Placar atualizado com sucesso!");
      setEditingMatch(null);
      setMatchScores({ team1Score: "", team2Score: "" });
      await Promise.all([loadSchedule(), loadRanking()]);
    } catch (err) {
      console.error("Erro ao atualizar placar:", err);
      const errorMsg = err.response?.data?.message || "Erro ao atualizar placar.";
      setError(errorMsg);
      showError(errorMsg);
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

      const endpoint = evento.mode === "Round Robin" 
        ? `/events/${eventId}/round-robin/finish`
        : `/events/${eventId}/leaderboard/finish`;

      await api.post(endpoint);

      showSuccess("Evento finalizado com sucesso!");
      window.location.reload(); // Recarregar para atualizar o status do evento
    } catch (err) {
      console.error("Erro ao finalizar evento:", err);
      const errorMsg = err.response?.data?.message || "Erro ao finalizar evento.";
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  // Funções para Leaderboard
  // Iniciar edição de rodada
  const handleEditRound = (roundNumber) => {
    setEditingRound(roundNumber);
    const round = rounds.find(r => r.roundNumber === roundNumber);
    const scores = {};
    
    if (round && round.scores) {
      round.scores.forEach(score => {
        scores[score.TeamId] = score.Points !== null ? score.Points.toString() : "";
      });
    } else {
      // Inicializar com times aprovados
      teams.forEach(team => {
        scores[team.teamId] = "";
      });
    }
    
    setRoundScores(scores);
  };

  // Cancelar edição de rodada
  const handleCancelRoundEdit = () => {
    setEditingRound(null);
    setRoundScores({});
  };

  // Salvar pontos da rodada
  const handleSaveRoundScores = async (roundNumber) => {
    // Validar que todos os times têm pontos válidos
    const scores = [];
    let hasInvalid = false;

    teams.forEach(team => {
      const pointsStr = roundScores[team.teamId] || "";
      const points = pointsStr === "" ? 0 : parseInt(pointsStr);
      
      if (pointsStr !== "" && (isNaN(points) || points < 0)) {
        hasInvalid = true;
        return;
      }
      
      scores.push({
        teamId: team.teamId,
        points: points
      });
    });

    if (hasInvalid) {
      showWarning("Por favor, insira pontos válidos (números não negativos) para todos os times.");
      return;
    }

    try {
      setActionLoading(`save-round-${roundNumber}`);
      setError("");

      await api.post(`/events/${eventId}/leaderboard/round/${roundNumber}`, {
        scores: scores
      });

      showSuccess(`Pontos da rodada ${roundNumber} salvos com sucesso!`);
      setEditingRound(null);
      setRoundScores({});
      await Promise.all([loadRounds(), loadLeaderboard()]);
    } catch (err) {
      console.error("Erro ao salvar pontos da rodada:", err);
      const errorMsg = err.response?.data?.message || "Erro ao salvar pontos da rodada.";
      setError(errorMsg);
      showError(errorMsg);
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
  const isRoundRobin = evento?.mode === "Round Robin";
  const isLeaderboard = evento?.mode === "Leaderboard";
  const hasRounds = rounds.length > 0;
  const hasLeaderboard = leaderboard.length > 0;

  // Renderizar UI do Leaderboard
  if (isLeaderboard) {
    return (
      <div className="gerenciar-partidas-tab">
        {error && (
          <div className="error-banner">
            <strong>⚠️</strong> {error}
          </div>
        )}

        {/* Seção: Gerenciar Rodadas */}
        <section className="section-card">
          <div className="section-header">
            <h2>Gerenciar Rodadas</h2>
            {evento?.status !== "Finished" && (
              <button 
                onClick={() => {
                  // Cancelar qualquer edição em andamento e iniciar nova rodada
                  setEditingRound(null);
                  setRoundScores({});
                  handleEditRound(currentRoundNumber);
                }} 
                className="btn-primary"
                disabled={editingRound !== null && editingRound !== currentRoundNumber}
              >
                ➕ Nova Rodada
              </button>
            )}
          </div>
          <p>Adicione ou edite os pontos de cada time por rodada. O ranking é calculado automaticamente com base na soma total de pontos.</p>

          {teams.length === 0 ? (
            <p className="warning-message">
              ⚠️ Nenhum time aprovado encontrado. Aprove times no evento antes de gerenciar rodadas.
            </p>
          ) : (
            <div className="rounds-table-container">
              <table className="rounds-table">
                <thead>
                  <tr>
                    <th >Time</th>
                    {hasRounds && rounds.map((round) => (
                      <th key={round.roundNumber}>
                        <div className="rounds-table-header">
                          <span>Rodada {round.roundNumber}</span>
                          {editingRound === round.roundNumber ? (
                            <div className="rounds-table-header-actions">
                              <button
                                onClick={() => handleSaveRoundScores(round.roundNumber)}
                                disabled={actionLoading === `save-round-${round.roundNumber}`}
                                className="btn-save rounds-table-btn-small"
                                title="Salvar"
                              >
                                {actionLoading === `save-round-${round.roundNumber}` ? "..." : "✓"}
                              </button>
                              <button 
                                onClick={handleCancelRoundEdit} 
                                className="btn-cancel rounds-table-btn-small"
                                title="Cancelar"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            evento?.status === "Active" && (<button
                              onClick={() => handleEditRound(round.roundNumber)}
                              className="btn-edit rounds-table-btn-small"
                              title="Editar rodada"
                            >
                              Editar
                            </button>)
                          )}
                        </div>
                      </th>
                    ))}
                    {editingRound === currentRoundNumber && !rounds.find(r => r.roundNumber === currentRoundNumber) && evento?.status !== "Finished" && (
                      <th className="rounds-table-new-round">
                        <div className="rounds-table-header">
                          <span>Nova Rodada {currentRoundNumber}</span>
                          <div className="rounds-table-header-actions">
                            <button
                              onClick={() => handleSaveRoundScores(currentRoundNumber)}
                              disabled={actionLoading === `save-round-${currentRoundNumber}`}
                              className="btn-save rounds-table-btn-small"
                              title="Salvar rodada"
                            >
                              {actionLoading === `save-round-${currentRoundNumber}` ? "..." : "✓"}
                            </button>
                            <button 
                              onClick={handleCancelRoundEdit} 
                              className="btn-cancel rounds-table-btn-small"
                              title="Cancelar"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.teamId}>
                      <td className="rounds-table-team-cell">
                        {team.teamName}
                      </td>
                      {hasRounds && rounds.map((round) => {
                        const score = round.scores?.find(s => s.TeamId === team.teamId);
                        const isEditing = editingRound === round.roundNumber;
                        
                        return (
                          <td key={round.roundNumber} className="rounds-table-score-cell">
                            {isEditing ? (
                              <input
                                type="number"
                                min="0"
                                value={roundScores[team.teamId] || (score?.Points !== null && score?.Points !== undefined ? score.Points.toString() : "")}
                                onChange={(e) =>
                                  setRoundScores({ ...roundScores, [team.teamId]: e.target.value })
                                }
                                className="score-input rounds-table-score-input"
                                placeholder="0"
                              />
                            ) : (
                              <span className="rounds-table-score-display">
                                {score?.Points !== null && score?.Points !== undefined ? score.Points : "-"}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      {editingRound === currentRoundNumber && !rounds.find(r => r.roundNumber === currentRoundNumber) && evento?.status !== "Finished" && (
                        <td className="rounds-table-score-cell rounds-table-score-cell-new">
                          <input
                            type="number"
                            min="0"
                            value={roundScores[team.teamId] || ""}
                            onChange={(e) =>
                              setRoundScores({ ...roundScores, [team.teamId]: e.target.value })
                            }
                            className="score-input rounds-table-score-input"
                            placeholder="0"
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Seção: Leaderboard (Ranking) */}
        {hasLeaderboard && (
          <section className="section-card">
            <div className="section-header">
              <h2>Classificação (Leaderboard)</h2>
              <button onClick={loadLeaderboard} className="btn-refresh" disabled={actionLoading}>
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

        {/* Botão Finalizar Evento */}
        {evento?.status === "Active" && (
          <section className="section-card finish-section">
            <h2>Finalizar Evento</h2>
            <p>Finalize o evento após todas as rodadas serem concluídas.</p>
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

  // Renderizar UI do Round Robin (código existente)
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
                    className="btn-cancel btn-cancel-spaced"
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
                className="btn-secondary btn-secondary-spaced"
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
            className={`btn-primary ${!pointsConfigured ? "btn-primary-disabled" : ""}`}
          >
            {actionLoading === "generate" ? "Gerando..." : "Gerar Agenda"}
          </button>
          {!pointsConfigured && (
            <p className="warning-message-small">
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


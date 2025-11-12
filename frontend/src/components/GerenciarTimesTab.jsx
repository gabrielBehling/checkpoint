import React, { useEffect, useState, useCallback } from "react";
import api from "../pages/api";
import { useAuth } from "../contexts/AuthContext";
import "../assets/css/GerenciarTimes.css";

export default function GerenciarTimesTab({ eventId, evento }) {
  const { user } = useAuth();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  // Carregar times do evento
  const loadTeams = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/events/${eventId}/teams`);
      if (response.data?.success) {
        setTeams(response.data.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar times:", err);
      const errorMsg = err.response?.data?.message || "Erro ao carregar times do evento.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      if (!evento || !eventId) {
        setLoading(false);
        return;
      }

      // Verificar se o usuário é organizador ou administrador
      // A verificação de permissão é feita no EventoInfo.jsx, então assumimos que tem permissão
      // Mas ainda validamos para segurança
      const isOrganizer =
        (evento.createdBy?.userId === user?.userId) ||
        (evento.createdBy === user?.userId) ||
        (user?.userRole === "Organizer" && evento.createdBy?.userId === user?.userId);
      const isAdmin = user?.userRole === "administrator";

      if (!isOrganizer && !isAdmin) {
        setError("Apenas o organizador ou administrador do evento pode gerenciar times.");
        setLoading(false);
        return;
      }

      // Se tem permissão, carregar times
      await loadTeams();
    };

    loadData();
  }, [eventId, evento, user, loadTeams]);

  // Atualizar status do time
  const handleUpdateStatus = async (teamId, newStatus) => {
    const statusLabels = {
      Approved: "aceitar",
      Rejected: "rejeitar",
      Cancelled: "cancelar",
    };

    const statusLabel = statusLabels[newStatus] || newStatus;
    if (!window.confirm(`Tem certeza que deseja ${statusLabel} a inscrição deste time?`)) {
      return;
    }

    try {
      setActionLoading(`update-${teamId}-${newStatus}`);
      setError("");

      await api.put(`/events/${eventId}/teams/${teamId}/status`, {
        status: newStatus,
      });

      alert(`Status do time atualizado com sucesso para "${newStatus}"!`);
      await loadTeams(); // Recarregar lista de times
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      const errorMsg = err.response?.data?.message || "Erro ao atualizar status do time.";
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Função para obter URL do logo
  const getLogoUrl = (logoURL) => {
    if (!logoURL) return null;
    if (logoURL.startsWith("http")) return logoURL;
    // Se for caminho relativo, prefixar com a URL base da API
    return `${window.location.origin}/api/teams${logoURL}`;
  };

  // Função para obter label do status
  const getStatusLabel = (status) => {
    const labels = {
      Pending: "Pendente",
      Approved: "Aprovado",
      Rejected: "Rejeitado",
      Cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  // Função para obter classe CSS do status
  const getStatusClass = (status) => {
    const classes = {
      Pending: "status-pending",
      Approved: "status-approved",
      Rejected: "status-rejected",
      Cancelled: "status-cancelled",
    };
    return classes[status] || "status-unknown";
  };

  if (loading) {
    return <div className="loading-state">Carregando times...</div>;
  }

  if (error && !teams.length) {
    return (
      <div className="error-state">
        <strong>Erro:</strong> {error}
      </div>
    );
  }

  // Filtrar times por status para organização
  const pendingTeams = teams.filter((team) => team.status === "Pending");
  const approvedTeams = teams.filter((team) => team.status === "Approved");
  const rejectedTeams = teams.filter((team) => team.status === "Rejected");
  const cancelledTeams = teams.filter((team) => team.status === "Cancelled");

  return (
    <div className="gerenciar-times-tab">
      {error && (
        <div className="error-banner">
          <strong>⚠️</strong> {error}
        </div>
      )}

      {/* Estatísticas */}
      <div className="teams-stats">
        <div className="stat-card">
          <div className="stat-value">{teams.length}</div>
          <div className="stat-label">Total de Times</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{pendingTeams.length}</div>
          <div className="stat-label">Pendentes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{approvedTeams.length}</div>
          <div className="stat-label">Aprovados</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{rejectedTeams.length}</div>
          <div className="stat-label">Rejeitados</div>
        </div>
      </div>

      {/* Times Pendentes */}
      {pendingTeams.length > 0 && (
        <section className="section-card">
          <div className="section-header">
            <h2>Times Pendentes ({pendingTeams.length})</h2>
            <button onClick={loadTeams} className="btn-refresh" disabled={actionLoading}>
              🔄 Atualizar
            </button>
          </div>

          <div className="teams-grid">
            {pendingTeams.map((team) => (
              <div key={team.teamId} className="team-card">
                <div className="team-header">
                  {team.logoURL && (
                    <img src={getLogoUrl(team.logoURL)} alt={team.teamName} className="team-logo" />
                  )}
                  <div className="team-info">
                    <h3 className="team-name">{team.teamName}</h3>
                    <span className={`status-badge ${getStatusClass(team.status)}`}>
                      {getStatusLabel(team.status)}
                    </span>
                  </div>
                </div>

                <div className="team-details">
                  <div className="detail-item">
                    <span className="detail-label">Capitão:</span>
                    <span className="detail-value">{team.captain?.username || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Membros:</span>
                    <span className="detail-value">
                      {team.memberCount || 0} / {team.maxMembers || "N/A"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Inscrito em:</span>
                    <span className="detail-value">{formatDate(team.registeredAt)}</span>
                  </div>
                </div>

                <div className="team-actions">
                  <button
                    onClick={() => handleUpdateStatus(team.teamId, "Approved")}
                    disabled={actionLoading === `update-${team.teamId}-Approved`}
                    className="btn-approve"
                  >
                    {actionLoading === `update-${team.teamId}-Approved` ? "Aceitando..." : "Aceitar"}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(team.teamId, "Rejected")}
                    disabled={actionLoading === `update-${team.teamId}-Rejected`}
                    className="btn-reject"
                  >
                    {actionLoading === `update-${team.teamId}-Rejected` ? "Rejeitando..." : "Rejeitar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Times Aprovados */}
      {approvedTeams.length > 0 && (
        <section className="section-card">
          <div className="section-header">
            <h2>Times Aprovados ({approvedTeams.length})</h2>
            <button onClick={loadTeams} className="btn-refresh" disabled={actionLoading}>
              🔄 Atualizar
            </button>
          </div>

          <div className="teams-grid">
            {approvedTeams.map((team) => (
              <div key={team.teamId} className="team-card">
                <div className="team-header">
                  {team.logoURL && (
                    <img src={getLogoUrl(team.logoURL)} alt={team.teamName} className="team-logo" />
                  )}
                  <div className="team-info">
                    <h3 className="team-name">{team.teamName}</h3>
                    <span className={`status-badge ${getStatusClass(team.status)}`}>
                      {getStatusLabel(team.status)}
                    </span>
                  </div>
                </div>

                <div className="team-details">
                  <div className="detail-item">
                    <span className="detail-label">Capitão:</span>
                    <span className="detail-value">{team.captain?.username || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Membros:</span>
                    <span className="detail-value">
                      {team.memberCount || 0} / {team.maxMembers || "N/A"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Inscrito em:</span>
                    <span className="detail-value">{formatDate(team.registeredAt)}</span>
                  </div>
                </div>

                <div className="team-actions">
                  <button
                    onClick={() => handleUpdateStatus(team.teamId, "Rejected")}
                    disabled={actionLoading === `update-${team.teamId}-Rejected`}
                    className="btn-reject"
                  >
                    {actionLoading === `update-${team.teamId}-Rejected` ? "Rejeitando..." : "Rejeitar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Times Rejeitados */}
      {rejectedTeams.length > 0 && (
        <section className="section-card">
          <div className="section-header">
            <h2>Times Rejeitados ({rejectedTeams.length})</h2>
            <button onClick={loadTeams} className="btn-refresh" disabled={actionLoading}>
              🔄 Atualizar
            </button>
          </div>

          <div className="teams-grid">
            {rejectedTeams.map((team) => (
              <div key={team.teamId} className="team-card">
                <div className="team-header">
                  {team.logoURL && (
                    <img src={getLogoUrl(team.logoURL)} alt={team.teamName} className="team-logo" />
                  )}
                  <div className="team-info">
                    <h3 className="team-name">{team.teamName}</h3>
                    <span className={`status-badge ${getStatusClass(team.status)}`}>
                      {getStatusLabel(team.status)}
                    </span>
                  </div>
                </div>

                <div className="team-details">
                  <div className="detail-item">
                    <span className="detail-label">Capitão:</span>
                    <span className="detail-value">{team.captain?.username || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Membros:</span>
                    <span className="detail-value">
                      {team.memberCount || 0} / {team.maxMembers || "N/A"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Inscrito em:</span>
                    <span className="detail-value">{formatDate(team.registeredAt)}</span>
                  </div>
                </div>

                <div className="team-actions">
                  <button
                    onClick={() => handleUpdateStatus(team.teamId, "Approved")}
                    disabled={actionLoading === `update-${team.teamId}-Approved`}
                    className="btn-approve"
                  >
                    {actionLoading === `update-${team.teamId}-Approved` ? "Aceitando..." : "Aceitar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Times Cancelados */}
      {cancelledTeams.length > 0 && (
        <section className="section-card">
          <div className="section-header">
            <h2>Times Cancelados ({cancelledTeams.length})</h2>
            <button onClick={loadTeams} className="btn-refresh" disabled={actionLoading}>
              🔄 Atualizar
            </button>
          </div>

          <div className="teams-grid">
            {cancelledTeams.map((team) => (
              <div key={team.teamId} className="team-card">
                <div className="team-header">
                  {team.logoURL && (
                    <img src={getLogoUrl(team.logoURL)} alt={team.teamName} className="team-logo" />
                  )}
                  <div className="team-info">
                    <h3 className="team-name">{team.teamName}</h3>
                    <span className={`status-badge ${getStatusClass(team.status)}`}>
                      {getStatusLabel(team.status)}
                    </span>
                  </div>
                </div>

                <div className="team-details">
                  <div className="detail-item">
                    <span className="detail-label">Capitão:</span>
                    <span className="detail-value">{team.captain?.username || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Membros:</span>
                    <span className="detail-value">
                      {team.memberCount || 0} / {team.maxMembers || "N/A"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Inscrito em:</span>
                    <span className="detail-value">{formatDate(team.registeredAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mensagem quando não há times */}
      {teams.length === 0 && !loading && (
        <section className="section-card">
          <div className="empty-state">
            <p>Nenhum time inscrito neste evento ainda.</p>
          </div>
        </section>
      )}
    </div>
  );
}


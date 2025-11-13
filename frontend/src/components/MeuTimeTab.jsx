import React, { useEffect, useState, useCallback } from "react";
import api from "../pages/api";
import { useAuth } from "../contexts/AuthContext";
import { useCustomModal } from "../hooks/useCustomModal";
import "../assets/css/MeuTime.css";

export default function MeuTimeTab({ eventId, evento }) {
  const { user } = useAuth();
  const { showError, showSuccess, showWarning, showInfo } = useCustomModal();
  const [myTeam, setMyTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Carregar time do usuário
  const loadMyTeam = useCallback(async () => {
    if (!eventId || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Buscar todos os times do evento
      const response = await api.get(`/events/${eventId}/teams`);
      
      if (response.data?.success) {
        const teams = response.data.data || [];
        
        // Encontrar o time onde o usuário é membro
        // Primeiro, verificar se o usuário é o capitão de algum time
        let userTeam = teams.find((team) => team.captain?.userId === user.userId);
        
        // Se não encontrou como capitão, verificar times onde canJoin é false
        // (indica que o usuário já é membro, mas precisamos confirmar buscando detalhes)
        if (!userTeam) {
          const teamsWhereCannotJoin = teams.filter((team) => team.canJoin === false);
          
          // Para cada time onde canJoin é false, buscar detalhes para verificar se o usuário é membro
          for (const team of teamsWhereCannotJoin) {
            try {
              const teamDetailsResponse = await api.get(`/events/teams/${team.teamId}`);
              if (teamDetailsResponse.data?.success) {
                const teamDetails = teamDetailsResponse.data.data;
                // Verificar se o usuário é membro deste time
                const isMember = teamDetails.members?.some((member) => member.userId === user.userId);
                if (isMember) {
                  userTeam = teamDetails;
                  break;
                }
              }
            } catch (err) {
              console.warn(`Erro ao buscar detalhes do time ${team.teamId}:`, err);
              continue;
            }
          }
          
          // Se ainda não encontrou, tentar usar o primeiro time onde canJoin é false como fallback
          if (!userTeam && teamsWhereCannotJoin.length > 0) {
            userTeam = teamsWhereCannotJoin[0];
          }
        }

        if (userTeam) {
          // Se já temos os detalhes completos (com membros), usar diretamente
          // Caso contrário, buscar detalhes completos
          if (userTeam.members && Array.isArray(userTeam.members)) {
            // Já temos os detalhes completos
            setMyTeam(userTeam);
          } else {
            // Buscar detalhes completos incluindo membros
            try {
              const teamDetailsResponse = await api.get(`/events/teams/${userTeam.teamId}`);
              if (teamDetailsResponse.data?.success) {
                setMyTeam(teamDetailsResponse.data.data);
              } else {
                setMyTeam(userTeam);
              }
            } catch (err) {
              // Se não conseguir buscar detalhes, usar o time básico da lista
              console.warn("Não foi possível buscar detalhes do time:", err);
              setMyTeam(userTeam);
            }
          }
        } else {
          setMyTeam(null);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar time:", err);
      const errorMsg = err.response?.data?.message || "Erro ao carregar informações do time.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [eventId, user]);

  // Carregar dados iniciais
  useEffect(() => {
    if (!evento || !eventId || !user) {
      setLoading(false);
      return;
    }

    loadMyTeam();
  }, [eventId, evento, user, loadMyTeam]);

  // Copiar link de convite
  const handleCopyLink = () => {
    if (!myTeam) return;

    // Criar link de convite (pode ser para página de inscrição com teamId)
    const inviteLink = `${window.location.origin}/evento/${eventId}/inscricao?team=${myTeam.teamId}`;
    
    navigator.clipboard.writeText(inviteLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => {
        setLinkCopied(false);
      }, 3000);
    }).catch((err) => {
      console.error("Erro ao copiar link:", err);
      showWarning("Erro ao copiar link. Por favor, copie manualmente.");
    });
  };

  // Cancelar/Sair do time
  const handleLeaveTeam = async () => {
    if (!myTeam || !user) return;

    const confirmMessage = myTeam.captain?.userId === user.userId
      ? "Tem certeza que deseja cancelar a inscrição deste time? Se você for o único membro, o time será deletado permanentemente."
      : "Tem certeza que deseja sair deste time? Se você for o último membro, o time será deletado.";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setActionLoading("leave");
      setError("");

      // Remover o usuário do time (sair do time)
      await api.delete(`/events/teams/${myTeam.teamId}/members/${user.userId}`);

      showSuccess("Você saiu do time com sucesso!");
      setMyTeam(null);
      // Recarregar a página ou atualizar o estado
      window.location.reload();
    } catch (err) {
      console.error("Erro ao sair do time:", err);
      const errorMsg = err.response?.data?.message || "Erro ao sair do time.";
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  // Remover membro do time (apenas capitão)
  const handleRemoveMember = async (memberId, memberUsername) => {
    if (!myTeam || !user) return;

    // Verificar se o usuário é o capitão
    if (myTeam.captain?.userId !== user.userId) {
      showWarning("Apenas o capitão pode remover membros do time.");
      return;
    }

    // Não permitir remover a si mesmo (usar handleLeaveTeam para isso)
    if (memberId === user.userId) {
      showInfo("Para sair do time, use o botão 'Cancelar Inscrição'.");
      return;
    }

    if (!window.confirm(`Tem certeza que deseja remover ${memberUsername} do time?`)) {
      return;
    }

    try {
      setActionLoading(`remove-${memberId}`);
      setError("");

      // Remover o membro do time
      const response = await api.delete(`/events/teams/${myTeam.teamId}/members/${memberId}`);

      if (response.data?.success) {
        const responseData = response.data.data;
        
        // Verificar se o time foi cancelado (sem membros restantes)
        if (responseData?.teamStatus === "Cancelled" || responseData?.newMemberCount === 0) {
          showWarning(`${memberUsername} foi removido do time. Como não há mais membros, o time foi cancelado.`);
          setMyTeam(null);
          // Recarregar a página após um pequeno delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          showSuccess(`${memberUsername} foi removido do time com sucesso!`);
          // Recarregar informações do time
          await loadMyTeam();
        }
      }
    } catch (err) {
      console.error("Erro ao remover membro:", err);
      const errorMsg = err.response?.data?.message || "Erro ao remover membro do time.";
      setError(errorMsg);
      showError(errorMsg);
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
    return <div className="loading-state">Carregando informações do time...</div>;
  }

  if (error && !myTeam) {
    return (
      <div className="error-state">
        <strong>Erro:</strong> {error}
      </div>
    );
  }

  if (!myTeam) {
    return (
      <div className="meu-time-tab">
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h2>Você não está em nenhum time</h2>
          <p>Você ainda não faz parte de nenhum time neste evento.</p>
          <p>Entre em um time existente ou crie um novo time para participar!</p>
        </div>
      </div>
    );
  }

  const isCaptain = myTeam.captain?.userId === user?.userId;
  const inviteLink = `${window.location.origin}/evento/${eventId}/inscricao?team=${myTeam.teamId}`;

  return (
    <div className="meu-time-tab">
      {error && (
        <div className="error-banner">
          <strong>⚠️</strong> {error}
        </div>
      )}

      {/* Informações do Time */}
      <section className="team-info-section">
        <div className="team-header-card">
          <div className="team-logo-container">
            {myTeam.logoURL ? (
              <img src={getLogoUrl(myTeam.logoURL)} alt={myTeam.teamName} className="team-logo-large" />
            ) : (
              <div className="team-logo-placeholder">
                <span>{myTeam.teamName?.charAt(0).toUpperCase() || "T"}</span>
              </div>
            )}
          </div>
          
          <div className="team-main-info">
            <h1 className="team-name-large">{myTeam.teamName}</h1>
            <div className="team-meta">
              <span className={`status-badge ${getStatusClass(myTeam.status)}`}>
                {getStatusLabel(myTeam.status)}
              </span>
              {isCaptain && (
                <span className="role-badge">Capitão</span>
              )}
            </div>
            
            <div className="team-stats">
              <div className="stat-item">
                <span className="stat-label">Membros:</span>
                <span className="stat-value">
                  {myTeam.memberCount || myTeam.members?.length || 0} / {myTeam.maxMembers || "N/A"}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Inscrito em:</span>
                <span className="stat-value">{formatDate(myTeam.registeredAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Link de Convite */}
        <div className="invite-section">
          <h3>Convidar Amigos</h3>
          <p>Compartilhe este link para que seus amigos possam entrar no seu time:</p>
          <div className="invite-link-container">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="invite-link-input"
              onClick={(e) => e.target.select()}
            />
            <button
              onClick={handleCopyLink}
              className={`btn-copy ${linkCopied ? "copied" : ""}`}
              disabled={actionLoading}
            >
              {linkCopied ? "✓ Copiado!" : "📋 Copiar Link"}
            </button>
          </div>
        </div>

        {/* Membros do Time */}
        {myTeam.members && myTeam.members.length > 0 && (
          <div className="members-section">
            <h3>Membros do Time</h3>
            <div className="members-grid">
              {myTeam.members.map((member) => (
                <div key={member.userId} className="member-card">
                  {member.profileURL ? (
                    <img
                      src={
                        member.profileURL.startsWith("http")
                          ? member.profileURL
                          : `${window.location.origin}/api/auth${member.profileURL}`
                      }
                      alt={member.username}
                      className="member-avatar"
                    />
                  ) : (
                    <div className="member-avatar-placeholder">
                      <span>{member.username?.charAt(0).toUpperCase() || "U"}</span>
                    </div>
                  )}
                  <div className="member-info">
                    <span className="member-name">{member.username}</span>
                    {member.role === "Captain" && (
                      <span className="member-role">Capitão</span>
                    )}
                  </div>
                  {isCaptain && member.role !== "Captain" && (
                    <button
                      onClick={() => handleRemoveMember(member.userId, member.username)}
                      disabled={actionLoading === `remove-${member.userId}` || actionLoading === "leave"}
                      className="btn-remove-member"
                      title="Remover membro"
                    >
                      {actionLoading === `remove-${member.userId}` ? "..." : "×"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="team-actions-section">
          <button
            onClick={handleLeaveTeam}
            disabled={actionLoading === "leave"}
            className="btn-leave"
          >
            {actionLoading === "leave" ? "Saindo..." : isCaptain ? "Cancelar Inscrição" : "Sair do Time"}
          </button>
        </div>
      </section>
    </div>
  );
}


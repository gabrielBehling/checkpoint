// frontend/src/pages/DashboardDoJogador.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import "../assets/css/DashboardJogador.css";

const STATUS_LABELS = {
  Active: "Ativo",
  Canceled: "Cancelado",
  Finished: "Finalizado",
};

function resolveBannerURL(bannerURL) {
  if (!bannerURL) return null;
  if (bannerURL.startsWith("http")) return bannerURL;
  return `https://checkpoint.localhost/api/events${bannerURL}`;
}

function formatDateRange(startDate, startHour, endDate, endHour) {
  if (!startDate) return "Sem data definida";
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
  });
  const startDateLabel = dateFormatter.format(start);
  const startHourLabel = startHour ? startHour.slice(11, 16) : timeFormatter.format(start);
  if (!end) {
    return `${startDateLabel} • ${startHourLabel}`;
  }
  const sameDay = start.toDateString() === end.toDateString();
  const endDateLabel = dateFormatter.format(end);
  const endHourLabel = endHour ? endHour.slice(11, 16) : timeFormatter.format(end);
  if (sameDay) {
    return `${startDateLabel} • ${startHourLabel} às ${endHourLabel}`;
  }
  return `${startDateLabel} • ${startHourLabel} → ${endDateLabel} • ${endHourLabel}`;
}

export default function DashboardDoJogador() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Função corrigida: busca eventos via /my-teams + detalhes
  const fetchMyEvents = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");

      // 1. Buscar times do usuário
      const teamsResponse = await api.get("/events/my-teams");
      const teams = Array.isArray(teamsResponse.data) ? teamsResponse.data : teamsResponse.data?.data || [];

      if (teams.length === 0) {
        setEvents([]);
        return;
      }

      // 2. Coletar eventos únicos
      const eventIds = [...new Set(teams.map((t) => t.EventID).filter(Boolean))];
      const eventPromises = eventIds.map((eventId) => api.get(`/events/${eventId}`).catch(() => null));
      const eventResponses = await Promise.all(eventPromises);
      const validEvents = eventResponses.filter((res) => res?.data?.success).map((res) => ({ ...res.data.data, myTeamId: teams.find((t) => t.EventID === res.data.data.eventId)?.TeamId }));

      setEvents(validEvents);
    } catch (requestError) {
      console.error("Erro ao buscar eventos do jogador:", requestError);
      setError("Não foi possível carregar seus eventos. Tente novamente mais tarde.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchMyEvents();
  }, [user, navigate, fetchMyEvents]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateA - dateB;
    });
  }, [events]);

  const handleViewEvent = (eventId) => {
    navigate(`/evento/${eventId}`);
  };

  const handleViewMyTeam = (eventId) => {
    navigate(`/evento/${eventId}?tab=meu-time`);
  };

  const handleViewMatches = (eventId) => {
    navigate(`/evento/${eventId}?tab=partidas`);
  };

  // ✅ FUNÇÃO CORRIGIDA: Cancela inscrição removendo o jogador do time
  const handleCancelRegistration = async (eventId, myTeamId) => {
    if (!myTeamId) {
      alert("Não foi possível identificar seu time para cancelar a inscrição.");
      return;
    }

    if (!window.confirm("Tem certeza que deseja cancelar sua inscrição neste evento?")) {
      return;
    }

    try {
      // Remove o jogador (userId) do time (myTeamId)
      await api.delete(`/events/teams/${myTeamId}/members/${user.userId}`);
      alert("Inscrição cancelada com sucesso!");
      fetchMyEvents();
    } catch (err) {
      console.error("Erro ao cancelar inscrição:", err);
      const msg = err.response?.data?.message || "Erro ao cancelar inscrição.";
      alert(msg);
    }
  };

  const renderStatusBadge = (status) => {
    const key = status || "Unknown";
    const className =
      {
        Active: "status-badge status-active",
        Canceled: "status-badge status-canceled",
        Finished: "status-badge status-finished",
      }[key] || "status-badge status-draft";
    return <span className={className}>{STATUS_LABELS[key] || "Desconhecido"}</span>;
  };

  return (
    <div>
      <Header />
      <main className="dashboard-jogador">
        <section className="dashboard-header">
          <div className="dashboard-title-group">
            <h1>Dashboard do Jogador</h1>
            <p>Visualize seus eventos inscritos, acompanhe seus times, partidas e gerencie sua participação.</p>
          </div>
          <div className="dashboard-header-actions">
            <button type="button" className="dashboard-refresh" onClick={fetchMyEvents} disabled={loading}>
              Atualizar lista
            </button>
          </div>
        </section>

        {loading ? (
          <div className="loading-state">Carregando eventos...</div>
        ) : (
          <section className="dashboard-panel">
            <h2>Meus Eventos Inscritos</h2>
            {error && (
              <div className="error-state">
                <strong>Ops!</strong> {error}
              </div>
            )}
            {!error && sortedEvents.length === 0 && (
              <div className="empty-state">
                Você ainda não está inscrito em nenhum evento.
                <br />
              </div>
            )}
            {!error && sortedEvents.length > 0 && (
              <div className="event-grid">
                {sortedEvents.map((event) => {
                  const { eventId, title, status, startDate, startHour, endDate, endHour, location, isOnline, bannerURL, mode, game, myTeamId } = event;
                  const banner = resolveBannerURL(bannerURL);

                  return (
                    <article key={eventId} className="event-card">
                      <div className="event-card-banner" style={banner ? { backgroundImage: `url(${banner})` } : undefined} />
                      <div className="event-card-content">
                        <header className="event-card-header">
                          <h3>{title}</h3>
                          {renderStatusBadge(status)}
                        </header>
                        <div className="event-card-meta">
                          <span>📅 {formatDateRange(startDate, startHour, endDate, endHour)}</span>
                          <span>📍 {isOnline ? "Online" : location || "Local a definir"}</span>
                          <span>🎮 {game?.gameName || "Jogo em definição"}</span>
                          {mode && <span>🧩 Modo: {mode}</span>}
                        </div>
                        <div className="event-card-actions">
                          <button type="button" className="dashboard-button btn-view" onClick={() => handleViewEvent(eventId)}>
                            Ver evento
                          </button>
                          <button type="button" className="dashboard-button btn-manage" onClick={() => handleViewMyTeam(eventId)}>
                            Meu Time
                          </button>
                          <button type="button" className="dashboard-button btn-view" onClick={() => handleViewMatches(eventId)}>
                            Partidas
                          </button>
                          {status !== "Finished" && status !== "Canceled" && (
                            <button type="button" className="dashboard-button btn-cancel" onClick={() => handleCancelRegistration(eventId, myTeamId)}>
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

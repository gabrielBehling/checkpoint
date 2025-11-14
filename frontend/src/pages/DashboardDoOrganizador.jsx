import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import "../assets/css/DashboardOrganizador.css";

const STATUS_LABELS = {
  Active: "Ativo",
  Canceled: "Cancelado",
  Finished: "Finalizado",
};

function resolveBannerURL(bannerURL) {
  if (!bannerURL) return null;
  if (bannerURL.startsWith("http")) return bannerURL;
  return `http://checkpoint.localhost/api/events${bannerURL}`;
}

function formatDateRange(startDate, startHour, endDate, endHour) {
  if (!startDate) return "Sem data definida";

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: 'UTC',
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: 'UTC',
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

export default function DashboardDoOrganizador() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchMyEvents = useCallback(async () => {
    if (!user || user.userRole !== "Organizer") {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get("/events", {
        params: {
          page: 1,
          limit: 100,
        },
      });

      if (!response.data?.success) {
        setError("Não foi possível carregar os eventos. Tente novamente mais tarde.");
        setEvents([]);
        return;
      }

      const payload = response.data.data;
      const list = Array.isArray(payload?.data) ? payload.data : [];

      const myEvents = list.filter((event) => {
        if (typeof event.createdBy === "number") {
          return event.createdBy === user.userId;
        }

        if (event.createdBy && typeof event.createdBy === "object") {
          return event.createdBy.userId === user.userId;
        }

        if (event.organizer && typeof event.organizer === "object") {
          return event.organizer.userId === user.userId;
        }

        return false;
      });

      setEvents(myEvents);
    } catch (requestError) {
      console.error("Erro ao buscar eventos do organizador:", requestError);
      setError("Ocorreu um erro ao carregar os seus eventos.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      navigate("/login");
      return;
    }

    if (user.userRole !== "Organizer") {
      navigate("/");
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

  const updateEventStatus = async (eventId, nextStatus) => {
    const confirmationMessages = {
      Active: "Deseja iniciar este evento agora?",
      Canceled: "Tem certeza que deseja cancelar este evento?",
      Finished: "Tem certeza que deseja finalizar este evento?",
    };

    if (!window.confirm(confirmationMessages[nextStatus] || "Deseja continuar com esta ação?")) {
      return;
    }

    try {
      setActionLoading(`${eventId}-${nextStatus}`);
      setError("");

      const formData = new FormData();
      formData.append("Status", nextStatus);

      await api.put(`/events/${eventId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await fetchMyEvents();
    } catch (requestError) {
      console.error("Erro ao atualizar status do evento:", requestError);
      setError("Não foi possível atualizar o status do evento. Tente novamente.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewEvent = (eventId) => {
    navigate(`/evento/${eventId}`);
  };

  const handleEditEvent = (eventId) => {
    navigate(`/evento/${eventId}/editarEvento`);
  };

  const handleManageMatches = (eventId) => {
    navigate(`/evento/${eventId}?tab=gerenciar`);
  };

  const renderStatusBadge = (status) => {
    const key = status || "Draft";
    const className =
      {
        Active: "status-badge status-active",
        Canceled: "status-badge status-canceled",
        Finished: "status-badge status-finished",
      }[key] || "status-badge status-draft";

    return <span className={className}>{STATUS_LABELS[key] || "Rascunho"}</span>;
  };

  return (
    <div>
      <Header />
      <main className="dashboard-organizer">
        <section className="dashboard-header">
          <div className="dashboard-title-group">
            <h1>Dashboard do Organizador</h1>
            <p>Gerencie os eventos que você criou, atualize status e acesse ferramentas esportivas.</p>
          </div>
          <div className="dashboard-header-actions">
            <button
              type="button"
              className="dashboard-create"
              onClick={() => navigate("/cadastroEvento")}
            >
              Criar evento
            </button>
            <button
              type="button"
              className="dashboard-refresh"
              onClick={fetchMyEvents}
              disabled={loading}
            >
              Atualizar lista
            </button>
          </div>
        </section>

        {loading ? (
          <div className="loading-state">Carregando eventos...</div>
        ) : (
          <section className="dashboard-panel">
            <h2>Eventos Criados</h2>

            {error && (
              <div className="error-state">
                <strong>Ops!</strong>
                {error}
              </div>
            )}

            {!error && sortedEvents.length === 0 && (
              <div className="empty-state">
                Você ainda não criou nenhum evento. Clique em &quot;Criar Evento&quot; no menu para começar!
              </div>
            )}

            {!error && sortedEvents.length > 0 && (
              <div className="event-grid">
                {sortedEvents.map((event) => {
                  const {
                    eventId,
                    title,
                    status,
                    startDate,
                    startHour,
                    endDate,
                    endHour,
                    location,
                    isOnline,
                    bannerURL,
                    mode,
                    gameName,
                    game,
                  } = event;

                  const banner = resolveBannerURL(bannerURL);
                  const canManageMatches = status === "Active";
                  const showStartButton = status !== "Active" && status !== "Finished";
                  const showCancelButton = status !== "Canceled" && status !== "Finished";
                  const showFinishButton = status !== "Finished";
                  const showEditButton = status !== "Finished";

                  return (
                    <article key={eventId} className="event-card">
                      <div
                        className="event-card-banner"
                        style={banner ? { backgroundImage: `url(${banner})` } : undefined}
                      />

                      <div className="event-card-content">
                        <header className="event-card-header">
                          <h3>{title}</h3>
                          {renderStatusBadge(status)}
                        </header>

                        <div className="event-card-meta">
                          <span>📅 {formatDateRange(startDate, startHour, endDate, endHour)}</span>
                          <span>📍 {isOnline ? "Online" : location || "Local a definir"}</span>
                          <span>🎮 {game?.gameName || gameName || "Jogo em definição"}</span>
                          {mode && <span>🧩 Modo: {mode}</span>}
                        </div>

                        <div className="event-card-actions">
                          <button
                            type="button"
                            className="dashboard-button btn-view"
                            onClick={() => handleViewEvent(eventId)}
                          >
                            Ver evento
                          </button>
                          {showEditButton && (
                            <button
                              type="button"
                              className="dashboard-button btn-edit"
                              onClick={() => handleEditEvent(eventId)}
                            >
                              Editar
                            </button>
                          )}
                          {showStartButton && (
                            <button
                              type="button"
                              className="dashboard-button btn-start"
                              disabled={actionLoading === `${eventId}-Active`}
                              onClick={() => updateEventStatus(eventId, "Active")}
                            >
                              {actionLoading === `${eventId}-Active` ? "Ativando..." : "Iniciar"}
                            </button>
                          )}
                          {showCancelButton && (
                            <button
                              type="button"
                              className="dashboard-button btn-cancel"
                              disabled={actionLoading === `${eventId}-Canceled`}
                              onClick={() => updateEventStatus(eventId, "Canceled")}
                            >
                              {actionLoading === `${eventId}-Canceled` ? "Cancelando..." : "Cancelar"}
                            </button>
                          )}
                          {showFinishButton && (
                            <button
                              type="button"
                              className="dashboard-button btn-finish"
                              disabled={actionLoading === `${eventId}-Finished`}
                              onClick={() => updateEventStatus(eventId, "Finished")}
                            >
                              {actionLoading === `${eventId}-Finished` ? "Finalizando..." : "Finalizar"}
                            </button>
                          )}
                          {canManageMatches && (
                            <button
                              type="button"
                              className="dashboard-button btn-manage"
                              onClick={() => handleManageMatches(eventId)}
                            >
                              Gerenciar partidas
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


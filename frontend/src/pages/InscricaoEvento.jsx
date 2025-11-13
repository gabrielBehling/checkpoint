import { useEffect, useState } from "react";
import api from "./api";
import { useParams, Link, useNavigate } from "react-router-dom";
import "../assets/css/Inscricao.css";
import { useAuth } from "../contexts/AuthContext";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function InscricaoEvento() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [evento, setEvento] = useState(null);
  const [times, setTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function carregarEvento() {
      try {
        if (!eventId) {
          setErro("Evento não encontrado.");
          setLoading(false);
          return;
        }

        const eventResponse = await api.get(`/events/${eventId}/`);
        if (eventResponse.data.success) {
          setEvento(eventResponse.data.data);
        }

        const teamsResponse = await api.get(`/events/${eventId}/teams/`);
        if (teamsResponse.data.success) {
          setTimes(teamsResponse.data.data);
        }
      } catch (err) {
        console.error("Erro ao carregar evento:", err.response);
        setErro("Erro ao carregar informações do evento.");
      } finally {
        setLoading(false);
      }
    }

    carregarEvento();
  }, []);

  if (loading) return <p>Carregando informações...</p>;
  if (erro) return <p style={{ color: "red" }}>{erro}</p>;
  if (!evento) return null;

  // Verificar se o usuário já possui um time neste evento (é capitão de algum time)
  const userHasTeam = user && times.some(time => time.captain?.userId === user.userId);

  async function recarregarDados() {
    try {
      const teamsResponse = await api.get(`/events/${eventId}/teams/`);
      if (teamsResponse.data.success) {
        setTimes(teamsResponse.data.data);
      }
    } catch (err) {
      console.error("Erro ao recarregar times:", err);
    }
  }

  function handleInscreverTime(teamId) {
    return async () => {
      try {
        await api.post(`/events/teams/${teamId}/join/`);
        alert("Inscrição realizada com sucesso!");
        navigate(`/evento/${eventId}`);
      } catch (err) {
        console.error("Erro ao inscrever no time:", err.response);
        const errorMessage = err.response?.data?.message || "Erro ao inscrever no time.";
        alert(errorMessage);
      }
    };
  }

  return (
    <>
      <Header />
      <main className="inscricao-container">
        <h1>Inscrição no Evento: {evento.title}</h1>
        <section className="criar-time">
          {!user ? (
            <p>Faça <Link to="/login">login</Link> para criar um time.</p>
          ) : userHasTeam ? (
            <p style={{ color: "green", fontWeight: "bold" }}>
              Você já possui um time neste evento!
            </p>
          ) : (
            <Link to={`/evento/${evento.eventId}/criarTime`}>
              <button>Criar Novo Time</button>
            </Link>
          )}
        </section>
        <br />
        <section className="times-list">
          <h2>Times Disponíveis</h2>
          {times.length === 0 ? (
            <p>Nenhum time disponível para inscrição.</p>
          ) : (
            <ul>
              {times.map((time) => (
                <li key={time.teamId}>
                  <h3>{time.teamName}</h3>
                  <p>Membros: {time.memberCount || 0}/{time.maxMembers || evento.teamSize}</p>
                  {/* Botão só aparece se o time não estiver cheio e o usuário puder entrar */}
                  {time.isFull === true ? (
                    <p style={{ color: "red", fontWeight: "bold" }}>Time cheio</p>
                  ) : time.canJoin === false ? (
                    <p style={{ color: "gray" }}>Você não pode entrar neste time</p>
                  ) : (
                    <button
                      onClick={handleInscreverTime(time.teamId)}
                    >
                      Entrar no time
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

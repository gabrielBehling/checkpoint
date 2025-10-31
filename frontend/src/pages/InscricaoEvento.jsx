import { useEffect, useState } from "react";
import api from "./api";
import { useParams, Link } from "react-router-dom";

export default function InscricaoEvento() {
  const { eventId } = useParams();
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
        setEvento(eventResponse.data);

        const teamsResponse = await api.get(`/events/${eventId}/teams/`);
        setTimes(teamsResponse.data);
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

  function handleInscreverTime(teamId) {
    return async () => {
      try {
        await api.post(`/events/teams/${teamId}/join/`);
        alert("Inscrição realizada com sucesso!");
      } catch (err) {
        console.error("Erro ao inscrever no time:", err.response);
        alert("Erro ao inscrever no time.");
      }
    };
  }

  return (
    <main className="inscricao-container">
      <h1>Inscrição no Evento: {evento.Title}</h1>
      <section className="criar-time">
        <Link to={`/evento/${evento.EventID}/criarTime`}>
          <button>Criar Novo Time</button>
        </Link>
      </section>
      <br/>
      <section className="times-list">
        <h2>Times Disponíveis</h2>
        {times.length === 0 ? (
          <p>Nenhum time disponível para inscrição.</p>
        ) : (
          <ul>
            {times.map((time) => (
              <li key={time.TeamID}>
                <h3>{time.TeamName}</h3>
                <button
                  onClick={handleInscreverTime(time.TeamID)}
                >
                  Entrar no time
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

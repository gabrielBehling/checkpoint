import { useEffect, useState } from "react";
import api from "./api"; 
import "../assets/css/EventoInfo.css"; 
import { useParams, Link } from "react-router-dom";


export default function EventoInfo() {
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const { eventId } = useParams()
  
  useEffect(() => {
    async function carregarEvento() {
      try {
        if (!eventId) {
          setErro("Evento não encontrado.");
          setLoading(false);
          return;
        }

        const response = await api.get(`/events/${eventId}/`);
        if (response.data.success) {
          setEvento(response.data.data);
        }
      } catch (err) {
        console.error("Erro ao carregar evento:", err);
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

  return (
    <main className="evento-container">
      <img
        src={evento.BannerURL}
        alt="Banner do Evento"
        className="evento-banner"
      />

      <h1>{evento.title}</h1>
      <p>{evento.description}</p>

      <section className="evento-info">
        <p><strong>Jogo ID:</strong> {evento.gameId}</p>
        <p><strong>Modo:</strong> {evento.mode}</p>
        <p><strong>Data de Início:</strong> {formatarData(evento.startDate)}</p>
        <p><strong>Data de Término:</strong> {formatarData(evento.endDate)}</p>
        <p><strong>Local:</strong> {evento.location}</p>
        <p><strong>Online:</strong> {evento.isOnline ? "Sim" : "Não"}</p>
        <p><strong>Idioma:</strong> {evento.language}</p>
        <p><strong>Plataforma:</strong> {evento.platform}</p>
        <p><strong>Participantes Máximos:</strong> {evento.maxParticipants}</p>
        <p><strong>Times Máximos:</strong> {evento.maxTeams}</p>
        <p><strong>Tamanho do Time:</strong> {evento.teamSize}</p>
        <p><strong>Entrada:</strong> R$ {evento.ticket?.toFixed(2)||"0.00"}</p>
        <p><strong>Custo de Participação:</strong> R$ {evento.participationCost?.toFixed(2)||"0.00"}</p>
        <p><strong>Regras:</strong> {evento.rules}</p>
        <p><strong>Premiação:</strong> {evento.prizes}</p>
        <p><strong>Status:</strong> {evento.status}</p>
      </section>

      <Link to={`/evento/${evento.eventId}/inscricao`}>
      <button className="btn-inscricao">Inscrever-se</button>
      </Link>
    </main>
  );
}


function formatarData(dataISO) {
  if (!dataISO) return "-";
  const data = new Date(dataISO);
  return data.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

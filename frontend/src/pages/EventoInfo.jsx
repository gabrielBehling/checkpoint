import { useEffect, useState } from "react";
import api from "./api"; 
import "./cadastroEvento.css"; 
import { useParams } from "react-router-dom";


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
        setEvento(response.data);
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

      <h1>{evento.Title}</h1>
      <p>{evento.Description}</p>

      <section className="evento-info">
        <p><strong>Jogo ID:</strong> {evento.GameID}</p>
        <p><strong>Modo:</strong> {evento.Mode}</p>
        <p><strong>Data de Início:</strong> {formatarData(evento.StartDate)}</p>
        <p><strong>Data de Término:</strong> {formatarData(evento.EndDate)}</p>
        <p><strong>Local:</strong> {evento.Location}</p>
        <p><strong>Online:</strong> {evento.IsOnline ? "Sim" : "Não"}</p>
        <p><strong>Idioma:</strong> {evento.Language}</p>
        <p><strong>Plataforma:</strong> {evento.Platform}</p>
        <p><strong>Participantes Máximos:</strong> {evento.MaxParticipants}</p>
        <p><strong>Times Máximos:</strong> {evento.MaxTeams}</p>
        <p><strong>Tamanho do Time:</strong> {evento.TeamSize}</p>
        <p><strong>Entrada:</strong> R$ {evento.Ticket?.toFixed(2)||"0.00"}</p>
        <p><strong>Custo de Participação:</strong> R$ {evento.ParticipationCost?.toFixed(2)||"0.00"}</p>
        <p><strong>Regras:</strong> {evento.Rules}</p>
        <p><strong>Premiação:</strong> {evento.Prizes}</p>
        <p><strong>Status:</strong> {evento.Status}</p>
      </section>

      <button
        className="btn-inscricao"
        onClick={() => alert("Função de inscrição em breve!")}
      >
        Inscrever-se
      </button>
    </main>
  );
}


function formatarData(dataISO) {
  if (!dataISO) return "-";
  const data = new Date(dataISO);
  return data.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

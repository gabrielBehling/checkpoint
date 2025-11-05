import { useEffect, useState } from "react";
import api from "./api"; 
import "../assets/css/EventoInfo.css"; 
import { useParams, Link } from "react-router-dom";


export default function EventoInfo() {
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const { eventId } = useParams();
  
  useEffect(() => {
    async function carregarDados() {
      try {
        if (!eventId) {
          setErro("Evento não encontrado.");
          setLoading(false);
          return;
        }

        const [eventoRes, commentsRes] = await Promise.all([
          api.get(`/events/${eventId}/`),
          api.get(`/chat/events/${eventId}/comments`)
        ]);
        if (eventoRes.data.success) {
          setEvento(eventoRes.data.data);
        }
        setComments(commentsRes.data);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setErro("Erro ao carregar informações do evento.");
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [eventId]);

  if (loading) return <p>Carregando informações...</p>;
  if (erro) return <p style={{ color: "red" }}>{erro}</p>;
  if (!evento) return null;

  return (
    <main className="evento-container">
      <img
        src={"http://checkpoint.localhost/api/events" + evento.bannerURL}
        alt="Banner do Evento"
        className="evento-banner"
      />

      <h1>{evento.title}</h1>
      <p>{evento.description}</p>

      <section className="evento-info">
        <p><strong>Jogo:</strong> {evento.game.gameName}</p>
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

      <section className="comments-section">
        <h3>Comentários</h3>
        
        <div className="comments-list">
          {comments.length === 0 ? (
            <p className="no-comments">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
          ) : (
            comments.map(comment => (
              <div key={comment._id} className="comment">
                <div className="comment-header">
                  <strong>{comment.author}</strong>
                  <span className="comment-date">
                    {new Date(comment.timestamp).toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="comment-content">{comment.message}</p>
              </div>
            ))
          )}
        </div>

        <form 
          className="comment-form" 
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newComment.trim()) return;
            
            try {
              const response = await api.post(`/chat/events/${eventId}/comments`, {
                content: newComment.trim()
              });
              setComments(prev => [response.data, ...prev]);
              setNewComment('');
            } catch (err) {
              console.error('Erro ao enviar comentário:', err);
              alert('Não foi possível enviar o comentário. Tente novamente.');
            }
          }}
        >
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva seu comentário..."
            maxLength={1000}
            required
          />
          <button type="submit" disabled={!newComment.trim()}>
            Enviar Comentário
          </button>
        </form>
      </section>
    </main>
  );
}


function formatarData(dataISO) {
  if (!dataISO) return "-";
  const data = new Date(dataISO);
  return data.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

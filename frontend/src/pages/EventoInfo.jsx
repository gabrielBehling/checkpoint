import { useEffect, useState } from "react";
import api from "./api"; 
import "../assets/css/EventoInfo.css"; 
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// --- Função Auxiliar de Formatação (Mantida) ---
// Formata datas para o formato local (ex: dd/mm/aaaa, hh:mm:ss)
function formatarData(dataISO) {
  if (!dataISO) return "-";
  const data = new Date(dataISO);
  // Adaptei para um formato mais limpo para o layout
  return data.toLocaleString("pt-BR", { 
    year: 'numeric', month: '2-digit', day: '2-digit', 
    hour: '2-digit', minute: '2-digit', second: '2-digit' 
  }).replace(/\//g, '-').replace(',', '');
}

// --- Componente Header (Simulação baseada na imagem) ---
// IMPORTANTE: Este componente deve ser adicionado separadamente na sua aplicação.
// Aqui, ele é incluído para contextualizar a estrutura completa.
function Header() {
    return (
        <header className="header">
            <div className="header-nav">
                <div className="logo">CHECKPOINT</div>
                <Link to="/eventos">Eventos</Link>
                <Link to="/jogos">Jogos</Link>
            </div>
            <div className="header-user">
                {/* Ícones ou links de login/cadastro */}
                <i className="search-icon">🔍</i> 
                <Link to="/login">Log In</Link>
                <Link to="/cadastro">Cadastre-se</Link>
            </div>
        </header>
    );
}

// --- Componente Principal ---
export default function EventoInfo() {
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const { eventId } = useParams();
  const { user } = useAuth(); // Assume que 'user' tem 'username' e 'avatarURL'
  
  // --- Funções de Handler (Comentário) ---
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      // Mock do objeto de resposta do comentário, já que o backend pode não retornar o autor completo
      const mockCommentResponse = {
        _id: Date.now().toString(), // ID único temporário
        author: user?.username || "Usuário Anônimo", 
        message: newComment.trim(),
        timestamp: new Date().toISOString(),
      };

      // Simula o POST (substitua a linha abaixo pela chamada real)
      // const response = await api.post(`/chat/events/${eventId}/comments`, { content: newComment.trim() });
      
      setComments(prev => [mockCommentResponse, ...prev]);
      setNewComment('');
    } catch (err) {
      console.error('Erro ao enviar comentário:', err);
      alert('Não foi possível enviar o comentário. Tente novamente.');
    }
  };

  // --- useEffect para Carregar Dados (Mantido) ---
  useEffect(() => {
    async function carregarDados() {
      try {
        if (!eventId) {
          setErro("Evento não encontrado.");
          return;
        }

        const [eventoRes, commentsRes] = await Promise.all([
          api.get(`/events/${eventId}/`),
          api.get(`/chat/events/${eventId}/comments`)
        ]);
        
        if (eventoRes.data.success) {
          setEvento(eventoRes.data.data);
        }
        // Os comentários devem ter a estrutura { author, message, timestamp }
        setComments(commentsRes.data || []); 
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

  // --- Variáveis para Dados (Limpeza e Formatação) ---
  const bannerUrl = "http://checkpoint.localhost/api/events" + evento.bannerURL;
  const creatorUsername = evento.organizer?.username || "fulano_234"; // Assumindo que organizer está disponível
  const creatorAvatar = evento.organizer?.avatarURL || "caminho/padrao/avatar.png"; 

  const isAtivo = evento.status === "ativo"; // Para o badge de status

  // Assumindo que evento.miniaturaURLs é um array de strings
  const miniaturas = evento.miniaturaURLs || ["miniatura1.jpg", "miniatura2.jpg", "miniatura3.jpg"]; 

  const ticketPrice = evento.ticket || 0;
  const halfTicketPrice = ticketPrice / 2;
  const participationCost = evento.participationCost || 0;

  return (
    <>
      <Header /> {/* Adicionando o Header */}
      <main className="evento-container">

        {/* --- TÍTULO E CATEGORIA (TOPO) --- */}
        <div className="evento-title-wrap">
            <h1>{evento.title || "CAMPEONATO DE ADEDONHA"}</h1>
            <span className="evento-category">{evento.game?.gameName.toUpperCase() || "CAMPEONATO"}</span>
        </div>

        {/* --- HERO (Imagem Principal + Miniaturas) + SIDEBAR (Vazio) --- */}
        <div className="evento-topo">
            <div className="evento-main">
                <div className="evento-hero">
                    {/* Banner Principal */}
                    <img
                        src={bannerUrl}
                        alt="Banner do Evento"
                        className="evento-banner"
                    />

                    {/* Miniaturas (Imagens na lateral direita do banner) */}
                    <div className="evento-miniaturas">
                        {miniaturas.slice(0, 3).map((url, index) => (
                            <img 
                                key={index} 
                                src={url} // Ajuste o caminho se necessário: "http://checkpoint.localhost/api/events" + url
                                alt={`Miniatura ${index + 1}`} 
                            />
                        ))}
                    </div>
                </div>

                {/* Status e Criador */}
                <div className="evento-meta">
                    <div className={`status-badge ${isAtivo ? 'ativo' : 'inativo'}`}>
                        <span className="dot"></span>
                        {isAtivo ? 'ATIVO' : 'INATIVO'}
                    </div>
                    <div className="creator">
                        <span>CREATED BY</span>
                        <strong>{creatorUsername}</strong>
                        <img className="avatar" src={creatorAvatar} alt="Avatar do Criador" />
                    </div>
                </div>

                {/* --- DESCRIÇÃO --- */}
                <section className="evento-descricao">
                    <h2>DESCRIÇÃO</h2>
                    <p>{evento.description || "Descrição padrão..."}</p>
                    {/* Adicionar regras e premiação aqui se não for usar a seção evento-info para isso */}
                </section>

                {/* --- DETALHES (DATAS, LOCAL, INGRESSO) --- */}
                <section className="evento-info">
                    {/* Grid principal (DATAS, HORÁRIOS, INGRESSO, TAXA) */}
                    <div className="info-grid">
                        
                        {/* 1. DATAS */}
                        <div className="info-card dates">
                            <div className="label">DATAS</div>
                            <div className="value">
                                <span className="date">{formatarData(evento.startDate).split(' ')[0]}</span>
                                <span className="date">{formatarData(evento.endDate).split(' ')[0]}</span>
                            </div>
                        </div>

                        {/* 2. HORÁRIOS */}
                        <div className="info-card times">
                            <div className="label">HORÁRIOS</div>
                            <div className="value">
                                {/* Assumindo que os horários são o segundo elemento da formatação da data */}
                                <span className="time">{formatarData(evento.startDate).split(' ')[1]}</span> 
                                <span className="time">{formatarData(evento.endDate).split(' ')[1]}</span>
                            </div>
                        </div>

                        {/* 3. LOCALIZAÇÃO (Ocupa a linha toda) */}
                        <div className="info-card location-card" style={{gridColumn: '1 / span 2'}}>
                            <div className="label">LOCALIZAÇÃO</div>
                            <div className="value location">
                                {evento.location || "Local não especificado"}{evento.isOnline ? " (Online)" : " (Presencial)"}
                                {/* Ponto de referência não está no objeto, mas se estivesse seria: */}
                                {/* <br />Ponto de Referência: {evento.referencePoint} */}
                            </div>
                        </div>

                        {/* 4. INGRESSO */}
                        <div className="info-card tickets">
                            <div className="label">INGRESSO</div>
                            <div className="card-ingressos">
                                <div className="value">
                                    <span className="price-tag">R$ {ticketPrice.toFixed(2)}</span>
                                    <span>INTEIRA</span>
                                </div>
                                {/* Adicionando a opção de Meia, mesmo que o backend não envie explicitamente */}
                                <div className="value">
                                    <span className="price-tag meia">R$ {halfTicketPrice.toFixed(2)}</span>
                                    <span>MEIA</span>
                                </div>
                            </div>
                        </div>

                        {/* 5. TAXA DE PARTICIPAÇÃO */}
                        <div className="info-card tax">
                            <div className="label">TAXA DE PARTICIPAÇÃO</div>
                            <div className="card-taxa">
                                <div className="value">
                                    <span className="price-tag">R$ {participationCost.toFixed(2)}</span>
                                    <span>/ PESSOA</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- PARTICIPANTES E TIMES --- */}
                <section className="participants">
                    <h4>PARTICIPANTES E TIMES</h4>
                    <div className="stats">
                        <div className="stat">
                            <span className="label">N° Máximo de Participantes:</span>
                            <span className="num">{evento.maxParticipants}</span>
                        </div>
                        <div className="stat">
                            <span className="label">N° de Times:</span>
                            <span className="num">{evento.maxTeams}</span>
                        </div>
                        <div className="stat">
                            <span className="label">N° de Participantes por Time:</span>
                            <span className="num">{evento.teamSize}</span>
                        </div>
                    </div>
                </section>

                {/* --- BOTÕES DE AÇÃO --- */}
                <div className="actions-row">
                    <Link to={`/evento/${evento.eventId}/inscricao`}>
                        <button className="btn-inscricao">Inscrever-se</button>
                    </Link>
                    {/* Botão de Edição visível para Admin/Organizer */}
                    {(user && (user.userRole === "administrator" || user.userRole === "organizer")) && (
                        <Link to={`/evento/${evento.eventId}/editarEvento`}>
                            <button className="btn-inscricao">Editar Evento</button>
                        </Link>
                    )}
                </div>

                {/* --- COMENTÁRIOS --- */}
                <section className="comments-section">
                    <h3>Comentários</h3>
                    
                    <div className="comments-list">
                        {comments.length === 0 ? (
                            <p className="no-comments">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                        ) : (
                            // Mapeia os comentários (assumindo que o mais recente está no topo: prev => [new, ...prev])
                            comments.map(comment => (
                                <div key={comment._id} className="comment">
                                    <div className="comment-header">
                                        <strong className="author">{comment.author}</strong>
                                        <span className="comment-date">
                                            {new Date(comment.timestamp).toLocaleString('pt-BR')}
                                        </span>
                                    </div>
                                    <p className="comment-content">{comment.message}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Formulário de Comentário */}
                    {user && ( // O formulário só aparece se o usuário estiver logado
                        <form className="comment-form" onSubmit={handleCommentSubmit}>
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
                    )}
                    {!user && (
                        <p className="small center">Faça <Link to="/login">login</Link> para comentar.</p>
                    )}
                </section>

            </div>
            
            {/* Coluna Lateral (Sidebar - Vazia no design da imagem, mas mantida por consistência) */}
            <div className="evento-side">
                {/* Aqui poderiam ir cards laterais (mini-stats, criador, etc.) */}
            </div>
        </div>
      </main>
    </>
  );
}
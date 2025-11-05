import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./assets/css/App.css";
import api from "./pages/api";
import { useAuth } from "./contexts/AuthContext";

// Imagem padrão
import FALLBACK_IMAGE_SRC from "./assets/img/fundo.png"; 

function App() {
    const navigate = useNavigate();
    const [carouselData, setCarouselData] = useState([]); 
    const totalSlides = carouselData.length;
    const [activeIndex, setActiveIndex] = useState(0);
    const [errorSources, setErrorSources] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eventosProximos, setEventosProximos] = useState([]);
    const [eventosEmAlta, setEventosEmAlta] = useState([]);
    const [loadingEventos, setLoadingEventos] = useState(true);
    const [loadingEventosAlta, setLoadingEventosAlta] = useState(true);
    const { user, logout } = useAuth();

    const getProfileSrc = (profilePath) => {
        if (!profilePath) return null;
        if (profilePath.startsWith('http')) return profilePath;
        // profilePath is expected to be like '/uploads/profiles/..'
        return `${window.location.origin}/api/auth${profilePath}`;
    };

    const fetchEventosEmAlta = async () => {
        setLoadingEventosAlta(true);
        try {
            const response = await api.get('/events/', {
                params: {
                    page: 1,
                    limit: 6,
                    status: 'Active'
                }
            });

            if (response.data.success) {
                // Ordena os eventos pelo número de participantes atual
                const eventos = response.data.data.data
                    .sort((a, b) => (b.currentParticipants || 0) - (a.currentParticipants || 0))
                    .slice(0, 6); // Pega os 6 eventos com mais participantes
                setEventosEmAlta(eventos);
            }
        } catch (err) {
            console.error('Erro ao carregar eventos em alta:', err);
        } finally {
            setLoadingEventosAlta(false);
        }
    };

    const fetchEventosProximos = async () => {
        setLoadingEventos(true);
        try {
            const hoje = new Date();
            const response = await api.get('/events/', {
                params: {
                    page: 1,
                    limit: 6,
                    status: 'Active'
                }
            });

            if (response.data.success) {
                const eventos = response.data.data.data.filter(evento => {
                    const dataEvento = new Date(evento.startDate);
                    return dataEvento >= hoje;
                });
                setEventosProximos(eventos);
            }
        } catch (err) {
            console.error('Erro ao carregar eventos próximos:', err);
        } finally {
            setLoadingEventos(false);
        }
    };

    const fetchCarouselData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get("/events/"); 
            
            if (response.data.success) {
                const newCarouselData = response.data.data.data.map((event, index) => ({
                    id: event.eventId,
                    src: event.bannerURL && event.bannerURL.trim() !== "" 
                        ? "http://checkpoint.localhost/api/events" + event.bannerURL 
                        : FALLBACK_IMAGE_SRC,
                    alt: event.title || "Evento sem título",
                    link: `/evento/${event.eventId}/`
                }));

                setCarouselData(newCarouselData);
                setActiveIndex(0);
                setErrorSources({});
            } else {
                throw new Error("Falha ao carregar os eventos");
            }
        } catch (err) {
            console.error("Erro ao carregar banners dos eventos:", err);
            setError("Não foi possível carregar os eventos. Tente novamente.");
            setCarouselData([
                { id: 99, src: FALLBACK_IMAGE_SRC, alt: "Erro de carregamento" }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.body.style.overflowX = "auto";
        document.body.style.overflowY = "auto";
        document.body.style.minHeight = "100vh";
        document.body.style.fontFamily = '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        document.body.style.backgroundColor = "#0a0d2a";
        document.body.style.color = "#f1f1f1";

        fetchCarouselData();
        fetchEventosProximos();
        fetchEventosEmAlta();
        const interval = setInterval(nextSlide, 15*60*1000); 
        return () => clearInterval(interval); 
    }, [totalSlides]);

    const nextSlide = () => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % totalSlides);
    };

    const prevSlide = () => {
        setActiveIndex((prevIndex) => 
            (prevIndex - 1 + totalSlides) % totalSlides
        );
    };

    const handleImageError = (index, currentSrc) => {
        setErrorSources(prev => ({ ...prev, [index]: true }));
    };

    const getSlideClasses = (index) => {
        let classes = "card";
        const relativeIndex = index - activeIndex;
        const distance = (relativeIndex + totalSlides + totalSlides / 2) % totalSlides - totalSlides / 2;

        if (distance === 0) classes += " active";
        else if (distance === 1 || distance === -totalSlides + 1) classes += " right";
        else if (distance === -1 || distance === totalSlides - 1) classes += " left";
        else if (distance === 2 || distance === -totalSlides + 2) classes += " right-far";
        else if (distance === -2 || distance === totalSlides - 2) classes += " left-far";
        
        if (errorSources[index]) classes += " error-orange";
        return classes;
    };
    
    return (
        <>
            <header>
                <nav className="navbar">
                    <div className="logo"><Link to="/">logo</Link></div>
                    <h1><input id="pesquisa" type="text" placeholder="Pesquisa" /></h1>
                    <ul>
                        <li><Link to="/eventos">Eventos</Link></li> 
                        <li><a href="#">Jogos</a></li> 
                        {!user ? (
                            <>
                                <li><Link to="/login">Login</Link></li>
                                <li><Link to="/cadastro">Cadastre-se</Link></li>
                            </>
                        ) : (
                            <>
                                <li><Link to="/chat">Chat</Link></li>
                                <li><Link to="/cadastroEvento">Cadastro Evento</Link></li>
                                <li>
                                    <button onClick={logout} className="logout-btn">
                                        Logout
                                    </button>
                                </li>
                                <li className="user-welcome">
                                    <Link to="/perfil" className="user-link">
                                        {user?.profileURL ? (
                                            <img
                                                src={getProfileSrc(user.profileURL)}
                                                alt={user.username}
                                                className="nav-avatar"
                                                style={{ width: 28, height: 28, borderRadius: '50%', marginRight: 8 }}
                                            />
                                        ) : null}
                                        Olá, {user.username}
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                </nav>
            </header>
            
            <section className="hero">
                {loading && <div className="loading-message">Carregando banners de eventos...</div>}
                {error && <div className="error-message">Erro: {error}</div>}
                
                <div className="carousel" style={{ overflowX: "auto" }}>
                    {!loading && carouselData.length > 0 ? (
                        carouselData.map((item, index) => {
                            const currentSrc = errorSources[index] ? FALLBACK_IMAGE_SRC : item.src;
                            return (
                                <img 
                                    key={item.id}
                                    className={getSlideClasses(index)} 
                                    src={currentSrc} 
                                    alt={item.alt}
                                    onError={(e) => {
                                        if (e.target.src !== FALLBACK_IMAGE_SRC) {
                                            handleImageError(index, item.src);
                                            e.target.src = FALLBACK_IMAGE_SRC; 
                                        } else {
                                            handleImageError(index, FALLBACK_IMAGE_SRC);
                                        }
                                    }}
                                    onClick={() => navigate(item.link)}
                                />
                            );
                        })
                    ) : (
                        !loading && !error && <div className="placeholder-card card active">Nenhum evento encontrado para o carrossel.</div>
                    )}
                </div>

                <div className="controls">
                    <button id="prev" onClick={prevSlide}>◀</button>
                    <button id="next" onClick={nextSlide}>▶</button>
                </div>
                
                {/* CTA só aparece se o usuário não estiver logado */}
                {!user && (
                    <div className="cta">
                        <p>
                            Cadastre-se e aproveite benefícios exclusivos!<br />
                            Tenha acesso a conteúdos especiais, ofertas e novidades antes de todo mundo.<br />
                            É rápido, gratuito e feito pra você!
                        </p>
                        <Link to="/cadastro" className="btn">Cadastre-se</Link>
                    </div>
                )}
            </section>

            <section className="eventos" style={{ overflowX: "auto" }}>
                <h2>Eventos Próximos</h2>
                <div id="lista-eventos" className="eventos-container">
                    {loadingEventos ? (
                        <p>Carregando eventos...</p>
                    ) : eventosProximos.length > 0 ? (
                        eventosProximos.map(evento => {
                            const dataEvento = new Date(evento.startDate);
                            return (
                                <div key={evento.eventId} className="evento-card">
                                    <div className="imagem-evento">
                                        <img 
                                            src={evento.bannerURL || FALLBACK_IMAGE_SRC} 
                                            alt={evento.title}
                                            onError={(e) => {
                                                e.target.src = FALLBACK_IMAGE_SRC;
                                            }}
                                        />
                                    </div>
                                    <div className="info-evento">
                                        <h3>{evento.title}</h3>
                                        <p>
                                            Data: {dataEvento.toLocaleDateString()}<br />
                                            Horário: {dataEvento.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<br />
                                            {evento.prizes && `Premiação: ${evento.prizes}`}<br />
                                            {evento.isOnline ? 'Online' : `Local: ${evento.location}`}
                                        </p>
                                        <Link to={`/evento/${evento.eventId}`} className="btn">
                                            Ver detalhes
                                        </Link>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p>Nenhum evento próximo encontrado.</p>
                    )}
                </div>
            </section> 

            <section className="eventos eventos-alta" style={{ overflowX: "auto" }}>
                <h2>Eventos em Alta</h2>
                <div id="lista-eventos-alta" className="eventos-container">
                    {loadingEventosAlta ? (
                        <p>Carregando eventos em alta...</p>
                    ) : eventosEmAlta.length > 0 ? (
                        eventosEmAlta.map(evento => {
                            const dataEvento = new Date(evento.startDate);
                            return (
                                <div key={evento.eventId} className="evento-card">
                                    <div className="imagem-evento">
                                        <img 
                                            src={evento.bannerURL || FALLBACK_IMAGE_SRC} 
                                            alt={evento.title}
                                            onError={(e) => {
                                                e.target.src = FALLBACK_IMAGE_SRC;
                                            }}
                                        />
                                        {evento.currentParticipants > 0 && (
                                            <div className="participantes-badge">
                                                {evento.currentParticipants} participantes
                                            </div>
                                        )}
                                    </div>
                                    <div className="info-evento">
                                        <h3>{evento.title}</h3>
                                        <p>
                                            Data: {dataEvento.toLocaleDateString()}<br />
                                            Horário: {dataEvento.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<br />
                                            {evento.prizes && `Premiação: ${evento.prizes}`}<br />
                                            {evento.isOnline ? 'Online' : `Local: ${evento.location}`}
                                        </p>
                                        <Link to={`/evento/${evento.eventId}`} className="btn">
                                            Ver detalhes
                                        </Link>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p>Nenhum evento em alta encontrado.</p>
                    )}
                </div>
            </section>

            <footer>
                <ul>
                    <li><a href="#">Ajuda</a></li>
                    <li><a href="#">Contato</a></li>
                    <li><Link to="/aboutUs">Sobre nós</Link></li>
                    <li><a href="#">Termos</a></li>
                </ul>
            </footer>
        </>
    );
}

export default App;

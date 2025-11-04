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
    const { user, logout } = useAuth();

    const fetchCarouselData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get("/events/"); 
            
            if (response.data.success) {
                const newCarouselData = response.data.data.data.map((event, index) => ({
                    id: event.eventId,
                    src: event.bannerUrl && event.bannerUrl.trim() !== "" 
                        ? event.bannerUrl 
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
                                <li>
                                    <span className="user-welcome">
                                        {console.log("User data:", user)}
                                        <li><a href="/perfil">Olá, {user.username}</a></li>
                                    </span>
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
                <h2>Eventos Próximos (Cadastrados)</h2>
                <div id="lista-eventos" className="eventos-container">
                    <p>Carregando eventos...</p>
                    <div className="evento-card">
                        <div className="imagem-evento"></div>
                        <div className="info-evento">
                            <p>
                                Evento tal<br />
                                Data tal<br />
                                Premiação tal<br />
                                Hora tal
                            </p>
                            <Link to="/EventoInfo" className="btn">Cadastrar no evento</Link>
                        </div>
                    </div>
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

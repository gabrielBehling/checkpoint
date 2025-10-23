import React, { useState, useEffect } from "react";
// Importe o Link
import { Link } from "react-router-dom"; 
import "./App.css";

// IMPORTANTE: Você precisa importar a instância do seu axios configurado.
// Assumindo que o arquivo está no mesmo lugar que no seu componente Evento:
// import api from "./api"; 

// Se não tiver o arquivo api, use uma função de busca simulada.
// Para este exemplo, vou simular o api.
const api = {
    get: async (url) => {
        // Simulação de delay de rede
        await new Promise(resolve => setTimeout(resolve, 500)); 

        // Dados simulados de eventos, com o campo BannerURL
        const mockEvents = [
            { id: 101, Title: "Torneio Master", BannerURL: "https://tse4.mm.bing.net/th/id/OIP.qCE3DeX2b_cgIU-FDgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3" },
            { id: 102, Title: "Desafio de Código", BannerURL: "https://tse1.mm.bing.net/th/id/OIP.FA1CkUQCdyFNwV-WF6AHaEc?rs=1&pid=ImgDetMain&o=7&rm=3" },
            // URL inválida de propósito para testar o fallback/laranja
            { id: 103, Title: "Maratona RPG", BannerURL: "https://url.invalida/para.erro.jpg" }, 
            { id: 104, Title: "Copa de Verão", BannerURL: "https://tse2.mm.bing.net/th/id/OIP.JzeHi06Unntj-6nBLwHaEK?rs=1&pid=ImgDetMain&o=7&rm=3" },
            { id: 105, Title: "Final Mundial", BannerURL: "https://th.bing.com/th/id/OIP.x3ZVAv_pr7xVgHaEK?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3" },
        ];
        
        if (url === "/events") {
            return { data: mockEvents };
        }
        return { data: [] };
    }
};
// FIM DA SIMULAÇÃO DE API

// Fonte de fallback
const FALLBACK_IMAGE_SRC = "img/minha_magem.jpg"; 

function App() {
    // ESTADO ATUALIZADO: Inicializa o carrosselData como array vazio, será preenchido pela API
    const [carouselData, setCarouselData] = useState([]); 
    const totalSlides = carouselData.length;

    // **1. Estado para a imagem ativa**
    const [activeIndex, setActiveIndex] = useState(0);
    
    // NOVO: Estado para rastrear fontes que falharam e aplicar o estilo laranja
    const [errorSources, setErrorSources] = useState({});

    // NOVO: Estado para carregamento e erro da API
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    // Função para carregar os dados da API (usando o BannerURL)
    const fetchCarouselData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Supondo que o endpoint para listar eventos é /events
            const response = await api.get("/events"); 
            
            // Mapeia os dados do evento para o formato que o carrossel espera
            const newCarouselData = response.data.map((event, index) => ({
                id: event.id,
                src: event.BannerURL, // Usa o BannerURL como a fonte da imagem
                alt: event.Title,      // Usa o Título como o texto alternativo
                link: `/evento-detalhe/${event.id}` // Opcional: link para o detalhe do evento
            }));

            setCarouselData(newCarouselData);
            setActiveIndex(0); // Reinicia o carrossel
            setErrorSources({}); // Limpa os erros anteriores
        } catch (err) {
            console.error("Erro ao carregar banners dos eventos:", err);
            setError("Não foi possível carregar os eventos. Tente novamente.");
            // Opcional: Se a API falhar completamente, você pode usar um array padrão de fallback
            setCarouselData([
                { id: 99, src: FALLBACK_IMAGE_SRC, alt: "Erro de carregamento" }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // **3. Troca automática e Carregamento de Dados (useEffect)**
    useEffect(() => {
        fetchCarouselData(); // Carrega os dados na montagem
        
        // Roda nextSlide a cada 3 segundos
        const interval = setInterval(nextSlide, 3000); 
        
        // Limpa o intervalo ao desmontar o componente
        return () => clearInterval(interval); 
    }, [totalSlides]); // Depende de totalSlides para redefinir se os dados mudarem

    // **2. Funções de navegação** (Inalteradas)
    const nextSlide = () => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % totalSlides);
    };

    const prevSlide = () => {
        setActiveIndex((prevIndex) => 
            (prevIndex - 1 + totalSlides) % totalSlides
        );
    };

    // NOVO: Função para lidar com o erro de carregamento da imagem (Inalterada)
    const handleImageError = (index, currentSrc) => {
        // 1. Define o bloco como "laranja" no estado de erro
        setErrorSources(prev => ({ ...prev, [index]: true }));
        console.error(`Erro ao carregar a imagem do slide ${index}: ${currentSrc}. Aplicando cor laranja.`);
    };

    // **4. Lógica para aplicar as classes CSS 3D** (Inalterada)
    const getSlideClasses = (index) => {
        let classes = "card";
        const relativeIndex = index - activeIndex;

        // Calcula a distância relativa de forma cíclica
        const distance = (relativeIndex + totalSlides + totalSlides / 2) % totalSlides - totalSlides / 2;

        if (distance === 0) {
            classes += " active";
        } 
        else if (distance === 1 || distance === -totalSlides + 1) { 
            classes += " right";
        } 
        else if (distance === -1 || distance === totalSlides - 1) { 
            classes += " left";
        }
        else if (distance === 2 || distance === -totalSlides + 2) { 
            classes += " right-far";
        }
        else if (distance === -2 || distance === totalSlides - 2) { 
            classes += " left-far";
        }
        
        // Se a imagem falhou, adicione a classe de cor laranja
        if (errorSources[index]) {
            classes += " error-orange";
        }

        return classes;
    };


    return (
        <>
            {/* O restante do código HTML do cabeçalho permanece inalterado */}
            <header>
                <nav className="navbar">
                    {/* ... (código da navbar) ... */}
                    <div className="logo"><Link to="/">logo</Link></div>
                    <h1><input id="pesquisa" type="text" placeholder="Pesquisa"></input></h1>
                    <ul>
                        <li><Link to="/eventos">Eventos</Link></li> 
                        <li><a href="#">Jogos</a></li> 
                        <li><Link to="/login">Login</Link></li>
                        <li><Link to="/cadastro">Cadastre-se</Link></li>
                        <li><Link to="/chat">Chat</Link></li>
                        <li><Link to="/cadastroEvento">Cadastro Evento</Link></li>
                        <li><Link to="/perfil">Perfil</Link></li>
                    </ul>
                </nav>
            </header>
            
            {/* ===== HERO / CARROSSEL - Renderização Dinâmica ===== */}
            <section className="hero">
                {loading && <div className="loading-message">Carregando banners de eventos...</div>}
                {error && <div className="error-message">Erro: {error}</div>}
                
                <div className="carousel">
                    {/* Renderiza apenas se houver dados e não estiver carregando (ou com erro total) */}
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
                            />
                            );
                        })
                    ) : (
                        // Renderiza o placeholder se não houver dados, mas não está em erro grave
                        !loading && !error && <div className="placeholder-card card active">Nenhum evento encontrado para o carrossel.</div>
                    )}
                </div>

                {/* Controles do Carrossel com eventos onClick */}
                <div className="controls">
                    <button id="prev" onClick={prevSlide}>◀</button>
                    <button id="next" onClick={nextSlide}>▶</button>
                </div>
                
                {/* CTA - Call to Action */}
                <div className="cta">
                    <p>
                        Cadastre-se e aproveite benefícios exclusivos!<br />
                        Tenha acesso a conteúdos especiais, ofertas e novidades antes de todo mundo.<br />
                        É rápido, gratuito e feito pra você!
                    </p>
                    <Link to="/cadastro" className="btn">Cadastre-se</Link>
                </div>
            </section>

            {/* ===== EVENTOS - Estrutura do HTML: h2, lista-eventos/eventos-container ===== */}
            <section className="eventos">
                <h2>Eventos Próximos (Cadastrados)</h2>
                
                <div id="lista-eventos" className="eventos-container">
                    <p>Carregando eventos...</p>

                    {/* Simulação de um Card de Evento */}
                    <div className="evento-card">
                        <div className="imagem-evento"></div>
                        <div className="info-evento">
                            <p>
                                Evento tal<br />
                                Data tal<br />
                                Premiação tal<br />
                                Hora tal
                            </p>
                            <Link to="/cadastroEvento" className="btn">Cadastrar no evento</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== RODAPÉ - Estrutura do HTML: ul/links ===== */}
            <footer>
                <ul>
                    <li><a href="#">Ajuda</a></li>
                    <li><a href="#">Contato</a></li>
                    <li><a href="#">Sobre Nós</a></li>
                    <li><a href="#">Termos</a></li>
                    </ul>
            </footer>
        </>
    );
}

export default App;
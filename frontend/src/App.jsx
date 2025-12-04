import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "./assets/css/App.css";
import api from "./pages/api";
import { useAuth } from "./contexts/AuthContext";

// Imagens
import FALLBACK_IMAGE_SRC from "./assets/img/fundo.png";

import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

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

  const { user } = useAuth();

  const fetchEventosEmAlta = async () => {
    setLoadingEventosAlta(true);
    try {
      const response = await api.get("/events/", {
        params: { page: 1, limit: 6, status: "Active" },
      });

      if (response.data.success) {
        const eventos = response.data.data.data
          .sort((a, b) => (b.currentParticipants || 0) - (a.currentParticipants || 0))
          .slice(0, 6);

        setEventosEmAlta(eventos);
      }
    } catch (err) {
      console.error("Erro ao carregar eventos em alta:", err);
    } finally {
      setLoadingEventosAlta(false);
    }
  };

  const fetchEventosProximos = async () => {
    setLoadingEventos(true);

    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const limiteSeteDias = new Date(hoje);
      limiteSeteDias.setDate(hoje.getDate() + 7);
      limiteSeteDias.setHours(23, 59, 59, 999);

      const response = await api.get("/events/", {
        params: { page: 1, limit: 50, status: "Active" },
      });

      if (response.data.success) {
        const eventosFiltrados = response.data.data.data.filter((evento) => {
          if (!evento.startDate) return false;

          const dataString = evento.startDate.toString().split("T")[0];
          const partesData = dataString.split("-");
          const dataEvento = new Date(partesData[0], partesData[1] - 1, partesData[2]);
          dataEvento.setHours(0, 0, 0, 0);

          return dataEvento >= hoje && dataEvento <= limiteSeteDias;
        });

        const eventosOrdenados = eventosFiltrados.sort(
          (a, b) => new Date(a.startDate) - new Date(b.startDate)
        );

        setEventosProximos(eventosOrdenados.slice(0, 6));
      }
    } catch (err) {
      console.error("Erro ao carregar eventos próximos:", err);
    } finally {
      setLoadingEventos(false);
    }
  };

  const fetchCarouselData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/events/", {
        params: { limit: 5 },
      });

      if (response.data.success) {
        const newCarouselData = response.data.data.data.map((event) => ({
          id: event.eventId,
          src:
            event.bannerURL && event.bannerURL.trim() !== ""
              ? `${window.location.origin}/api/events${event.bannerURL}`
              : FALLBACK_IMAGE_SRC,
          alt: event.title || "Evento sem título",
          link: `/evento/${event.eventId}/`,
        }));

        setCarouselData(newCarouselData);
        setActiveIndex(0);
        setErrorSources({});
      } else {
        throw new Error("Falha ao carregar os eventos");
      }
    } catch (err) {
      console.error("Erro ao carregar banners:", err);
      setError("Erro ao carregar os eventos.");

      setCarouselData([
        { id: 99, src: FALLBACK_IMAGE_SRC, alt: "Erro de carregamento" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarouselData();
    fetchEventosProximos();
    fetchEventosEmAlta();

    const interval = setInterval(nextSlide, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [totalSlides]);

  const nextSlide = () => {
    if (totalSlides === 0) return;
    setActiveIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    if (totalSlides === 0) return;
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleImageError = (index) => {
    setErrorSources((prev) => ({ ...prev, [index]: true }));
  };

  const getSlideClasses = (index) => {
    let classes = "card";

    if (totalSlides <= 1) {
      classes += " active";
    } else {
      const relativeIndex = index - activeIndex;
      const distance =
        ((relativeIndex + totalSlides + totalSlides / 2) % totalSlides) -
        totalSlides / 2;

      if (distance === 0) classes += " active";
      else if (distance === 1 || distance === -totalSlides + 1) classes += " right";
      else if (distance === -1 || distance === totalSlides - 1) classes += " left";
      else if (distance === 2 || distance === -totalSlides + 2)
        classes += " right-far";
      else if (distance === -2 || distance === totalSlides - 2)
        classes += " left-far";
    }

    if (errorSources[index]) classes += " error-orange";

    return classes;
  };

  return (
    <>
      <Header />

      <section className="hero">
        {loading && <div className="loading-message">Carregando banners...</div>}
        {error && <div className="error-message">Erro: {error}</div>}

        <div className="carousel" style={{ overflowX: "auto" }}>
          {!loading && carouselData.length > 0 ? (
            carouselData.map((item, index) => {
              const currentSrc = errorSources[index]
                ? FALLBACK_IMAGE_SRC
                : item.src;

              return (
                <img
                  key={item.id}
                  className={getSlideClasses(index)}
                  src={currentSrc}
                  alt={item.alt}
                  onError={(e) => {
                    if (e.target.src !== FALLBACK_IMAGE_SRC) {
                      handleImageError(index);
                      e.target.src = FALLBACK_IMAGE_SRC;
                    }
                  }}
                  onClick={() => navigate(item.link)}
                />
              );
            })
          ) : (
            !loading &&
            !error && (
              <div className="placeholder-card card active">
                Nenhum evento encontrado para o carrossel.
              </div>
            )
          )}
        </div>

        {/* CONTROLES DO CARROSSEL */}
        {!loading && carouselData.length > 1 && (
          <div className="controls">
            <button id="prev" onClick={prevSlide}>
              ◀
            </button>
            <button id="next" onClick={nextSlide}>
              ▶
            </button>
          </div>
        )}

        {!user && (
          <div className="cta">
            <p>
              Cadastre-se e aproveite benefícios exclusivos!
              <br />
              Acesso antecipado a novidades e promoções.
            </p>

            <Link to="/cadastro" state={{ from: location }} className="btn">
              Cadastre-se
            </Link>
          </div>
        )}
      </section>

      {/* EVENTOS PROXIMOS */}
      <section className="eventos" style={{ overflowX: "auto" }}>
        <h2>Eventos Próximos</h2>

        <div className="eventos-container">
          {loadingEventos ? (
            <p>Carregando eventos...</p>
          ) : eventosProximos.length > 0 ? (
            eventosProximos.map((evento) => {
              const dataEvento = new Date(evento.startDate);
              const dia = String(dataEvento.getUTCDate()).padStart(2, "0");
              const mes = String(dataEvento.getUTCMonth() + 1).padStart(2, "0");
              const ano = dataEvento.getUTCFullYear();

              return (
                <div key={evento.eventId} className="evento-card">
                  <div className="imagem-evento">
                    <img
                      src={
                        evento.bannerURL && evento.bannerURL.trim() !== ""
                          ? `${window.location.origin}/api/events${evento.bannerURL}`
                          : FALLBACK_IMAGE_SRC
                      }
                      alt={evento.title}
                      onError={(e) => (e.target.src = FALLBACK_IMAGE_SRC)}
                    />
                  </div>

                  <div className="info-evento">
                    <h3>{evento.title}</h3>

                    <p>
                      Data: {dia}/{mes}/{ano}
                      <br />
                      Horário: {evento.startHour || "Definir"}
                      <br />
                      {evento.prizes && <>Premiação: {evento.prizes}<br /></>}
                      {evento.isOnline ? "Online" : `Local: ${evento.location}`}
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

      {/* EVENTOS EM ALTA */}
      <section className="eventos eventos-alta" style={{ overflowX: "auto" }}>
        <h2>Eventos em Alta</h2>

        <div className="eventos-container">
          {loadingEventosAlta ? (
            <p>Carregando eventos em alta...</p>
          ) : eventosEmAlta.length > 0 ? (
            eventosEmAlta.map((evento) => {
              const dataEvento = new Date(evento.startDate);
              const dia = String(dataEvento.getUTCDate()).padStart(2, "0");
              const mes = String(dataEvento.getUTCMonth() + 1).padStart(2, "0");
              const ano = dataEvento.getUTCFullYear();

              return (
                <div key={evento.eventId} className="evento-card">
                  <div className="imagem-evento">
                    <img
                      src={
                        evento.bannerURL && evento.bannerURL.trim() !== ""
                          ? `${window.location.origin}/api/events${evento.bannerURL}`
                          : FALLBACK_IMAGE_SRC
                      }
                      alt={evento.title}
                      onError={(e) => (e.target.src = FALLBACK_IMAGE_SRC)}
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
                      Data: {dia}/{mes}/{ano}
                      <br />
                      Horário: {evento.startHour || "Definir"}
                      <br />
                      {evento.prizes && <>Premiação: {evento.prizes}<br /></>}
                      {evento.isOnline ? "Online" : `Local: ${evento.location}`}
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

      <Footer />
    </>
  );
}

export default App;
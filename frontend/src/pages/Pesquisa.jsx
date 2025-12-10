import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "../assets/css/PesquisaEvento.css"; // ✅ Importa o CSS estilizado

import Header from "../components/Header";
import Footer from "../components/Footer";

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // --- Estados da API e UI ---
  const [events, setEvents] = useState([]);
  const [paginationInfo, setPaginationInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Estados dos Filtros ---
  const [filterOptions, setFilterOptions] = useState({
    games: [],
    modes: [],
    languages: [],
    platforms: []
  });
  const [filtersLoading, setFiltersLoading] = useState(true);

  // --- Estados Controlados (Inputs) ---
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
  const [pageInput, setPageInput] = useState(currentPage);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  
  // O termo que realmente aciona a busca (após clicar em "Buscar")
  const [activeSearchTerm, setActiveSearchTerm] = useState(searchParams.get("q") || "");

  // Controla a visibilidade dos filtros
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    game: searchParams.get("game") || "",
    date: searchParams.get("date") || "",
    mode: searchParams.get("mode") || "",
    ticket: searchParams.get("ticket") || "",
    participationCost: searchParams.get("participationCost") || "",
    place: searchParams.get("place") || "",
    groupSize: searchParams.get("groupSize") || "",
    status: searchParams.get("status") || "",
    prize: searchParams.get("prize") || "",
    language: searchParams.get("language") || "",
    platform: searchParams.get("platform") || "",
    maxParticipants: searchParams.get("maxParticipants") || "",
    isOnline: searchParams.get("isOnline") === "true",
  });

  // 1. Busca as opções de filtro
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setFiltersLoading(true);
        // Ajuste a URL se necessário para o seu ambiente
        const response = await fetch(`http://checkpoint.localhost/api/events/filters`);
        if (!response.ok) {
          throw new Error("Falha ao buscar opções de filtro");
        }
        const data = await response.json();
        if (data.success) {
          setFilterOptions(data.data);
        } else {
          throw new Error(data.message || "Erro da API ao buscar filtros");
        }
      } catch (err) {
        console.error("Erro ao carregar filtros:", err.message);
      } finally {
        setFiltersLoading(false);
      }
    };
    fetchFilterOptions();
  }, []);

  // 2. Busca os eventos
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams(); 
        
        if (activeSearchTerm) params.append("search", activeSearchTerm);
        params.append("page", currentPage.toString());

        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params.append(key, value.toString());
          }
        });
        
        const response = await fetch(`http://checkpoint.localhost/api/events?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch events (status: ${response.status})`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setEvents(data.data.data || []);
          setPaginationInfo(data.data.pagination || null); 
        } else {
          throw new Error(data.message || "Erro ao buscar eventos");
        }

      } catch (err) {
        setError("Erro ao buscar eventos. Tente novamente mais tarde.");
        console.error("ERRO NO BLOCO CATCH:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [activeSearchTerm, filters, currentPage]);

  // 3. Atualiza a URL
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (activeSearchTerm) params.set("q", activeSearchTerm);
    if (currentPage > 1) params.set("page", currentPage.toString());
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString());
      }
    });
    
    setSearchParams(params, { replace: true });
  }, [activeSearchTerm, filters, currentPage, setSearchParams]);

  // 4. Sincroniza o input
  useEffect(() => {
    setPageInput(currentPage);
  }, [currentPage]);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === "checkbox") {
      setFilters(prev => ({ ...prev, [name]: checked }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1); 
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setCurrentPage(1);
    setFilters({
      game: "",
      date: "",
      mode: "",
      ticket: "",
      participationCost: "",
      place: "",
      groupSize: "",
      status: "",
      prize: "",
      language: "",
      platform: "",
      maxParticipants: "",
      isOnline: false,
    });
  };

  // --- Funções de Paginação ---
  const goToPage = (page) => {
    const pageNum = Number(page);
    if (pageNum >= 1 && pageNum <= (paginationInfo?.totalPages || 1)) {
      setCurrentPage(pageNum);
    }
  };

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    goToPage(pageInput);
  };

  // Componente de renderização da paginação
  const renderPagination = () => {
    if (!paginationInfo || paginationInfo.totalPages <= 1) return null;

    const { page: currentPage, totalPages: lastPage } = paginationInfo;
    const pageButtons = [];
    const pagesToShow = 5; 

    let startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
    let endPage = Math.min(lastPage, startPage + pagesToShow - 1);

    if (endPage - startPage + 1 < pagesToShow) {
      startPage = Math.max(1, endPage - pagesToShow + 1);
    }

    if (startPage > 1) {
      pageButtons.push(
        <button 
          key="start-ellipsis" 
          className="pagination-btn"
          onClick={() => goToPage(startPage - 1)}
        >
          ...
        </button>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <button 
          key={i} 
          className={`pagination-btn ${i === currentPage ? 'active' : ''}`}
          onClick={() => goToPage(i)}
          disabled={i === currentPage}
        >
          {i}
        </button>
      );
    }

    if (endPage < lastPage) {
      pageButtons.push(
        <button 
          key="end-ellipsis" 
          className="pagination-btn"
          onClick={() => goToPage(endPage + 1)}
        >
          ...
        </button>
      );
    }

    return ( 
      <div className="pagination-container">
        <button 
          className="pagination-btn"
          onClick={() => goToPage(1)} 
          disabled={currentPage === 1}
        >
          Prim.
        </button>
        <button 
          className="pagination-btn"
          onClick={() => goToPage(currentPage - 1)} 
          disabled={currentPage === 1}
        >
          Ant.
        </button>
        
        {pageButtons}

        <button 
          className="pagination-btn"
          onClick={() => goToPage(currentPage + 1)} 
          disabled={currentPage === lastPage}
        >
          Próx.
        </button>
        <button 
          className="pagination-btn"
          onClick={() => goToPage(lastPage)} 
          disabled={currentPage === lastPage}
        >
          Últ.
        </button>

        <form onSubmit={handlePageInputSubmit} className="pagination-form">
          <input 
            type="number" 
            className="pagination-input"
            value={pageInput} 
            onChange={(e) => setPageInput(e.target.value)} 
            min="1" 
            max={lastPage}
          />
          <button type="submit" className="pagination-btn">
            Ir
          </button>
        </form>
      </div>
    );
  };

  // --- Início do return (JSX) ---
  return (
    <div> 
      <Header/>
    
    <div className="search-page-container">
      <h1 className="search-page-title">Pesquisa de Eventos</h1>

      {/* --- BARRA DE BUSCA --- */}
      <div className="search-bar-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar eventos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <button className="btn-primary2" onClick={handleSearch}>
          Buscar
        </button>
      </div>

      {/* --- FILTROS --- */}
      <div className="filters-section">
        <div className="filters-header">
          <h2>Filtros</h2>
          <div className="filters-actions">
            <button className="btn-secondary" onClick={() => setShowFilters(prev => !prev)}>
              {showFilters ? "Esconder" : "Mostrar"}
            </button>
            <button className="btn-secondary2" onClick={handleClearFilters}>
              Limpar filtros
            </button>
          </div>
        </div>
        
        {/* --- CONTEÚDO CONDICIONAL (Filtros) --- */}
        {showFilters && (
          <>
            {filtersLoading ? (
              <p className="loading-state">Carregando filtros...</p>
            ) : (
              // Div principal dos filtros
              <div className="filters-grid"> 
                <select name="game" value={filters.game} onChange={handleChange}>
                  <option value="">Todos os Jogos</option>
                  {filterOptions.games.map(game => (
                    <option key={game.GameID} value={game.GameName}>
                      {game.GameName}
                    </option>
                  ))}
                </select>
                
                <input name="date" type="date" value={filters.date} onChange={handleChange} />
                
                <select name="mode" value={filters.mode} onChange={handleChange}>
                  <option value="">Todos os Modos</option>
                  {filterOptions.modes.map(mode => (
                    <option key={mode.ModeID} value={mode.ModeName}>
                      {mode.ModeName}
                    </option>
                  ))}
                </select>

                <input name="ticket" type="number" placeholder="Preço do ingresso" value={filters.ticket} onChange={handleChange} min="0" step="0.01" />
                <input name="participationCost" type="number" placeholder="Custo de participação" value={filters.participationCost} onChange={handleChange} min="0" step="0.01" />
                <input name="place" type="text" placeholder="Localização" value={filters.place} onChange={handleChange} />
                <input name="groupSize" type="number" placeholder="Tamanho do time" value={filters.groupSize} onChange={handleChange} min="1" />
                <select name="status" value={filters.status} onChange={handleChange}>
                  <option value="">Status do Evento</option>
                  <option value="Active">Ativo</option>
                  <option value="Canceled">Cancelado</option>
                  <option value="Finished">Finalizado</option>
                </select>
                <input name="prize" type="text" placeholder="Prêmios" value={filters.prize} onChange={handleChange} />

                <select name="language" value={filters.language} onChange={handleChange}>
                  <option value="">Todos os Idiomas</option>
                  {filterOptions.languages.map(lang => (
                    <option key={lang.LanguageID} value={lang.LanguageName}>
                      {lang.LanguageName}
                    </option>
                  ))}
                </select>

                <select name="platform" value={filters.platform} onChange={handleChange}>
                  <option value="">Todas as Plataformas</option>
                  {filterOptions.platforms.map(platform => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>

                <input name="maxParticipants" type="number" placeholder="Máx. participantes" value={filters.maxParticipants} onChange={handleChange} min="1" />

                <div className="checkbox-wrapper">
                  <input 
                    id="isOnline" 
                    name="isOnline" 
                    type="checkbox" 
                    checked={filters.isOnline} 
                    onChange={handleChange} 
                  />
                  <label htmlFor="isOnline">
                    Apenas eventos online
                  </label>
                </div>
              </div>
            )} 

            <div className="apply-filters-btn-container">
              <button className="btn-primary" onClick={handleSearch}>
                Aplicar Filtros
              </button>
            </div>
          </>
        )}
      </div>

      {/* --- RESULTADOS --- */}
      <div>
        {loading ? (
          <div className="loading-state">
            <div>Carregando eventos...</div>
          </div>
        ) : error ? (
          <div className="error-state">
            {error}
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            Nenhum evento encontrado com os filtros aplicados.
          </div>
        ) : (
          <>
            <h2 className="results-info">Eventos Encontrados ({paginationInfo?.total || events.length})</h2>
            <div className="events-grid">
              {events.map((event) => (
                <div key={event.eventId} className="event-card">
                  {event.bannerURL && (
                    <img 
                      className="event-card-image"
                      src={event.bannerURL} 
                      alt={event.title} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/400x200?text=Sem+Banner";
                      }}
                    />
                  )}
                  <div className="event-card-content">
                    <div>
                        <div className="event-card-header">
                        <h3 className="event-card-title">{event.title}</h3>
                        <span className="event-card-status">
                            {event.status}
                        </span>
                        </div>
                        <p className="event-description">{event.description}</p>
                        
                        <div className="event-details-grid">
                        <div className="event-detail-item">
                            <strong>Data:</strong>
                            <span> {new Date(event.startDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="event-detail-item">
                            <strong>Jogo:</strong>
                            <span> {event.gameName || "N/A"}</span>
                        </div>
                        <div className="event-detail-item">
                            <strong>Formato:</strong>
                            <span> {
                            filterOptions.modes.find(m => m.ModeName === event.mode)?.ModeName || event.mode
                            }</span>
                        </div>
                        <div className="event-detail-item">
                            <strong>Local:</strong>
                            <span> {event.isOnline ? "Online" : event.location}</span>
                        </div>
                        </div>
                    </div>
                    
                    <div className="event-footer">
                      <div className="event-price">
                        {event.ticket ? `R$ ${event.ticket.toFixed(2)}` : "Grátis"}
                      </div>
                      <Link to={`/evento/${event.eventId}`}>
                        <button className="btn-details">
                          Ver detalhes
                        </button>
                      </Link> 
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </div>
    </div>
    <Footer/>
    </div>
  );
}

export default SearchPage;
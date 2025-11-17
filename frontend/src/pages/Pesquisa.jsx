import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "../assets/css/PesquisaEvento.css"; // ✅ importa o CSS

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

  // 1. Busca as opções de filtro (games, modes, etc.)
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setFiltersLoading(true);
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
  }, []); // Roda apenas uma vez

  // 2. Busca os eventos quando a busca ativa, filtros ou página mudam
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
          // CORRIGIDO: A API envia "pagination", não "meta"
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
  }, [activeSearchTerm, filters, currentPage]); // Depende da busca ATIVA

  // 3. Atualiza a URL quando a busca ativa, filtros ou página mudam
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

  // 4. Sincroniza o input de "ir para página" com a página atual
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
    // ADICIONADO: Reseta para a página 1 ao mudar qualquer filtro
    setCurrentPage(1);
  };

  // Ativa a busca ao clicar no botão ou pressionar Enter
  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1); // Reseta para a página 1 em nova busca
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
    // CORRIGIDO: A API envia "totalPages"
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
    // CORRIGIDO: A API envia "totalPages"
    if (!paginationInfo || paginationInfo.totalPages <= 1) return null;

    // CORRIGIDO: Renomeia "page" para "currentPage" e "totalPages" para "lastPage"
    const { page: currentPage, totalPages: lastPage } = paginationInfo;
    const pageButtons = [];
    const pagesToShow = 5; // Quantos números mostrar

    let startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
    let endPage = Math.min(lastPage, startPage + pagesToShow - 1);

    if (endPage - startPage + 1 < pagesToShow) {
      startPage = Math.max(1, endPage - pagesToShow + 1);
    }

    if (startPage > 1) {
      pageButtons.push(<button key="start-ellipsis" onClick={() => goToPage(startPage - 1)}>...</button>);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <button 
          key={i} 
          onClick={() => goToPage(i)}
          disabled={i === currentPage}
        >
          {i}
        </button>
      );
    }

    if (endPage < lastPage) {
      pageButtons.push(<button key="end-ellipsis" onClick={() => goToPage(endPage + 1)}>...</button>);
    }

    return (
      <div>
        <button onClick={() => goToPage(1)} disabled={currentPage === 1}>
          Primeira
        </button>
        <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
          Anterior
        </button>
        
        {pageButtons}

        <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === lastPage}>
          Próximo
        </button>
        <button onClick={() => goToPage(lastPage)} disabled={currentPage === lastPage}>
          Última
        </button>

        <form onSubmit={handlePageInputSubmit}>
          <input 
            type="number" 
            value={pageInput} 
            onChange={(e) => setPageInput(e.target.value)} 
            min="1" 
            max={lastPage}
          />
          <button type="submit">
            Ir
          </button>
        </form>
      </div>
    );
  };

  // --- Início do return (JSX) ---
  return (
    <div>
      <h1>Pesquisa de Eventos</h1>

      {/* --- BARRA DE BUSCA --- */}
      <div>
        <input
          type="text"
          placeholder="Buscar eventos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch}>
          Buscar
        </button>
      </div>

      {/* --- FILTROS --- */}
      <div>
        <div>
          <h2>Filtros</h2>
          {/* Botão para mostrar/esconder */}
          <button onClick={() => setShowFilters(prev => !prev)}>
            {showFilters ? "Esconder" : "Mostrar"}
          </button>
          <button onClick={handleClearFilters}>
            Limpar filtros
          </button>
        </div>
        
        {/* --- CONTEÚDO CONDICIONAL (Filtros) --- */}
        {showFilters && (
          <>
            {filtersLoading ? (
              <p>Carregando filtros...</p>
            ) : (
              // Div principal dos filtros (aparece quando não está loading)
              <div> 
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

                <div>
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

            {/* Este botão "Aplicar Filtros" SÓ aparece se os filtros estiverem visíveis */}
            <div>
              <button onClick={handleSearch}>
                Aplicar Filtros
              </button>
            </div>
          </>
        )}
        {/* --- FIM DO CONTEÚDO CONDICIONAL --- */}
      </div>

      {/* --- RESULTADOS --- */}
      <div>
        {loading ? (
          <div>
            <div>Carregando eventos...</div>
          </div>
        ) : error ? (
          <div>
            {error}
          </div>
        ) : events.length === 0 ? (
          <div>
            Nenhum evento encontrado com os filtros aplicados.
          </div>
        ) : (
          <>
            <h2>Eventos Encontrados ({paginationInfo?.total || events.length})</h2>
            <div>
              {events.map((event) => (
                <div key={event.eventId}>
                  {event.bannerURL && (
                    <img 
                      src={event.bannerURL} 
                      alt={event.title} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/400x200?text=Sem+Banner";
                      }}
                    />
                  )}
                  <div>
                    <div>
                      <h3>{event.title}</h3>
                      <span>
                        {event.status}
                      </span>
                    </div>
                    <p>{event.description}</p>
                    
                    <div>
                      <div>
                        <strong>Data:</strong>
                        <span> {new Date(event.startDate).toLocaleDateString('pt-BR')} - {new Date(event.endDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div>
                        <strong>Jogo:</strong>
                        <span> {event.gameName || "N/A"}</span>
                      </div>
                      <div>
                        <strong>Formato:</strong>
                        {/* Mostra o nome do modo se o encontrarmos, senão o texto bruto */}
                        <span> {
                          filterOptions.modes.find(m => m.ModeName === event.mode)?.ModeName || event.mode
                        }</span>
                      </div>
                      <div>
                        <strong>Local:</strong>
                        <span> {event.isOnline ? "Online" : event.location}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div>
                        <strong>Ingresso:</strong> 
                        <span>R$ {event.ticket?.toFixed(2) || "Grátis"}</span>
                      </div>
                      <Link to={`/evento/${event.eventId}`}>
                        <button>
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
  );
}

export default SearchPage;
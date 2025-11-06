import React, { useEffect, useState } from "react";
import api from "./api";
import "../assets/css/PesquisaEvento.css";

export default function BuscarEventos() {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({ games: [], modes: [], languages: [], platforms: [] });
  const [selectedFilters, setSelectedFilters] = useState({
    game: "",
    mode: "",
    language: "",
    platform: "",
    search: "",
  });
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);

 
  useEffect(() => {
    api
      .get("/events/filters/")
      .then((response) => {
        if (response.data.success){
          setFilters(response.data.data);
        }
      })
      .catch((error) => console.error("Erro ao carregar filtros:", error));
  }, []);

  
  const fetchEvents = () => {
    setLoading(true);
    setNoResults(false);
    api
      .get("/events/", { params: selectedFilters })
      .then((response) => {
        setEvents(response.data.data.data);
        setNoResults(response.data.data.length === 0);
      })
      .catch((error) => console.error("Erro ao buscar eventos:", error))
      .finally(() => setLoading(false));
  };

  
  useEffect(() => {
    fetchEvents();
  }, [selectedFilters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSelectedFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    setSelectedFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  return (
    <div className="page-container">
      
      <header className="header">
        <h1>Buscar Eventos</h1>
      </header>

      <div className="content">
        
        <aside className="filters">
          <h2>Filtros</h2>

          <div className="filter-group">
            <h3>Jogo</h3>
            {/* {filters.games.map((g) => (
              <label key={g.GameID}>
                <input
                  type="radio"
                  name="game"
                  value={g.GameName}
                  checked={selectedFilters.game === g.GameName}
                  onChange={handleFilterChange}
                />
                {g}
              </label>
            ))} */}
          </div>

          <div className="filter-group">
            <h3>Modo</h3>
            {filters.modes.map((m) => (
              <label key={m.ModeID}>
                <input
                  type="radio"
                  name="mode"
                  value={m.ModeName}
                  checked={selectedFilters.mode === m.ModeName}
                  onChange={handleFilterChange}
                />
                {m.ModeName}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h3>Idioma</h3>
            {filters.languages.map((l) => (
              <label key={l.LanguageID}>
                <input
                  type="radio"
                  name="language"
                  value={l.LanguageName}
                  checked={selectedFilters.language === l.LanguageName}
                  onChange={handleFilterChange}
                />
                {l.LanguageName}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h3>Plataforma</h3>
            {filters.platforms.map((p) => (
              <label key={p}>
                <input
                  type="radio"
                  name="platform"
                  value={p}
                  checked={selectedFilters.platform === p}
                  onChange={handleFilterChange}
                />
                {p}
              </label>
            ))}
          </div>
        </aside>

        
        <main className="results">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Pesquisar evento..."
              value={selectedFilters.search}
              onChange={handleSearch}
            />
          </div>

          {loading ? (
            <p className="loading">Carregando eventos...</p>
          ) : noResults ? (
            <p className="no-results">Nenhum evento encontrado.</p>
          ) : (
            <div className="event-list">
              {console.log(events) || events.map((event) => (
                <div key={event.eventId} className="event-card">
                  <h4>{event.title}</h4>
                  <p>
                    <strong>Jogo:</strong> {event.gameName}
                  </p>
                  <p>
                    <strong>Modo:</strong> {event.modeName}
                  </p>
                  <p>
                    <strong>Idioma:</strong> {event.languageName}
                  </p>
                  <p>
                    <strong>Plataforma:</strong> {event.platform}
                  </p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      
      <footer className="footer">
        <p>© 2025 Checkpoint - Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

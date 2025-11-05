import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../css/Pesquisa.css";

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
    axios
      .get("http://api.localhost/api/events/filters")
      .then((response) => {
        setFilters(response.data);
      })
      .catch((error) => console.error("Erro ao carregar filtros:", error));
  }, []);

  
  const fetchEvents = () => {
    setLoading(true);
    setNoResults(false);
    axios
      .get("http://api.localhost/api/events", { params: selectedFilters })
      .then((response) => {
        setEvents(response.data);
        setNoResults(response.data.length === 0);
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
            {filters.games.map((g) => (
              <label key={g}>
                <input
                  type="radio"
                  name="game"
                  value={g}
                  checked={selectedFilters.game === g}
                  onChange={handleFilterChange}
                />
                {g}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h3>Modo</h3>
            {filters.modes.map((m) => (
              <label key={m}>
                <input
                  type="radio"
                  name="mode"
                  value={m}
                  checked={selectedFilters.mode === m}
                  onChange={handleFilterChange}
                />
                {m}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h3>Idioma</h3>
            {filters.languages.map((l) => (
              <label key={l}>
                <input
                  type="radio"
                  name="language"
                  value={l}
                  checked={selectedFilters.language === l}
                  onChange={handleFilterChange}
                />
                {l}
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
              {events.map((event) => (
                <div key={event.id} className="event-card">
                  <h4>{event.title}</h4>
                  <p>
                    <strong>Jogo:</strong> {event.game}
                  </p>
                  <p>
                    <strong>Modo:</strong> {event.mode}
                  </p>
                  <p>
                    <strong>Idioma:</strong> {event.language}
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

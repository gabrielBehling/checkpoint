import React, { useState } from "react";
import api from "../api";
import "./PesquisaEvento.css";

export default function PesquisaEventos() {
  const [search, setSearch] = useState("");
  const [filtros, setFiltros] = useState({
    date: "",
    time: "",
    place: "",
    isOnline: "",
    game: "",
    mode: "",
    platform: "",
    groupSize: "",
    maxParticipants: "",
    ticket: "",
    participationCost: "",
    language: "",
    status: "",
    prize: "",
  });
  const [eventos, setEventos] = useState([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const buscarEventos = async () => {
    setLoading(true);
    setErro(null);

    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/events/search/?${params.toString()}`);
      setEventos(response.data);
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
      setErro("Não foi possível buscar os eventos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pesquisa-container">
      <div className="barra-pesquisa">
        <input
          type="text"
          placeholder="Buscar eventos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-buscar" onClick={buscarEventos}>
          Buscar
        </button>
      </div>

      <div className="filtros-area">
        <button
          className="btn-filtros"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
        >
          Filtros {mostrarFiltros ? "▲" : "▼"}
        </button>

        {mostrarFiltros && (
          <div className="filtros-container">
            <div className="filtro-grupo">
              <h3>Data / Hora</h3>
              <input
                type="date"
                name="date"
                value={filtros.date}
                onChange={handleFiltroChange}
              />
              <input
                type="time"
                name="time"
                value={filtros.time}
                onChange={handleFiltroChange}
              />
            </div>

            <div className="filtro-grupo">
              <h3>Localização</h3>
              <input
                type="text"
                name="place"
                placeholder="Local"
                value={filtros.place}
                onChange={handleFiltroChange}
              />
              <select
                name="isOnline"
                value={filtros.isOnline}
                onChange={handleFiltroChange}
              >
                <option value="">Presencial e Online</option>
                <option value="true">Online</option>
                <option value="false">Presencial</option>
              </select>
            </div>

            <div className="filtro-grupo">
              <h3>Jogo</h3>
              <input
                name="game"
                placeholder="Jogo"
                value={filtros.game}
                onChange={handleFiltroChange}
              />
              <input
                name="mode"
                placeholder="Modo"
                value={filtros.mode}
                onChange={handleFiltroChange}
              />
              <input
                name="platform"
                placeholder="Plataforma"
                value={filtros.platform}
                onChange={handleFiltroChange}
              />
            </div>

            <div className="filtro-grupo">
              <h3>Configurações</h3>
              <input
                name="groupSize"
                placeholder="Tamanho do grupo"
                value={filtros.groupSize}
                onChange={handleFiltroChange}
              />
              <input
                name="maxParticipants"
                placeholder="Máx. participantes"
                value={filtros.maxParticipants}
                onChange={handleFiltroChange}
              />
            </div>

            <div className="filtro-grupo">
              <h3>Financeiro</h3>
              <input
                name="ticket"
                placeholder="Tipo de ingresso"
                value={filtros.ticket}
                onChange={handleFiltroChange}
              />
              <input
                name="participationCost"
                placeholder="Custo de participação"
                value={filtros.participationCost}
                onChange={handleFiltroChange}
              />
            </div>

            <div className="filtro-grupo">
              <h3>Outros</h3>
              <input
                name="language"
                placeholder="Idioma"
                value={filtros.language}
                onChange={handleFiltroChange}
              />
              <input
                name="status"
                placeholder="Status"
                value={filtros.status}
                onChange={handleFiltroChange}
              />
              <input
                name="prize"
                placeholder="Premiação"
                value={filtros.prize}
                onChange={handleFiltroChange}
              />
            </div>
          </div>
        )}
      </div>

      {loading && <p className="mensagem-status">Carregando eventos...</p>}
      {erro && <p className="mensagem-erro">{erro}</p>}

      {!loading && eventos.length > 0 && (
        <div className="lista-eventos">
          {eventos.map((evento) => (
            <div key={evento.id} className="card-evento">
              <img
                src={evento.BannerURL}
                alt={evento.Title}
                className="banner-evento"
              />
              <div className="info-evento">
                <h2>{evento.Title}</h2>
                <p>{evento.Description}</p>
                <button className="btn-detalhes">Mais detalhes</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

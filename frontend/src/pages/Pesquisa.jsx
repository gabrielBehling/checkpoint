import React, { useState, useEffect } from "react";
import api from "./api"; 
import "../assets/css/PesquisaEvento.css";

export default function PesquisaEvento() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  
  const [filtros, setFiltros] = useState({
    search: "",
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
    status: "",
    prize: "",
  });

  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltros({ ...filtros, [name]: value });
  };

  
  const buscarEventos = async () => {
    setLoading(true);
    setErro(null);

    try {
      const params = {};

      
      Object.keys(filtros).forEach((key) => {
        if (filtros[key]) params[key] = filtros[key];
      });

      
      const response = await api.get("/events/", { params });
      setEventos(response.data);
    } catch (err) {
      console.error("Erro ao buscar eventos:", err);
      setErro("Não foi possível carregar os eventos.");
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    buscarEventos();
  }, []);

  return (
    <main className="pesquisa-container">
      <h1>Pesquisar Eventos</h1>

      
      <section className="filtros">
        <input
          type="text"
          name="search"
          placeholder="Buscar por nome, jogo, etc..."
          value={filtros.search}
          onChange={handleChange}
        />

        <input
          type="text"
          name="game"
          placeholder="Jogo"
          value={filtros.game}
          onChange={handleChange}
        />

        <input
          type="text"
          name="mode"
          placeholder="Modo de jogo"
          value={filtros.mode}
          onChange={handleChange}
        />

        <select
          name="isOnline"
          value={filtros.isOnline}
          onChange={handleChange}
        >
          <option value="">Online ou Presencial?</option>
          <option value="true">Online</option>
          <option value="false">Presencial</option>
        </select>

        <select
          name="status"
          value={filtros.status}
          onChange={handleChange}
        >
          <option value="">Status</option>
          <option value="Active">Ativo</option>
          <option value="Upcoming">Próximos</option>
          <option value="Finished">Finalizados</option>
        </select>

        <button onClick={buscarEventos}>Buscar</button>
      </section>

      
      <section className="resultados">
        {loading && <p>Carregando eventos...</p>}
        {erro && <p className="erro">{erro}</p>}

        {!loading && !erro && eventos.length === 0 && (
          <p>Nenhum evento encontrado.</p>
        )}

        {!loading &&
          eventos.map((evento) => (
            <div key={evento.ID} className="card-evento">
              <img
                src={evento.BannerURL}
                alt={evento.Title}
                className="banner-evento"
              />
              <h2>{evento.Title}</h2>
              <p>{evento.Description}</p>
              <p><strong>Jogo:</strong> {evento.GameID}</p>
              <p><strong>Status:</strong> {evento.Status}</p>
              <p><strong>Data de início:</strong> {formatarData(evento.StartDate)}</p>

              <button
                onClick={() =>
                  (window.location.href = `/evento?id=${evento.ID}`)
                }
              >
                Ver Detalhes
              </button>
            </div>
          ))}
      </section>
    </main>
  );
}


function formatarData(dataISO) {
  if (!dataISO) return "-";
  const data = new Date(dataISO);
  return data.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
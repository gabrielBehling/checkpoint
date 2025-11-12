import { useEffect, useState } from "react";
import api from "./api";
import { useParams, useNavigate } from "react-router-dom";
import "../assets/css/criarTime.css";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function CriarTime() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);


  const [teamName, setTeamName] = useState("");
  const [teamLogo, setTeamLogo] = useState(null);

  useEffect(() => {
    async function carregarEvento() {
      try {
        if (!eventId) {
          setErro("Evento não encontrado.");
          setLoading(false);
          return;
        }

        const eventResponse = await api.get(`/events/${eventId}/`);
        if (eventResponse.data.success) {
          setEvento(eventResponse.data.data);
        }
      } catch (err) {
        console.error("Erro ao carregar evento:", err);
        setErro("Erro ao carregar informações do evento.");
      } finally {
        setLoading(false);
      }
    }

    carregarEvento();
  }, []);

  if (loading) return <p>Carregando informações...</p>;
  if (erro) return <p style={{ color: "red" }}>{erro}</p>;
  if (!evento) return null;

  async function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) { setTeamLogo(file); }
  }

  function handleNameChange(e) {
    setTeamName(e.target.value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await api.post(`/events/${eventId}/teams/`, {
        TeamName: teamName,
        // logoFile: teamLogo
      });
      if (response.data.success) {
        alert("Time criado com sucesso!");
        navigate(`/evento/${eventId}`);
      }
    } catch (err) {
      console.error("Erro ao criar time:", err);
      alert("Erro ao criar time. Tente novamente.");
    }
  }

  return (
    <>
      <Header />
      <main className="inscricao-container">
        <h1>Inscrição no Evento: {evento.title}</h1>
        <form onSubmit={handleSubmit} className="criar-time">
          <input type="text" value={teamName} onChange={handleNameChange} placeholder="Nome do time:" />
          <input type="file" accept="image/*" onChange={handleImageChange} />
          <input type="submit" value="Criar Time" />
        </form>
      </main>
      <Footer />
    </>
  );
}

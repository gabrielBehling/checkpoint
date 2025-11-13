import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";
import "../assets/css/CadastroStyle.css";

import { useCustomModal } from "../hooks/useCustomModal";
import Header from "../components/Header"; 
import Footer from "../components/Footer";

export default function EditEventPage() {
  const { eventId } = useParams(); 
  const navigate = useNavigate();
  const { Modal, showSuccess, showError } = useCustomModal();

  const [form, setForm] = useState({
    Title: "",
    Description: "",
    GameID: "",
    Mode: "",
    StartDate: "",
    EndDate: "",
    Location: "",
    Ticket: "",
    ParticipationCost: "",
    Language: "",
    Platform: "",
    IsOnline: false,
    MaxParticipants: "",
    TeamSize: "",
    MaxTeams: "",
    Rules: "",
    Prizes: "",
    BannerURL: ""
  });

  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentBannerUrl, setCurrentBannerUrl] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/events/${eventId}`);
        const eventData = response.data;

        setForm({
          Title: eventData.title || "",
          Description: eventData.description || "",
          GameID: eventData.gameId || "",
          Mode: eventData.mode || "",
          StartDate: eventData.startDate ? new Date(eventData.startDate).toISOString().split('T')[0] : "",
          EndDate: eventData.endDate ? new Date(eventData.endDate).toISOString().split('T')[0] : "",
          Location: eventData.location || "",
          Ticket: eventData.ticket || "",
          ParticipationCost: eventData.participationCost || "",
          Language: eventData.language || "",
          Platform: eventData.platform || "",
          IsOnline: eventData.isOnline || false,
          MaxParticipants: eventData.maxParticipants || "",
          TeamSize: eventData.teamSize || "",
          MaxTeams: eventData.maxTeams || "",
          Rules: eventData.rules || "",
          Prizes: eventData.prizes || "",
          BannerURL: eventData.bannerUrl || "", // Guarda a URL existente
          CreatedBy: eventData.createdBy || "",
        });
        setCurrentBannerUrl(eventData.bannerUrl || ""); // Exibe o banner atual
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar evento:", err);
        setError("Não foi possível carregar os detalhes do evento.");
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBanner(file);
      setCurrentBannerUrl(URL.createObjectURL(file));
    } else {
      setBanner(null);
      setCurrentBannerUrl(form.BannerURL); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let dataToSubmit = form;

      if (banner) {
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => formData.append(key, value));
        formData.append("BannerFile", banner);
        formData.delete("BannerURL"); 
        dataToSubmit = formData;
      }

      const response = await api.put(`/events/${eventId}`, dataToSubmit); 

      showSuccess("Evento atualizado com sucesso!");
      console.log(response.data);

      navigate(`/eventos/${eventId}`);
    } catch (error) {
      console.error(error);
      showError("Erro ao atualizar evento.");
    }
  };

  if (loading) {
    return (
      <>
        <Modal />
        <Header />
        <main className="container" style={{ textAlign: 'center', padding: '50px' }}>
          <h1>Carregando Evento...</h1>
          <p>Por favor, aguarde.</p>
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Modal />
        <Header />
        <main className="container" style={{ textAlign: 'center', padding: '50px' }}>
          <h1>Erro: {error}</h1>
          <p>Não foi possível carregar o evento. Verifique o ID ou tente novamente.</p>
          <button onClick={() => navigate(-1)} className="btn">Voltar</button>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <div>
      <Modal />
      <Header />

      <main className="container">
        <form className="form-evento" onSubmit={handleSubmit}>
          <div className="col-esquerda">
            <label>Título do Evento</label>
            <input
              type="text"
              name="Title"
              value={form.Title}
              onChange={handleChange}
              placeholder="Digite o nome do evento"
              required
            />

            <label>Descrição</label>
            <textarea
              name="Description"
              value={form.Description}
              onChange={handleChange}
              placeholder="Descrição detalhada do evento"
            ></textarea>

            <label>Jogo (Game ID)</label>
            <input
              type="text"
              name="GameID"
              value={form.GameID}
              onChange={handleChange}
              placeholder="ID do jogo"
            />

            <label>Modo</label>
            <input
              type="text"
              name="Mode"
              value={form.Mode}
              onChange={handleChange}
              placeholder="Ex: Eliminação, Grupo, Leaderboard..."
            />

            <label>Localização</label>
            <input
              type="text"
              name="Location"
              value={form.Location}
              onChange={handleChange}
              placeholder="Digite o local"
            />

            <label>Banner do Evento</label>
            <label className="banner-upload">
              + Carregar Novo Banner
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleBannerChange}
              />
            </label>
            {currentBannerUrl && (
              <img
                src={currentBannerUrl}
                alt="banner-preview"
                className="preview-banner"
              />
            )}
          </div>

          <div className="col-direita">
            <h3>Configurações do evento</h3>

            <div className="form-group-row">
              <div className="form-field-group">
                <label>Premiações</label>
                <input
                  type="text"
                  name="Prizes"
                  value={form.Prizes}
                  onChange={handleChange}
                  placeholder="[ESCREVA]"
                />
              </div>

              <div className="form-field-group">
                <label>Idioma</label>
                <select
                  name="Language"
                  value={form.Language}
                  onChange={handleChange}
                >
                  <option value="">Selecione</option>
                  <option value="Português">Português</option>
                  <option value="Inglês">Inglês</option>
                </select>
              </div>
            </div>
            
            <label>Regras</label>
            <input
              type="text"
              name="Rules"
              value={form.Rules}
              onChange={handleChange}
              placeholder="[ESCREVA]"
            />
            
            <div className="form-group-row">
              <div className="form-field-group">
                <label>Data de Início</label>
                <input
                  type="date"
                  name="StartDate"
                  value={form.StartDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="form-field-group">
                <label>Data de Término</label>
                <input
                  type="date"
                  name="EndDate"
                  value={form.EndDate}
                  onChange={handleChange}
                  min={form.StartDate}
                />
              </div>
            </div>

            <label>Plataforma</label>
            <input
              type="text"
              name="Platform"
              value={form.Platform}
              onChange={handleChange}
              placeholder="Ex: Steam, PS5, Xbox..."
            />

            <div className="form-group-row">
              <div className="form-field-group">
                <label>Ingresso (Ticket)</label>
                <input
                  type="text"
                  name="Ticket"
                  value={form.Ticket}
                  onChange={handleChange}
                  placeholder="Preço ou descrição do ingresso"
                />
              </div>
              <div className="form-field-group">
                <label>Custo de Participação</label>
                <input
                  type="number"
                  name="ParticipationCost"
                  value={form.ParticipationCost}
                  onChange={handleChange}
                  placeholder="Valor de inscrição (se houver)"
                />
              </div>
            </div>

            <label>Evento Online?</label>
            <div className="tipo-evento">
              <label>
                <input
                  type="checkbox"
                  name="IsOnline"
                  checked={form.IsOnline}
                  onChange={handleChange}
                />{" "}
                Online
              </label>
            </div>

            <div className="form-group-row three-cols">
              <div className="form-field-group">
                <label>Máx. Participantes</label>
                <input
                  type="number"
                  name="MaxParticipants"
                  value={form.MaxParticipants}
                  onChange={handleChange}
                  placeholder="Número máximo"
                />
              </div>

              <div className="form-field-group">
                <label>Tamanho da Equipe</label>
                <input
                  type="number"
                  name="TeamSize"
                  value={form.TeamSize}
                  onChange={handleChange}
                  placeholder="Ex: 5"
                />
              </div>

              <div className="form-field-group">
                <label>Máximo de Equipes</label>
                <input
                  type="number"
                  name="MaxTeams"
                  value={form.MaxTeams}
                  onChange={handleChange}
                  placeholder="Ex: 8"
                />
              </div>
            </div>

            <button type="submit" className="btn">
              Salvar Alterações
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
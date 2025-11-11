import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "./api";
import { useAuth } from "../contexts/AuthContext"; // ✅ Importa o contexto de autenticação
import "../assets/css/CadastroStyle.css";

import Header from "./components/Header";
import Footer from "./components/Footer";

export default function Evento() {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // ✅ Pega o usuário logado e a função de logout

  const [form, setForm] = useState({
    Title: "",
    Description: "",
    GameID: "",
    ModeID: "",
    StartDate: "",
    StartHour: "",
    Location: "",
    Ticket: "",
    ParticipationCost: "",
    LanguageID: "",
    Platform: "",
    IsOnline: false,
    MaxParticipants: "",
    TeamSize: "",
    MaxTeams: "",
    Rules: "",
    Prizes: "",
    CreatedBy: "",
  });

  const [formErrors, setFormErrors] = useState({});

  const [games, setGames] = useState([]);
  const [modes, setModes] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    async function fetchAvailableFilters() {
      try {
        const response = await api.get("/events/filters");
        if (response.data.success) {
          setGames(response.data.data.games);
          setModes(response.data.data.modes);
          setLanguages(response.data.data.languages);
          setPlatforms(response.data.data.platforms);
        }
      } catch (error) {
        console.error("Erro ao buscar filtros disponíveis:", error);
      }
    }
    fetchAvailableFilters();
  }, []);

  useEffect(() => {
    if (!user || user.userRole === "Player") {
      alert("❌ Acesso negado. Apenas organizadores podem criar eventos.");
      navigate("/");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) setBanner(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormErrors({});

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (banner) data.append("BannerFile", banner);
      console.log(form);
      api
        .post("/events/", data, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((response) => {
          if (response.data.success) {
            alert("✅ Evento criado com sucesso!");
            navigate("/evento/" + response.data.data.eventId);
          }
        })
        .catch((error) => {
          if (error.response && error.response.data) {
            const apiError = error.response.data.error;

            if (apiError === "INVALID_DATE_RANGE") {
              setFormErrors({ dateRange: "Data de término deve ser após a data de início." });
              return;
            }
            if (apiError === "INVALID_HOUR_RANGE") {
              setFormErrors({ hourRange: "Hora de término deve ser após a hora de início." });
              return;
            }
          }

          console.error(error);
          alert("❌ Erro ao criar evento. Verifique o console.");
        });

      setForm({
        Title: "",
        Description: "",
        GameID: "",
        ModeID: "",
        StartDate: "",
        StartHour: "",
        Location: "",
        Ticket: "",
        ParticipationCost: "",
        LanguageID: "",
        Platform: "",
        IsOnline: false,
        MaxParticipants: "",
        TeamSize: "",
        MaxTeams: "",
        Rules: "",
        Prizes: "",
        CreatedBy: "",
      });
      setBanner(null);
    } catch (error) {
      console.error(error);
      alert("❌ Erro ao criar evento.");
    }
  };

  return (
    

    <div>
     <Header/> {/* ✅ Header padronizado */}
   
      <main className="container">
        <form className="form-evento" onSubmit={handleSubmit}>
          <div className="col-esquerda">
            <label>Título do Evento *</label>
            <input type="text" name="Title" value={form.Title} onChange={handleChange} placeholder="Digite o nome do evento" required />

            <label>Descrição *</label>
            <textarea name="Description" value={form.Description} onChange={handleChange} placeholder="Descrição detalhada do evento" required></textarea>

            <div className="form-field-group">
              <label>Jogo</label>
              <select name="GameID" value={form.GameID} onChange={handleChange}>
                <option value="">Selecione o jogo</option>
                {games.map((game) => (
                  <option key={game.GameID} value={game.GameID}>
                    {game.GameName}
                  </option>
                ))}
              </select>
            </div>

            <label>Modo</label>
            <select name="ModeID" value={form.ModeID} onChange={handleChange}>
              <option value="">Selecione o modo</option>
              {modes.map((mode) => (
                <option key={mode.ModeID} value={mode.ModeID}>
                  {mode.ModeName}
                </option>
              ))}
            </select>

            <label>Localização</label>
            <input type="text" name="Location" value={form.Location} onChange={handleChange} placeholder="Digite o local" />

            <label>Banner do Evento</label>
            <label className="banner-upload">
              +
              <input type="file" accept="image/*" hidden onChange={handleBannerChange} />
            </label>
            {banner && <img src={URL.createObjectURL(banner)} alt="banner-preview" className="preview-banner" />}
          </div>

          <div className="col-direita">
            <h3>Configurações do evento</h3>
            <div className="form-group-row">
              <div className="form-field-group">
                <label>Premiações</label>
                <input type="text" name="Prizes" value={form.Prizes} onChange={handleChange} placeholder="[ESCREVA]" />
              </div>

              <div className="form-field-group">
                <label>Idioma</label>
                <select name="LanguageID" value={form.LanguageID} onChange={handleChange}>
                  <option value="">Selecione o idioma</option>
                  {languages.map((lang) => (
                    <option key={lang.LanguageID} value={lang.LanguageID}>
                      {lang.LanguageName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label>Regras</label>
            <input type="text" name="Rules" value={form.Rules} onChange={handleChange} placeholder="[ESCREVA]" />

            <div className="form-group-row">
              <div className="form-field-group">
                <label>Data de Início *</label>
                <input type="date" name="StartDate" value={form.StartDate} onChange={handleChange} min={new Date().toISOString().split("T")[0]} required />
              </div>

              <div className="form-field-group">
                <label>Hora de Início *</label>
                <input type="time" name="StartHour" value={form.StartHour} onChange={handleChange} required />
              </div>

              <div className="form-field-group">
                <label>Data de Término</label>
                <input type="date" name="EndDate" value={form.EndDate} onChange={handleChange} min={form.StartDate} />
              </div>

              <div className="form-field-group">
                <label>Hora de Término</label>
                <input type="time" name="EndHour" value={form.EndHour} onChange={handleChange} />
              </div>
            </div>
            {formErrors.dateRange && <div className="error-message">{formErrors.dateRange}</div>}
            {formErrors.hourRange && <div className="error-message">{formErrors.hourRange}</div>}

            <label>Plataforma</label>
            <input type="text" name="Platform" value={form.Platform} onChange={handleChange} placeholder="Ex: Steam, PS5, Xbox..." list="platforms" />
            <datalist id="platforms">
              {platforms.map((plat, i) => (
                <option key={i} value={plat} />
              ))}
            </datalist>

            <div className="form-group-row">
              <div className="form-field-group">
                <label>Ingresso (Ticket)</label>
                <input type="text" name="Ticket" value={form.Ticket} onChange={handleChange} placeholder="Preço ou descrição do ingresso" />
              </div>
              <div className="form-field-group">
                <label>Custo de Participação</label>
                <input type="number" name="ParticipationCost" value={form.ParticipationCost} onChange={handleChange} placeholder="Valor de inscrição (se houver)" />
              </div>
            </div>

            <label>Evento Online? *</label>
            <div className="tipo-evento">
              <label>
                <input type="checkbox" name="IsOnline" checked={form.IsOnline} onChange={handleChange} /> Online
              </label>
            </div>

            <div className="form-group-row three-cols">
              <div className="form-field-group">
                <label>Máx. Participantes</label>
                <input type="number" name="MaxParticipants" value={form.MaxParticipants} onChange={handleChange} placeholder="Número máximo" />
              </div>

              <div className="form-field-group">
                <label>Tamanho da Equipe</label>
                <input type="number" name="TeamSize" value={form.TeamSize} onChange={handleChange} placeholder="Ex: 5" />
              </div>

              <div className="form-field-group">
                <label>Máximo de Equipes</label>
                <input type="number" name="MaxTeams" value={form.MaxTeams} onChange={handleChange} placeholder="Ex: 8" />
              </div>
            </div>

            <button type="submit" className="btn">
              Criar Evento
            </button>
          </div>
        </form>
      </main>
       <Footer/> {/* ✅ Footer padronizado */}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "./api";
import { useAuth } from "../contexts/AuthContext"; // ✅ Importa o contexto de autenticação
import "../assets/css/CadastroStyle.css";
import LOGO_IMG from "../assets/img/logo.png"; // ✅ Logo adicionada

export default function Evento() {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // ✅ Pega o usuário logado e a função de logout

  const [form, setForm] = useState({
    Title: "",
    Description: "",
    GameID: "",
    ModeID: "",
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
    CreatedBy: "",
  });

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
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (banner) data.append("BannerFile", banner);

      const response = await api.post("/events/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        alert("✅ Evento criado com sucesso!");
        navigate("/evento/" + response.data.data.eventId);
      }

      setForm({
        Title: "",
        Description: "",
        GameID: "",
        ModeID: "",
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
      {/* ✅ Cabeçalho com logo e navegação */}
      <header className="topbar">
        <div className="logo">
          <Link to="/">
            <div className="logo-circle">
              <img src={LOGO_IMG} alt="Logo do site" />
            </div>
          </Link>
        </div>

        <nav>
          <Link to="/evento">Eventos</Link>
          <a href="#">Jogos</a>
        </nav>

        {/* ✅ Se o usuário NÃO estiver logado, mostra Login e Cadastro */}
        {!user ? (
          <div className="auth">
            <Link to="/login">LOGIN</Link>
            <Link to="/cadastro" className="cadastro">
              CADASTRO
            </Link>
          </div>
        ) : (
          /* ✅ Se o usuário estiver logado, mostra nome, perfil e logout */
          <div className="auth user-auth">
            <Link to="/perfil" className="user-link">
              {user.profileURL ? (
                <img
                  src={user.profileURL}
                  alt={user.username}
                  className="nav-avatar"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    marginRight: 8,
                  }}
                />
              ) : null}
              Olá, {user.username}
            </Link>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        )}
      </header>

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
            <input
              type="text"
              name="Location"
              value={form.Location}
              onChange={handleChange}
              placeholder="Digite o local"
            />

            <label>Banner do Evento</label>
            <label className="banner-upload">
              +
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleBannerChange}
              />
            </label>
            {banner && (
              <img
                src={URL.createObjectURL(banner)}
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
              list="platforms"
            />
            <datalist id="platforms">
              {platforms.map((plat, i) => (
                <option key={i} value={plat} />
              ))}
            </datalist>

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
              Criar Evento
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

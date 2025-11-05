import React, { useState } from "react";
import api from "./api"; // seu axios configurado
import "../assets/css/CadastroStyle.css";

export default function Evento() {
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
    CreatedBy: "",
  });

  const [banner, setBanner] = useState(null);

  // Atualiza campos de texto, select e checkbox
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Upload de banner
  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) setBanner(file);
  };

  // Envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (banner) data.append("BannerFile", banner);
      console.log(data);
      
      

      const response = await api.post("/events/", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("✅ Evento criado com sucesso!");
      console.log(response.data);

      // limpa o formulário
      setForm({
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
      {/* MENU SUPERIOR */}
      <header className="topbar">
        <div className="logo">
          <a href="/">logo</a>
        </div>
        <nav>
          <a href="/evento">Eventos</a>
          <a href="#">Jogos</a>
        </nav>
        <div className="auth">
          <a href="/login">LOGIN</a>
          <a href="#" className="cadastro">
            CADASTRO
          </a>
        </div>
      </header>

      {/* FORM DE EVENTO */}
      <main className="container">
        <form className="form-evento" onSubmit={handleSubmit}>
          {/* COLUNA ESQUERDA - FOCO EM INFORMAÇÕES BÁSICAS */}
          <div className="col-esquerda">
            <label>Título do Evento</label>
            <input type="text" name="Title" value={form.Title} onChange={handleChange} placeholder="Digite o nome do evento" required />

            <label>Descrição</label>
            <textarea name="Description" value={form.Description} onChange={handleChange} placeholder="Descrição detalhada do evento"></textarea>

            <label>Jogo (Game ID)</label>
            <input type="text" name="GameID" value={form.GameID} onChange={handleChange} placeholder="ID do jogo" />

            <label>Modo</label>
            <input type="text" name="Mode" value={form.Mode} onChange={handleChange} placeholder="Ex: Eliminação, Grupo, Leaderboard..." />

            <label>Localização</label>
            <input type="text" name="Location" value={form.Location} onChange={handleChange} placeholder="Digite o local" />

            <label>Banner do Evento</label>
            <label className="banner-upload">
              +
              <input type="file" accept="image/*" hidden onChange={handleBannerChange} />
            </label>
            {banner && <img src={URL.createObjectURL(banner)} alt="banner-preview" className="preview-banner" />}
          </div>

          {/* COLUNA DIREITA - FOCO EM CONFIGURAÇÕES E DETALHES */}
          <div className="col-direita">
            <h3>Configurações do evento</h3>

            {/* Linha 1: Premiações e Idioma */}
            <div className="form-group-row">
              <div className="form-field-group">
                <label>Premiações</label>
                <input type="text" name="Prizes" value={form.Prizes} onChange={handleChange} placeholder="[ESCREVA]" />
              </div>

              <div className="form-field-group">
                <label>Idioma</label>
                <select name="Language" value={form.Language} onChange={handleChange}>
                  <option value="">Selecione</option>
                  <option value="Português">Português</option>
                  <option value="Inglês">Inglês</option>
                </select>
              </div>
            </div>

            <label>Regras</label>
            <input type="text" name="Rules" value={form.Rules} onChange={handleChange} placeholder="[ESCREVA]" />

            {/* Linha 2: Datas */}
            <div className="form-group-row">
              <div className="form-field-group">
                <label>Data de Início</label>
                <input type="date" name="StartDate" value={form.StartDate} onChange={handleChange} min={new Date().toISOString().split("T")[0]} />
              </div>

              <div className="form-field-group">
                <label>Data de Término</label>
                <input type="date" name="EndDate" value={form.EndDate} onChange={handleChange} min={form.StartDate} />
              </div>
            </div>

            <label>Plataforma</label>
            <input type="text" name="Platform" value={form.Platform} onChange={handleChange} placeholder="Ex: Steam, PS5, Xbox..." />

            {/* Linha 3: Ticket e Custo */}
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

            <label>Evento Online?</label>
            <div className="tipo-evento">
              <label>
                <input type="checkbox" name="IsOnline" checked={form.IsOnline} onChange={handleChange} /> Online
              </label>
            </div>

            {/* Linha 4: Participantes, Tam. Equipe e Máximo de Equipes */}
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
    </div>
  );
}

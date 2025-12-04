import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";
import "../assets/css/CadastroStyle.css";

import { useCustomModal } from "../hooks/useCustomModal";
import Header from "../components/Header"; 
import Footer from "../components/Footer";

// --- FUNÇÕES DE FORMATAÇÃO ---
const formatDataParaInput = (dataISO) => {
  if (!dataISO) return "";
  if (typeof dataISO === 'string') return dataISO.split('T')[0];
  const date = new Date(dataISO);
  const ano = date.getUTCFullYear();
  const mes = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(date.getUTCDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const formatHoraParaInput = (horaISO) => {
  if (!horaISO) return "";
  const str = horaISO.toString();
  if (str.includes('T')) return str.split('T')[1].slice(0, 5);
  return str.slice(0, 5);
};

export default function EditEventPage() {
  const { eventId } = useParams(); 
  const navigate = useNavigate();
  const { Modal, showSuccess, showError } = useCustomModal();

  const [form, setForm] = useState({
    Title: "",
    Description: "",
    GameID: "",
    ModeID: "",
    StartDate: "",
    StartHour: "",
    EndDate: "",
    EndHour: "",
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
    BannerURL: ""
  });

  const [originalData, setOriginalData] = useState({});
  const [banner, setBanner] = useState(null);
  const [currentBannerUrl, setCurrentBannerUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/events/${eventId}`);
        const data = response.data.data || response.data;

        const formattedData = {
          Title: data.title || "",
          Description: data.description || "",
          GameID: data.gameId || "", 
          ModeID: data.modeId || "", 
          
          StartDate: formatDataParaInput(data.startDate),
          StartHour: formatHoraParaInput(data.startHour || "00:00"),
          
          EndDate: formatDataParaInput(data.endDate),
          EndHour: formatHoraParaInput(data.endHour || ""),

          Location: data.location || "",
          Ticket: data.ticket || "",
          ParticipationCost: data.participationCost || "",
          LanguageID: data.languageId || "", 
          
          Platform: data.platform || "",
          IsOnline: data.isOnline || false,
          MaxParticipants: data.maxParticipants || "",
          TeamSize: data.teamSize || "",
          MaxTeams: data.maxTeams || "",
          Rules: data.rules || "",
          Prizes: data.prizes || "",
          BannerURL: data.bannerUrl || "",
        };

        setForm(formattedData);
        setOriginalData(formattedData);

        if (data.bannerUrl) {
           const baseUrl = "http://checkpoint.localhost/api/events"; 
           const fullUrl = data.bannerUrl.startsWith('http') ? data.bannerUrl : `${baseUrl}${data.bannerUrl}`;
           setCurrentBannerUrl(fullUrl);
        }

        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar evento:", err);
        setError("Não foi possível carregar os dados.");
        setLoading(false);
      }
    };

    if (eventId) fetchEvent();
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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      
      Object.entries(form).forEach(([key, value]) => {
        if (value === "" || value === null || value === undefined) return;

        const isDateOrTimeField = ["StartDate", "StartHour", "EndDate", "EndHour"].includes(key);
        
        if (isDateOrTimeField && value === originalData[key]) {
            return;
        }

        let valueToSend = value;
        if ((key === 'StartHour' || key === 'EndHour') && typeof value === 'string') {
             if (value.length > 5) valueToSend = value.substring(0, 5);
        }

        formData.append(key, valueToSend);
      });

      if (banner) {
        formData.append("BannerFile", banner);
      }

      const response = await api.put(`/events/${eventId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        showSuccess("Evento atualizado com sucesso!");
        setTimeout(() => navigate(`/evento/${eventId}`), 1500);
      } else {
        showError("Erro: " + response.data.message);
      }

    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.error || "Erro ao salvar alterações.";
      showError(msg);
    }
  };

  if (loading) {
    return (
      <>
        <Modal />
        <Header />
        <main className="container loading-container">
          <h1>Carregando dados...</h1>
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
        <main className="container error-container">
          <h1>Ocorreu um erro</h1>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="btn btn-cancel">Voltar</button>
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
        <h2 className="page-title">Editar Evento</h2>
        
        <form className="form-evento" onSubmit={handleSubmit}>
          
          <div className="col-esquerda">
            <label>Título do Evento</label>
            <input type="text" name="Title" value={form.Title} onChange={handleChange} required />

            <label>Descrição</label>
            <textarea name="Description" value={form.Description} onChange={handleChange} rows="5"></textarea>

            <label>Jogo (Game ID)</label>
            <input type="number" name="GameID" value={form.GameID} onChange={handleChange} placeholder="ID" />

            <label>Modo (Mode ID)</label>
            <input type="number" name="ModeID" value={form.ModeID} onChange={handleChange} placeholder="ID" />

            <label>Localização</label>
            <input type="text" name="Location" value={form.Location} onChange={handleChange} disabled={form.IsOnline} />

            <label>Banner</label>
            {currentBannerUrl && (
                <img src={currentBannerUrl} alt="Preview" className="preview-banner" />
            )}
            
            <label className="banner-upload-btn">
               Alterar Imagem
               <input type="file" accept="image/*" onChange={handleBannerChange} hidden />
            </label>
          </div>

          <div className="col-direita">
            <h3>Datas e Horários</h3>

            <div className="form-group-row">
              <div className="form-field-group">
                <label>Data Início</label>
                <input 
                    type="date" 
                    name="StartDate" 
                    value={form.StartDate} 
                    onChange={handleChange} 
                    required 
                />
              </div>
              <div className="form-field-group">
                <label>Hora Início</label>
                <input 
                    type="time" 
                    name="StartHour" 
                    value={form.StartHour} 
                    onChange={handleChange} 
                    required 
                />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-field-group">
                <label>Data Término</label>
                <input 
                    type="date" 
                    name="EndDate" 
                    value={form.EndDate} 
                    onChange={handleChange} 
                />
              </div>
              <div className="form-field-group">
                <label>Hora Fim</label>
                <input 
                    type="time" 
                    name="EndHour" 
                    value={form.EndHour} 
                    onChange={handleChange} 
                />
              </div>
            </div>

            <h3>Configurações</h3>
            <label>Premiações</label>
            <input type="text" name="Prizes" value={form.Prizes} onChange={handleChange} />

            <label>Regras</label>
            <textarea name="Rules" value={form.Rules} onChange={handleChange} />

            <label>Plataforma</label>
            <input type="text" name="Platform" value={form.Platform} onChange={handleChange} />

            <div className="form-group-row">
              <div className="form-field-group">
                <label>Valor Ingresso</label>
                <input type="number" step="0.01" name="Ticket" value={form.Ticket} onChange={handleChange} />
              </div>
              <div className="form-field-group">
                <label>Custo Inscrição</label>
                <input type="number" step="0.01" name="ParticipationCost" value={form.ParticipationCost} onChange={handleChange} />
              </div>
            </div>

            <div className="checkbox-wrapper">
               <label className="checkbox-label">
                  <input type="checkbox" name="IsOnline" checked={form.IsOnline} onChange={handleChange} />
                  <strong>Evento Online?</strong>
               </label>
            </div>

            <div className="form-group-row three-cols">
              <div className="form-field-group">
                <label>Máx. Players</label>
                <input type="number" name="MaxParticipants" value={form.MaxParticipants} onChange={handleChange} />
              </div>
              <div className="form-field-group">
                <label>Tam. Time</label>
                <input type="number" name="TeamSize" value={form.TeamSize} onChange={handleChange} />
              </div>
              <div className="form-field-group">
                <label>Máx. Times</label>
                <input type="number" name="MaxTeams" value={form.MaxTeams} onChange={handleChange} />
              </div>
            </div>

            <div className="form-field-group mt-10">
               <label>Idioma</label>
               <select name="LanguageID" value={form.LanguageID} onChange={handleChange}>
                  <option value="">Selecione</option>
                  <option value="1">Português</option> 
                  <option value="2">Inglês</option>
                  <option value="3">Espanhol</option>
               </select>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-cancel" onClick={() => navigate(-1)}>Cancelar</button>
              <button type="submit" className="btn">Salvar Alterações</button>
            </div>

          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
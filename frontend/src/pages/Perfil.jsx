import { React, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "./api";
import "../assets/css/style-perfil.css";

export default function PerfilPage() {
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    userRole: "",
    participacoes: [],
    profileImage: null,
    bannerImage: null, // imagem do banner
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);

  useEffect(() => {
    api
      .get("/auth/me/")
      .then((response) => {
        setUserData(response.data.data);
        if (response.data.profileImage) setPreviewImage(response.data.profileImage);
        if (response.data.bannerImage) setPreviewBanner(response.data.bannerImage);
      })
      .catch((error) => {
        console.error("Erro ao buscar dados do usuário:", error);
      });
  }, []);

  // ====== TROCA FOTO DE PERFIL ======
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);

      const formData = new FormData();
      formData.append("profileImage", file);

      api
        .post("/auth/upload-profile-image/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => {
          setUserData((prev) => ({ ...prev, profileImage: res.data.imageUrl }));
        })
        .catch((err) => {
          console.error("Erro ao enviar imagem de perfil:", err);
        });
    }
  };

  // ====== TROCA BANNER ======
  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreviewBanner(previewUrl);

      const formData = new FormData();
      formData.append("bannerImage", file);

      api
        .post("/auth/upload-banner-image/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => {
          setUserData((prev) => ({ ...prev, bannerImage: res.data.bannerUrl }));
        })
        .catch((err) => {
          console.error("Erro ao enviar banner:", err);
        });
    }
  };

  return (
    <div className="perfil-container">
      <header>
        <div className="logo">
          <a href="/">Logo</a>
        </div>
        <nav>
          <a href="#">Eventos</a>
          <a href="#">Jogos</a>
        </nav>
      </header>

      {/* ====== BANNER PERFIL ====== */}
      <section className="perfil-banner">
        <div
          className="background-img"
          style={{
            backgroundImage: previewBanner
              ? `url(${previewBanner})`
              : "linear-gradient(135deg, #241D3B, #100C1F)",
          }}
        >
          {/* Botão para alterar banner */}
          <label htmlFor="upload-banner" className="edit-banner-btn">
            Alterar Banner
            <input
              id="upload-banner"
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              style={{ display: "none" }}
            />
          </label>

          <div className="perfil-info">
            <label htmlFor="upload-image" className="foto-perfil">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Foto de perfil"
                  className="perfil-img"
                />
              ) : (
                <span>+</span>
              )}
              <input
                id="upload-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </label>

            <div className="status">
              <span className="dot"></span> status: online
            </div>

            <div className="perfil-buttons">
              <button>{userData.username || "Usuário"}</button>
              <Link to="/" className="btn">
                Histórico
              </Link>
              <Link to="/chat">
                <button type="submit" className="btn">
                  Chat
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====== CONTEÚDO PRINCIPAL ====== */}
      <main>
        <aside className="info-box">
          <h3>Informações:</h3>
          <p>
            <strong>Nome:</strong> {userData.username}
          </p>
          <p>
            <strong>E-mail:</strong> {userData.email}
          </p>
          <p>
            <strong>Tipo da conta:</strong> {userData.userRole}
          </p>
          <button className="secondary">Trocar tipo da conta</button>

          <h3>Configurações</h3>
          <p>
            <strong>Idioma:</strong> Português BR
          </p>
          <p>
            <strong>Notificações:</strong> ativadas
          </p>
          <button className="secondary">Trocar notificações</button>

          <div className="danger">
            <Link to="/logout">Sair</Link>
          </div>
        </aside>

        <section className="participacoes">
          <h3>Participações recentes</h3>
          {userData.eventsHistory?.length > 0 ? (
            <div className="grid">
              {userData.eventsHistory.map((evento, index) => (
                <div className="card" key={index}>
                  <h4>{evento.title}</h4>
                  <p>{new Date(evento.startDate)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="sem-participacoes">
              <p>Você ainda não participou de nenhum evento.</p>
            </div>
          )}
        </section>
      </main>

      <footer>
        <a href="#">Ajuda</a>
        <a href="#">Contato</a>
        <a href="#">Sobre Nós</a>
      </footer>
    </div>
  );
}

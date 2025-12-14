import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "../assets/css/login.css";
import api from "./api";
import LOGO_IMG from "../assets/img/imagem.png";

import { useAuth } from "../contexts/AuthContext";
import { useCustomModal } from "../hooks/useCustomModal";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Novo estado para controlar a visibilidade da senha
  const [showPassword, setShowPassword] = useState(false);

  const { checkAuth } = useAuth();
  const { Modal, showError } = useCustomModal();

  const from = location.state?.from?.pathname || "/";

  function handleEmailChange(e) {
    setEmail(e.target.value);
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value);
  }

  // Função para alternar o olho mágico
  function togglePasswordVisibility() {
    setShowPassword(!showPassword);
  }

  function handleSubmit(e) {
    e.preventDefault();
    api
      .post("/auth/login/", {
        email: email,
        password: password,
      })
      .then((res) => {
        if (res.data.success) {
          checkAuth();
          navigate(from, { replace: true });
        }
      })
      .catch((err) => {
        if (err.response && err.response.data.error === "INVALID_CREDENTIALS") {
          showError("E-mail ou senha inválidos. Por favor, tente novamente.");
        } else {
          console.error("Erro ao fazer login:", err);
          showError("Ocorreu um erro ao tentar fazer login.");
        }
      });
  }

  return (
    <>
      <Modal />
      <Header />
      <main className="container">
        <section className="form-auth form-login">
          {/* Logo + Título lado a lado */}
          <div className="logo-title">
            <img src={LOGO_IMG} alt="Logo Checkpoint" className="logo-img" />
            <h1>LOGIN</h1>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Campo E-mail */}
            <label htmlFor="email-login">E-mail</label>
            <input type="email" id="email-login" placeholder="Insira seu endereço de e-mail..." value={email} onChange={handleEmailChange} required />

            {/* Campo Senha com Olho Mágico */}
            <label htmlFor="senha-login">Senha</label>
            <div className="password-input-wrapper">
              <input
                // Alterna entre text e password baseado no estado
                type={showPassword ? "text" : "password"}
                id="senha-login"
                placeholder="Insira sua senha..."
                value={password}
                onChange={handlePasswordChange}
                required
              />

              {/* Botão do Olho */}
              <button type="button" className="password-toggle-btn" onClick={togglePasswordVisibility} aria-label="Alternar visibilidade da senha">
                {showPassword ? (
                  // Ícone de Olho Aberto (SVG)
                  <svg xmlns="https://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  // Ícone de Olho Fechado (SVG)
                  <svg xmlns="https://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </button>
            </div>

            <button type="submit" className="btn" style={{ marginTop: "30px" }}>
              ENTRAR
            </button>

            <div className="link-info" style={{ marginTop: "50px" }}>
              Ainda não possui uma conta?{" "}
              <Link to="/cadastro" state={{ from: location.state?.from }}>
                Cadastre-se
              </Link>
            </div>

            <div className="link-info" style={{ marginTop: "50px" }}>
              Esqueceu a senha? faça uma nova.
              <br />
              <Link to="/request-password-reset">Resetar senha</Link>
            </div>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}

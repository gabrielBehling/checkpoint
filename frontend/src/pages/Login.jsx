import { React, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../assets/css/login.css"; // O CSS que você forneceu
import api from "./api";
import LOGO_IMG from "../assets/img/imagem.png";

import { useAuth } from "../contexts/AuthContext";
import { useCustomModal } from "../hooks/useCustomModal";

import Header from "../components/Header";
import Footer from "../components/Footer";


export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { checkAuth } = useAuth();
  const { Modal, showError } = useCustomModal();

  function handleEmailChange(e) {
    setEmail(e.target.value);
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value);
  }

  function handleSubmit(e) {
    e.preventDefault();
    api.post("/auth/login/", {
      email: email,
      password: password
    })
      .then((res) => {
        if (res.data.success) {
          checkAuth();
          navigate("/");
        }
      })                                     
      .catch((err) => {
        if (err.response && err.response.data.error === "INVALID_CREDENTIALS") {
          showError("E-mail ou senha inválidos. Por favor, tente novamente.");
        } else {
          // Tratar outros erros (ex: rede, servidor)
          console.error("Erro ao fazer login:", err);
          showError("Ocorreu um erro ao tentar fazer login.");
        }
      });
  };

  return (
    <>
      <Modal />
      <Header />
      <main className="container">
        <section className="form-auth form-login">
          {/* Logo + Título lado a lado */}
          <div className="logo-title">
            <img
              src={LOGO_IMG}
              alt="Logo Checkpoint"
              className="logo-img"
            />
            <h1>LOGIN</h1>
          </div>


          {/* O formulário agora utiliza o onSubmit para chamar handleSubmit */}
          <form onSubmit={handleSubmit}>

            {/* Campo E-mail */}
            <label htmlFor="email-login">E-mail</label>
            <input
              type="email"
              id="email-login"
              placeholder="Insira seu endereço de e-mail..."
              value={email}
              onChange={handleEmailChange}
              required
            />

            {/* Campo Senha */}
            <label htmlFor="senha-login">Senha</label>
            <input
              type="password" // Mudei para 'password' para esconder a digitação
              id="senha-login"
              placeholder="Insira sua senha..."
              value={password}
              onChange={handlePasswordChange}
              required
            />

            {/* Botão de Submissão */}
            <button type="submit" className="btn" style={{ marginTop: '30px' }}>ENTRAR</button>

            <div className="link-info" style={{ marginTop: '50px' }}>
              Ainda não possui uma conta? <Link to="/cadastro">Cadastre-se</Link>
            </div>

            <div className="link-info" style={{ marginTop: '50px' }}>
              Esqueceu a senha? faça uma nova.<br /><Link to="/request-password-reset">Resetar senha</Link>
            </div>

          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
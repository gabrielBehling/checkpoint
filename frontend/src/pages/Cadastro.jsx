import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "../assets/css/cadastro.css";
import api from "./api";
import { useAuth } from "../contexts/AuthContext";
import { useCustomModal } from "../hooks/useCustomModal";
import LOGO_IMG from "../assets/img/imagem.png";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function CadastroPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuth();
  
  const from = location.state?.from?.pathname || "/";

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [type, setType] = useState("Player");
  const [profileFile, setProfileFile] = useState(null);

  // Olho mágico
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [confirmationError, setConfirmationError] = useState("");
  const { Modal, showSuccess, showError } = useCustomModal();

  function togglePasswordVisibility() {
    setShowPassword(!showPassword);
  }

  function toggleConfirmPasswordVisibility() {
    setShowConfirmPassword(!showConfirmPassword);
  }

  function handleSubmit(e) {
    e.preventDefault();

    setEmailError("");
    setUsernameError("");

    if (password !== passwordConfirm) {
      setConfirmationError("As senhas não coincidem.");
      return;
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("username", nome);
    formData.append("password", password);
    formData.append("passwordConfirm", passwordConfirm);
    formData.append("userRole", type);
    if (profileFile) formData.append("ProfileFile", profileFile);

    api
      .post("/auth/register", formData)
      .then((response) => {
        if (response.data.success) {
          showSuccess("Cadastro realizado com sucesso!");
          checkAuth();
          navigate(from, { replace: true });
        }
      })
      .catch((error) => {
        if (error.response?.data?.error === "USERNAME_EXISTS") {
          setUsernameError("Nome de usuário já existe.");
          return;
        }
        if (error.response?.data?.error === "EMAIL_EXISTS") {
          setEmailError("E-mail já cadastrado.");
          return;
        }

        console.error("Erro no cadastro:", error);
        showError("Erro ao cadastrar. Verifique o console.");
      });
  }

  return (
    <>
      <Modal />
      <Header />
      <main className="container">

        <section className="form-auth form-cadastro">

          <div className="logo-title">
            <img src={LOGO_IMG} alt="Logo Checkpoint" className="logo-img" />
            <h1>CADASTRE-SE</h1>
          </div>

          <form onSubmit={handleSubmit}>
            
            <label htmlFor="email-cadastro">E-mail</label>
            <input
              type="email"
              id="email-cadastro"
              placeholder="Insira seu endereço de e-mail..."
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {emailError && <div className="error-message">{emailError}</div>}

            <label htmlFor="nome-usuario">Nome de Usuário</label>
            <input
              type="text"
              id="nome-usuario"
              placeholder="Insira seu nome de usuário..."
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            {usernameError && <div className="error-message">{usernameError}</div>}

            <label htmlFor="profile-file">Foto de Perfil (opcional)</label>
            <input
              type="file"
              id="profile-file"
              accept="image/*"
              onChange={(e) => setProfileFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="profile-file">Escolher Imagem</label>
            {profileFile && <div className="file-name">{profileFile.name}</div>}

            {/* SENHA */}
            <label htmlFor="senha-cadastro">Senha</label>
            <div className="password-input-wrapper1">
              <input
                type={showPassword ? "text" : "password"}
                id="senha-cadastro"
                placeholder="Insira sua senha..."
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                name="password"
                pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&#\.]{8,}$"
                title="A senha deve conter pelo menos uma letra, um número e ter no mínimo 8 caracteres."
              />

              {/* OLHO MÁGICO (igual login) */}
              <button
                type="button"
                className="password-toggle-btn1"
                onClick={togglePasswordVisibility}
                aria-label="Alternar visibilidade da senha"
              >
                {showPassword ? (
                  /* Olho aberto */
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                ) : (
                  /* Olho fechado */
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                )}
              </button>
            </div>

            {/* CONFIRMAR SENHA */}
            <label htmlFor="confirmar-senha">Confirmar Senha</label>
            <div className="password-input-wrapper1">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmar-senha"
                placeholder="Insira a senha novamente..."
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />

              {/* OLHO MÁGICO 2 */}
              <button
                type="button"
                className="password-toggle-btn2"
                onClick={toggleConfirmPasswordVisibility}
                aria-label="Alternar visibilidade da confirmação de senha"
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                )}
              </button>
            </div>
            {confirmationError && (
              <div className="error-message">{confirmationError}</div>
            )}

            {/* TIPO DE CONTA */}
            <div className="type-selection">
              <p>Tipo de Conta:</p>
              <label>
                <input type="radio" value="Organizer" checked={type === "Organizer"} onChange={(e) => setType(e.target.value)} /> ORGANIZADOR
              </label>
              <label>
                <input type="radio" value="Player" checked={type === "Player"} onChange={(e) => setType(e.target.value)} /> JOGADOR
              </label>
              <label>
                <input type="radio" value="Visitor" checked={type === "Visitor"} onChange={(e) => setType(e.target.value)} /> VISITANTE
              </label>
            </div>

            <button type="submit" className="btn" style={{ marginTop: "20px" }} disabled={!email || !nome || !password || !passwordConfirm}>
              CADASTRAR
            </button>

            <div className="auth-bottom-link">
              Já possui uma conta? <Link to="/login" state={{ from: location.state?.from }}>Log-in</Link>
            </div>
          </form>
        </section>
      </main>

      <Footer />
    </>
  );
}

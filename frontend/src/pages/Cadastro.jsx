import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../assets/css/cadastro.css";
import api from "./api";
import { useAuth } from "../contexts/AuthContext";
import LOGO_IMG from "../assets/img/imagem.png"; // Importa o logo

export default function CadastroPage() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [type, setType] = useState("Player");
  const [profileFile, setProfileFile] = useState(null);
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    setEmailError("");
    setUsernameError("");

    if (password !== passwordConfirm) {
      alert("As senhas não coincidem!");
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
          alert("Cadastro realizado com sucesso!");
          checkAuth();
          navigate("/");
        }
      })
      .catch((error) => {
        if (error.response && error.response.data && error.response.data.error) {
          if(error.response.data.error === "USERNAME_EXISTS"){
            setUsernameError("Nome de usuário já existe.");
            return;
          }
          if(error.response.data.error === "EMAIL_EXISTS"){
            setEmailError("E-mail já cadastrado.");
            return;
          }
        }

        console.error("Erro no cadastro:", error);
        alert("Erro ao cadastrar. Verifique o console.");
      });
  }

  return (
    <main className="container">
      <section className="form-auth form-cadastro">
        {/* Logo + Título lado a lado */}
        <div className="logo-title">
          <img src={LOGO_IMG} alt="Logo Checkpoint" className="logo-img" />
          <h1>CADASTRE-SE</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email-cadastro">E-mail</label>
          <input type="email" id="email-cadastro" placeholder="Insira seu endereço de e-mail..." required value={email} onChange={(e) => setEmail(e.target.value)} name="email" />
          {emailError && <div className="error-message">{emailError}</div>}

          <label htmlFor="nome-usuario">Nome de Usuário</label>
          <input type="text" id="nome-usuario" placeholder="Insira seu nome de usuário..." required value={nome} onChange={(e) => setNome(e.target.value)} name="username" />
          {usernameError && <div className="error-message">{usernameError}</div>}

          <label htmlFor="profile-file">Foto de Perfil (opcional)</label>
          <input
            type="file"
            id="profile-file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files && e.target.files[0];
              setProfileFile(file);
            }}
          />
          <label htmlFor="profile-file">Escolher Imagem</label>
          {profileFile && <div className="file-name">{profileFile.name}</div>}

          <label htmlFor="senha-cadastro">Senha</label>
          <input type="password" id="senha-cadastro" placeholder="Insira sua senha..." required value={password} onChange={(e) => setPassword(e.target.value)} name="password" pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&#\.]{8,}$" title="A senha deve conter pelo menos uma letra, um número e ter no mínimo 8 caracteres." />
          <small style={{ color: "#666", fontSize: "0.8em", marginTop: "4px" }}>
            A senha deve conter pelo menos:
            <br />
            - 8 caracteres
            <br />
            - Uma letra
            <br />- Um número
          </small>

          <label htmlFor="confirmar-senha">Confirmar Senha</label>
          <input type="password" id="confirmar-senha" placeholder="Insira a senha novamente..." required value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} name="confirmarSenha" />

          <div className="type-selection">
            <p>Tipo de Conta:</p>
            <label>
              <input type="radio" name="tipo-conta" value="Organizer" checked={type === "Organizer"} onChange={(e) => setType(e.target.value)} /> ORGANIZADOR
            </label>
            <label>
              <input type="radio" name="tipo-conta" value="Player" checked={type === "Player"} onChange={(e) => setType(e.target.value)} /> JOGADOR
            </label>
            <label>
              <input type="radio" name="tipo-conta" value="Visitor" checked={type === "Visitor"} onChange={(e) => setType(e.target.value)} /> VISITANTE
            </label>
          </div>

          <button type="submit" className="btn" style={{ marginTop: "20px" }} disabled={!email || !nome || !password || !passwordConfirm}>
            CADASTRAR
          </button>

          <div className="auth-bottom-link">
            Já possui uma conta? <Link to="/login">Log-in</Link>
          </div>
        </form>
      </section>
    </main>
  );
}

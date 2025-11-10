import { React, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../assets/css/login.css"; // O CSS que você forneceu
import api from "./api";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { checkAuth } = useAuth();

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
        if(err.response && err.response.status === 401) {
          alert("Credenciais inválidas");
        } else {
            // Tratar outros erros (ex: rede, servidor)
            console.error("Erro ao fazer login:", err);
            alert("Ocorreu um erro ao tentar fazer login.");
        }
    });
  };

  return (
    // A estrutura agora espelha o <body> do seu HTML: <main class="container">
    <main className="container">
      <section className="form-auth form-login">
        
        <div className="logo-auth">
            <div className="circle"></div>
            <div className="text">CHECKPOINT</div>
        </div>
        
        <h1>LOG-IN</h1>
        
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

            <div className="link-info" style={{marginTop: '50px'}}>
               Esqueceu a senha? faça uma nova.<br/><Link to="/request-password-reset">Resetar senha</Link>
            </div>
            
        </form>
      </section>
    </main>
  );
}
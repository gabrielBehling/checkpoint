import { React, useState, useEffect } from "react";
// Importa 'useSearchParams' para ler o token da URL
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import "../assets/css/login.css"; // Reutilizando o MESMO CSS
import api from "./api"; // Reutilizando sua API

export default function ConfirmResetPasswordPage() {
  const navigate = useNavigate();
  // Hook para ler os parâmetros da URL
  const [searchParams] = useSearchParams();

  // Estados para os campos e feedback
  const [token, setToken] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Efeito para extrair o token da URL assim que a página carregar
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
    } else {
      // Se não houver token, exibe um erro
      setError("Token de redefinição inválido ou não fornecido.");
      // Opcional: redirecionar para o login após um tempo
      setTimeout(() => navigate("/login"), 4000);
    }
  }, [searchParams, navigate]); // Dependências do efeito

  function handlePasswordChange(e) {
    setPassword(e.target.value);
  }

  function handleConfirmPasswordChange(e) {
    setConfirmPassword(e.target.value);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    // 1. Validação local: As senhas coincidem?
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return; // Para a execução
    }

    // 2. Validação: O token foi carregado?
    if (!token) {
      setError("Token de redefinição inválido.");
      setLoading(false);
      return;
    }

    // 3. Enviar para a API
    // (Ajuste o endpoint e o payload conforme sua API)
    api
      .post("/auth/reset-password", {
        token: token,
        newPassword: password,
      })
      .then((res) => {
        setLoading(false);
        setMessage("Senha redefinida com sucesso! Redirecionando para o login...");

        // Limpa os campos
        setPassword("");
        setConfirmPassword("");

        // Redireciona para o login após 3 segundos
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      })
      .catch((err) => {
        setLoading(false);
        console.error("Erro ao redefinir senha:", err);
        if (err.response && err.response.error === "INVALID_RESET_TOKEN") {
          setError("Link de redefinição inválido ou expirado. Por favor, solicite um novo.");
        } else {
          setError("Ocorreu um erro no servidor. Tente novamente.");
        }
      });
  }

  return (
    <main className="container">
      {/* Reutiliza o layout .form-auth do seu login.css */}
      <section className="form-auth form-new-password">
        <div className="logo-auth">
          <div className="circle"></div>
          <div className="text">CHECKPOINT</div>
        </div>

        <h1>CRIAR NOVA SENHA</h1>

        <form onSubmit={handleSubmit}>
          {/* Campo Nova Senha */}
          <label htmlFor="senha-new">Nova Senha</label>
          <input type="password" id="senha-new" placeholder="Insira sua nova senha..." value={password} onChange={handlePasswordChange} required />

          {/* Campo Confirmar Senha */}
          <label htmlFor="senha-confirm">Confirmar Senha</label>
          <input type="password" id="senha-confirm" placeholder="Confirme sua nova senha..." value={confirmPassword} onChange={handleConfirmPasswordChange} required />

          {/* Mensagem de Feedback (Sucesso) */}
          {message && <div className="feedback-message success">{message}</div>}

          {/* Mensagem de Feedback (Erro) */}
          {error && <div className="feedback-message error">{error}</div>}

          {/* Botão de Submissão */}
          <button
            type="submit"
            className="btn"
            style={{ marginTop: "30px" }}
            disabled={loading || !token} // Desabilita se estiver carregando ou se não houver token
          >
            {loading ? "SALVANDO..." : "REDEFINIR SENHA"}
          </button>

          <div className="link-info" style={{ marginTop: "50px" }}>
            <Link to="/login">Voltar para o Log-in</Link>
          </div>
        </form>
      </section>
    </main>
  );
}

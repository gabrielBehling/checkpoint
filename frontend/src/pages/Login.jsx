import React from "react";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";
export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // aqui você pode colocar validação/autenticação
    navigate("/"); // redireciona para a home
  };

  return (
    <>
      {/* MENU SUPERIOR */}
      <header className="topbar">
        <div className="logo">
          <Link to="/">logo</Link>
        </div>
        <nav>
          <Link to="/evento">Eventos</Link>
          <Link to="/jogos">Jogos</Link>
        </nav>
        <div className="auth">
          <Link to="/login">LOGIN</Link>
          <Link to="/cadastro" className="cadastro">
            CADASTRO
          </Link>
        </div>
      </header>

      {/* FORM DE LOGIN */}
      <main className="container">
        <section className="form-login">
          <img
            src="./logo.png"
            alt="CheckPoint Logo"
            className="logo-central"
          />
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email" required />
            <input type="password" placeholder="Senha" required />

            <label className="remember">
              <input type="checkbox" /> Lembrar de mim
            </label>

            <button type="submit" className="btn">
              Entrar
            </button>
            <style></style>
          </form>
        </section>
      </main>
    </>
  );
}

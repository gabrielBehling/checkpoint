import React from "react";
import { useNavigate, Link } from "react-router-dom";

export default function CadastroPage() {
  const navigate = useNavigate();

  const handleCadastro = (e) => {
    e.preventDefault();
    // aqui você pode colocar lógica de validação / envio de dados
    navigate("/"); // redireciona para home após cadastro
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
          <Link to="/cadastro" className="cadastro active">
            CADASTRO
          </Link>
        </div>
      </header>

      {/* FORM DE CADASTRO */}
      <main className="container">
        <section className="form-login">
          <img
            src="./logo.png"
            alt="CheckPoint Logo"
            className="logo-central"
          />
          <form onSubmit={handleCadastro}>
            <input type="text" placeholder="Username" required />
            <input type="email" placeholder="Email" required />
            <input type="password" placeholder="Senha" required />
            <input type="password" placeholder="Confirmar Senha" required />

            <select name="TipoDaConta" required>
              <option value="Player">Player</option>
              <option value="Organizer">Organizador</option>
              <option value="Visitor">Visitante</option>
            </select>

            <label className="remember">
              <input type="checkbox" /> Lembrar de mim
            </label>

            <button type="submit" className="btn">
              Cadastrar
            </button>
          </form>
        </section>
      </main>
    </>
  );
}

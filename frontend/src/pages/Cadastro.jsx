import {React, useState} from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "./api"
import { useState } from "react";
export default function CadastroPage() {
  const navigate = useNavigate();
  const [nome, setnome] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  }
  function handleEmailChange(e) {
    setEmail(e.target.value)
  }
  function handlePasswordChange(e) {
    setPassword(e.target.value)
    }
  function handlePasswordConfirmChange(e){
    setPasswordConfirm(e.target.value)
  }
  function handleSubmit(e) {
    e.preventDefault();
    if(passwordConfirm != password){
    alert("Tá errado")
    return
    }
    api.post("/cadastro", {
      username: nome,
      email: email,
      password: password,
      userRole: "TipoDaConta" 
    })
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
          <form onSubmit={handleSubmit}>
            <input type="text" name="Username" value={nome} placeholder="Username" required />
            <input type="email" name="Email" value={email} onChange={handleEmailChange} placeholder="Email" required />
            <input type="password" name="Password" value={password} onChange={handlePasswordChange} placeholder="Senha" required />
            <input type="password" name="PasswordConfirm" value={passwordConfirm} onChange={handlePasswordConfirmChange} placeholder="Confirmar Senha" required />

            <select name="TipoDaConta" required>
              <option value="Player">Player</option>
              <option value="Organizer">Organizador</option>
              <option value="Visitor">Visitante</option>
            </select>

            <label className="remember">
              <input type="checkbox" /> Lembrar de mim
            </label>

            <input type="submit" />
              Cadastrar
          </form>
        </section>
      </main>
    </>
  );


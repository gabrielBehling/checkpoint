import { React, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";
import api from "./api"
import axios from "axios";
export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("")
  const [telefone, setTelefone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  function handleEmailChange(e) {
    setEmail(e.target.value)
  }
  function handlePasswordChange(e) {
    setPassword(e.target.value)
  }

  function handleTelefoneChange(e) {
   setTelefone(e.target.value)
  }
  function handleConfirmarSenhaChange(e) {
    setConfirmarSenha(e.target.value)
  }

  function handleSubmit(e) {
    e.preventDefault();
    console.log(password)
    api.post("/login", {
      email: email,
      password: password,
      telefone: telefone,
      confirmarSenha: confirmarSenha
    }).then(function (response) {
      console.log(response);
    })
  };

  return (
    <>
    <form onSubmit={handleSubmit}>

        <label htmlFor="email">E-mail: </label>
        <input type="text" value={email} onChange={handleEmailChange} name="email" />
        <label htmlFor="password">Senha: </label>
        <input type="text" value={password} onChange={handlePasswordChange} name="password"/>
        <label htmlFor="telefone">Telefone: </label>
        <input type="text" value={telefone} onChange={handleTelefoneChange} name="telefone"/>
        <label htmlFor="confirmarSenha">Confirmar-Telefone: </label>
        <input type="text" value={confirmarSenha} onChange={handleConfirmarSenhaChange} name="confirmarSenha"/>
        <input type="submit" />



      </form>
    </>
  );
}
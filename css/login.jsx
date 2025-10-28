import { React, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";
import api from "./api"
import axios from "axios";
export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  function handleEmailChange(e) {
    setEmail(e.target.value)
  }
  function handlePasswordChange(e) {
    setPassword(e.target.value)
  }
  function handleSubmit(e) {
    e.preventDefault();
    console.log(password)
    api.post("/login", {
      email: email,
      password: password
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
        <input type="text" value={password} onChange={handlePasswordChange} name="password" />
        <input type="submit" />
      </form>
    </>
  );
}
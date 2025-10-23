import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import CadastroEvento from "./pages/cadastroEvento";
import { useState } from "react";
import "./assets/css/App.css";

function App() {
  return (
    <>
      <header>
        
          <div>
            <nav style={{ margin: 20 }}>
              <div className="logo">
                <Link to="/" style={{ marginRight: 10 }}>
                  Logo
                </Link>
                <a className="jogo" href="#">
                  Jogos
                </a>
              </div>
              <ul>
                <h3>
                  <input
                    id="pesquisa"
                    type="text"
                    placeholder="Pesquisa"
                  ></input>
                </h3>
                <li>
                  <a href="evento.html">Eventos</a>
                </li>
                <Link to="/login" style={{ marginRight: 10 }}>
                  login
                </Link>
                <Link to="/cadastro" style={{ marginRight: 10 }}>
                  cadastro
                </Link>
                <Link to="/chat" style={{ marginRight: 10 }}>
                Chat
                </Link>
                <Link to="/cadastroEvento" style={{ marginRight: 10 }}>
                Cadastro Evento
                </Link>
                <Link to="/perfil" style={{ marginRight: 10 }}>
                Perfil
                </Link>
                </ul>
            </nav>
          </div>
          
        <nav className="navbar"></nav>

      </header>

      <section className="hero">
        <div className="banner"></div>
        <div className="cta">
          <p>
            Cadastre-se e aproveite benefícios exclusivos!
            <br />
            Tenha acesso a conteúdos especiais, ofertas e novidades antes de
            todo mundo.
            <br />É rápido, gratuito e feito pra você!
          </p>
          <a href="cadastro.html" className="btn">
            Cadastre-se
          </a>
        </div>
      </section>

      <section className="eventos">
        <h2>Eventos Próximos</h2>
        <div className="evento-card">
          <div className="imagem-evento"></div>
          <div className="info-evento">
            <p>
              Evento tal
              <br />
              Data tal
              <br />
              Premiação tal
              <br />
              Hora tal
            </p>
            <a href="evento.html" className="btn">
              Cadastrar no evento
            </a>
          </div>
        </div>
      </section>

      <footer>
        <ul>
          <li>
            <a href="#">Ajuda</a>
          </li>
          <li>
            <a href="#">Contato</a>
          </li>
          <li>
            <a href="#">Sobre Nós</a>
          </li>
        </ul>
      </footer>
    </>
  );
}

export default App;

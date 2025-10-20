import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import './App.css'
import App from './App.jsx'
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
// import Chat from "./pages/chat"
import CadastroEvento from './pages/cadastroEvento';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        {/* <Route path="/chat" element={<Chat/>}/> */}
        <Route path="/cadastroEvento" element={<CadastroEvento/>}/>
      </Routes>
    </BrowserRouter>

  </StrictMode>,
)

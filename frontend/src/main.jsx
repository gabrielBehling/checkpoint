import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import "./assets/css/App.css";
import App from "./App.jsx";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Chat from "./pages/chat"
import CadastroEvento from "./pages/cadastroEvento";
import PerfilPage from "./pages/Perfil";
import ProtectedRoutes from "./components/ProtectedRoute";
import EventoInfo from "./pages/EventoInfo";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        <Route path="/evento/:eventId" element={<EventoInfo />} />
        
        {/* Rotas protegidas */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/cadastroEvento" element={<CadastroEvento />} />
          <Route path="/perfil" element={<PerfilPage />} />
          <Route path="/chat" element={<Chat/>}/>
        </Route>
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

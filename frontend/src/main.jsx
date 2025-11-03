import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import "./assets/css/App.css";
import App from "./App.jsx";
import React, { Suspense } from "react";
const Login = React.lazy(() => import("./pages/Login"));
const Cadastro = React.lazy(() => import("./pages/Cadastro"));
const Chat = React.lazy(() => import("./pages/chat"));
const CadastroEvento = React.lazy(() => import("./pages/cadastroEvento"));
const PerfilPage = React.lazy(() => import("./pages/Perfil"));
const ProtectedRoutes = React.lazy(() => import("./components/ProtectedRoute"));
const EventoInfo = React.lazy(() => import("./pages/EventoInfo"));
const InscricaoEvento = React.lazy(() => import("./pages/InscricaoEvento"));
const CriarTime = React.lazy(() => import("./pages/CriarTime"));
const EditarEvento = React.lazy(() => import("./pages/EditarEvento.jsx"))
const About_Us = React.lazy(() => import("./pages/About_Us.jsx"))
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <Suspense fallback={<div>Carregando...</div>}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          <Route path="/evento/:eventId" element={<EventoInfo />} />

          {/* Rotas protegidas */}
          <Route element={<ProtectedRoutes />}>
            <Route path="/cadastroEvento" element={<CadastroEvento />} />
            <Route path="/perfil" element={<PerfilPage />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/evento/:eventId/inscricao" element={<InscricaoEvento />} />
            <Route path="/evento/:eventId/criarTime" element={<CriarTime />} />
            <Route path="/evento/:eventId/editarevento" element={<EditarEvento />} />
            <Route path="/" element={<About_Us/>} />

          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  </BrowserRouter>
);

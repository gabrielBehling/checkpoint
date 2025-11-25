import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import api from "./api";
import "../assets/css/chat.css";
import { useAuth } from "../contexts/AuthContext";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ChatPage() {
  // --- Estados ---
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  
  // preview de imagens
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);


  const [typingUsers, setTypingUsers] = useState({});
  const socket = useRef(null);
  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // --- Efeitos ---

  // Carregar Times
  useEffect(() => {
    async function loadTeams() {
      try {
        const res = await api.get("/events/my-teams");
        setTeams(res.data.data);
      } catch (err) {
        console.error("Erro ao carregar teams:", err);
      }
    }
    loadTeams();
  }, []);

  //  Conectar Socket
  useEffect(() => {
    if (!socket.current) {
      socket.current = io("http://checkpoint.localhost", {
        path: "/api/chat/socket.io",
        withCredentials: true,
        transports: ["websocket"],
      });
    }
    return () => socket.current?.disconnect();
  }, []);

  async function loadMessages() {
    try {
      const res = await api.get(`/chat/messages/${selectedTeam.TeamId}`);
      setMessages(Array.isArray(res.data) ? res.data : []);
      scrollToBottom();
    } catch (err) {
      console.error("Erro ao carregar mensagens:", err);
    }
  }

  // 3. Lógica da Sala (Mensagens)
  useEffect(() => {
    if (!selectedTeam) return;

    loadMessages();
    socket.current.emit("joinTeam", selectedTeam.TeamId);

    // Função de receber mensagem
    const handleReceiveMessage = (msg) => {
      // Verifica se a mensagem pertence ao time atual
      if (msg.teamId == selectedTeam.TeamId) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
    };

    // Função de digitando
    const handleTyping = ({ teamId, username }) => {
      if (teamId !== selectedTeam.TeamId) return;
      setTypingUsers((prev) => ({ ...prev, [username]: true }));
      setTimeout(() => {
        setTypingUsers((prev) => {
          const c = { ...prev };
          delete c[username];
          return c;
        });
      }, 1200);
    };

    // Registrar ouvintes
    socket.current.on("receivedMessage", handleReceiveMessage);
    socket.current.on("typing", handleTyping);

    // --- LIMPEZA (Crucial para não duplicar) ---
    return () => {
      socket.current.off("receivedMessage", handleReceiveMessage);
      socket.current.off("typing", handleTyping);
    };

  }, [selectedTeam]);

  // --- Handlers ---

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ENVIO UNIFICADO
  async function handleSubmit(e) {
    e.preventDefault();

    if (!message.trim() && !selectedFile) return;

    // 1. Enviar Imagem (API POST)
    if (selectedFile) {
        const formData = new FormData();
        formData.append('teamId', selectedTeam.TeamId);
        formData.append('type', 'image');
        formData.append('file', selectedFile);
    
        try {
          await api.post('/chat/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (err) {
          console.error("Erro ao enviar imagem:", err);
          alert("Erro no upload da imagem");
        }
    }

    // 2. Enviar Texto (Socket)
    if (message.trim()) {
        socket.current.emit("sendMessage", {
            teamId: selectedTeam.TeamId,
            message,
        }, (response) => {
            if (response.status !== 'success') {
                console.error(response.message);
            }
        });
    }

    // Limpar tudo
    setMessage("");
    clearFile();
    // NÃO fazemos setMessages manual aqui, confiamos no retorno do socket
  }

  function handleTyping(e) {
    setMessage(e.target.value);
    socket.current.emit("typing", {
      teamId: selectedTeam.TeamId,
      username: user.username,
    });
  }

  // --- Render ---
  return (
    <div>
      <Header />

      <div className="chat-container">
        {/* Sidebar */}
        <aside className="chat-sidebar">
          <div className="sidebar-header">
            <h2>Seus Chats</h2>
          </div>

          <div className="chat-list">
            {teams.map((team, i) => (
              <div
                key={i}
                className={`chat-list-item ${selectedTeam?.TeamId === team.TeamId ? "active" : ""}`}
                onClick={() => {
                  setSelectedTeam(team);
                  clearFile();
                }}
              >
                <div className="chat-item-info">
                  <span className="chat-item-name">{team.TeamName}</span>
                  <span className="chat-item-last-message">Clique para abrir a conversa</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Janela Principal */}
        <main className="chat-window">
          {!selectedTeam ? (
            <div className="no-chat-selected">Selecione um chat na barra lateral →</div>
          ) : (
            <>
              <div className="chat-header">
                <h3>{selectedTeam.TeamName}</h3>
              </div>

              <div className="message-list">
                {messages.map((msg, i) => {
                  const isSent = msg.userId == user.userId;
                  return (
                    <div
                      key={i}
                      className={`message-bubble ${isSent ? "sent" : "received"}`}
                    >
                      {!isSent && <span className="message-sender">{msg.author}</span>}

                      {/* Lógica de Renderização: Imagem ou Texto */}
                      {msg.type === 'image' || msg.fileUrl ? (
                        <img
                          // Ajuste aqui a URL base caso necessário
                          src={msg.fileUrl.startsWith('http') ? msg.fileUrl : `http://checkpoint.localhost/api/chat${msg.fileUrl}`}
                          className="chat-image"
                          alt="Enviada"
                          onError={(e) => { e.target.style.display = 'none'; }} 
                        />
                      ) : (
                        <span className="message-text">{msg.message}</span>
                      )}

                      <span className="message-timestamp">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}

                {Object.keys(typingUsers).length > 0 && (
                  <div className="typing-indicator">
                    {Object.keys(typingUsers).join(", ")} digitando...
                  </div>
                )}

                <div ref={bottomRef}></div>
              </div>

              {/* Área de Preview */}
              {previewUrl && (
                <div className="image-preview-container" style={{ padding: '10px', background: 'rgba(0,0,0,0.2)' }}>
                  <div className="preview-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      style={{ height: '80px', borderRadius: '8px', border: '1px solid #4d8eff' }} 
                    />
                    <button 
                      onClick={clearFile}
                      style={{
                        position: 'absolute', top: '-8px', right: '-8px', 
                        background: '#ff6b3c', color: 'white', borderRadius: '50%', 
                        width: '20px', height: '20px', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Formulário */}
              <form className="message-input-form" onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    placeholder="Digite sua mensagem..." 
                    value={message} 
                    onChange={handleTyping} 
                />

                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileSelect}
                    ref={fileInputRef} 
                    style={{ maxWidth: '100px' }} // Ajuste visual simples
                />

                <button type="submit" disabled={!message.trim() && !selectedFile}>
                  Enviar
                </button>
              </form>
            </>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
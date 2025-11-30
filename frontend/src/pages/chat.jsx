import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import api from "./api";
import "../assets/css/chat.css";
import { useAuth } from "../contexts/AuthContext";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ChatPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  
  // Estados de Imagem
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const [typingUsers, setTypingUsers] = useState({});
  const socket = useRef(null);
  const bottomRef = useRef(null);

  // --- Scroll ---
  const scrollToBottom = () => {
    setTimeout(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // --- Carregar Times ---
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

  // --- Socket Connection ---
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

  // --- Carregar Mensagens ao Mudar de Time ---
  useEffect(() => {
    if (!selectedTeam) return;

    async function loadMessages() {
      try {
        const res = await api.get(`/chat/messages/${selectedTeam.TeamId}`);
        setMessages(Array.isArray(res.data) ? res.data : []);
        scrollToBottom();
      } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
      }
    }

    loadMessages();
    socket.current.emit("joinTeam", selectedTeam.TeamId);

    const handleReceiveMessage = (msg) => {
      if (msg.teamId == selectedTeam.TeamId) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
    };

    const handleTypingServer = ({ teamId, username }) => {
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

    socket.current.on("receivedMessage", handleReceiveMessage);
    socket.current.on("typing", handleTypingServer);

    return () => {
      socket.current.off("receivedMessage", handleReceiveMessage);
      socket.current.off("typing", handleTypingServer);
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

  const handleTypingInput = (e) => {
    setMessage(e.target.value);
    socket.current.emit("typing", {
      teamId: selectedTeam.TeamId,
      username: user.username,
    });
  };

  //  ENVIO DA MENSAGEM 
  async function handleSubmit(e) {
    e.preventDefault();

    if (!message.trim() && !selectedFile) return;

    let finalFileUrl = null;

    // 1. UPLOAD (Se houver arquivo)
    if (selectedFile) {
        const formData = new FormData();
        formData.append('teamId', selectedTeam.TeamId);
        formData.append('file', selectedFile);
    
        try {
          // O Await aqui é essencial. O código para até o upload terminar.
          const res = await api.post('/chat/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          
          if (res.data && res.data.fileUrl) {
             finalFileUrl = res.data.fileUrl;
          }
        } catch (err) {
          console.error("Erro ao enviar imagem:", err);
          alert("Falha no upload da imagem");
          return; 
        }
    }

    // 2. SOCKET EMIT (Texto e/ou URL)
    if (message.trim() || finalFileUrl) {
        socket.current.emit("sendMessage", {
            teamId: selectedTeam.TeamId,
            message: message,
            fileUrl: finalFileUrl 
        }, (response) => {
            if (response && response.status !== 'success') {
                console.error("Erro no socket:", response);
            }
        });
    }

    setMessage("");
    clearFile();
  }

  //  RENDER 
  return (
    <div>
      <Header />
      <div className="chat-container">
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
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat Window */}
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

                      {msg.fileUrl && (
                        <div className="message-image-container">
                             <img
                              src={msg.fileUrl.startsWith('http') ? msg.fileUrl : `http://checkpoint.localhost/api/chat${msg.fileUrl}`}
                              className="chat-image"
                              alt="Anexo"
                              style={{ maxWidth: '100%', borderRadius: '8px', display: 'block' }}
                              onError={(e) => { e.target.style.display = 'none'; }} 
                            />
                        </div>
                      )}

                      {msg.message && (
                        <span className="message-text" style={{ display: 'block', marginTop: msg.fileUrl ? '5px' : '0' }}>
                          {msg.message}
                        </span>
                      )}

                      <span className="message-timestamp">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {Object.keys(typingUsers).length > 0 && (
                  <div className="typing-indicator">
                    {Object.keys(typingUsers).join(", ")} digitando...
                  </div>
                )}
                <div ref={bottomRef}></div>
              </div>

              {/* Preview da Imagem Selecionada */}
              {previewUrl && (
                <div className="image-preview-container" style={{ padding: '10px', background: 'rgba(0,0,0,0.1)', display: 'flex' }}>
                   <div style={{ position: 'relative' }}>
                      <img src={previewUrl} alt="Preview" style={{ height: '80px', borderRadius: '5px' }} />
                      <button 
                        onClick={clearFile}
                        style={{
                          position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', 
                          borderRadius: '50%', border: 'none', cursor: 'pointer', width: '20px', height: '20px'
                        }}
                      >X</button>
                   </div>
                </div>
              )}

              {/* Input Form */}
              <form className="message-input-form" onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    placeholder="Digite sua mensagem..." 
                    value={message} 
                    onChange={handleTypingInput} 
                />

                <label htmlFor="file-upload" className="file-upload-btn" style={{ cursor: 'pointer', margin: '0 10px' }}>
                    📷
                </label>
                <input 
                    id="file-upload"
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileSelect}
                    ref={fileInputRef} 
                    style={{ display: 'none' }}
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
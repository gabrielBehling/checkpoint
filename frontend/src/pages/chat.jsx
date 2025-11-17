import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import api from "./api";
import "../assets/css/chat.css";
import { useAuth } from "../contexts/AuthContext";

export default function ChatPage() {
  // --- Estados e Refs ---
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  const [unread, setUnread] = useState({});
  const socket = useRef(null);
  const bottomRef = useRef(null);

  // --- Funções Auxiliares ---

  // Auto scroll
  const scrollToBottom = () => {
    setTimeout(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);
  };

  // --- Efeitos (useEffect) ---

  // Carregar times do usuário
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

  // Conectar socket apenas uma vez
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

  // Carregar mensagens + entrar na sala realtime
  useEffect(() => {
    if (!selectedTeam) return;

    async function loadMessages() {
      try {
        // Correção de sintaxe: Trocado regex /.../ por template string `...`
        const res = await api.get(`/chat/messages/${selectedTeam.TeamId}`);
        setMessages(Array.isArray(res.data) ? res.data : []);
        scrollToBottom();
      } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
      }
    }
    loadMessages();

    // joinTeam somente quando socket conecta
    function handleConnect() {
      console.log("JOIN TEAM →", selectedTeam.TeamId);
      socket.current.emit("joinTeam", selectedTeam.TeamId);
    }
    socket.current.on("connect", handleConnect);

    // Mensagens realtime
    socket.current.on("receivedMessage", (msg) => {
      if (msg.teamId === selectedTeam.TeamId) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      } else {
        setUnread((prev) => ({
          ...prev,
          [msg.teamId]: (prev[msg.teamId] || 0) + 1,
        }));
      }
    });

    // Digitando realtime
    socket.current.on("typing", ({ teamId, username }) => {
      if (teamId !== selectedTeam.TeamId) return;
      
      setTypingUsers((prev) => ({
        ...prev,
        [username]: true,
      }));

      setTimeout(() => {
        setTypingUsers((prev) => {
          const c = { ...prev };
          delete c[username];
          return c;
        });
      }, 1200);
    });

    // Função de Limpeza
    return () => {
      socket.current.off("connect", handleConnect);
      socket.current.off("receivedMessage");
      socket.current.off("typing");
    };
  }, [selectedTeam]);

  // --- Handlers de Eventos ---

  // Enviar mensagem de texto
  function sendMessage(e) {
    e.preventDefault();
    if (!message.trim()) return;

    socket.current.emit("sendMessage", {
      teamId: selectedTeam.TeamId,
      message,
    });
    setMessage("");
  }

  // Emit typing
  function handleTyping(e) {
    setMessage(e.target.value);
    socket.current.emit("typing", {
      teamId: selectedTeam.TeamId,
      username: user.username,
    });
  }

  // Enviar imagem
  function sendImage(file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      socket.current.emit("sendMessage", {
        teamId: selectedTeam.TeamId,
        image: reader.result,
      });
    };
    reader.readAsDataURL(file);
  }

  // --- Renderização JSX ---
  return (
    <div className="chat-container">
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <h2>Seus Chats</h2>
        </div>

        <div className="chat-list">
          {teams.map((team) => (
            <div
              key={team.TeamId}
              // Correção de sintaxe: Adicionado crases (`)
              className={`chat-list-item ${
                selectedTeam?.TeamId === team.TeamId ? "active" : ""
              }`}
              onClick={() => {
                setUnread((prev) => ({ ...prev, [team.TeamId]: 0 }));
                setSelectedTeam(team);
              }}
            >
              <div className="chat-item-info">
                <span className="chat-item-name">{team.TeamName}</span>
                <span className="chat-item-last-message">
                  Clique para abrir a conversa
                </span>
              </div>

              {unread[team.TeamId] > 0 && (
                <div className="chat-item-unread">{unread[team.TeamId]}</div>
              )}
            </div>
          ))}
        </div>
      </aside>

      <main className="chat-window">
        {!selectedTeam ? (
          <div className="no-chat-selected">
            Selecione um chat na barra lateral →
          </div>
        ) : (
          <>
            <div className="chat-header">
              <h3>{selectedTeam.TeamName}</h3>
            </div>

            <div className="message-list">
              {messages.map((msg, i) => {
                const isSent = msg.userId === user.userId;
                return (
                  <div
                    key={i}
                    // Correção de sintaxe: Adicionado crases (`)
                    className={`message-bubble ${
                      isSent ? "sent" : "received"
                    }`}
                  >
                    {!isSent && (
                      <span className="message-sender">{msg.author}</span>
                    )}

                    {msg.image ? (
                      <img src={msg.image} className="chat-image" />
                    ) : (
                      <span className="message-text">{msg.message}</span>
                    )}

                    <span className="message-timestamp">
                      {new Date(msg.timestamp).toLocaleTimeString()}
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

            <form className="message-input-form" onSubmit={sendMessage}>
              <input
                type="text"
                placeholder="Digite sua mensagem..."
                value={message}
                onChange={handleTyping}
              />

              <input
                type="file"
                accept="image/*"
                onChange={(e) => sendImage(e.target.files[0])}
              />

              <button type="submit" disabled={!message.trim()}>
                Enviar
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
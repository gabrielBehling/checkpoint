import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import validator from 'validator';
import "../assets/css/chat.css";
import { useAuth } from '../contexts/AuthContext.jsx';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [status, setStatus] = useState('Conectando...');
  const [notification, setNotification] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();

  const [users, setUsers] = useState([]); // lista de usuários / conversas
  const [activeUser, setActiveUser] = useState(null); // usuário selecionado

  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  const BASE_URL = 'http://checkpoint.localhost';
  const SOCKET_PATH = '/api/chat/socket.io';

  useEffect(() => {
    const socket = io(BASE_URL, {
      path: SOCKET_PATH,
      reconnectionAttempts: 5,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setStatus('Conectado');
      showNotification('Conectado ao chat');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setStatus('Desconectado');
    });

    socket.on('connect_error', (err) => {
      setStatus('Erro de conexão: ' + (err?.message || err));
    });

    socket.on('receivedMessage', (msg) => {
      setMessages(prev => [...prev, { ...msg, timestamp: msg.timestamp || Date.now() }]);
      scrollToBottom();
    });

    socket.on('userList', (list) => {
      setUsers(list);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    fetch(`${BASE_URL}/api/chat/messages`)
      .then(res => res.json())
      .then(msgs => {
        setMessages(msgs || []);
        setStatus(`${(msgs && msgs.length) || 0} mensagens carregadas`);
        scrollToBottom();
      })
      .catch(() => setStatus('Não foi possível carregar mensagens antigas'));
  }, []);

  function showNotification(text) {
    setNotification(text);
    setTimeout(() => setNotification(''), 3000);
  }

  function scrollToBottom() {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }

  function formatDate(date) {
    try {
      return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  function renderMessageElement(msg, idx) {
    const safeAuthor = validator.escape(msg.author);
    const isOwn = user.Username && user.Username === msg.author;

    return (
      <div className={`message ${isOwn ? 'own' : ''}`} key={idx}>
        <div className="author">
          <span>{safeAuthor}</span>
          <span className="timestamp">{formatDate(msg.timestamp)}</span>
        </div>

        {msg.type === 'text' && msg.message && (
          <div className="message-text">{validator.escape(msg.message)}</div>
        )}

        {msg.type === 'image' && msg.fileUrl && (
          <>
            {msg.message && <div className="message-text">{validator.escape(msg.message)}</div>}
            <div className="message-image">
              <img src={msg.fileUrl.startsWith('http') ? msg.fileUrl : `${BASE_URL}/api/chat${msg.fileUrl}`} alt="Imagem enviada" />
            </div>
          </>
        )}

        {msg.type === 'audio' && msg.fileUrl && (
          <>
            {msg.message && <div className="message-text">{validator.escape(msg.message)}</div>}
            <div className="message-audio">
              <audio controls src={msg.fileUrl.startsWith('http') ? msg.fileUrl : `${BASE_URL}/api/chat${msg.fileUrl}`} />
            </div>
          </>
        )}
      </div>
    );
  }

  function handleSend(e) {
    e.preventDefault();
    const msg = messageText.trim();
    if (!msg) return;

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('sendMessage', { message: msg });
      setMessageText('');
    } else {
      alert('Socket não conectado. Tente novamente.');
    }
  }

  function handleFileChange(ev) {
    const file = ev.target.files[0];
    if (!file) return;

    const type = file.type.startsWith('image')
      ? 'image'
      : file.type.startsWith('audio')
      ? 'audio'
      : null;
    if (!type) {
      alert('Apenas imagens ou áudios são suportados.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    setUploadProgress(30);

    fetch(`${BASE_URL}/api/chat/upload`, {
      method: 'POST',
      body: formData,
    })
      .then(response => {
        setUploadProgress(60);
        return response.json();
      })
      .then(data => {
        if (data.success) {
          setUploadProgress(100);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setTimeout(() => setUploadProgress(0), 500);
          showNotification('Arquivo enviado com sucesso!');
        } else throw new Error(data.error || 'Erro ao enviar arquivo.');
      })
      .catch(err => {
        alert('Erro ao enviar arquivo: ' + (err.message || err));
        setUploadProgress(0);
      });
  }

  return (
    <div className="chat-page">
      <nav className="navbar">
        <div className="nav-left">
          <div className="logo">CHECKPOINT</div>
          <ul className="nav-links">
            <li>Eventos</li>
            <li>Jogos</li>
          </ul>
        </div>
        <div className="nav-right">
          <input type="text" placeholder="Pesquisar..." className="nav-search" />
          <div className="nav-icons">
            <span>🔔</span>
            <span>👤</span>
          </div>
        </div>
      </nav>

      <div className="chat-container">
        <aside className="chat-list">
          {users.map((u, idx) => (
            <div
              key={idx}
              className={`chat-user ${activeUser === u.username ? 'active' : ''}`}
              onClick={() => setActiveUser(u.username)}
            >
              <img src={u.avatarUrl || '/default-avatar.png'} alt="avatar" />
              <div className="user-info">
                <strong>{u.username}</strong>
                <span>{u.lastMessage || ''}</span>
              </div>
            </div>
          ))}
        </aside>

        <main className="chat-main">
          <div className="messages" ref={messagesContainerRef}>
            {messages.map((m, i) => renderMessageElement(m, i))}
          </div>

          <form onSubmit={handleSend} className="input-area">
            <input
              type="text"
              placeholder="Mensagem"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            <button type="submit">Enviar</button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,audio/*"
              onChange={handleFileChange}
            />
          </form>
        </main>
      </div>

      <div className="status">{status}</div>
      {notification && <div className="notification">{notification}</div>}
    </div>
  );
}

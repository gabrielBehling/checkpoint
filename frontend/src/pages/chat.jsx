import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import validator from 'validator';
import './style.css';

// Single-file React component (default export)
// Usage:
// 1) Create a React project (Vite or CRA).
// 2) Install dependencies: `npm install socket.io-client validator`.
// 3) Put this file as `src/App.jsx` and copy the `style.css` (or adapt).
// 4) Start the dev server.

export default function App() {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState(() => localStorage.getItem('chatUsername') || '');
  const [messageText, setMessageText] = useState('');
  const [status, setStatus] = useState('Conectando...');
  const [notification, setNotification] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  // configure your backend base URL here
  const BASE_URL = 'http://checkpoint.localhost';
  const SOCKET_PATH = '/api/chat/socket.io';

  useEffect(() => {
    // Initialize socket
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
      // ensure message has timestamp
      const withTs = { ...msg, timestamp: msg.timestamp || Date.now() };
      setMessages(prev => [...prev, withTs]);
      scrollToBottom();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    // load initial messages
    fetch(`${BASE_URL}/api/chat/messages`)
      .then(res => res.json())
      .then(msgs => {
        setMessages(msgs || []);
        setStatus(`${(msgs && msgs.length) || 0} mensagens carregadas`);
        scrollToBottom();
      })
      .catch(err => {
        console.error('Erro ao carregar mensagens antigas:', err);
        setStatus('Não foi possível carregar mensagens antigas');
      });
  }, []);

  useEffect(() => {
    // persist username
    localStorage.setItem('chatUsername', username.trim());
  }, [username]);

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
    } catch (e) {
      return '';
    }
  }

  function renderMessageElement(msg, idx) {
    const safeAuthor = validator.escape(msg.author || 'Anônimo');
    const isOwn = (username && username === msg.author);

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
              {/* Keep the same path combining BASE_URL if server returns relative path */}
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
    const author = username.trim();
    const msg = messageText.trim();

    if (!author) {
      alert('Por favor, informe seu nome.');
      return;
    }
    if (!msg) {
      alert('Digite uma mensagem para enviar.');
      return;
    }

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('sendMessage', { author, message: msg });
      setMessageText('');
    } else {
      alert('Socket não conectado. Tente novamente.');
    }
  }

  function handleFileChange(ev) {
    const file = ev.target.files[0];
    const author = username.trim();

    if (!file) return;
    if (!author) {
      alert('Por favor, informe seu nome antes de enviar arquivos.');
      return;
    }

    const type = file.type.startsWith('image') ? 'image' : file.type.startsWith('audio') ? 'audio' : null;
    if (!type) {
      alert('Apenas imagens ou áudios são suportados.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('author', author);
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
        } else {
          throw new Error(data.error || 'Erro ao enviar arquivo.');
        }
      })
      .catch(err => {
        console.error('Erro no upload:', err);
        alert('Erro ao enviar arquivo: ' + (err.message || err));
        setUploadProgress(0);
      });
  }

  return (
    <div className="chat-root">
      <header className="chat-header">
        <h1>Chat em Tempo Real</h1>
        <p>Converse e compartilhe imagens e áudios</p>
      </header>

      <form id="chat" onSubmit={handleSend} className="chat-form">
        <div className="user-input">
          <input
            type="text"
            name="username"
            placeholder="Seu nome"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="messages" id="messages-container" ref={messagesContainerRef}>
          {messages.map((m, i) => renderMessageElement(m, i))}
        </div>

        <div className="input-area">
          <div className="message-input">
            <input
              type="text"
              name="message"
              placeholder="Mensagem"
              id="message-input"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            <button type="submit">Enviar</button>
          </div>

          <div className="file-input-container">
            <label htmlFor="file">Enviar imagem ou áudio:</label>
            <input ref={fileInputRef} type="file" id="file" accept="image/*,audio/*" onChange={handleFileChange} />
            <div className="progress-bar" id="progress-bar" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      </form>

      <div className="status" id="status">{status}</div>
      <div className="notification" id="notification">{notification}</div>
    </div>
  );
}
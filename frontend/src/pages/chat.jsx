import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import validator from 'validator';
import "../assets/css/chat.css"
import { useAuth } from '../contexts/AuthContext.jsx';
import api from './api';

//  O componente agora recebe 'teamId' como uma "prop" 
// NECESSITA passar o ID da equipe para este componente quando o usar.
export default function App({ teamId }) { 
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [status, setStatus] = useState('Aguardando ID da Equipe...');
  const [notification, setNotification] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth(); // usuario autenticado

  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  // derive base host from api.defaults.baseURL when available
  // api.defaults.baseURL is like 'http://checkpoint.localhost/api'
  const API_BASE = (api && api.defaults && api.defaults.baseURL) ? api.defaults.baseURL : 'http://checkpoint.localhost/api';
  const BASE_URL = API_BASE.replace(/\/api\/?$/, '');
  const SOCKET_PATH = '/api/chat/socket.io';

  useEffect(() => {
    // Se não houver teamId, não faz nada.
    if (!teamId) {
      setStatus('Nenhuma equipe selecionada.');
      return;
    }

    // Initialize socket
    const socket = io(BASE_URL, {
      path: SOCKET_PATH,
      reconnectionAttempts: 5,
      timeout: 10000,
      // Enviar cookies de autenticação (JWT) com o socket
      withCredentials: true 
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setStatus('Conectado');
      showNotification('Conectado ao chat');

      // Entrar na sala da equipe baseado no teamId
      socket.emit('joinTeam', teamId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setStatus('Desconectado');
    });

    socket.on('connect_error', (err) => {
      setStatus('Erro de conexão: ' + (err?.message || err));
    });

    socket.on('receivedMessage', (msg) => {
      const withTs = { ...msg, timestamp: msg.timestamp || Date.now() };
      setMessages(prev => [...prev, withTs]);
      scrollToBottom();
    });

    return () => {
      socket.disconnect();
    };
  }, [teamId]); // <-- O useEffect agora depende do teamId

  useEffect(() => {
    // Só busca mensagens se tiver um teamId
    if (!teamId) {
      setMessages([]); // Limpa mensagens se o teamId for removido
      return;
    }

    // load initial messages using the shared axios instance
    // endpoint uses api.baseURL which already contains '/api'
    api.get(`/chat/messages/${teamId}`)
      .then(res => {
        const msgs = res.data;
        if (Array.isArray(msgs)) {
          setMessages(msgs);
          setStatus(`${msgs.length || 0} mensagens carregadas`);
          scrollToBottom();
        } else {
          setMessages([]);
          setStatus('Erro ao carregar mensagens.');
        }
      })
      .catch(err => {
        console.error('Erro ao carregar mensagens antigas:', err);
        setStatus('Não foi possível carregar mensagens antigas');
      });
  }, [teamId]); // <-- O useEffect agora depende do teamId

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
    const currentUsername = user ? user.Username : '';
    const safeAuthor = validator.escape(msg.author);
    const isOwn = (currentUsername && currentUsername === msg.author);

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

    if (!msg) {
      alert('Digite uma mensagem para enviar.');
      return;
    }

    // Verifica se temos o teamId
    if (!teamId) {
      alert('Nenhuma equipe selecionada.');
      return;
    }

    if (socketRef.current && socketRef.current.connected) {
      // <-- MUDANÇA 5: Enviar um objeto contendo a mensagem E o teamId -->
      socketRef.current.emit('sendMessage', { 
        message: msg,
        teamId: teamId 
      });
      setMessageText('');
    } else {
      alert('Socket não conectado. Tente novamente.');
    }
  }

  function handleFileChange(ev) {
    const file = ev.target.files[0];

    if (!file) return;

    // Verifica se temos o teamId e o usuário antes de enviar
    if (!teamId) {
      alert('Nenhuma equipe selecionada. Não é possível enviar o arquivo.');
      return;
    }
    if (!user || !user.Username) {
      alert('Usuário não autenticado. Faça login para enviar arquivos.');
      return;
    }

    const type = file.type.startsWith('image') ? 'image' : file.type.startsWith('audio') ? 'audio' : null;
    if (!type) {
      alert('Apenas imagens ou áudios são suportados.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    // <-- MUDANÇA 6: Adicionar 'teamId' e 'author' ao formulário de upload -->
    formData.append('teamId', teamId);
    formData.append('author', user.Username); // O backend precisa saber quem enviou

    setUploadProgress(30);

    // Use shared axios instance so refresh-token logic and withCredentials are applied
    api.post(`/chat/upload`, formData, {
      // Let the browser set the correct multipart Content-Type boundary
      onUploadProgress: (progressEvent) => {
        try {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        } catch (e) {
          // ignore progress errors
        }
      }
    })
      .then(response => {
        const data = response.data;
        if (data && data.success) {
          setUploadProgress(100);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setTimeout(() => setUploadProgress(0), 500);
          showNotification('Arquivo enviado com sucesso!');
        } else {
          throw new Error((data && data.error) || 'Erro ao enviar arquivo.');
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
      {/* ... (O resto do seu HTML/JSX não precisa de mudanças) ... */}
      <header className="chat-header">
        <h1>Chat da Equipe</h1>
        <p>{teamId ? `Sala: ${teamId}` : 'Nenhuma sala selecionada'}</p>
      </header>

      <form id="chat" onSubmit={handleSend} className="chat-form">
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
              disabled={!teamId || !isConnected} // Desabilita se não houver equipe
            />
            <button type="submit" disabled={!teamId || !isConnected}>Enviar</button>
          </div>

          <div className="file-input-container">
            <label htmlFor="file">Enviar imagem ou áudio:</label>
            <input 
                ref={fileInputRef} 
                type="file" 
                id="file" 
                accept="image/*,audio/*" 
                onChange={handleFileChange} 
                disabled={!teamId || !isConnected} // Desabilita se não houver equipe
            />
            <div className="progress-bar" id="progress-bar" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      </form>

      <div className="status" id="status">{status}</div>
      <div className="notification" id="notification">{notification}</div>
    </div>
  );
}
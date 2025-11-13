import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import validator from 'validator';
import "../assets/css/chat.css";
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCustomModal } from "../hooks/useCustomModal";
import api from './api';

import Header from "../components/Header";
import Footer from "../components/Footer";  

//  O componente agora recebe 'teamId' como uma "prop" 
// NECESSITA passar o ID da equipe para este componente quando o usar.
export default function App({ teamId }) { 
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [status, setStatus] = useState('Aguardando ID da Equipe...');
  const [notification, setNotification] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();
  const { Modal, showError, showWarning } = useCustomModal();

  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  const BASE_URL = 'http://checkpoint.localhost';
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

    // load initial messages
    // <-- MUDANÇA 4: Buscar histórico da API usando o 'teamId'
    fetch(`${BASE_URL}/api/chat/messages/${teamId}`, {
      credentials: 'include' // envia os cookies de autenticação (JWT)
    })
      .then(res => res.json())
      .then(msgs => {
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
      showWarning('Digite uma mensagem para enviar.');
      return;
    }

    // Verifica se temos o teamId
    if (!teamId) {
      showWarning('Nenhuma equipe selecionada.');
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
      showError('Socket não conectado. Tente novamente.');
    }
  }

  function handleFileChange(ev) {
    const file = ev.target.files[0];

    if (!file) return;

    // Verifica se temos o teamId e o usuário antes de enviar
    if (!teamId) {
      showWarning('Nenhuma equipe selecionada. Não é possível enviar o arquivo.');
      return;
    }
    if (!user || !user.Username) {
      showWarning('Usuário não autenticado. Faça login para enviar arquivos.');
      return;
    }

    const type = file.type.startsWith('image') ? 'image' : file.type.startsWith('audio') ? 'audio' : null;
    if (!type) {
      showWarning('Apenas imagens ou áudios são suportados.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    // <-- MUDANÇA 6: Adicionar 'teamId' e 'author' ao formulário de upload -->
    formData.append('teamId', teamId);
    formData.append('author', user.Username); // O backend precisa saber quem enviou

    setUploadProgress(30);

    fetch(`${BASE_URL}/api/chat/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
      .then(response => {
        setUploadProgress(60);
        if (!response.ok) {
          // Se a resposta não for 2xx, joga um erro
          return response.json().then(err => { throw new Error(err.error || 'Erro no servidor') });
        }
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
        showError('Erro ao enviar arquivo!');
        setUploadProgress(0);
      });
  }

  return (
    <div className="chat-root">
      <Modal/>
      <Header/>

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
      <Footer/>
    </div>
  );
}

const express = require('express');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const multer = require('multer');
const { renderFile } = require('ejs');
const socketIO = require('socket.io');
const Message = require('./models/Message');
const authMiddleware = require('./authMiddleware');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cookieParser());
app.use(express.json());

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {  
    path: '/api/chat/socket.io',
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  cookie: true
});

// --- Configuração dos Serviços ---
// URL do seu Events Service (correta, baseada nos seus logs)
const EVENTS_SERVICE_URL = process.env.EVENTS_SERVICE_URL || 'http://events-service:3000';

// MongoDB (Conexão que você enviou)
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASSWORD;
const mongoDb = process.env.MONGO_DB;
const mongoUri = `mongodb://${mongoUser}:${mongoPass}@mongodb:27017/${mongoDb}?authSource=admin`;
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(' MongoDB conectado'))
  .catch(err => console.error(' MongoDB erro:', err));

// Configuração de Pastas e Multer (Seu código original)
const publicDir = path.join(__dirname, '../Implementacao_Socket_Teste');
app.use(express.static(publicDir));
app.use('/chat/uploads', express.static(path.join(publicDir, 'uploads')));
app.set('views', publicDir);
app.engine('html', renderFile);
app.set('view engine', 'html');
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(publicDir, 'uploads'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
  })
});


// --- MUDANÇA NECESSÁRIA: A Função "Porteiro" (com Fetch) ---
async function isUserMemberOfTeam(userId, teamId, authToken) {
  if (!userId || !teamId || !authToken) {
    return false;
  }

  const checkUrl = `${EVENTS_SERVICE_URL}/teams/${teamId}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(checkUrl, {
      method: 'GET',
      headers: {
        'Cookie': `accessToken=${authToken}`
      },
      signal: controller.signal
    });

    if (!response.ok) {
      // Se o Events Service rejeitar (401, 403, 404), o usuário não é membro
      console.log("response", response);
      return false;
    }

    const body = await response.json();
    const members = body.data?.members; // Pega o array de membros

    if (!Array.isArray(members)) {
      // Se a resposta não tiver o array (JSON inesperado), rejeita
      return false;
    }

    // Verifica se o userId (do JWT) está na lista de membros (da API)
    const userIdString = userId.toString();
    return members.some(member => member.userId.toString() === userIdString);

  } catch (error) {
    console.log(`[AUTH_CHECK] Falha no fetch: ${error.message}`);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

    // ROTAS HTTP

    app.get('/', (req, res) => {
      res.render('index.html');
    });

    // Rota de Upload
    app.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
      const { type, teamId } = req.body;
      const user = req.user;
      const authToken = req.cookies.accessToken;

      // Validação
      if (!user || !user.userId) {
        return res.status(401).json({ error: 'JWT inválido (sem userId).' });
      }
      if (!teamId) {
        return res.status(400).json({ error: 'TeamId é obrigatório' });
      }

      // Verificação do "Porteiro" Team
      const isMember = await isUserMemberOfTeam(user.userId, teamId, authToken);
      if (!isMember) {
        return res.status(403).json({ error: 'Não autorizado para esta equipe.' });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      const message = new Message({
        author: user.username,
        userId: user.userId, // Salva o userId
        type,
        fileUrl,
        teamId: teamId
      });

      await message.save();
      io.to(teamId).emit('receivedMessage', message);
      res.json({ success: true });
    });

    // Rota para comentários de eventos
    app.post('/events/:eventId/comments', authMiddleware, async (req, res) => {
      try {
        const { eventId } = req.params;
        const { content } = req.body;
        const user = req.user;

        if (!user || !user.userId) {
          return res.status(401).json({ error: 'JWT inválido (sem userId).' });
        }

        if (!content || !content.trim()) {
          return res.status(400).json({ error: 'Conteúdo do comentário é obrigatório' });
        }

        const message = new Message({
          author: user.username,
          userId: user.userId,
          message: content.trim(),
          type: 'comment',
          eventId: eventId
        });

        await message.save();
        res.status(201).json(message);
      } catch (err) {
        console.log('Erro ao criar comentário:', err);
        res.status(500).json({ error: 'Erro ao criar comentário' });
      }
    });

    // Rota para listar comentários de um evento
    app.get('/events/:eventId/comments', async (req, res) => {
      try {
        const { eventId } = req.params;
        const comments = await Message.find({ 
          eventId: eventId,
          type: 'comment'
        })
        .sort({ timestamp: -1 })
        .limit(100);
        
        res.json(comments);
      } catch (err) {
        console.log('Erro ao buscar comentários:', err);
        res.status(500).json({ error: 'Erro ao buscar comentários' });
      }
    });

    // Rota de Mensagens SEGURA
    app.get('/messages/:teamId', authMiddleware, async (req, res) => {
      try {
        const { teamId } = req.params;
        const user = req.user;
        const authToken = req.cookies.accessToken;

        if (!user || !user.userId) {
          return res.status(401).json({ error: 'JWT inválido (sem userId).' });
        }

        // <-- MUDANÇA NECESSÁRIA: Verificação do "Porteiro" -->
        const isMember = await isUserMemberOfTeam(user.userId, teamId, authToken);
        if (!isMember) {
          // É esta linha que está causando o seu erro atual
          return res.status(403).json({ error: 'Não autorizado para ver estas mensagens.' });
        }

        const messages = await Message.find({ teamId: teamId }).sort({ timestamp: 1 });
        res.json(messages);
      } catch (err) {
        console.log('Erro ao buscar mensagens:', err);
        res.status(500).json({ error: 'Erro ao buscar mensagens' });
      }
    });

    // Rota pública para servir os arquivos (Seu código original)
    const fs = require('fs');
    app.get('/upload/:filename', (req, res) => {
      const filePath = path.join(publicDir, 'uploads', req.params.filename);
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
          return res.status(404).json({ error: 'Arquivo não encontrado' });
        }
        res.sendFile(filePath);
      });
    });


    // --- SOCKET.IO SEGURO ---

    function getCookie(cookieString, cname) {
      // (Seu código original de getCookie)
      if (!cookieString) return "";
      let name = cname + "=";
      let decodedCookie = decodeURIComponent(cookieString);
      let ca = decodedCookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
    }

    io.on('connection', socket => {
      console.log(`ID Conectado: ${socket.id}`);
      const cookieString = socket.handshake.headers.cookie || socket.request.headers.cookie;
      const authToken = getCookie(cookieString, 'accessToken');

      let user;
      try {
        user = jwt.verify(authToken, process.env.JWT_SECRET, { maxAge: "1h" });
        if (!user.userId || !user.username) {
          throw new Error("Token JWT inválido - 'userId' ou 'username' não encontrado.");
        }
      }
      catch (err) {
        console.log('Erro de JWT no Socket:', err.message);
        return socket.disconnect();
      }

      // (Evento SEGURO) Usuário tenta entrar em uma sala
      socket.on('joinTeam', async (teamId) => {
        if (!teamId) return;

        // Verificação do "Porteiro" -->
        const isMember = await isUserMemberOfTeam(user.userId, teamId, authToken);
        if (!isMember) {
          console.log(`[SOCKET_REJECT] REJEITADO: ${user.username} (ID: ${socket.id}) tentou entrar na sala ${teamId}`);
          socket.emit('authError', 'Você não tem permissão para entrar neste chat.');
          return;
        }

        socket.join(teamId);
        console.log(`[SOCKET_JOIN] Usuário ${user.username} (ID: ${socket.id}) entrou na sala ${teamId}`);
      });

      // (Evento SEGURO) Usuário envia uma mensagem
      socket.on('sendMessage', async (data, callback) => {
        console.log("sendMessage", data);
        if (!data.teamId || !data.message) {
          return;
        }

        // <-- MUDANÇA NECESSÁRIA: Verificação do "Porteiro" -->
        const isMember = await isUserMemberOfTeam(user.userId, data.teamId, authToken);
        if (!isMember) {
          console.log(`[SOCKET_REJECT] REJEITADO: ${user.username} (ID: ${socket.id}) tentou ENVIAR MSG para sala ${data.teamId}`);
          socket.emit('authError', 'Você não tem permissão para enviar mensagens para esta equipe.');
          return;
        }

        const message = new Message({
          author: user.username,
          userId: user.userId, // Salva o userId
          message: data.message,
          type: 'text',
          teamId: data.teamId
        });

        await message.save();
        console.log(data.teamId);
        io.to(data.teamId).emit('receivedMessage', message);
        console.log("receivedMessage", message);
        callback({
          status: 'success',
          message: 'Mensagem enviada com sucesso'
        })
      });
    });


    // --- Inicialização do Servidor ---
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => console.log(` Chat rodando na porta ${PORT}`));
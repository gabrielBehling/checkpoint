const express = require('express');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const multer = require('multer');
const { renderFile } = require('ejs');
const socketIO = require('socket.io');
const fs = require('fs');
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

const EVENTS_SERVICE_URL = process.env.EVENTS_SERVICE_URL || 'http://events-service:3000';

const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASSWORD;
const mongoDb = process.env.MONGO_DB;
const mongoUri = `mongodb://${mongoUser}:${mongoPass}@mongodb:27017/${mongoDb}?authSource=admin`;

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('MongoDB erro:', err));

const publicDir = path.join(__dirname, '../Implementacao_Socket_Teste');
app.use(express.static(publicDir));
app.use('/chat/uploads', express.static(path.join(publicDir, 'uploads')));
app.set('views', publicDir);
app.engine('html', renderFile);
app.set('view engine', 'html');

// Garante que a pasta existe
const uploadDir = path.join(publicDir, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
  })
});

// --- Função Porteiro ---
async function isUserMemberOfTeam(userId, teamId, authToken) {
  if (!userId || !teamId || !authToken) return false;

  const checkUrl = `${EVENTS_SERVICE_URL}/teams/${teamId}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(checkUrl, {
      method: 'GET',
      headers: { 'Cookie': `accessToken=${authToken}` },
      signal: controller.signal
    });

    if (!response.ok) return false;

    const body = await response.json();
    const members = body.data?.members;

    if (!Array.isArray(members)) return false;

    const userIdString = userId.toString();
    return members.some(member => member.userId.toString() === userIdString);

  } catch (error) {
    console.log(`[AUTH_CHECK] Erro: ${error.message}`);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

// --- ROTAS HTTP ---

app.get('/', (req, res) => {
  res.render('index.html');
});

// Rota de Upload
app.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { type, teamId } = req.body;
    const user = req.user;
    const authToken = req.cookies.accessToken;

    if (!user || !user.userId) {
        return res.status(401).json({ error: 'JWT inválido.' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    if (!teamId) {
      return res.status(400).json({ error: 'TeamId é obrigatório' });
    }

    const isMember = await isUserMemberOfTeam(user.userId, teamId, authToken);
    if (!isMember) {
      fs.unlink(req.file.path, () => {}); // Apaga arquivo se falhar auth
      return res.status(403).json({ error: 'Não autorizado.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    const message = new Message({
      author: user.username,
      userId: user.userId,
      type: type || 'image',
      fileUrl: fileUrl,    
      teamId: teamId,
      timestamp: new Date()
    });

    await message.save();

    // EMISSÃO EM TEMPO REAL
    io.to(teamId).emit('receivedMessage', message);

    res.json({ success: true, fileUrl: fileUrl });

  } catch (error) {
    console.error('Erro upload:', error);
    res.status(500).json({ error: 'Erro interno.' });
  }
  
});

// Comentários de eventos
app.post('/events/:eventId/comments', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { content } = req.body;
    const user = req.user;

    if (!content || !content.trim()) return res.status(400).json({ error: 'Conteúdo obrigatório' });

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
    res.status(500).json({ error: 'Erro ao criar comentário' });
  }
});

app.get('/events/:eventId/comments', async (req, res) => {
  try {
    const { eventId } = req.params;
    const comments = await Message.find({ eventId: eventId, type: 'comment' })
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar comentários' });
  }
});

// Mensagens Chat
app.get('/messages/:teamId', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;
    const user = req.user;
    const authToken = req.cookies.accessToken;

    const isMember = await isUserMemberOfTeam(user.userId, teamId, authToken);
    if (!isMember) return res.status(403).json({ error: 'Não autorizado.' });

    const messages = await Message.find({ teamId: teamId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// Servir arquivos estáticos
app.get('/upload/:filename', (req, res) => {
  const filePath = path.join(publicDir, 'uploads', req.params.filename);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) return res.status(404).json({ error: 'Arquivo não encontrado' });
    res.sendFile(filePath);
  });
});

// --- SOCKET.IO ---

function getCookie(cookieString, cname) {
  if (!cookieString) return "";
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(cookieString);
  let ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
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
    if (!user.userId || !user.username) throw new Error("Token inválido");
  } catch (err) {
    return socket.disconnect();
  }

  socket.on('joinTeam', async (teamId) => {
    if (!teamId) return;
    const isMember = await isUserMemberOfTeam(user.userId, teamId, authToken);
    if (!isMember) {
      socket.emit('authError', 'Sem permissão.');
      return;
    }
    socket.join(teamId);
  });

  socket.on('sendMessage', async (data, callback) => {
    if (!data.teamId || !data.message) return;

    const isMember = await isUserMemberOfTeam(user.userId, data.teamId, authToken);
    if (!isMember) {
      socket.emit('authError', 'Sem permissão.');
      return;
    }

    const message = new Message({
      author: user.username,
      userId: user.userId,
      message: data.message,
      type: 'text',
      teamId: data.teamId
    });

    await message.save();
    io.to(data.teamId).emit('receivedMessage', message);
    
    if (callback) callback({ status: 'success' });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Chat rodando na porta ${PORT}`));
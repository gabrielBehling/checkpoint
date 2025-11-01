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

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    path: 'api/chat',
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  cookie: true
});

// MongoDB (via Docker)
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASSWORD;
const mongoDb = process.env.MONGO_DB;
const mongoUri = `mongodb://${mongoUser}:${mongoPass}@mongodb:27017/${mongoDb}?authSource=admin`;

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(' MongoDB conectado'))
  .catch(err => console.error(' MongoDB erro:', err));

// front
const publicDir = path.join(__dirname, '../Implementacao_Socket_Teste');
app.use(express.static(publicDir));
app.use('/chat/uploads', express.static(path.join(publicDir, 'uploads')));
app.set('views', publicDir);
app.engine('html', renderFile);
app.set('view engine', 'html');

// Multer (uploads)
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(publicDir, 'uploads'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
  })
});

// Rotas
app.get('/', (req, res) => {
  res.render('index.html');
});

// FRONT: A rota de upload precisa ser adaptada para 'teamId'

app.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  const { author, type, teamId } = req.body; // <-- ALTERAÇÃO: Receber teamId
  if (!teamId) {
    return res.status(400).json({ error: 'TeamId é obrigatório' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  const message = new Message({
    author,
    type,
    fileUrl,
    teamId: teamId // Salvar teamId
  });

  const fs = require('fs');

  // Rota GET para servir arquivos da pasta uploads
  app.get('/upload/:filename', (req, res) => {
    const filePath = path.join(publicDir, 'uploads', req.params.filename);

    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
      }
      res.sendFile(filePath);
    });
  });

  await message.save();
  io.to(teamId).emit('receivedMessage', message); // <-- ALTERAÇÃO: Emitir apenas para a sala
  res.json({ success: true });
});

// Sistema de chat com o soketIO
io.on('connection', socket => {
  console.log(`ID Conectado: ${socket.id}`);
  socket.cookie = socket.handshake.headers.cookie || socket.request.headers.cookie

  function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(socket.cookie);
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

  let user;
  try {
    user = jwt.verify(getCookie('accessToken'), process.env.JWT_SECRET, { maxAge: "1h" });
  }
  catch (err) {
    if(err instanceof jwt.TokenExpiredError){
      return socket.disconnect();
    }
    console.log(err)
    return socket.disconnect();
  }

  // <-- ALTERAÇÃO 1: Adicionar evento para entrar na sala -->
  socket.on('joinTeam', (teamId) => {
    if (teamId) {
      socket.join(teamId);
      console.log(`Usuário ${user.username} (ID: ${socket.id}) entrou na sala ${teamId}`);
    }
  });

  // <-- ALTERAÇÃO 2: Modificar evento de enviar mensagem -->
  socket.on('sendMessage', async data => {
    // 'data' agora deve ser { message: "...", teamId: "..." }
    if (!data.teamId || !data.message) {
      console.log('Mensagem ou teamId faltando');
      return;
    }

    const message = new Message({
      author: user.username,
      message: data.message,
      type: 'text',
      teamId: data.teamId // <-- Salvar o teamId
    });

    await message.save();

    //  Emitir apenas para a sala correta 
    io.to(data.teamId).emit('receivedMessage', message);
  });
});

// Rota para buscar mensagens por equipe 
app.get('/messages/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    if (!teamId) {
      return res.status(400).json({ error: 'TeamId é obrigatório' });
    }

    //  Filtrar mensagens pelo id do time 
    const messages = await Message.find({ teamId: teamId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.log('Erro ao buscar mensagens:', err);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(` Chat rodando na porta ${PORT}`));


// app.get('/', (req, res) => {
//     res.json({
//         status: 'OK',
//         message: 'Chat Service is running'
//     });
// });
// ...
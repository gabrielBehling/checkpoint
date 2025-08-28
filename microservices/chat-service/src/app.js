require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const multer = require('multer');
const { renderFile } = require('ejs');
const socketIO = require('socket.io');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    path: '/chat',
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
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

app.post('/upload', upload.single('file'), async (req, res) => {
  const { author, type } = req.body;
  const fileUrl = `/uploads/${req.file.filename}`;
  const message = new Message({ author, type, fileUrl });

  await message.save();
  io.emit('receivedMessage', message);
  res.json({ success: true });
});

// Sistema de chat com o soketIO
io.on('connection', socket => {
  console.log(`ID Conectado: ${socket.id}`);

  socket.on('sendMessage', async data => {
    const message = new Message({
      author: data.author,
      message: data.message,
      type: 'text'
    });

    await message.save();
    io.emit('receivedMessage', message);
  });
});

// Rota para buscar as mesagens antigas do mongo
app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error('Erro ao buscar mensagens:', err);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(` Chat rodando na porta ${PORT}`));


// app.get('/', (req, res) => {
//     res.json({
//         status: 'OK',
//         message: 'Chat Service is running'
//     });
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Chat Service is running on port ${PORT}`);
// });
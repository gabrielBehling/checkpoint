const express = require('express');
const path = require('path');
const { renderFile } = require('ejs');
const http = require('http');
const socketIO = require('socket.io');
const validator = require('validator');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);



app.use(express.static(path.join(__dirname, '../Implementacao_Socket_Teste')));
app.set('views', path.join(__dirname, '../Implementacao_Socket_Teste'));
app.engine('html', renderFile);
app.set('view engine', 'html');

app.use('/', (req, res) => {
    res.render('index.html');
});

let messages = [];

io.on('connection', socket => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('sendMessage', data => {
        
        messages.push(data);
        socket.broadcast.emit('receivedMessage', data);
    });
});

server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});


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
const express = require('express');

const app = express();

// Middleware para processar JSON
app.use(express.json());

// Rota de health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Auth Service is running'
    });
});

// Rotas de autenticação
app.post('/login', (req, res) => {
    res.json({
        message: 'Login endpoint',
        timestamp: new Date().toISOString()
    });
});

app.post('/register', (req, res) => {
    res.json({
        message: 'Register endpoint',
        timestamp: new Date().toISOString()
    });
});

app.get('/me', (req, res) => {
    res.json({
        message: 'Get current user endpoint',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`);
});
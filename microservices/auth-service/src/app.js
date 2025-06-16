const express = require('express');
const redis = require('redis');
const sql = require('mssql');
const bcrypt = require('bcrypt');

const app = express();

// Configuração do banco de dados
const dbConfig = {
    server: process.env.MSSQL_SERVER,
    port: parseInt(process.env.MSSQL_PORT),
    database: process.env.MSSQL_DATABASE,
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    options: {
        trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === 'True',
        encrypt: true
    }
};

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

app.post('/register', async (req, res) => {
    let {username, email, password, userRole} = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    if (!userRole) {
        userRole = 'Visitor'; // Default role
    } else if (!['Administrator', 'Player', 'Organizer', 'Visitor'].includes(userRole)) {
        return res.status(400).json({ error: 'Invalid user role. Allowed roles are Administrator, Player, Organizer and Visitor' });
    }

    if (userRole === 'Administrator') {
        let { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'Token is required for Administrator role.' });
        }

        const redisClient = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        await redisClient.connect();
        const userId = await redisClient.get(token);
        if (!userId) {
            return res.status(401).json({ error: 'Invalid or expired token.' });
        }
        await redisClient.quit();

        try {
            await sql.connect(dbConfig);
            const result = await sql.query`
                SELECT userRole FROM Users WHERE id = ${userId}
            `;
            if (!result.recordset.length || result.recordset[0].userRole !== 'Administrator') {
                return res.status(403).json({ error: 'User is not an Administrator.' });
            }
        } catch (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
        } finally {
            await sql.close();
        }
    }

    try {
        const PasswordHash = await bcrypt.hash(password, 10);
        
        await sql.connect(dbConfig);
        const result = await sql.query`
            INSERT INTO Users (Username, Email, PasswordHash, UserRole)
            VALUES (${username}, ${email}, ${PasswordHash}, ${userRole});
        `;
    } catch (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
    } finally {
        await sql.close();
    }

    res.json({
        message: `User ${username} registered successfully as ${userRole}.`,
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
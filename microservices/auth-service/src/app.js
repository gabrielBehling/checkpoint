const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

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

app.use(express.json());
app.use(cookieParser());

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
    const {username, email, password, userRole} = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    if (!userRole) {
        userRole = 'Visitor'; // Default role
    } else if (!['Administrator', 'Player', 'Organizer', 'Visitor'].includes(userRole)) {
        return res.status(400).json({ error: 'Invalid user role. Allowed roles are Administrator, Player, Organizer and Visitor' });
    }

    if (userRole === 'Administrator') {
        let { token } = req.cookies;
        if (!token) {
            return res.status(400).json({ error: 'Token is required for Administrator role.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET, { maxAge: '1h' });
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid or expired token.' });
        }
        
        if (decoded.userRole !== 'Administrator') {
            return res.status(401).json({ error: 'User is not an Administrator.' });
        }
    }

    try {        
        await sql.connect(dbConfig);
        const usernameExists = await sql.query`
            SELECT * FROM UsersNotDeleted WHERE Username = ${username};
        `;
        if (usernameExists.recordset.length > 0) {
            return res.status(400).json({ error: 'Username already exists.' });
        }

        const emailExists = await sql.query`
            SELECT * FROM UsersNotDeleted WHERE Email = ${email};
        `;
        if (emailExists.recordset.length > 0) {
            return res.status(400).json({ error: 'Email already exists.' });
        }

        const PasswordHash = await bcrypt.hash(password, 10);
        
        const result = await sql.query`
            INSERT INTO Users (Username, Email, PasswordHash, UserRole)
            VALUES (${username}, ${email}, ${PasswordHash}, ${userRole});
        `;
    } catch (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
    } finally {
        await sql.close();
    }

    const token = jwt.sign({ username, userRole }, process.env.JWT_SECRET, { expiresIn: "1h"});
    res.cookie("authToken", token, {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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



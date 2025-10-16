// controllers/matchController.js

const express = require("express");
const router = express.Router();
const sql = require("mssql");

const dbConfig = {
    server: process.env.MSSQL_SERVER,
    port: parseInt(process.env.MSSQL_PORT),
    database: process.env.MSSQL_DATABASE,
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    options: {
        trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === "True",
        encrypt: true,
    },
};

// Importar os handlers (pra ficar mais organizado)
const leaderboardRouter = require("../handlers/leaderboard");

// vai usar o middleware para todas as rotas do controller
// Ele busca o evento, valida, e o anexa ao request para os sub-controllers usarem.
const getEventAndValidate = async (req, res, next) => {
    const { eventId } = req.params;
    if (isNaN(parseInt(eventId))) {
        return res.status(400).json({ error: "Invalid eventId" });
    }

    let pool;
    try {
        pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('eventId', sql.Int, eventId)
            .query('SELECT EventID, Mode, CreatedBy FROM Events WHERE EventID = @eventId AND DeletedAt IS NULL');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }
        
        // Anexa informações úteis ao objeto `res.locals` para as próximas rotas
        res.locals.event = result.recordset[0];
        res.locals.db_pool = pool; // Passa a pool de conexão para evitar reconectar

        next();

    } catch (error) {
        console.error("Database connection error in middleware:", error);
        res.status(500).json({ error: "Failed to process request." });
        if (pool) await pool.close();
    }
};

// Aplica o middleware a todas as rotas que contêm /:eventId
router.use("/:eventId", getEventAndValidate);

// Roteamento baseado no modo do evento
router.use("/:eventId/leaderboard", (req, res, next) => {
    if (res.locals.event.Mode !== 'Leaderboard') {
        res.locals.db_pool.close();
        return res.status(400).json({ error: `This endpoint is only for 'Leaderboard' events. This event is of type '${res.locals.event.Mode}'.` });
    }
    // Verifica se o usuário autenticado é o criador do evento para rotas POST/PUT/DELETE
    if (req.method !== 'GET') {
        if (res.locals.event.CreatedBy !== req.user.userId) {
            res.locals.db_pool.close();
            return res.status(403).json({ error: "You are not authorized to manage this event's matches." });
        }
    }
    next();
}, leaderboardRouter);



// Middleware para fechar a conexão após a resposta ser enviada
router.use("/:eventId", (req, res, next) => {
    if (res.locals.db_pool) {
        res.on('finish', () => {
             res.locals.db_pool.close();
        });
    }
    next();
});

module.exports = router;
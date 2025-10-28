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
const singleEliminationRouter = require("../handlers/singleElimination");
const roundRobinRouter = require("../handlers/roundRobin");
const authMiddleware = require("../authMiddleware");

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
            .query('SELECT EventID, Mode, CreatedBy, Status FROM Events WHERE EventID = @eventId AND DeletedAt IS NULL');

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
router.use("/:eventId/leaderboard", authMiddleware, (req, res, next) => {
    if (res.locals.event.Mode !== 'Leaderboard') {
        res.locals.db_pool.close();
        return res.status(400).json({ error: `This endpoint is only for 'Leaderboard' events. This event is of type '${res.locals.event.Mode}'.` });
    }
    if (req.method === 'POST') {
        if (res.locals.event.status === 'Finished') {
            res.locals.db_pool.close();
            return res.status(400).json({ error: "Cannot modify a completed event." });
        }
    }
    next();
}, leaderboardRouter);

router.use("/:eventId/single-elimination", authMiddleware, (req, res, next) => {
    if (res.locals.event.Mode !== 'Single Elimination') {
        res.locals.db_pool.close();
        return res.status(400).json({ error: `This endpoint is only for 'Single Elimination' events. This event is of type '${res.locals.event.Mode}'.` });
    }

    // 2. Validar Status do Evento para rotas POST (gerar bracket, atualizar partida, finalizar)
    if (req.method === 'POST') {
        if (res.locals.event.status === 'Finished') {
            res.locals.db_pool.close();
            return res.status(400).json({ error: "Cannot modify a completed event." });
        }
    }
    next();
}, singleEliminationRouter);

router.use("/:eventId/round-robin", authMiddleware, (req, res, next) => {
    // 1. Validar Modo
    if (res.locals.event.Mode !== 'Round Robin') { // Use esta string exata
        res.locals.db_pool.close();
        return res.status(400).json({ error: `This endpoint is only for 'Round Robin' events. This event is of type '${res.locals.event.Mode}'.` });
    }

    // 2. Validar Status do Evento para rotas POST
    if (req.method === 'POST') {
        if (res.locals.event.Status === 'Finished') {
            res.locals.db_pool.close();
            return res.status(400).json({ error: "Cannot modify a completed event." });
        }
    }
    next();
}, roundRobinRouter);

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
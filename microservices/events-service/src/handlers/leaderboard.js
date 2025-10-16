// controllers/match-types/leaderboard.js

const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams é crucial para acessar o :eventId do pai
const sql = require("mssql");
const { object, array, number } = require("yup");
const authMiddleware = require("../../authMiddleware"); // Ajuste o caminho se necessário

// Schema de validação para a pontuação da rodada
let roundScoresSchema = object({
    scores: array().of(
        object({
            teamId: number().required("teamId is required"),
            points: number().required("points is required"),
        })
    ).min(1, "Scores array cannot be empty").required(),
});

// ROTA PARA ADICIONAR/ATUALIZAR PONTOS DE UMA RODADA
// Path: /:eventId/leaderboard/round/:roundNumber
router.post("/round/:roundNumber", authMiddleware, async (req, res) => {
    // O eventId é acessado via req.params graças ao mergeParams
    const { eventId, roundNumber } = req.params;
    const userId = req.user.userId;

    // A verificação se o evento é do tipo 'Leaderboard' e se o usuário é o dono já foi feita pelo controller principal (matchController.js)
    if (isNaN(parseInt(roundNumber))) {
        return res.status(400).json({ error: "Invalid roundNumber" });
    }

    try {
        const { scores } = await roundScoresSchema.validate(req.body);
        
        // A transação acontece aqui, na lógica específica
        const transaction = new sql.Transaction(res.locals.db_pool); // Usando a pool de conexão do middleware
        await transaction.begin();

        try {
            for (const score of scores) {
                const request = new sql.Request(transaction);
                await request
                    .input('eventId', sql.Int, eventId)
                    .input('teamId', sql.Int, score.teamId)
                    .input('roundNumber', sql.Int, roundNumber)
                    .input('points', sql.Decimal(10, 2), score.points)
                    .query(`
                        MERGE LeaderboardScores AS target
                        USING (SELECT @eventId AS EventID, @teamId AS TeamID, @roundNumber AS RoundNumber) AS source
                        ON (target.EventID = source.EventID AND target.TeamID = source.TeamID AND target.RoundNumber = source.RoundNumber)
                        WHEN MATCHED THEN
                            UPDATE SET Points = @points, LastModifiedAt = GETDATE()
                        WHEN NOT MATCHED BY TARGET THEN
                            INSERT (EventID, TeamID, RoundNumber, Points)
                            VALUES (@eventId, @teamId, @roundNumber, @points);
                    `);
            }
            await transaction.commit();
            res.status(200).json({ message: `Scores for round ${roundNumber} updated successfully.` });
        } catch (error) {
            await transaction.rollback();
            console.error(error);
            res.status(500).json({ error: "Transaction failed.", details: error.message });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ROTA PARA OBTER O RANKING/LEADERBOARD DE UM EVENTO =  Path: /:eventId/leaderboard
router.get("/", async (req, res) => {
    const { eventId } = req.params;

    try {
        const request = new sql.Request(res.locals.db_pool);
        const result = await request
            .input('eventId', sql.Int, eventId)
            .query(`
                SELECT
                    DENSE_RANK() OVER (ORDER BY SUM(ls.Points) DESC) as Rank,
                    t.TeamId, t.TeamName, t.LogoURL, SUM(ls.Points) as TotalPoints
                FROM LeaderboardScores ls
                INNER JOIN TeamsNotDeleted t ON ls.TeamID = t.TeamId
                WHERE ls.EventID = @eventId
                GROUP BY t.TeamId, t.TeamName, t.LogoURL
                ORDER BY TotalPoints DESC;
            `);
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
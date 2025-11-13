// controllers/match-types/leaderboard.js

const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams é crucial para acessar o :eventId do pai
const sql = require("mssql");
const { object, array, number } = require("yup");
const authMiddleware = require("../authMiddleware"); // Ajuste o caminho se necessário

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
    if (res.locals.event.CreatedBy !== req.user.userId) {
        res.locals.db_pool.close();
        return res.error("You are not authorized to manage this event's matches.", "UNAUTHORIZED", 403);
    }
    // O eventId é acessado via req.params graças ao mergeParams
    const { eventId, roundNumber } = req.params;
    const userId = req.user.userId;

    // A verificação se o evento é do tipo 'Leaderboard' e se o usuário é o dono já foi feita pelo controller principal (matchController.js)
    if (isNaN(parseInt(roundNumber))) {
        return res.error("Invalid roundNumber", "INVALID_ROUND_NUMBER", 400);
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
            return res.success({ roundNumber: parseInt(roundNumber) }, `Scores for round ${roundNumber} updated successfully.`, 200);
        } catch (error) {
            await transaction.rollback();
            console.error(error);
            return res.error("Transaction failed.", "TRANSACTION_FAILED", 500, { details: error.message });
        }
    } catch (error) {
        return res.error(error.message, "VALIDATION_ERROR", 400);
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
        return res.success(result.recordset, "Leaderboard retrieved successfully");
    } catch (error) {
        console.error(error);
        return res.error(error.message, "INTERNAL_ERROR", 500);
    }
});

// ROTA PARA OBTER OS DETALHES DE PONTOS POR RODADA = Path: /:eventId/leaderboard/rounds
router.get("/rounds", async (req, res) => {
    const { eventId } = req.params;

    try {
        const request = new sql.Request(res.locals.db_pool);
        const result = await request
            .input('eventId', sql.Int, eventId)
            .query(`
                SELECT
                    ls.RoundNumber,
                    t.TeamId,
                    t.TeamName,
                    t.LogoURL,
                    ls.Points,
                    ls.LastModifiedAt
                FROM LeaderboardScores ls
                INNER JOIN TeamsNotDeleted t ON ls.TeamID = t.TeamId
                WHERE ls.EventID = @eventId
                ORDER BY ls.RoundNumber ASC, ls.Points DESC, t.TeamName ASC;
            `);
        
        const rounds = result.recordset.reduce((acc, score) => {
            const { RoundNumber, ...teamScore } = score;
            
            // Encontra ou cria o objeto para esta rodada
            let roundEntry = acc.find(r => r.roundNumber === RoundNumber);
            
            if (!roundEntry) {
                roundEntry = {
                    roundNumber: RoundNumber,
                    scores: [] 
                };
                acc.push(roundEntry);
            }
            
            roundEntry.scores.push(teamScore);
            
            return acc;
        }, []); 

        rounds.sort((a, b) => a.roundNumber - b.roundNumber);

        res.status(200).json(rounds);

    } catch (error) {
        console.error("Failed to get scores by round:", error);
        res.error("Failed to retrieve round scores.","INTERNAL_ERROR", 500)
    }
});

//ROTA PARA O CRIADOR DO EVENTO FINALIZAR O EVENTO 
router.post("/finish", authMiddleware, async (req, res) =>{
    const { eventId } = req.params
    if(res.locals.event.CreatedBy == req.user.userId){
        try{ 
            const request = new sql.Request(res.locals.db_pool)
            await request
            .input('eventId', sql.Int, eventId)
            .query(`Update Events set Status = 'Finished' where EventId = @eventId`)
            return res.success(null, `Event has been finished!`);
        }
        catch (error){
            console.error(error);
            return res.error(error.message, "INTERNAL_ERROR", 500);
        }
    }
    
   
})
module.exports = router;
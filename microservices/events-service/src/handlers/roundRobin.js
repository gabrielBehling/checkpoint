// handlers/roundRobin.js

const express = require("express");
const router = express.Router({ mergeParams: true });
const sql = require("mssql");
const { object, number } = require("yup");

// Schema para definir os pontos
let settingsSchema = object({
    pointsPerWin: number().required(),
    pointsPerDraw: number().required(),
    pointsPerLoss: number().required()
});

// Schema para registrar um placar
let matchResultSchema = object({
    team1Score: number().required(),
    team2Score: number().required()
});


/**
 * ROTA: POST /:eventId/round-robin/settings
 * Define os pontos de Vitória, Empate e Derrota para o evento.
 */
router.post("/settings", async (req, res) => {
    const { eventId } = req.params;
    
    // Autorização
    if (res.locals.event.CreatedBy !== req.user.userId) {
        return res.error("You are not authorized to configure this event.", "UNAUTHORIZED", 403);
    }
    
    // Validação do Body
    let settings;
    try {
        settings = await settingsSchema.validate(req.body);
    } catch (error) {
        return res.error(error.message, "VALIDATION_ERROR", 400);
    }

    try {
        const request = new sql.Request(res.locals.db_pool);
        // Usa MERGE para fazer um "UPSERT" (Update ou Insert)
        await request
            .input('eventId', sql.Int, eventId)
            .input('win', sql.Decimal(5, 2), settings.pointsPerWin)
            .input('draw', sql.Decimal(5, 2), settings.pointsPerDraw)
            .input('loss', sql.Decimal(5, 2), settings.pointsPerLoss)
            .query(`
                MERGE EventSettings_RoundRobin AS Target
                USING (SELECT @eventId AS EventID) AS Source
                ON (Target.EventID = Source.EventID)
                WHEN MATCHED THEN
                    UPDATE SET PointsPerWin = @win, PointsPerDraw = @draw, PointsPerLoss = @loss
                WHEN NOT MATCHED THEN
                    INSERT (EventID, PointsPerWin, PointsPerDraw, PointsPerLoss)
                    VALUES (@eventId, @win, @draw, @loss);
            `);
        
        return res.success(null, "Event point settings updated successfully.");
    } catch (error) {
        console.error(error);
        return res.error("Failed to update settings.", "INTERNAL_ERROR", 500, { details: error.message });
    }
});


/**
 * ROTA: POST /:eventId/round-robin/generate-schedule
 * Gera a agenda de partidas (todos contra todos)
 */
router.post("/generate-schedule", async (req, res) => {
    const { eventId } = req.params;
    
    if (res.locals.event.CreatedBy !== req.user.userId) {
        return res.error("You are not authorized to manage this event.", "UNAUTHORIZED", 403);
    }

    const transaction = new sql.Transaction(res.locals.db_pool);
    try {
        await transaction.begin();

        // 1. Verificar se a agenda já foi gerada
        const checkRequest = new sql.Request(transaction);
        const checkResult = await checkRequest
            .input('eventId', sql.Int, eventId)
            .query('SELECT COUNT(MatchID) as MatchCount FROM RoundRobinMatches WHERE EventID = @eventId');
        
        if (checkResult.recordset[0].MatchCount > 0) {
            await transaction.rollback();
            return res.error("Schedule has already been generated for this event.", "SCHEDULE_ALREADY_GENERATED", 400);
        }

        // 2. Buscar equipes aprovadas
        const teamsRequest = new sql.Request(transaction);
        const teamsResult = await teamsRequest
            .input('eventId', sql.Int, eventId)
            .query(`SELECT er.TeamID FROM EventRegistrations er WHERE er.EventID = @eventId AND er.Status = 'Approved' AND er.DeletedAt IS NULL`);
        
        const teams = teamsResult.recordset.map(t => t.TeamID);

        if (teams.length < 2) {
            await transaction.rollback();
            return res.error("At least 2 approved teams are required to generate a schedule.", "NOT_ENOUGH_TEAMS", 400);
        }

        // 3. Gerar pares (Todos contra Todos)
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                const team1_ID = teams[i];
                const team2_ID = teams[j];
                
                const insertRequest = new sql.Request(transaction);
                await insertRequest
                    .input('eventId', sql.Int, eventId)
                    .input('team1', sql.Int, team1_ID)
                    .input('team2', sql.Int, team2_ID)
                    .query(`
                        INSERT INTO RoundRobinMatches (EventID, Team1_ID, Team2_ID, Status)
                        VALUES (@eventId, @team1, @team2, 'Pending')
                    `);
            }
        }

    await transaction.commit();
    return res.success({ teamCount: teams.length }, `Schedule generated successfully with ${teams.length} teams.`, 201);

    } catch (error) {
        await transaction.rollback();
        console.error(error);
        return res.error("Failed to generate schedule.", "INTERNAL_ERROR", 500, { details: error.message });
    }
});


/**
 * ROTA: GET /:eventId/round-robin/schedule
 * Busca a agenda completa de partidas.
 */
router.get("/schedule", async (req, res) => {
    const { eventId } = req.params;
    try {
        const request = new sql.Request(res.locals.db_pool);
        const result = await request
            .input('eventId', sql.Int, eventId)
            .query(`
                SELECT 
                    M.MatchID, M.Status,
                    M.Team1_ID, T1.TeamName AS Team1_Name, T1.LogoURL AS Team1_Logo, M.Team1_Score,
                    M.Team2_ID, T2.TeamName AS Team2_Name, T2.LogoURL AS Team2_Logo, M.Team2_Score,
                    M.Winner_ID, W.TeamName AS Winner_Name
                FROM RoundRobinMatches M
                INNER JOIN TeamsNotDeleted T1 ON M.Team1_ID = T1.TeamId
                INNER JOIN TeamsNotDeleted T2 ON M.Team2_ID = T2.TeamId
                LEFT JOIN TeamsNotDeleted W ON M.Winner_ID = W.TeamId
                WHERE M.EventID = @eventId
                ORDER BY M.MatchID;
            `);
        
        return res.success(result.recordset, "Schedule retrieved successfully");
    } catch (error) {
        console.error(error);
        return res.error(error.message, "INTERNAL_ERROR", 500);
    }
});


/**
 * ROTA: POST /:eventId/round-robin/match/:matchId
 * Atualiza o resultado de uma partida.
 */
router.post("/match/:matchId", async (req, res) => {
    const { eventId, matchId } = req.params;

    if (res.locals.event.CreatedBy !== req.user.userId) {
        return res.error("You are not authorized to update match results.", "UNAUTHORIZED", 403);
    }

    let resultData;
    try {
        resultData = await matchResultSchema.validate(req.body);
    } catch (error) {
        return res.error(error.message, "VALIDATION_ERROR", 400);
    }

    const { team1Score, team2Score } = resultData;
    
    try {
        const request = new sql.Request(res.locals.db_pool);

        // 1. Buscar dados da partida (para saber quem é Team1 e Team2)
        const matchResult = await request
            .input('matchId', sql.Int, matchId)
            .input('eventId', sql.Int, eventId)
            .query('SELECT Team1_ID, Team2_ID, Status FROM RoundRobinMatches WHERE MatchID = @matchId AND EventID = @eventId');
        
        if (matchResult.recordset.length === 0) {
            return res.error("Match not found.", "MATCH_NOT_FOUND", 404);
        }
        
        const match = matchResult.recordset[0];
        if (match.Status === 'Finished') {
            return res.error("This match has already been finished.", "MATCH_ALREADY_FINISHED", 400);
        }

        // 2. Determinar Vencedor
        let winnerId = null;
        if (team1Score > team2Score) {
            winnerId = match.Team1_ID;
        } else if (team2Score > team1Score) {
            winnerId = match.Team2_ID;
        } // Se for empate, winnerId permanece null

        // 3. Atualizar a partida
        const updateRequest = new sql.Request(res.locals.db_pool);
        await updateRequest
            .input('matchId', sql.Int, matchId)
            .input('t1Score', sql.Int, team1Score)
            .input('t2Score', sql.Int, team2Score)
            .input('winnerId', sql.Int, winnerId) // Envia NULL se for empate
            .query(`
                UPDATE RoundRobinMatches 
                SET Team1_Score = @t1Score, Team2_Score = @t2Score, Winner_ID = @winnerId, Status = 'Finished', LastModifiedAt = GETDATE()
                WHERE MatchID = @matchId
            `);
        
    return res.success(null, "Match result recorded successfully.");

    } catch (error) {
        console.error(error);
        return res.error("Failed to update match.", "INTERNAL_ERROR", 500, { details: error.message });
    }
});


/**
 * ROTA: GET /:eventId/round-robin/ranking
 * Busca a tabela de classificação (ranking)
 */
router.get("/ranking", async (req, res) => {
    const { eventId } = req.params;
    
    try {
        const pool = res.locals.db_pool;

        // 1. Buscar as configurações de pontos
        const settingsRequest = new sql.Request(pool);
        const settingsResult = await settingsRequest
            .input('eventId', sql.Int, eventId)
            .query('SELECT PointsPerWin, PointsPerDraw, PointsPerLoss FROM EventSettings_RoundRobin WHERE EventID = @eventId');

        if (settingsResult.recordset.length === 0) {
            return res.error("Point settings for this event are not configured. Please set them first.", "SETTINGS_NOT_CONFIGURED", 400);
        }
        
        const settings = settingsResult.recordset[0];

        // 2. Query principal para calcular o ranking
        const rankingRequest = new sql.Request(pool);
        
        // Passamos os pontos como parâmetros para a query
        rankingRequest.input('eventId', sql.Int, eventId);
        rankingRequest.input('winPoints', sql.Decimal(5, 2), settings.PointsPerWin);
        rankingRequest.input('drawPoints', sql.Decimal(5, 2), settings.PointsPerDraw);
        rankingRequest.input('lossPoints', sql.Decimal(5, 2), settings.PointsPerLoss);

        const rankingResult = await rankingRequest.query(`
            -- Usamos uma Common Table Expression (CTE) para "desdobrar" as partidas
            ;WITH MatchResults AS (
                -- Coleta resultados da perspectiva do Time 1
                SELECT 
                    Team1_ID AS TeamID,
                    Team1_Score AS GoalsFor,
                    Team2_Score AS GoalsAgainst,
                    CASE 
                        WHEN Winner_ID = Team1_ID THEN @winPoints
                        WHEN Winner_ID IS NULL THEN @drawPoints
                        ELSE @lossPoints
                    END AS Points,
                    CASE WHEN Winner_ID = Team1_ID THEN 1 ELSE 0 END AS Win,
                    CASE WHEN Winner_ID IS NULL THEN 1 ELSE 0 END AS Draw,
                    CASE WHEN Winner_ID = Team2_ID THEN 1 ELSE 0 END AS Loss
                FROM RoundRobinMatches
                WHERE EventID = @eventId AND Status = 'Finished'
                
                UNION ALL
                
                -- Coleta resultados da perspectiva do Time 2
                SELECT 
                    Team2_ID AS TeamID,
                    Team2_Score AS GoalsFor,
                    Team1_Score AS GoalsAgainst,
                    CASE 
                        WHEN Winner_ID = Team2_ID THEN @winPoints
                        WHEN Winner_ID IS NULL THEN @drawPoints
                        ELSE @lossPoints
                    END AS Points,
                    CASE WHEN Winner_ID = Team2_ID THEN 1 ELSE 0 END AS Win,
                    CASE WHEN Winner_ID IS NULL THEN 1 ELSE 0 END AS Draw,
                    CASE WHEN Winner_ID = Team1_ID THEN 1 ELSE 0 END AS Loss
                FROM RoundRobinMatches
                WHERE EventID = @eventId AND Status = 'Finished'
            )
            -- Agora, agrupamos os resultados por time
            SELECT
                DENSE_RANK() OVER (ORDER BY SUM(MR.Points) DESC, (SUM(MR.GoalsFor) - SUM(MR.GoalsAgainst)) DESC, SUM(MR.GoalsFor) DESC) as Rank,
                T.TeamID,
                t.TeamName,
                t.LogoURL,
                COUNT(MR.TeamID) AS MatchesPlayed,
                SUM(MR.Win) AS Wins,
                SUM(MR.Draw) AS Draws,
                SUM(MR.Loss) AS Losses,
                SUM(MR.GoalsFor) AS GoalsFor,
                SUM(MR.GoalsAgainst) AS GoalsAgainst,
                (SUM(MR.GoalsFor) - SUM(MR.GoalsAgainst)) AS GoalDifference,
                SUM(MR.Points) AS TotalPoints
            FROM MatchResults MR
            INNER JOIN TeamsNotDeleted T ON MR.TeamID = T.TeamId
            GROUP BY T.TeamID, t.TeamName, t.LogoURL
            ORDER BY TotalPoints DESC, GoalDifference DESC, GoalsFor DESC;
        `);

    return res.success(rankingResult.recordset, "Ranking retrieved successfully");

    } catch (error) {
        console.error(error);
        return res.error("Failed to get ranking.", "INTERNAL_ERROR", 500, { details: error.message });
    }
});


/**
 * ROTA: POST /:eventId/round-robin/finish
 * (Consistente com seus outros handlers)
 */
router.post("/finish", async (req, res) =>{
    const { eventId } = req.params;
    
    if(res.locals.event.CreatedBy !== req.user.userId){
        return res.error("You are not authorized to finish this event.", "UNAUTHORIZED", 403);
    }
    
    try { 
        const request = new sql.Request(res.locals.db_pool);
        await request
            .input('eventId', sql.Int, eventId)
            .query(`UPDATE Events SET Status = 'Finished' WHERE EventID = @eventId`);
        
        return res.success(null, `Event has been finished!`);
    } catch (error) {
        console.error(error);
        return res.error(error.message, "INTERNAL_ERROR", 500);
    }
});

module.exports = router;
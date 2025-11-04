const express = require("express");
const router = express.Router({ mergeParams: true });
const sql = require("mssql");
const { object, number, string } = require("yup");
const authMiddleware = require("../authMiddleware");
 
// Schema para validar o resultado de uma partida
let matchResultSchema = object({
    team1Score: number().required("Team 1 score is required"),
    team2Score: number().required("Team 2 score is required"),
});

let updateStatusSchema = object({
    status: string().oneOf(['Pending', 'Approved', 'Rejected', 'Cancelled'], "Invalid status value").required()
});

/**
 * Função Auxiliar: Embaralha um array (Algoritmo Fisher-Yates)
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * ROTA: POST /:eventId/single-elimination/generate-bracket
 * Gera a bracket completa, lidando com byes e numeração de rodada.
 */
router.post("/generate-bracket", async (req, res) => {
    const { eventId } = req.params;

    if (res.locals.event.CreatedBy !== req.user.userId) {
        return res.status(403).json({ error: "You are not authorized to manage this event's matches." });
    }

    const transaction = new sql.Transaction(res.locals.db_pool);
    try {
        await transaction.begin();

        // 1. Verificar se a bracket já foi gerada
        const checkRequest = new sql.Request(transaction);
        const checkResult = await checkRequest
            .input('eventId', sql.Int, eventId)
            .query('SELECT COUNT(MatchID) as MatchCount FROM KnockoutMatches WHERE EventID = @eventId');
        
        if (checkResult.recordset[0].MatchCount > 0) {
            await transaction.rollback();
            return res.status(400).json({ error: "Bracket has already been generated for this event." });
        }

        // 2. Buscar equipes aprovadas
        const teamsRequest = new sql.Request(transaction);
        const teamsResult = await teamsRequest
            .input('eventId', sql.Int, eventId)
            .query(`SELECT er.TeamID FROM EventRegistrations er WHERE er.EventID = @eventId AND er.Status = 'Approved' AND er.DeletedAt IS NULL`);
        
        let teams = teamsResult.recordset.map(t => t.TeamID);
        const n = teams.length;

        if (n < 2) {
            await transaction.rollback();
            return res.status(400).json({ error: "At least 2 teams are required to generate a bracket." });
        }

        // 3. Calcular tamanho da bracket e byes
        const bracketSize = 2 ** Math.ceil(Math.log2(n));
        const numByes = bracketSize - n;
        const numPlayInTeams = n - numByes;
        
        teams = shuffleArray(teams);
        
        const playInTeams = teams.slice(0, numPlayInTeams);
        const byeTeams = teams.slice(numPlayInTeams);

        const matchesByRound = {};
        const playInMatchIds = [];

        // 4. Gerar Rodada 1 (Play-in)
        for (let i = 0; i < numPlayInTeams; i += 2) {
            const matchNum = i / 2 + 1;
            const playInRequest = new sql.Request(transaction);
            const insertResult = await playInRequest
                .input('eventId', sql.Int, eventId)
                .input('round', sql.Int, bracketSize)
                .input('matchNum', sql.Int, matchNum)
                .input('team1', sql.Int, playInTeams[i])
                .input('team2', sql.Int, playInTeams[i + 1])
                .query(`
                    INSERT INTO KnockoutMatches (EventID, RoundNumber, MatchNumber, Team1_ID, Team2_ID, Status)
                    OUTPUT INSERTED.MatchID
                    VALUES (@eventId, @round, @matchNum, @team1, @team2, 'Ready');
                `);
            playInMatchIds.push(insertResult.recordset[0].MatchID);
        }

        // ================== INÍCIO DA CORREÇÃO ==================
        // Se n=2, a "play-in" (Passo 4) já é a final. Não precisamos dos passos 5, 6, 7.
        if (n === 2) {
            await transaction.commit();
            return res.status(201).json({ message: `Bracket generated successfully for 2 teams.` });
        }
        // =================== FIM DA CORREÇÃO ====================

        // 5. Gerar "slots" vazios para as rodadas futuras
        let currentRoundNum = bracketSize / 2;
        while (currentRoundNum >= 2) {
            const matchesInRound = currentRoundNum / 2;
            matchesByRound[currentRoundNum] = [];
            for (let m = 1; m <= matchesInRound; m++) {
                const slotRequest = new sql.Request(transaction);
                const insertResult = await slotRequest
                    .input('eventId', sql.Int, eventId)
                    .input('round', sql.Int, currentRoundNum)
                    .input('matchNum', sql.Int, m)
                    .query(`
                        INSERT INTO KnockoutMatches (EventID, RoundNumber, MatchNumber, Status)
                        OUTPUT INSERTED.MatchID
                        VALUES (@eventId, @round, @matchNum, 'Pending');
                    `);
                matchesByRound[currentRoundNum].push(insertResult.recordset[0].MatchID);
            }
            currentRoundNum /= 2;
        }

        // 6. Ligar a estrutura da bracket
        currentRoundNum = bracketSize / 2;
        while (currentRoundNum >= 4) {
            const matchesInThisRound = matchesByRound[currentRoundNum];
            const matchesInNextRound = matchesByRound[currentRoundNum / 2];
            
            for (let i = 0; i < matchesInThisRound.length; i += 2) {
                const sourceMatch1_ID = matchesInThisRound[i];
                const sourceMatch2_ID = matchesInThisRound[i+1];
                const targetMatch_ID = matchesInNextRound[i / 2];

                const linkRequest = new sql.Request(transaction);
                await linkRequest
                    .input('targetMatchId', sql.Int, targetMatch_ID)
                    .input('source1', sql.Int, sourceMatch1_ID)
                    .input('source2', sql.Int, sourceMatch2_ID)
                    .query(`
                        UPDATE KnockoutMatches 
                        SET Team1_SourceMatchID = @source1, Team2_SourceMatchID = @source2
                        WHERE MatchID = @targetMatchId;
                    `);
            }
            currentRoundNum /= 2;
        }

        // 7. Popular a primeira rodada "cheia" com "byes" e vencedores do "play-in"
        const firstFullRoundMatches = matchesByRound[bracketSize / 2];
        let entrants = [
            ...byeTeams.map(id => ({ type: 'team', id })),
            ...playInMatchIds.map(id => ({ type: 'match', id }))
        ];
        entrants = shuffleArray(entrants);

        for (let i = 0; i < entrants.length; i += 2) {
            const targetMatch_ID = firstFullRoundMatches[i / 2];
            const entrant1 = entrants[i];
            const entrant2 = entrants[i+1];

            const team1_id = entrant1.type === 'team' ? entrant1.id : null;
            const source1_id = entrant1.type === 'match' ? entrant1.id : null;
            const team2_id = entrant2.type === 'team' ? entrant2.id : null;
            const source2_id = entrant2.type === 'match' ? entrant2.id : null;
            const status = (team1_id && team2_id) ? 'Ready' : 'Pending';
            
            const populateRequest = new sql.Request(transaction);
            await populateRequest
                .input('targetMatchId', sql.Int, targetMatch_ID)
                .input('team1Id', sql.Int, team1_id)
                .input('source1Id', sql.Int, source1_id)
                .input('team2Id', sql.Int, team2_id)
                .input('source2Id', sql.Int, source2_id)
                .input('status', sql.NVarChar, status)
                .query(`
                    UPDATE KnockoutMatches 
                    SET Team1_ID = @team1Id, Team1_SourceMatchID = @source1Id,
                        Team2_ID = @team2Id, Team2_SourceMatchID = @source2Id,
                        Status = @status
                    WHERE MatchID = @targetMatchId;
                `);
        }

        await transaction.commit();
        res.status(201).json({ message: `Bracket generated successfully for ${n} teams.` });

    } catch (error) {
        await transaction.rollback();
        console.error("Erro ao gerar bracket:", error);
        res.status(500).json({ 
            error: "Failed to generate bracket.", 
            details: error.message
        });
    }
});


/**
 * ROTA: GET /:eventId/single-elimination/bracket
 * Busca a bracket completa (Esta rota não precisa de alteração)
 */
router.get("/bracket", async (req, res) => {
    const { eventId } = req.params;
    try {
        const request = new sql.Request(res.locals.db_pool);
        const result = await request
            .input('eventId', sql.Int, eventId)
            .query(`
                SELECT 
                    M.MatchID, M.RoundNumber, M.MatchNumber, M.Status,
                    M.Team1_ID, T1.TeamName AS Team1_Name, T1.LogoURL AS Team1_Logo, M.Team1_Score,
                    M.Team2_ID, T2.TeamName AS Team2_Name, T2.LogoURL AS Team2_Logo, M.Team2_Score,
                    M.Winner_ID, W.TeamName AS Winner_Name,
                    M.Team1_SourceMatchID, M.Team2_SourceMatchID
                FROM KnockoutMatches M
                LEFT JOIN TeamsNotDeleted T1 ON M.Team1_ID = T1.TeamId
                LEFT JOIN TeamsNotDeleted T2 ON M.Team2_ID = T2.TeamId
                LEFT JOIN TeamsNotDeleted W ON M.Winner_ID = W.TeamId
                WHERE M.EventID = @eventId
                ORDER BY M.RoundNumber, M.MatchNumber;
            `);
        
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


/**
 * ROTA: POST /:eventId/single-elimination/match/:matchId
 * Atualiza o resultado de uma partida e AVANÇA O VENCEDOR automaticamente.
 */
router.post("/match/:matchId", async (req, res) => {
    const { eventId, matchId } = req.params;

    if (res.locals.event.CreatedBy !== req.user.userId) {
        return res.status(403).json({ error: "You are not authorized to manage this event's matches." });
    }

    let resultData;
    try {
        resultData = await matchResultSchema.validate(req.body);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }

    const { team1Score, team2Score } = resultData;
    if (team1Score === team2Score) {
        return res.status(400).json({ error: "Draws are not allowed in single elimination." });
    }

    const transaction = new sql.Transaction(res.locals.db_pool);
    try {
        await transaction.begin();

        // 1. Buscar dados da partida atual
        const matchRequest = new sql.Request(transaction); // <-- Request 1
        const matchResult = await matchRequest
            .input('matchId', sql.Int, matchId)
            .input('eventId', sql.Int, eventId)
            .query('SELECT * FROM KnockoutMatches WHERE MatchID = @matchId AND EventID = @eventId');

        if (matchResult.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ error: "Match not found." });
        }
        const match = matchResult.recordset[0];

        // 2. Validar status da partida
        if (match.Status === 'Finished') {
            await transaction.rollback();
            return res.status(400).json({ error: "This match has already been finished." });
        }
        if (match.Status !== 'Ready') {
            await transaction.rollback();
            return res.status(400).json({ error: "This match is not ready to be played." });
        }

        // 3. Determinar vencedor e atualizar a partida atual
        const winnerId = (team1Score > team2Score) ? match.Team1_ID : match.Team2_ID;

        const updateRequest = new sql.Request(transaction); // <-- Request 2
        await updateRequest
            .input('matchId', sql.Int, matchId)
            .input('t1Score', sql.Int, team1Score)
            .input('t2Score', sql.Int, team2Score)
            .input('winnerId', sql.Int, winnerId)
            .query(`
                UPDATE KnockoutMatches 
                SET Team1_Score = @t1Score, Team2_Score = @t2Score, Winner_ID = @winnerId, Status = 'Finished'
                WHERE MatchID = @matchId
            `);
        
        // 4. Avançar o vencedor para a próxima rodada (se houver)
        const nextMatchRequest = new sql.Request(transaction); // <-- Request 3
        const nextMatchResult = await nextMatchRequest
            .input('sourceMatchId', sql.Int, matchId)
            .query(`
                SELECT MatchID, Team1_SourceMatchID, Team2_SourceMatchID 
                FROM KnockoutMatches 
                WHERE Team1_SourceMatchID = @sourceMatchId OR Team2_SourceMatchID = @sourceMatchId
            `);

        // Se for a final, não há próxima partida
        if (nextMatchResult.recordset.length > 0) {
            const nextMatch = nextMatchResult.recordset[0];
            
            const teamSlotToUpdate = (nextMatch.Team1_SourceMatchID == matchId) ? 'Team1_ID' : 'Team2_ID';

            const advanceRequest = new sql.Request(transaction); // <-- Request 4
            await advanceRequest
                .input('winnerId', sql.Int, winnerId)
                .input('nextMatchId', sql.Int, nextMatch.MatchID)
                .query(`
                    UPDATE KnockoutMatches 
                    SET ${teamSlotToUpdate} = @winnerId
                    WHERE MatchID = @nextMatchId
                `);
            
            // 5. Verificar se a próxima partida está 'Ready'
            const checkRequest = new sql.Request(transaction); // <-- Request 5
            const nextMatchCheck = await checkRequest
                .input('nextMatchId', sql.Int, nextMatch.MatchID)
                .query('SELECT Team1_ID, Team2_ID FROM KnockoutMatches WHERE MatchID = @nextMatchId');
            
            const nextMatchSlots = nextMatchCheck.recordset[0];
            if (nextMatchSlots.Team1_ID && nextMatchSlots.Team2_ID) {
                const readyRequest = new sql.Request(transaction); // <-- Request 6
                await readyRequest
                    .input('nextMatchId', sql.Int, nextMatch.MatchID)
                    .query(`UPDATE KnockoutMatches SET Status = 'Ready' WHERE MatchID = @nextMatchId`);
            }
        }

        await transaction.commit();
        res.status(200).json({ message: "Match result recorded and winner advanced." });

    } catch (error) {
        await transaction.rollback();
        console.error("Erro ao atualizar partida:", error); // Log do erro
        res.status(500).json({ 
            error: "Failed to update match.", 
            details: error.message 
        });
    }
});



/**
 * ROTA: POST /:eventId/single-elimination/finish
 * (Esta rota não precisa de alteração)
 */
router.post("/finish", async (req, res) =>{
    const { eventId } = req.params;
    
    if(res.locals.event.CreatedBy !== req.user.userId){
        return res.status(403).json({ error: "You are not authorized to finish this event." });
    }
    
    try { 
        const request = new sql.Request(res.locals.db_pool);
        await request
            .input('eventId', sql.Int, eventId)
            .query(`UPDATE Events SET Status = 'Finished' WHERE EventID = @eventId`);
        
        res.status(200).json({ message: `Event has been finished!` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
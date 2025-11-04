const express = require("express");
const sql = require("mssql");
const jwt = require("jsonwebtoken");
const { object, string } = require("yup");
const authMiddleware = require("../authMiddleware");
const { transformTeam, toCamelCase } = require("../utils/dataTransformers");
const router = express.Router();

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

let createTeamSchema = object({
    TeamName: string().required().max(100),
    LogoURL: string().url().max(255)
});
let updateStatusSchema = object({
    status: string().oneOf(['Pending', 'Approved', 'Rejected', 'Cancelled'], "Invalid status value").required()
});
// Create a new team and register it for an event
router.post("/:eventId/teams", authMiddleware, async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
        return res.error("Invalid eventId", "INVALID_EVENT_ID", 400);
    }
    let connection;
    try {
        const teamData = await createTeamSchema.validate(req.body);
        const userId = req.user.userId;
        await sql.connect(dbConfig);
        connection = sql;

        const eventResult = await sql.query`SELECT MaxTeams FROM EventsNotDeleted WHERE EventID = ${eventId}`;
        if (eventResult.recordset.length === 0) {
            return res.error("Event not found", "EVENT_NOT_FOUND", 404);
        }
        const maxTeams = eventResult.recordset[0].MaxTeams;

        const existingTeamResult = await sql.query`
            SELECT T.TeamId 
            FROM Teams T
            INNER JOIN EventRegistrations ER ON T.TeamId = ER.TeamID
            WHERE ER.EventId = ${eventId} AND T.CreatedBy = ${userId} AND ER.DeletedAt IS NULL
        `;
        if (existingTeamResult.recordset.length > 0) {
            return res.error(
                "You have already created a team for this event",
                "TEAM_ALREADY_EXISTS",
                400,
                { eventId, userId }
            );
        }

        const teamCountResult = await sql.query`SELECT COUNT(*) AS TeamCount FROM EventRegistrations WHERE EventId = ${eventId} and Status = 'Approved' and DeletedAt is null`;
        const currentTeamCount = teamCountResult.recordset[0].TeamCount;
        if (maxTeams !== null && currentTeamCount >= maxTeams) {
            return res.error(
                "Maximum number of teams reached for this event",
                "MAX_TEAMS_REACHED",
                400,
                {
                    eventId,
                    currentTeamCount,
                    maxTeams
                }
            );
        }

        const insertResult = await sql.query`
            INSERT INTO Teams (TeamName, LogoURL, CreatedBy)
            OUTPUT INSERTED.TeamId, INSERTED.CreatedAt
            VALUES (${teamData.TeamName}, ${teamData.LogoURL || null}, ${userId});
        `;
        if (insertResult.rowsAffected[0] === 0) {
            return res.error("Failed to create team", "CREATE_FAILED", 500);
        }
        const teamId = insertResult.recordset[0].TeamId;
        const createdAt = insertResult.recordset[0].CreatedAt;

        const memberInsertResult = await sql.query`
            INSERT INTO TeamMembers (TeamId, UserId, Role)
            VALUES (${teamId}, ${userId}, 'Captain');
        `;

        const registrationResult = await sql.query`
            INSERT INTO EventRegistrations (EventID, TeamID)
            VALUES (${eventId}, ${teamId});
        `;

        return res.success(
            {
                teamId,
                teamName: teamData.TeamName,
                eventId,
                createdAt
            },
            "Team created successfully",
            201
        );
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.error(error.message, "VALIDATION_ERROR", 400);
        }
        return res.error(error.message, "INTERNAL_ERROR", 500);
    } finally {
        if (connection) {
            await sql.close();
        }
    }
});

// Get all teams registered for an event
router.get("/:eventId/teams", async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
        return res.error("Invalid eventId", "INVALID_EVENT_ID", 400);
    }
    let connection;
    try {
        await sql.connect(dbConfig);
        connection = sql;

        const accessToken = req.cookies?.accessToken;
        const userId = accessToken ? jwt.verify(accessToken, process.env.JWT_SECRET)?.userId || null : null;

        // Buscar times com informações do capitão e estatísticas
        let teamsQuery;
        if (userId) {
            teamsQuery = `
                SELECT 
                    T.*,
                    ER.EventID,
                    ER.Status,
                    ER.RegisteredAt,
                    U.UserID AS CaptainUserID,
                    U.Username AS CaptainUsername,
                    U.UserRole AS CaptainRole,
                    (SELECT COUNT(*) FROM TeamMembers TM WHERE TM.TeamId = T.TeamId AND TM.DeletedAt IS NULL) AS MemberCount,
                    E.TeamSize AS MaxMembers,
                    CASE 
                        WHEN EXISTS(SELECT 1 FROM TeamMembers TM2 WHERE TM2.TeamId = T.TeamId AND TM2.UserId = @userId AND TM2.DeletedAt IS NULL) THEN 0
                        ELSE 1
                    END AS CanJoin
                FROM TeamsNotDeleted T
                INNER JOIN EventRegistrations ER ON T.TeamId = ER.TeamID
                INNER JOIN EventsNotDeleted E ON ER.EventId = E.EventID
                LEFT JOIN UsersNotDeleted U ON T.CreatedBy = U.UserID
                WHERE ER.EventID = @eventId AND ER.DeletedAt IS NULL
                ORDER BY ER.RegisteredAt ASC
            `;
        } else {
            teamsQuery = `
                SELECT 
                    T.*,
                    ER.EventID,
                    ER.Status,
                    ER.RegisteredAt,
                    U.UserID AS CaptainUserID,
                    U.Username AS CaptainUsername,
                    U.UserRole AS CaptainRole,
                    (SELECT COUNT(*) FROM TeamMembers TM WHERE TM.TeamId = T.TeamId AND TM.DeletedAt IS NULL) AS MemberCount,
                    E.TeamSize AS MaxMembers
                FROM TeamsNotDeleted T
                INNER JOIN EventRegistrations ER ON T.TeamId = ER.TeamID
                INNER JOIN EventsNotDeleted E ON ER.EventId = E.EventID
                LEFT JOIN UsersNotDeleted U ON T.CreatedBy = U.UserID
                WHERE ER.EventID = @eventId AND ER.DeletedAt IS NULL
                ORDER BY ER.RegisteredAt ASC
            `;
        }

        const request = new sql.Request();
        request.input('eventId', sql.Int, eventId);
        if (userId) {
            request.input('userId', sql.Int, userId);
        }
        const result = await request.query(teamsQuery);
        const teams = result.recordset.map(team => {
            const transformed = transformTeam(team, {
                captain: {
                    UserID: team.CaptainUserID,
                    Username: team.CaptainUsername,
                    UserRole: team.CaptainRole
                },
                maxMembers: team.MaxMembers,
                canJoin: userId && team.CanJoin !== undefined ? team.CanJoin === 1 : undefined
            });
            return transformed;
        });

        return res.success(teams, "Teams retrieved successfully");
    } catch (error) {
        return res.error(error.message, "INTERNAL_ERROR", 500);
    } finally {
        if (connection) {
            await sql.close();
        }
    }
});

// Get details of a specific team
router.get("/teams/:teamId", async (req, res) => {
    const teamId = parseInt(req.params.teamId);
    if (isNaN(teamId)) {
        return res.error("Invalid teamId", "INVALID_TEAM_ID", 400);
    }
    let connection;
    try {
        await sql.connect(dbConfig);
        connection = sql;

        // Buscar informações do time com capitão
        const teamQuery = `
            SELECT 
                T.*,
                ER.EventId,
                ER.Status,
                ER.RegisteredAt,
                U.UserID AS CaptainUserID,
                U.Username AS CaptainUsername,
                U.UserRole AS CaptainRole,
                E.TeamSize AS MaxMembers
            FROM TeamsNotDeleted T
            INNER JOIN EventRegistrations ER ON T.TeamId = ER.TeamID
            INNER JOIN EventsNotDeleted E ON ER.EventId = E.EventID
            LEFT JOIN UsersNotDeleted U ON T.CreatedBy = U.UserID
            WHERE T.TeamId = @teamId AND ER.DeletedAt IS NULL
        `;

        const teamRequest = new sql.Request();
        teamRequest.input('teamId', sql.Int, teamId);
        const teamResult = await teamRequest.query(teamQuery);
        if (teamResult.recordset.length === 0) {
            return res.error("Team not found", "TEAM_NOT_FOUND", 404);
        }

        const teamData = teamResult.recordset[0];

        // Buscar membros do time
        const membersQuery = `
            SELECT 
                TM.UserID,
                TM.Role,
                TM.JoinedAt,
                U.Username,
                U.UserRole
            FROM TeamMembers TM
            INNER JOIN UsersNotDeleted U ON TM.UserID = U.UserID
            WHERE TM.TeamId = @teamId AND TM.DeletedAt IS NULL
            ORDER BY TM.JoinedAt ASC
        `;

        const membersRequest = new sql.Request();
        membersRequest.input('teamId', sql.Int, teamId);
        const membersResult = await membersRequest.query(membersQuery);
        const members = membersResult.recordset.map(member => ({
            userId: member.UserID,
            username: member.Username,
            role: member.Role,
            userRole: member.UserRole,
            joinedAt: member.JoinedAt
        }));

        const memberCount = members.length;

        // Transformar time
        const transformedTeam = transformTeam(teamData, {
            captain: {
                UserID: teamData.CaptainUserID,
                Username: teamData.CaptainUsername,
                UserRole: teamData.CaptainRole
            },
            members,
            maxMembers: teamData.MaxMembers,
            memberCount
        });

        return res.success(transformedTeam, "Team retrieved successfully");
    } catch (error) {
        return res.error(error.message, "INTERNAL_ERROR", 500);
    } finally {
        if (connection) {
            await sql.close();
        }
    }
});

// Join a team
router.post("/teams/:teamId/join", authMiddleware, async (req, res) => {
    const teamId = parseInt(req.params.teamId);
    if (isNaN(teamId)) {
        return res.error("Invalid teamId", "INVALID_TEAM_ID", 400);
    }
    let connection;
    try {
        const userId = req.user.userId;
        await sql.connect(dbConfig);
        connection = sql;

        const teamResult = await sql.query`SELECT TeamId, TeamName FROM TeamsNotDeleted WHERE TeamId = ${teamId}`;
        if (teamResult.recordset.length === 0) {
            return res.error("Team not found", "TEAM_NOT_FOUND", 404);
        }

        const teamName = teamResult.recordset[0].TeamName;

        const maxMembersResult = await sql.query`
            SELECT E.TeamSize 
            FROM EventRegistrations ER
            INNER JOIN EventsNotDeleted E ON ER.EventId = E.EventID
            WHERE ER.TeamID = ${teamId} AND ER.DeletedAt IS NULL 
        `;
        
        if (maxMembersResult.recordset.length === 0) {
            return res.error("Event registration not found for this team", "REGISTRATION_NOT_FOUND", 404);
        }

        const maxMembers = maxMembersResult.recordset[0].TeamSize;

        const memberCountResult = await sql.query`SELECT COUNT(*) AS MemberCount FROM TeamMembers WHERE TeamId = ${teamId} AND DeletedAt IS NULL`;
        const currentMemberCount = memberCountResult.recordset[0].MemberCount;

        if (maxMembers !== null && currentMemberCount >= maxMembers) {
            return res.error(
                "Team is already full",
                "TEAM_FULL",
                400,
                {
                    teamId,
                    currentMembers: currentMemberCount,
                    maxMembers
                }
            );
        }

        const memberResult = await sql.query`SELECT TeamMemberID FROM TeamMembers WHERE TeamId = ${teamId} AND UserId = ${userId} AND DeletedAt IS NULL`;
        if (memberResult.recordset.length > 0) {
            return res.error(
                "You are already a member of this team",
                "ALREADY_MEMBER",
                400,
                { teamId, userId }
            );
        }

        await sql.query`INSERT INTO TeamMembers (TeamId, UserId) VALUES (${teamId}, ${userId})`;
        
        const newMemberCount = currentMemberCount + 1;

        return res.success(
            {
                teamId,
                teamName,
                newMemberCount,
                maxMembers,
                isFull: maxMembers !== null && newMemberCount >= maxMembers
            },
            "Joined team successfully"
        );
    } catch (error) {
        return res.error(error.message, "INTERNAL_ERROR", 500);
    } finally {
        if (connection) {
            await sql.close();
        }
    }
});

// Delete a team
router.delete("/teams/:teamId", authMiddleware, async (req, res) => {
    const teamId = parseInt(req.params.teamId);
    if (isNaN(teamId)) {
        return res.error("Invalid teamId", "INVALID_TEAM_ID", 400);
    }
    let connection;
    try {
        const userId = req.user.userId;
        await sql.connect(dbConfig);
        connection = sql;

        const teamResult = await sql.query`SELECT CreatedBy FROM TeamsNotDeleted WHERE TeamId = ${teamId}`;
        if (teamResult.recordset.length === 0) {
            return res.error("Team not found", "TEAM_NOT_FOUND", 404);
        }
        if (teamResult.recordset[0].CreatedBy !== userId) {
            return res.error(
                "You are not authorized to delete this team",
                "UNAUTHORIZED",
                403,
                { teamId, userId }
            );
        }

        await sql.query`UPDATE Teams SET DeletedAt = GETDATE() WHERE TeamId = ${teamId}`;
        await sql.query`UPDATE EventRegistrations SET DeletedAt = GETDATE() WHERE TeamID = ${teamId} AND DeletedAt IS NULL`;
        await sql.query`UPDATE TeamMembers SET DeletedAt = GETDATE() WHERE TeamId = ${teamId} AND DeletedAt IS NULL`;

        return res.success(
            { teamId },
            "Team deleted successfully"
        );
    } catch (error) {
        return res.error(error.message, "INTERNAL_ERROR", 500);
    } finally {
        if (connection) {
            await sql.close();
        }
    }
});

// Remove a member from a team
router.delete("/teams/:teamId/members/:memberId", authMiddleware, async (req, res) => {
    const teamId = parseInt(req.params.teamId);
    const memberId = parseInt(req.params.memberId);
    if (isNaN(teamId) || isNaN(memberId)) {
        return res.error("Invalid teamId or memberId", "INVALID_ID", 400);
    }
    let connection;
    try {
        const userId = req.user.userId;
        await sql.connect(dbConfig);
        connection = sql;

        const teamResult = await sql.query`SELECT CreatedBy FROM TeamsNotDeleted WHERE TeamId = ${teamId}`;
        if (teamResult.recordset.length === 0) {
            return res.error("Team not found", "TEAM_NOT_FOUND", 404);
        }

        const teamCaptain = teamResult.recordset[0].CreatedBy;
        
        // Verificar permissão: capitão pode remover qualquer membro, membro pode remover a si mesmo
        if (teamCaptain !== userId && memberId !== userId) {
            return res.error(
                "You are not authorized to remove this member",
                "UNAUTHORIZED",
                403,
                { teamId, memberId, userId }
            );
        }

        const memberResult = await sql.query`SELECT TeamMemberID FROM TeamMembers WHERE TeamId = ${teamId} AND UserId = ${memberId} AND DeletedAt IS NULL`;
        if (memberResult.recordset.length === 0) {
            return res.error("Member not found in this team", "MEMBER_NOT_FOUND", 404);
        }

        // Remover membro e contar membros restantes
        const remainingMembersResult = await sql.query`
            UPDATE TeamMembers 
            SET DeletedAt = GETDATE() 
            WHERE TeamId = ${teamId} AND UserId = ${memberId} AND DeletedAt IS NULL;
            
            SELECT COUNT(*) AS RemainingMembers 
            FROM TeamMembers 
            WHERE TeamId = ${teamId} AND DeletedAt IS NULL;
        `;

        const remainingMembers = remainingMembersResult.recordset[0].RemainingMembers;
        let teamStatus = "Active";

        // Se não há mais membros, deletar time e cancelar registro
        if (remainingMembers === 0) {
            await sql.query`UPDATE Teams SET DeletedAt = GETDATE() WHERE TeamId = ${teamId}`;
            await sql.query`UPDATE EventRegistrations SET Status = 'Cancelled', DeletedAt = GETDATE() WHERE TeamID = ${teamId} AND DeletedAt IS NULL`;
            teamStatus = "Cancelled";
        }

        return res.success(
            {
                teamId,
                removedMemberId: memberId,
                newMemberCount: remainingMembers,
                teamStatus
            },
            "Member removed successfully"
        );
    } catch (error) {
        return res.error(error.message, "INTERNAL_ERROR", 500);
    } finally {
        if (connection) {
            await sql.close();
        }
    }
});
// ROTA PARA O DONO DO EVENTO ATUALIZAR O STATUS DE UM TIME
router.put("/:eventId/teams/:teamId/status", authMiddleware, async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    const teamId = parseInt(req.params.teamId);
    const userId = req.user.userId;

    // 1. Validar IDs
    if (isNaN(eventId) || isNaN(teamId)) {
        return res.error("Invalid eventId or teamId", "INVALID_ID", 400);
    }

    // 2. Validar o Body (o novo status)
    let validatedData;
    try {
        validatedData = await updateStatusSchema.validate(req.body);
    } catch (error) {
        return res.error(error.message, "VALIDATION_ERROR", 400);
    }
    
    const { status: newStatus } = validatedData;

    try {
        await sql.connect(dbConfig);
        
        // 3. Verificar se o usuário é o Dono do Evento (usando a view EventsNotDeleted)
        const eventCheck = await sql.query`
            SELECT CreatedBy FROM EventsNotDeleted 
            WHERE EventID = ${eventId}
        `;
        
        if (eventCheck.recordset.length === 0) {
            return res.error("Event not found.", "EVENT_NOT_FOUND", 404);
        }
        
        if (eventCheck.recordset[0].CreatedBy !== userId) {
            return res.error("You are not authorized to manage this event's registrations.", "UNAUTHORIZED", 403);
        }

        // 4. Se for o dono, atualizar o status da inscrição do time
        const updateResult = await sql.query`
            UPDATE EventRegistrations 
            SET Status = ${newStatus}
            WHERE EventID = ${eventId} AND TeamID = ${teamId} AND DeletedAt IS NULL
        `;

        if (updateResult.rowsAffected[0] === 0) {
            // Isso acontece se o time não estiver inscrito ou já foi deletado
            return res.error("Team registration not found for this event.", "REGISTRATION_NOT_FOUND", 404);
        }

        return res.success(null, `Team ${teamId} status for event ${eventId} updated to ${newStatus}`);

    } catch (error) {
        return res.error(error.message, "INTERNAL_ERROR", 500);
    } finally {
        await sql.close();
    }
});
// 
module.exports = router;

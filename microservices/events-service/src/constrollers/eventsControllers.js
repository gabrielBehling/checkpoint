const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { object, string, date, number, boolean } = require("yup");
const authMiddleware = require("../authMiddleware");
const { transformEvent, transformEventList, createPagination } = require("../utils/dataTransformers");

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

let createEventSchema = object({
    Title: string().required(),
    Description: string().required(),
    GameID: number(),
    Mode: string(),
    StartDate: date().required(),
    EndDate: date().required(),
    Location: string(),
    Ticket: number(),
    ParticipationCost: number(),
    Language: string(),
    Platform: string(),
    IsOnline: boolean().required(),
    MaxParticipants: number(),
    TeamSize: number(),
    MaxTeams: number(),
    Rules: string(),
    Prizes: string(),
    BannerURL: string().url(),
    Status: string().oneOf(['Active', 'Canceled', 'Finished']).default('Active'),
});

// Create a new event
router.post("/", authMiddleware, async (req, res) => {
    try {
        const eventData = await createEventSchema.validate(req.body);

        if (eventData.EndDate <= eventData.StartDate) {
            return res.error("End date must be after start date", "INVALID_DATE_RANGE", 400);
        }

        const userId = req.user.userId;

        await sql.connect(dbConfig);
        const result = await sql.query`
            INSERT INTO Events (
                Title, Description, GameID, Mode, StartDate, EndDate, Location, 
                Ticket, ParticipationCost, Language, Platform, IsOnline,
                MaxParticipants, TeamSize, MaxTeams, Rules, Prizes, BannerURL, 
                Status, CreatedBy
            )
            OUTPUT INSERTED.EventID, INSERTED.CreatedAt
            VALUES (
                ${eventData.Title}, ${eventData.Description}, ${eventData.GameID || null}, 
                ${eventData.Mode || null}, ${eventData.StartDate}, ${eventData.EndDate}, 
                ${eventData.Location || null}, ${eventData.Ticket || null}, 
                ${eventData.ParticipationCost || null}, ${eventData.Language || null}, 
                ${eventData.Platform || null}, ${eventData.IsOnline}, 
                ${eventData.MaxParticipants || null}, ${eventData.TeamSize || null}, 
                ${eventData.MaxTeams || null}, ${eventData.Rules || null}, 
                ${eventData.Prizes || null}, ${eventData.BannerURL || null}, 
                ${eventData.Status || 'Active'}, ${userId}
            );
        `;

        if (result.recordset.length === 0) {
            return res.error("Failed to create event", "CREATE_FAILED", 500);
        }

        const eventId = result.recordset[0].EventID;
        const createdAt = result.recordset[0].CreatedAt;

        return res.success(
            {
                eventId,
                createdAt
            },
            "Event created successfully",
            201
        );
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.error(error.message, "VALIDATION_ERROR", 400);
        }
        return res.error(error.message, "INTERNAL_ERROR", 500);
    } finally {
        await sql.close();
    }
});

let updateEventSchema = object({
    Title: string(),
    Description: string(),
    GameID: number(),
    Mode: string(),
    StartDate: date(),
    EndDate: date(),
    Location: string(),
    Ticket: number(),
    ParticipationCost: number(),
    Language: string(),
    Platform: string(),
    IsOnline: boolean(),
    MaxParticipants: number(),
    TeamSize: number(),
    MaxTeams: number(),
    Rules: string(),
    Prizes: string(),
    BannerURL: string().url(),
    Status: string().oneOf(['Active', 'Canceled', 'Finished']),
});

// Update an event
router.put("/:eventId", authMiddleware, async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
        return res.error("Invalid eventId", "INVALID_EVENT_ID", 400);
    }
    try {
        const eventData = await updateEventSchema.validate(req.body);
        const userId = req.user.userId;
        
        await sql.connect(dbConfig);
        const result = await sql.query`update Events set
            Title = coalesce(${eventData.Title}, Title),
            Description = coalesce(${eventData.Description}, Description),
            GameID = coalesce(${eventData.GameID}, GameID),
            Mode = coalesce(${eventData.Mode}, Mode),
            StartDate = coalesce(${eventData.StartDate}, StartDate),
            EndDate = coalesce(${eventData.EndDate}, EndDate),
            Location = coalesce(${eventData.Location}, Location),
            Ticket = coalesce(${eventData.Ticket}, Ticket),
            ParticipationCost = coalesce(${eventData.ParticipationCost}, ParticipationCost),
            Language = coalesce(${eventData.Language}, Language),
            Platform = coalesce(${eventData.Platform}, Platform),
            IsOnline = coalesce(${eventData.IsOnline}, IsOnline),
            MaxParticipants = coalesce(${eventData.MaxParticipants}, MaxParticipants),
            TeamSize = coalesce(${eventData.TeamSize}, TeamSize),
            MaxTeams = coalesce(${eventData.MaxTeams}, MaxTeams),
            Rules = coalesce(${eventData.Rules}, Rules),
            Prizes = coalesce(${eventData.Prizes}, Prizes),
            BannerURL = coalesce(${eventData.BannerURL}, BannerURL),
            Status = coalesce(${eventData.Status}, Status),
            LastModifiedBy = ${userId},
            EditedAt = GETDATE()
            where EventId = ${eventId} and CreatedBy = ${userId} and DeletedAt is null;`;

        if (result.rowsAffected[0] === 0) {
            return res.error("Event not found or you do not have permission to update it", "EVENT_NOT_FOUND", 404);
        }
        
        return res.success(
            { eventId },
            "Event updated successfully",
            200
        );
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.error(error.message, "VALIDATION_ERROR", 400);
        }
        return res.error(error.message, "INTERNAL_ERROR", 500);
    } finally {
        await sql.close();
    }
});

// Soft delete an event
router.delete("/:eventId", authMiddleware, async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
        return res.error("Invalid eventId", "INVALID_EVENT_ID", 400);
    }
    try {
        const userId = req.user.userId;
        await sql.connect(dbConfig);
        const result = await sql.query`update Events set DeletedAt = GETDATE() where EventId = ${eventId} and CreatedBy = ${userId};`;

        if (result.rowsAffected[0] === 0) {
            return res.error("Event not found or you do not have permission to delete it", "EVENT_NOT_FOUND", 404);
        }
        
        return res.success(
            { eventId },
            "Event deleted successfully",
            200
        );
    } catch (error) {
        return res.error(error.message, "INTERNAL_ERROR", 500);
    } finally {
        await sql.close();
    }
});

// Get events by filter
router.get("/", async (req, res) => {
    let connection;
    try {
        await sql.connect(dbConfig);
        connection = sql;

        const {
            game,
            date,
            mode,
            ticket,
            participationCost,
            place,
            groupSize,
            status,
            prize,
            time,
            language,
            platform,
            maxParticipants,
            isOnline,
            search,
            page = 1,
            limit = 10
        } = req.query;

        // Query para contar total (para paginação)
        const countQuery = `
            SELECT COUNT(*) AS Total
            FROM EventsNotDeleted e
            INNER JOIN UsersNotDeleted u ON e.CreatedBy = u.UserID
            WHERE
                (@game IS NULL OR e.GameID = (SELECT GameID FROM Games WHERE GameName = @game))
                AND (@date IS NULL OR @date BETWEEN e.StartDate AND e.EndDate)
                AND (@mode IS NULL OR e.Mode = @mode)
                AND (@ticket IS NULL OR e.Ticket = @ticket)
                AND (@participationCost IS NULL OR e.ParticipationCost = @participationCost)
                AND (@place IS NULL OR e.Location LIKE '%' + @place + '%')
                AND (@groupSize IS NULL OR e.TeamSize = @groupSize)
                AND (@status IS NULL OR e.Status = @status)
                AND (@prize IS NULL OR e.Prizes LIKE '%' + @prize + '%')
                AND (@time IS NULL OR CONVERT(time, e.StartDate) = @time)
                AND (@language IS NULL OR e.Language = @language)
                AND (@platform IS NULL OR e.Platform LIKE '%' + @platform + '%')
                AND (@maxParticipants IS NULL OR e.MaxParticipants = @maxParticipants)
                AND (@isOnline IS NULL OR e.IsOnline = @isOnline)
                AND (@search IS NULL OR (
                    e.Title LIKE '%' + @search + '%' OR 
                    e.Description LIKE '%' + @search + '%' OR
                    u.Username LIKE '%' + @search + '%'
                ))
        `;

        // Query para buscar eventos com dados relacionados
        const query = `
            SELECT 
                e.*,
                u.Username AS OrganizerUsername,
                g.GameName,
                (SELECT COUNT(DISTINCT TM.UserID) 
                 FROM EventRegistrations ER
                 INNER JOIN Teams T ON ER.TeamID = T.TeamID
                 INNER JOIN TeamMembers TM ON T.TeamID = TM.TeamID
                 WHERE ER.EventID = e.EventID AND ER.DeletedAt IS NULL AND TM.DeletedAt IS NULL) AS CurrentParticipants,
                (SELECT COUNT(*) 
                 FROM EventRegistrations ER
                 WHERE ER.EventID = e.EventID AND ER.Status = 'Approved' AND ER.DeletedAt IS NULL) AS TeamCount
            FROM EventsNotDeleted e
            INNER JOIN UsersNotDeleted u ON e.CreatedBy = u.UserID
            LEFT JOIN Games g ON e.GameID = g.GameID
            WHERE
                (@game IS NULL OR e.GameID = (SELECT GameID FROM Games WHERE GameName = @game))
                AND (@date IS NULL OR @date BETWEEN e.StartDate AND e.EndDate)
                AND (@mode IS NULL OR e.Mode = @mode)
                AND (@ticket IS NULL OR e.Ticket = @ticket)
                AND (@participationCost IS NULL OR e.ParticipationCost = @participationCost)
                AND (@place IS NULL OR e.Location LIKE '%' + @place + '%')
                AND (@groupSize IS NULL OR e.TeamSize = @groupSize)
                AND (@status IS NULL OR e.Status = @status)
                AND (@prize IS NULL OR e.Prizes LIKE '%' + @prize + '%')
                AND (@time IS NULL OR CONVERT(time, e.StartDate) = @time)
                AND (@language IS NULL OR e.Language = @language)
                AND (@platform IS NULL OR e.Platform LIKE '%' + @platform + '%')
                AND (@maxParticipants IS NULL OR e.MaxParticipants = @maxParticipants)
                AND (@isOnline IS NULL OR e.IsOnline = @isOnline)
                AND (@search IS NULL OR (
                    e.Title LIKE '%' + @search + '%' OR 
                    e.Description LIKE '%' + @search + '%' OR
                    u.Username LIKE '%' + @search + '%'
                ))
            ORDER BY e.StartDate ASC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;

        const request = new sql.Request();

        // Setando parâmetros
        request.input('game', sql.NVarChar, game || null);
        request.input('date', sql.DateTime, date ? new Date(date) : null);
        request.input('mode', sql.NVarChar, mode || null);
        request.input('ticket', sql.Decimal(10,2), ticket ? parseFloat(ticket) : null);
        request.input('participationCost', sql.Decimal(10,2), participationCost ? parseFloat(participationCost) : null);
        request.input('place', sql.NVarChar, place || null);
        request.input('groupSize', sql.Int, groupSize ? parseInt(groupSize) : null);
        request.input('status', sql.NVarChar, status || null);
        request.input('prize', sql.NVarChar, prize || null);
        request.input('time', sql.Time, time || null);
        request.input('language', sql.NVarChar, language || null);
        request.input('platform', sql.NVarChar, platform || null);
        request.input('maxParticipants', sql.Int, maxParticipants ? parseInt(maxParticipants) : null);

        // Tratando isOnline
        if (isOnline === undefined) {
            request.input('isOnline', sql.Bit, null);
        } else {
            const boolVal = (isOnline === 'true' || isOnline === '1') ? 1 : 0;
            request.input('isOnline', sql.Bit, boolVal);
        }

        request.input('search', sql.NVarChar, search || null);

        // Configurar paginação
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const offsetNum = (pageNum - 1) * limitNum;

        request.input('offset', sql.Int, offsetNum);
        request.input('limit', sql.Int, limitNum);

        // Executar queries
        const [eventsResult, countResult] = await Promise.all([
            request.query(query),
            request.query(countQuery)
        ]);

        const total = countResult.recordset[0].Total;
        const events = transformEventList(eventsResult.recordset, { 
            includeOrganizer: true, 
            includeGame: true 
        });

        // Enriquecer eventos com estatísticas
        const enrichedEvents = events.map(event => {
            const eventObj = { ...event };
            if (eventObj.maxParticipants && eventObj.CurrentParticipants !== undefined) {
                eventObj.currentParticipants = eventObj.CurrentParticipants || 0;
                eventObj.availableSpots = eventObj.maxParticipants - eventObj.currentParticipants;
            }
            if (eventObj.maxTeams && eventObj.TeamCount !== undefined) {
                eventObj.teamCount = eventObj.TeamCount || 0;
                eventObj.availableTeamSlots = eventObj.maxTeams - eventObj.teamCount;
            }
            // Limpar campos temporários
            delete eventObj.CurrentParticipants;
            delete eventObj.TeamCount;
            return eventObj;
        });

        return res.success({
            data: enrichedEvents,
            pagination: createPagination(page, limit, total)
        }, "Events retrieved successfully");
    } catch (error) {
        console.error("Error fetching events:", error);
        return res.error(error.message, "INTERNAL_ERROR", 500);
    } finally {
        if (connection) {
            await sql.close();
        }
    }
});

// Get event by ID
router.get("/:eventId", async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
        return res.error("Invalid eventId", "INVALID_EVENT_ID", 400);
    }

    let connection;
    try {
        await sql.connect(dbConfig);
        connection = sql;

        // Buscar evento com dados relacionados
        const eventQuery = `
            SELECT 
                e.*,
                u.UserID AS OrganizerUserID,
                u.Username AS OrganizerUsername,
                u.UserRole AS OrganizerRole,
                g.GameID AS GameGameID,
                g.GameName,
                (SELECT COUNT(DISTINCT TM.UserID) 
                 FROM EventRegistrations ER
                 INNER JOIN Teams T ON ER.TeamID = T.TeamID
                 INNER JOIN TeamMembers TM ON T.TeamID = TM.TeamID
                 WHERE ER.EventID = e.EventID AND ER.DeletedAt IS NULL AND TM.DeletedAt IS NULL) AS CurrentParticipants,
                (SELECT COUNT(*) 
                 FROM EventRegistrations ER
                 WHERE ER.EventID = e.EventID AND ER.Status = 'Approved' AND ER.DeletedAt IS NULL) AS TeamCount
            FROM EventsNotDeleted e
            INNER JOIN UsersNotDeleted u ON e.CreatedBy = u.UserID
            LEFT JOIN Games g ON e.GameID = g.GameID
            WHERE e.EventID = @eventId
        `;

        const request = new sql.Request();
        request.input('eventId', sql.Int, eventId);
        const eventResult = await request.query(eventQuery);

        if (eventResult.recordset.length === 0) {
            return res.error("Event not found", "EVENT_NOT_FOUND", 404);
        }

        const eventData = eventResult.recordset[0];
        
        // Verificar se usuário está registrado (se autenticado)
        let isRegistered = false;
        if (req.user && req.user.userId) {
            const registrationQuery = `
                SELECT COUNT(*) AS IsRegistered
                FROM EventRegistrations ER
                INNER JOIN Teams T ON ER.TeamID = T.TeamID
                INNER JOIN TeamMembers TM ON T.TeamID = TM.TeamID
                WHERE ER.EventID = @eventId 
                AND TM.UserID = @userId
                AND ER.DeletedAt IS NULL 
                AND TM.DeletedAt IS NULL
            `;
            const regRequest = new sql.Request();
            regRequest.input('eventId', sql.Int, eventId);
            regRequest.input('userId', sql.Int, req.user.userId);
            const regResult = await regRequest.query(registrationQuery);
            isRegistered = regResult.recordset[0].IsRegistered > 0;
        }

        // Transformar evento
        const transformedEvent = transformEvent(eventData, {
            organizer: {
                UserID: eventData.OrganizerUserID,
                Username: eventData.OrganizerUsername,
                UserRole: eventData.OrganizerRole
            },
            game: eventData.GameGameID ? {
                GameID: eventData.GameGameID,
                GameName: eventData.GameName
            } : null,
            stats: {
                currentParticipants: eventData.CurrentParticipants || 0,
                teamCount: eventData.TeamCount || 0
            },
            isRegistered,
            metadata: {
                CreatedAt: eventData.CreatedAt,
                EditedAt: eventData.EditedAt,
                LastModifiedBy: eventData.LastModifiedBy
            }
        });

        return res.success(transformedEvent, "Event retrieved successfully");
    } catch (error) {
        console.error("Error fetching event:", error);
        return res.error(error.message, "INTERNAL_ERROR", 500);
    } finally {
        if (connection) {
            await sql.close();
        }
    }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { object, string, date, number, boolean } = require("yup");
const authMiddleware = require("../authMiddleware");

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
    StartDate: date().min(new Date(), "Start date must be in the future").required(),
    EndDate: date().min(new Date(), "End date must be in the future").required(),
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
            return res.status(400).json({ error: "End date must be after start date" });
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

        res.status(201).json({ message: "Event created successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
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
        return res.status(400).json({ error: "Invalid eventId" });
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
            LastModifiedBy = ${userId}
            where EventId = ${eventId} and CreatedBy = ${userId} and DeletedAt is null;`;

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Event not found or you do not have permission to update it" });
        }
        res.status(200).json({ message: "Event updated successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    } finally {
        await sql.close();
    }
});

// Soft delete an event
router.delete("/:eventId", authMiddleware, async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid eventId" });
    }
    try {
        const userId = req.user.userId;
        await sql.connect(dbConfig);
        const result = await sql.query`update Events set DeletedAt = GETDATE() where EventId = ${eventId} and CreatedBy = ${userId};`;

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Event not found or you do not have permission to delete it" });
        }
        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await sql.close();
    }
});

// Get events by filter
router.get("/", async (req, res) => {
    try {
        await sql.connect(dbConfig);

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
            search
        } = req.query;

        const query = `
            SELECT e.*
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

        const request = new sql.Request();

        // Setando parâmetros (se não informados, passam NULL para ignorar a condição)
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

        // Tratando isOnline: se undefined, passa null; se 'true' ou '1' passa 1; se 'false' ou '0' passa 0
        if (isOnline === undefined) {
            request.input('isOnline', sql.Bit, null);
        } else {
            const boolVal = (isOnline === 'true' || isOnline === '1') ? 1 : 0;
            request.input('isOnline', sql.Bit, boolVal);
        }

        request.input('search', sql.NVarChar, search || null);

        const result = await request.query(query);

        res.json(result.recordset);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// Get event by ID
router.get("/:eventId", async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid eventId" });
    }

    try{
        await sql.connect(dbConfig);

        const result = await sql.query`SELECT * FROM EventsNotDeleted WHERE EventID = ${eventId}`
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }
        res.json(result.recordset[0])
    } catch {
        res.status(500).json({ error: error.message });
    } finally {
        await sql.close();
    }
});

module.exports = router;
const express = require("express");
const sql = require("mssql");
const cookieParser = require("cookie-parser");
const { object, string, date, number } = require("yup");
const authMiddleware = require("./authMiddleware");

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

const app = express();

app.use(express.json());
app.use(cookieParser());

let createEventSchema = object({
    Title: string().required(),
    Description: string().required(),
    StartDate: date().required(),
    EndDate: date().required(),
    Location: string(),
    MaxParticipants: number(),
    MaxTeams: number(),
    Rules: string(),
    Prizes: string(),
    BannerURL: string().url(),
});
// Create a new event
app.post("/", authMiddleware, async (req, res) => {
    try {
        const eventData = await createEventSchema.validate(req.body);

        const userId = req.user.userId;

        await sql.connect(dbConfig);
        const result = await sql.query`
            INSERT INTO Events (Title, Description, StartDate, EndDate, Location, MaxParticipants, MaxTeams, Rules, Prizes, BannerURL, CreatedBy)
            values (${eventData.Title}, ${eventData.Description}, ${eventData.StartDate}, ${eventData.EndDate}, ${eventData.Location || null}, 
                    ${eventData.MaxParticipants || null}, ${eventData.MaxTeams || null}, ${eventData.Rules || null}, 
                    ${eventData.Prizes || null}, ${eventData.BannerURL || null}, ${userId});
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
    StartDate: date(),
    EndDate: date(),
    Location: string(),
    MaxParticipants: number(),
    MaxTeams: number(),
    Rules: string(),
    Prizes: string(),
    BannerURL: string().url(),
});
// Update an event
app.put("/:eventId", authMiddleware, async (req, res) => {
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
            StartDate = coalesce(${eventData.StartDate}, StartDate),
            EndDate = coalesce(${eventData.EndDate}, EndDate),
            Location = coalesce(${eventData.Location}, Location),
            MaxParticipants = coalesce(${eventData.MaxParticipants}, MaxParticipants),
            MaxTeams = coalesce(${eventData.MaxTeams}, MaxTeams),
            Rules = coalesce(${eventData.Rules}, Rules),
            Prizes = coalesce(${eventData.Prizes}, Prizes),
            BannerURL = coalesce(${eventData.BannerURL}, BannerURL)
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
app.delete("/:eventId", authMiddleware, async (req, res) => {
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
app.get("/", authMiddleware, async (req, res) => {
    try {
        await sql.connect(dbConfig);

        // Pegando query params (se não informado, será undefined)
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

        // Query SQL gigante, com filtros opcionais
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
        res.status(500).json({ error: error.message });
    }
});

let createTeamSchema = object({
    TeamName: string().required().max(100),
    LogoURL: string().url().max(255)
});
// Create a new team and register it for an event
app.post("/:eventId/teams", authMiddleware, async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid eventId" });
    }
    try {
        const teamData = await createTeamSchema.validate(req.body);
        const userId = req.user.userId;
        await sql.connect(dbConfig);
        const eventResult = await sql.query`SELECT MaxTeams FROM EventsNotDeleted WHERE EventID = ${eventId}`;
        if (eventResult.recordset.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }
        const maxTeams = eventResult.recordset[0].MaxTeams;
        const teamCountResult = await sql.query`SELECT COUNT(*) AS TeamCount FROM EventRegistrations WHERE EventId = ${eventId} and Status = 'Approved' and DeletedAt is null`;
        const currentTeamCount = teamCountResult.recordset[0].TeamCount;
        if (maxTeams !== null && currentTeamCount >= maxTeams) {
            return res.status(400).json({ error: "Maximum number of teams reached for this event" });
        }
        const insertResult = await sql.query`
            INSERT INTO Teams (TeamName, LogoURL, CreatedBy)
            OUTPUT INSERTED.TeamId
            VALUES (${teamData.TeamName}, ${teamData.LogoURL || null}, ${userId});
        `;
        if (insertResult.rowsAffected[0] === 0) {
            return res.status(500).json({ error: "Failed to create team" });
        }
        const teamId = insertResult.recordset[0].TeamId;

        const registrationResult = await sql.query`
            INSERT INTO EventRegistrations (EventID, TeamID)
            VALUES (${eventId}, ${teamId});
        `;
        res.status(201).json({ message: "Team created successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    } finally {
        await sql.close();
    }
});

// Get all teams registered for an event
app.get("/:eventId/teams", authMiddleware, async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid eventId" });
    }
    try {
        await sql.connect(dbConfig);
        const result = await sql.query`SELECT T.*, ER.EventID, ER.Status, ER.RegisteredAt FROM TeamsNotDeleted T INNER JOIN EventRegistrations ER as  ON T.TeamId = ER.TeamID  WHERE ER.EventID = ${eventId} AND ER.DeletedAt IS NULL`;
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await sql.close();
    }
});

app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Events Service is running on port ${PORT}`);
});

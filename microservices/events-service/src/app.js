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

// Get all events
app.get("/", authMiddleware, async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query`SELECT * FROM EventsNotDeleted`;
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

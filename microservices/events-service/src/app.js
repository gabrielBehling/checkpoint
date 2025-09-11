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
            where EventId = ${eventId} and CreatedBy = ${userId};`;

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

app.delete("/:eventId", authMiddleware, async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid eventId" });
    }
    try {
        const userId = req.user.userId;
        await sql.connect(dbConfig);
        const result = await sql.query`delete from Events where EventId = ${eventId} and CreatedBy = ${userId};`;

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

app.get("/", authMiddleware, async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query`SELECT * FROM Events`;
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Events Service is running on port ${PORT}`);
});

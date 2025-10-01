const express = require("express");
const sql = require("mssql");
const { object, string } = require("yup");
const authMiddleware = require("../authMiddleware");
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
// Create a new team and register it for an event
router.post("/:eventId/teams", authMiddleware, async (req, res) => {
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

        const existingTeamResult = await sql.query`
            SELECT T.TeamId 
            FROM Teams T
            INNER JOIN EventRegistrations ER ON T.TeamId = ER.TeamID
            WHERE ER.EventId = ${eventId} AND T.CreatedBy = ${userId} AND ER.DeletedAt IS NULL
        `;
        if (existingTeamResult.recordset.length > 0) {
            return res.status(400).json({ error: "You have already created a team for this event" });
        }

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
router.get("/:eventId/teams", async (req, res) => {
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

// Get details of a specific team
router.get("/teams/:teamId", async (req, res) => {
    const teamId = parseInt(req.params.teamId);
    if (isNaN(teamId)) {
        return res.status(400).json({ error: "Invalid teamId" });
    }
    try {
        await sql.connect(dbConfig);
        const result = await sql.query`
        SELECT T.*, ER.EventId, ER.Status, (SELECT COUNT(*) FROM TeamMembers TM WHERE TM.TeamId = T.TeamId) AS MemberCount
        FROM TeamsNotDeleted T
        INNER JOIN EventRegistrations ER ON T.TeamId = ER.TeamID
        WHERE T.TeamId = ${teamId}`;
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Team not found" });
        }
        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await sql.close();
    }
});

module.exports = router;
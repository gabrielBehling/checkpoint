const express = require("express");
const router = express.Router();
const sql = require("mssql");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { object, string, date, number, boolean } = require("yup");
const authMiddleware = require("../authMiddleware");
const bannerUpload = require("../middleware/bannerUpload");
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
  ModeID: number(),
  StartDate: date()
    .min(new Date(Date.now() - 24 * 60 * 60 * 1000), "Start date must be in the future")
    .required(),
  StartHour: string()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)")
    .required(),
  EndDate: date().min(new Date(Date.now() - 24 * 60 * 60 * 1000), "End date must be in the future"),
  EndHour: string().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  Location: string(),
  Ticket: number(),
  ParticipationCost: number(),
  LanguageID: number(),
  Platform: string(),
  IsOnline: boolean().required(),
  MaxParticipants: number(),
  TeamSize: number(),
  MaxTeams: number(),
  Rules: string(),
  Prizes: string(),
  Status: string().oneOf(["Active", "Canceled", "Finished"]).default("Active"),
});

// Create a new event
router.post("/", authMiddleware, bannerUpload, async (req, res) => {
  try {
    const eventData = await createEventSchema.validate(req.body);
    console.log(eventData);

    if (eventData.EndDate < eventData.StartDate) {
      return res.error("End date must be after start date", "INVALID_DATE_RANGE", 400);
    }

    const startHourAndMinutes = eventData.StartHour.split(":");
    const endHoursAndMinutes = eventData.EndHour ? eventData.EndHour.split(":") : null;

    if ((eventData.EndDate === eventData.StartDate) & eventData.EndHour) {
      if (new Date((hours = endHoursAndMinutes[0]), (minutes = endHoursAndMinutes[1])) <= new Date((hours = startHourAndMinutes[0]), (minutes = startHourAndMinutes[1]))) {
        return res.error("End hour must be after start hour", "INVALID_HOUR_RANGE", 400);
      }
    }

    // Process banner if one was uploaded
    let bannerURL = null;
    if (req.file) {
      // Create a relative URL path from the uploads folder
      bannerURL = `/uploads/banners/${req.file.filename}`;
    }

    const userId = req.user.userId;
    await sql.connect(dbConfig);
    const result = await sql.query`
            INSERT INTO Events (
                Title, Description, GameID, ModeID, StartDate, StartHour, EndDate, EndHour, Location, 
                Ticket, ParticipationCost, LanguageID, Platform, IsOnline,
                MaxParticipants, TeamSize, MaxTeams, Rules, Prizes, BannerURL, 
                Status, CreatedBy
            )
            OUTPUT INSERTED.EventID, INSERTED.CreatedAt
            VALUES (
                ${eventData.Title}, ${eventData.Description}, ${eventData.GameID || null}, 
                ${eventData.ModeID || null}, ${eventData.StartDate},${eventData.StartHour},
                ${eventData.EndDate || null}, ${eventData.EndHour || null},
                ${eventData.Location || null}, ${eventData.Ticket || null}, 
                ${eventData.ParticipationCost || null}, ${eventData.LanguageID || null}, 
                ${eventData.Platform || null}, ${eventData.IsOnline}, 
                ${eventData.MaxParticipants || null}, ${eventData.TeamSize || null}, 
                ${eventData.MaxTeams || null}, ${eventData.Rules || null}, 
                ${eventData.Prizes || null}, ${bannerURL}, 
                ${eventData.Status || "Active"}, ${userId}
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
        createdAt,
      },
      "Event created successfully",
      201
    );
  } catch (error) {
    if (error.name === "ValidationError") {
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
  ModeID: number(),
  StartDate: date().min(new Date(Date.now() - 24 * 60 * 60 * 1000), "Start date must be in the future"),
  StartHour: string().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  EndDate: date().min(new Date(Date.now() - 24 * 60 * 60 * 1000), "End date must be in the future"),
  EndHour: string().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  Location: string(),
  Ticket: number(),
  ParticipationCost: number(),
  LanguageID: number(),
  Platform: string(),
  IsOnline: boolean(),
  MaxParticipants: number(),
  TeamSize: number(),
  MaxTeams: number(),
  Rules: string(),
  Prizes: string(),
  BannerURL: string(),
  Status: string().oneOf(["Active", "Canceled", "Finished"]),
});

// Update an event
router.put("/:eventId", authMiddleware, bannerUpload, async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  if (isNaN(eventId)) {
    return res.error("Invalid eventId", "INVALID_EVENT_ID", 400);
  }
  try {
    const eventData = await updateEventSchema.validate(req.body);
    const userId = req.user.userId;

    // Process banner if one was uploaded
    if (req.file) {
      // Create a relative URL path from the uploads folder
      eventData.BannerURL = `/uploads/banners/${req.file.filename}`;

      // Delete old banner if exists
      await sql.connect(dbConfig);
      const oldBannerResult = await sql.query`
                SELECT BannerURL FROM Events 
                WHERE EventId = ${eventId} AND CreatedBy = ${userId} AND DeletedAt IS NULL;
            `;

      if (oldBannerResult.recordset[0]?.BannerURL) {
        const oldBannerPath = path.join(__dirname, "..", "..", oldBannerResult.recordset[0].BannerURL);
        if (fs.existsSync(oldBannerPath)) {
          fs.unlinkSync(oldBannerPath);
        }
      }
      await sql.close();
    }

    await sql.connect(dbConfig);
    const result = await sql.query`update Events set
            Title = coalesce(${eventData.Title}, Title),
            Description = coalesce(${eventData.Description}, Description),
            GameID = coalesce(${eventData.GameID}, GameID),
            ModeID = coalesce(${eventData.ModeID}, ModeID),
            StartDate = coalesce(${eventData.StartDate}, StartDate),
            StartHour = coalesce(${eventData.StartHour}, StartHour),
            EndDate = coalesce(${eventData.EndDate}, EndDate),
            EndHour = coalesce(${eventData.EndHour}, EndHour),
            Location = coalesce(${eventData.Location}, Location),
            Ticket = coalesce(${eventData.Ticket}, Ticket),
            ParticipationCost = coalesce(${eventData.ParticipationCost}, ParticipationCost),
            LanguageID = coalesce(${eventData.LanguageID}, LanguageID),
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

    return res.success({ eventId }, "Event updated successfully", 200);
  } catch (error) {
    if (error.name === "ValidationError") {
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

    return res.success({ eventId }, "Event deleted successfully", 200);
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

    const { game, date, mode, ticket, participationCost, place, groupSize, status, prize, language, platform, maxParticipants, isOnline, search, page = 1, limit = 10 } = req.query;

    // Query para contar total (para paginação)
    const countQuery = `
            SELECT COUNT(*) AS Total
            FROM EventsNotDeleted e
            INNER JOIN UsersNotDeleted u ON e.CreatedBy = u.UserID
            WHERE
                (@game IS NULL OR e.GameID = (SELECT GameID FROM Games WHERE GameName = @game))
                AND (@date IS NULL OR @date BETWEEN e.StartDate AND e.EndDate)
                AND (@mode IS NULL OR e.ModeID = (SELECT ModeID FROM Modes WHERE ModeName = @mode))
                AND (@ticket IS NULL OR e.Ticket = @ticket)
                AND (@participationCost IS NULL OR e.ParticipationCost = @participationCost)
                AND (@place IS NULL OR e.Location LIKE '%' + @place + '%')
                AND (@groupSize IS NULL OR e.TeamSize = @groupSize)
                AND (@status IS NULL OR e.Status = @status)
                AND (@prize IS NULL OR e.Prizes LIKE '%' + @prize + '%')
                AND (@language IS NULL OR e.LanguageID = (SELECT LanguageID FROM Languages WHERE LanguageName = @language))
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
                u.ProfileURL AS OrganizerProfileURL,
                m.ModeName AS ModeName,
                l.LanguageName AS LanguageName,
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
            LEFT JOIN Modes m ON e.ModeID = m.ModeID
            LEFT JOIN Languages l ON e.LanguageID = l.LanguageID
            WHERE
                (@game IS NULL OR e.GameID = (SELECT GameID FROM Games WHERE GameName = @game))
                AND (@date IS NULL OR @date BETWEEN e.StartDate AND e.EndDate)
                AND (@mode IS NULL OR e.ModeID = (SELECT ModeID FROM Modes WHERE ModeName = @mode))
                AND (@ticket IS NULL OR e.Ticket = @ticket)
                AND (@participationCost IS NULL OR e.ParticipationCost = @participationCost)
                AND (@place IS NULL OR e.Location LIKE '%' + @place + '%')
                AND (@groupSize IS NULL OR e.TeamSize = @groupSize)
                AND (@status IS NULL OR e.Status = @status)
                AND (@prize IS NULL OR e.Prizes LIKE '%' + @prize + '%')
                AND (@language IS NULL OR e.LanguageID = (SELECT LanguageID FROM Languages WHERE LanguageName = @language))
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
    request.input("game", sql.NVarChar, game || null);
    request.input("date", sql.Date, date ? new Date(date) : null);
    request.input("mode", sql.NVarChar, mode || null);
    request.input("ticket", sql.Decimal(10, 2), ticket ? parseFloat(ticket) : null);
    request.input("participationCost", sql.Decimal(10, 2), participationCost ? parseFloat(participationCost) : null);
    request.input("place", sql.NVarChar, place || null);
    request.input("groupSize", sql.Int, groupSize ? parseInt(groupSize) : null);
    request.input("status", sql.NVarChar, status || null);
    request.input("prize", sql.NVarChar, prize || null);
    request.input("language", sql.NVarChar, language || null);
    request.input("platform", sql.NVarChar, platform || null);
    request.input("maxParticipants", sql.Int, maxParticipants ? parseInt(maxParticipants) : null);

    // Tratando isOnline
    if (isOnline === undefined) {
      request.input("isOnline", sql.Bit, null);
    } else {
      const boolVal = isOnline === "true" || isOnline === "1" ? 1 : 0;
      request.input("isOnline", sql.Bit, boolVal);
    }

    request.input("search", sql.NVarChar, search || null);

    // Configurar paginação
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offsetNum = (pageNum - 1) * limitNum;

    request.input("offset", sql.Int, offsetNum);
    request.input("limit", sql.Int, limitNum);

    // Executar queries
    const [eventsResult, countResult] = await Promise.all([request.query(query), request.query(countQuery)]);

    const total = countResult.recordset[0].Total;
    const events = transformEventList(eventsResult.recordset, {
      includeOrganizer: true,
      includeGame: true,
    });

    // Enriquecer eventos com estatísticas e adicionar OrganizerProfileURL
    const enrichedEvents = events.map((event, idx) => {
      const eventObj = { ...event };
      // Add organizer profileURL from raw recordset
      eventObj.organizerProfileURL = eventsResult.recordset[idx].OrganizerProfileURL || null;
      // map ModeName/LanguageName into friendly fields
      eventObj.mode = eventsResult.recordset[idx].ModeName || null;
      eventObj.language = eventsResult.recordset[idx].LanguageName || null;

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

    return res.success(
      {
        data: enrichedEvents,
        pagination: createPagination(page, limit, total),
      },
      "Events retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.error(error.message, "INTERNAL_ERROR", 500);
  } finally {
    if (connection) {
      await sql.close();
    }
  }
});

// Get available filters (games, modes, languages, platforms)
router.get("/filters", async (req, res) => {
  let connection;
  try {
    await sql.connect(dbConfig);
    connection = sql;

    const gamesReq = new sql.Request();
    const modesReq = new sql.Request();
    const languagesReq = new sql.Request();
    const platformsReq = new sql.Request();

    const [gamesResult, modesResult, languagesResult, platformsResult] = await Promise.all([gamesReq.query("SELECT GameID, GameName FROM Games WHERE DeletedAt IS NULL ORDER BY GameName;"), modesReq.query("SELECT ModeID, ModeName FROM Modes WHERE DeletedAt IS NULL ORDER BY ModeName;"), languagesReq.query("SELECT LanguageID, LanguageName FROM Languages WHERE DeletedAt IS NULL ORDER BY LanguageName;"), platformsReq.query("SELECT DISTINCT Platform FROM EventsNotDeleted WHERE Platform IS NOT NULL AND Platform <> '' ORDER BY Platform;")]);

    const games = gamesResult.recordset || [];
    const modes = modesResult.recordset || [];
    const languages = languagesResult.recordset || [];
    const platforms = (platformsResult.recordset || []).map((r) => r.Platform).filter(Boolean);

    return res.success({ games, modes, languages, platforms }, "Filters retrieved successfully");
  } catch (error) {
    console.error("Error fetching filters:", error);
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

  const accessToken = req.cookies?.accessToken;
  let userId;
  try {
    userId = accessToken ? jwt.verify(accessToken, process.env.JWT_SECRET)?.userId || null : null;
  } catch (error) {
    userId = null;
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
                u.ProfileURL AS OrganizerProfileURL,
                g.GameID AS GameGameID,
                g.GameName,
                m.ModeID AS ModeID,
                m.ModeName AS ModeName,
                l.LanguageID AS LanguageID,
                l.LanguageName AS LanguageName,
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
            LEFT JOIN Modes m ON e.ModeID = m.ModeID
            LEFT JOIN Languages l ON e.LanguageID = l.LanguageID
            WHERE e.EventID = @eventId
        `;

    const request = new sql.Request();
    request.input("eventId", sql.Int, eventId);
    const eventResult = await request.query(eventQuery);

    if (eventResult.recordset.length === 0) {
      return res.error("Event not found", "EVENT_NOT_FOUND", 404);
    }

    const eventData = eventResult.recordset[0];

    // Verificar se usuário está registrado (se autenticado)
    let isRegistered = false;
    if (userId) {
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
      regRequest.input("eventId", sql.Int, eventId);
      regRequest.input("userId", sql.Int, userId);
      const regResult = await regRequest.query(registrationQuery);
      isRegistered = regResult.recordset[0].IsRegistered > 0;
    }

    // Transformar evento
    const transformedEvent = transformEvent(eventData, {
      organizer: {
        UserID: eventData.OrganizerUserID,
        Username: eventData.OrganizerUsername,
        UserRole: eventData.OrganizerRole,
        ProfileURL: eventData.OrganizerProfileURL || null,
      },
      game: eventData.GameGameID
        ? {
            GameID: eventData.GameGameID,
            GameName: eventData.GameName,
          }
        : null,
      stats: {
        currentParticipants: eventData.CurrentParticipants || 0,
        teamCount: eventData.TeamCount || 0,
      },
      isRegistered,
      metadata: {
        CreatedAt: eventData.CreatedAt,
        EditedAt: eventData.EditedAt,
        LastModifiedBy: eventData.LastModifiedBy,
      },
    });

    // attach mode and language names for clients
    transformedEvent.mode = eventData.ModeName || null;
    transformedEvent.language = eventData.LanguageName || null;

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

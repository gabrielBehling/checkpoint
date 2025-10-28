USE CheckpointDB;
GO

-- USERS
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    EditedAt DATETIME DEFAULT NULL,
    LastLogin DATETIME DEFAULT NULL,
    DeletedAt DATETIME DEFAULT NULL,
    UserRole VARCHAR(20) DEFAULT 'Visitor' CHECK (UserRole IN ('Visitor', 'Administrator', 'Player', 'Organizer')),
    CONSTRAINT UC_Username UNIQUE (Username,DeletedAt),
    CONSTRAINT UC_Email UNIQUE (Email,DeletedAt)
);
GO

-- TEAMS
CREATE TABLE Teams (
    TeamID INT PRIMARY KEY IDENTITY(1,1),
    TeamName NVARCHAR(100) NOT NULL,
    CreatedBy INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    EditedAt DATETIME DEFAULT NULL,
    DeletedAt DATETIME DEFAULT NULL,
    LogoURL NVARCHAR(255),
    ChatID UNIQUEIDENTIFIER DEFAULT NEWID(),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
);
GO

-- TEAM MEMBERS
CREATE TABLE TeamMembers (
    TeamMemberID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL,
    TeamID INT NOT NULL,
    Role VARCHAR(50) NOT NULL DEFAULT 'Player',
    JoinedAt DATETIME DEFAULT GETDATE(),
    EditedAt DATETIME DEFAULT NULL,
    DeletedAt DATETIME DEFAULT NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (TeamID) REFERENCES Teams(TeamID)
);
GO

-- GAMES
CREATE TABLE Games (
    GameID INT PRIMARY KEY IDENTITY(1,1),
    GameName NVARCHAR(100) NOT NULL UNIQUE,
    CreatedAt DATETIME DEFAULT GETDATE(),
    EditedAt DATETIME DEFAULT NULL,
    DeletedAt DATETIME DEFAULT NULL
);
GO

-- EVENTS
CREATE TABLE Events (
    EventID INT PRIMARY KEY IDENTITY(1,1),
    Title NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    GameID INT,
    Mode NVARCHAR(50),
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    Location NVARCHAR(255),
    Ticket DECIMAL(10,2),
    ParticipationCost DECIMAL(10,2),
    Language NVARCHAR(50),
    Platform NVARCHAR(100),
    IsOnline BIT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    EditedAt DATETIME DEFAULT NULL,
    LastModifiedBy INT NULL,
    DeletedAt DATETIME DEFAULT NULL,
    MaxParticipants INT DEFAULT NULL,
    TeamSize INT NULL,
    MaxTeams INT DEFAULT NULL,
    CreatedBy INT NOT NULL,
    Rules NVARCHAR(MAX),
    Prizes NVARCHAR(MAX),
    BannerURL NVARCHAR(255),
    Status VARCHAR(20) DEFAULT 'Active' CHECK (Status IN ('Active', 'Canceled', 'Finished')),
    FOREIGN KEY (GameID) REFERENCES Games(GameID),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID),
    FOREIGN KEY (LastModifiedBy) REFERENCES Users(UserID)
);
GO

-- EVENT REGISTRATIONS
CREATE TABLE EventRegistrations (
    RegistrationID INT PRIMARY KEY IDENTITY(1,1),
    EventID INT NOT NULL,
    UserID INT NULL,
    TeamID INT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    RegisteredAt DATETIME DEFAULT GETDATE(),
    EditedAt DATETIME DEFAULT NULL,
    DeletedAt DATETIME DEFAULT NULL,
    FOREIGN KEY (EventID) REFERENCES Events(EventID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (TeamID) REFERENCES Teams(TeamID)
);
GO

-- MATCHES
CREATE TABLE Matches (
    MatchID INT PRIMARY KEY IDENTITY(1,1),
    EventID INT NOT NULL,
    MatchDate DATETIME NOT NULL,
    Location NVARCHAR(255),
    Status VARCHAR(20) DEFAULT 'Scheduled' CHECK (Status IN ('Scheduled', 'InProgress', 'Finished', 'Cancelled')),
    CreatedAt DATETIME DEFAULT GETDATE(),
    EditedAt DATETIME DEFAULT NULL,
    DeletedAt DATETIME DEFAULT NULL,
    FOREIGN KEY (EventID) REFERENCES Events(EventID)
);
GO

-- TEAM MATCHES (for each team in a match)
CREATE TABLE TeamMatches (
    TeamMatchID INT PRIMARY KEY IDENTITY(1,1),
    MatchID INT NOT NULL,
    TeamID INT NOT NULL,
    Score INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    EditedAt DATETIME DEFAULT NULL,
    DeletedAt DATETIME DEFAULT NULL,
    FOREIGN KEY (MatchID) REFERENCES Matches(MatchID),
    FOREIGN KEY (TeamID) REFERENCES Teams(TeamID)
);
GO
CREATE TABLE LeaderboardScores (
    ScoreID INT PRIMARY KEY IDENTITY(1,1),
    EventID INT NOT NULL,
    TeamID INT NOT NULL,
    RoundNumber INT NOT NULL,
    Points DECIMAL(10, 2) NOT NULL DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastModifiedAt DATETIME DEFAULT GETDATE(),
    
    CONSTRAINT FK_LeaderboardScores_Events FOREIGN KEY (EventID) REFERENCES Events(EventID),
    CONSTRAINT FK_LeaderboardScores_Teams FOREIGN KEY (TeamID) REFERENCES Teams(TeamID),
    
    -- Garante que um time só pode ter uma pontuação por rodada em um evento
    CONSTRAINT UQ_Event_Team_Round UNIQUE (EventID, TeamID, RoundNumber)
);
GO
CREATE TABLE KnockoutMatches (
    MatchID INT PRIMARY KEY IDENTITY(1,1),
    EventID INT NOT NULL,
    RoundNumber INT NOT NULL,
    MatchNumber INT NOT NULL,
    Team1_ID INT NULL,
    Team2_ID INT NULL,
    Team1_Score INT NULL,
    Team2_Score INT NULL,
    Winner_ID INT NULL,
    
    Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
    
    Team1_SourceMatchID INT NULL,
    Team2_SourceMatchID INT NULL,

    CONSTRAINT FK_KnockoutMatches_Events FOREIGN KEY (EventID) REFERENCES Events(EventID),
    CONSTRAINT FK_KnockoutMatches_Team1 FOREIGN KEY (Team1_ID) REFERENCES Teams(TeamID),
    CONSTRAINT FK_KnockoutMatches_Team2 FOREIGN KEY (Team2_ID) REFERENCES Teams(TeamID),
    CONSTRAINT FK_KnockoutMatches_Winner FOREIGN KEY (Winner_ID) REFERENCES Teams(TeamID),

    CONSTRAINT FK_Knockout_Source1 FOREIGN KEY (Team1_SourceMatchID) REFERENCES KnockoutMatches(MatchID),
    CONSTRAINT FK_Knockout_Source2 FOREIGN KEY (Team2_SourceMatchID) REFERENCES KnockoutMatches(MatchID),
    CONSTRAINT UQ_Event_Round_Match UNIQUE (EventID, RoundNumber, MatchNumber)
);
GO

CREATE TABLE EventSettings_RoundRobin (
    EventID INT PRIMARY KEY,
    PointsPerWin DECIMAL(5, 2) NOT NULL DEFAULT 3,
    PointsPerDraw DECIMAL(5, 2) NOT NULL DEFAULT 1,
    PointsPerLoss DECIMAL(5, 2) NOT NULL DEFAULT 0,
    
    CONSTRAINT FK_RoundRobinSettings_Events FOREIGN KEY (EventID) REFERENCES Events(EventID)
        ON DELETE CASCADE -- Se o evento for deletado, as configurações também são
);
GO

/* Tabela 2: Armazena todas as partidas da agenda
*/
CREATE TABLE RoundRobinMatches (
    MatchID INT PRIMARY KEY IDENTITY(1,1),
    EventID INT NOT NULL,
    Team1_ID INT NOT NULL,
    Team2_ID INT NOT NULL,
    Team1_Score INT NULL,
    Team2_Score INT NULL,
    Winner_ID INT NULL,           -- NULL em caso de empate
    Status NVARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, Finished
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastModifiedAt DATETIME DEFAULT GETDATE(),
    
    CONSTRAINT FK_RoundRobinMatches_Events FOREIGN KEY (EventID) REFERENCES Events(EventID),
    CONSTRAINT FK_RoundRobinMatches_Team1 FOREIGN KEY (Team1_ID) REFERENCES Teams(TeamID),
    CONSTRAINT FK_RoundRobinMatches_Team2 FOREIGN KEY (Team2_ID) REFERENCES Teams(TeamID),
    CONSTRAINT FK_RoundRobinMatches_Winner FOREIGN KEY (Winner_ID) REFERENCES Teams(TeamID),
    
    -- Garante que o par (Time A vs Time B) seja único por evento
    CONSTRAINT UQ_RoundRobin_Match UNIQUE (EventID, Team1_ID, Team2_ID)
);
GO

-- VIEWS
CREATE VIEW dbo.UsersNotDeleted AS
SELECT 
    UserID,
    Username,
    Email,
    PasswordHash,
    UserRole,
    LastLogin,
    CreatedAt,
    EditedAt
FROM dbo.Users
WHERE DeletedAt is NULL;
GO

CREATE VIEW dbo.TeamsNotDeleted AS
SELECT 
    TeamID,
    TeamName,
    CreatedBy,
    LogoURL,
    CreatedAt,
    EditedAt,
    ChatID
FROM dbo.Teams
WHERE DeletedAt is NULL;
GO

CREATE VIEW dbo.EventsNotDeleted AS
SELECT 
    EventID,
    Title,
    Description,
    GameID,
    Mode,
    StartDate,
    EndDate,
    Location,
    Ticket,
    ParticipationCost,
    Language,
    Platform,
    IsOnline,
    CreatedAt,
    EditedAt,
    LastModifiedBy,
    MaxParticipants,
    TeamSize,
    MaxTeams,
    CreatedBy,
    Rules,
    Prizes,
    BannerURL,
    Status
FROM dbo.Events
WHERE DeletedAt is NULL;
GO

CREATE VIEW dbo.MatchesNotDeleted AS
SELECT 
    MatchID,
    EventID,
    MatchDate,
    Location,
    Status,
    CreatedAt,
    EditedAt
FROM dbo.Matches
WHERE DeletedAt is NULL;
GO

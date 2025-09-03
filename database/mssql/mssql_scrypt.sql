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

-- EVENTS
CREATE TABLE Events (
    EventID INT PRIMARY KEY IDENTITY(1,1),
    Title NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    Location NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE(),
    EditedAt DATETIME DEFAULT NULL,
    LastModifiedBy INT NULL,
    DeletedAt DATETIME DEFAULT NULL,
    MaxParticipants INT DEFAULT NULL,
    MaxTeams INT DEFAULT NULL,
    CreatedBy INT NOT NULL,
    Rules NVARCHAR(MAX),
    Prizes NVARCHAR(MAX),
    BannerURL NVARCHAR(255),
    Status VARCHAR(20) DEFAULT 'Active' CHECK (Status IN ('Active', 'Canceled', 'Finished')),
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
    EditedAt
FROM dbo.Teams
WHERE DeletedAt is NULL;
GO

CREATE VIEW dbo.EventsNotDeleted AS
SELECT 
    EventID,
    Title,
    Description,
    StartDate,
    EndDate,
    Location,
    CreatedBy,
    Rules,
    Prizes,
    BannerURL,
    Status,
    CreatedAt,
    EditedAt
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

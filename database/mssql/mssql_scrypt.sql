create database CheckpointDB

use CheckpointDB

-- USERS
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    EditedAt DATETIME DEFAULT NULL,
    LastLogin DATETIME DEFAULT NULL,
    IsDeleted BIT DEFAULT 0,
    UserRole VARCHAR(20) DEFAULT 'Visitor' CHECK (UserRole IN ('Visitor', 'Administrator', 'Player', 'Organizer'))
);

-- TEAMS
CREATE TABLE Teams (
    TeamID INT PRIMARY KEY IDENTITY(1,1),
    TeamName NVARCHAR(100) NOT NULL,
    CreatedBy INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    EditedAt DATETIME DEFAULT NULL,
    IsDeleted BIT DEFAULT 0,
    LogoURL NVARCHAR(255),
    ChatID UNIQUEIDENTIFIER DEFAULT NEWID(),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
);

-- TEAM MEMBERS
CREATE TABLE TeamMembers (
    TeamMemberID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL,
    TeamID INT NOT NULL,
    Role VARCHAR(50) NOT NULL DEFAULT 'Player',
    JoinedAt DATETIME DEFAULT GETDATE(),
    EditedAt DATETIME DEFAULT NULL,
    IsDeleted BIT DEFAULT 0,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (TeamID) REFERENCES Teams(TeamID)
);

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
    IsDeleted BIT DEFAULT 0,
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

-- EVENT REGISTRATIONS
CREATE TABLE EventRegistrations (
    RegistrationID INT PRIMARY KEY IDENTITY(1,1),
    EventID INT NOT NULL,
    UserID INT NULL,
    TeamID INT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    RegisteredAt DATETIME DEFAULT GETDATE(),
    EditedAt DATETIME DEFAULT NULL,
    IsDeleted BIT DEFAULT 0,
    FOREIGN KEY (EventID) REFERENCES Events(EventID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (TeamID) REFERENCES Teams(TeamID)
);

-- MATCHES
CREATE TABLE Matches (
    MatchID INT PRIMARY KEY IDENTITY(1,1),
    EventID INT NOT NULL,
    MatchDate DATETIME NOT NULL,
    Location NVARCHAR(255),
    Status VARCHAR(20) DEFAULT 'Scheduled' CHECK (Status IN ('Scheduled', 'InProgress', 'Finished', 'Cancelled')),
    CreatedAt DATETIME DEFAULT GETDATE(),
    EditedAt DATETIME DEFAULT NULL,
    IsDeleted BIT DEFAULT 0,
    FOREIGN KEY (EventID) REFERENCES Events(EventID)
);

-- TEAM MATCHES (for each team in a match)
CREATE TABLE TeamMatches (
    TeamMatchID INT PRIMARY KEY IDENTITY(1,1),
    MatchID INT NOT NULL,
    TeamID INT NOT NULL,
    Score INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    EditedAt DATETIME DEFAULT NULL,
    IsDeleted BIT DEFAULT 0,
    FOREIGN KEY (MatchID) REFERENCES Matches(MatchID),
    FOREIGN KEY (TeamID) REFERENCES Teams(TeamID)
);


CREATE VIEW dbo.UsersNotDeleted AS
SELECT 
    UserID,
    Username,
    Email,
    UserRole,
    LastLogin,
    CreatedAt,
    EditedAt
FROM dbo.Users
WHERE IsDeleted = 0;
END

CREATE VIEW dbo.TeamsNotDeleted AS
SELECT 
    TeamID,
    TeamName,
    CreatedBy,
    LogoURL,
    CreatedAt,
    EditedAt
FROM dbo.Teams
WHERE IsDeleted = 0;
END

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
WHERE IsDeleted = 0;
END

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
WHERE IsDeleted = 0;
END

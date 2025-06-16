IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'CheckpointDB')
BEGIN
    CREATE DATABASE [CheckpointDB];
END
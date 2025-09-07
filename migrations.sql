IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [Users] (
    [Id] uniqueidentifier NOT NULL,
    [Email] nvarchar(255) NOT NULL,
    [PasswordHash] nvarchar(500) NOT NULL,
    [EmailVerified] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [PasswordUpdatedAt] datetime2 NOT NULL,
    [FailedLoginCount] int NOT NULL,
    [LockoutUntil] datetimeoffset NULL,
    [IsAdmin] bit NOT NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);

CREATE TABLE [Cases] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [Status] nvarchar(50) NOT NULL,
    [LastActivityAt] datetime2 NOT NULL,
    [VisaTypeId] int NULL,
    [PackageId] int NULL,
    [AssignedStaffId] uniqueidentifier NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Cases] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Cases_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [GuardianLinks] (
    [Id] uniqueidentifier NOT NULL,
    [ChildUserId] uniqueidentifier NOT NULL,
    [GuardianUserId] uniqueidentifier NOT NULL,
    [AttestationId] uniqueidentifier NOT NULL,
    [Status] nvarchar(50) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_GuardianLinks] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_GuardianLinks_Users_ChildUserId] FOREIGN KEY ([ChildUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_GuardianLinks_Users_GuardianUserId] FOREIGN KEY ([GuardianUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [InterviewSessions] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [StartedAt] datetime2 NOT NULL,
    [FinishedAt] datetime2 NULL,
    [Status] nvarchar(50) NOT NULL,
    CONSTRAINT [PK_InterviewSessions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_InterviewSessions_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [PasswordResetTokens] (
    [Id] int NOT NULL IDENTITY,
    [UserId] uniqueidentifier NOT NULL,
    [TokenHash] nvarchar(500) NOT NULL,
    [ExpiresAt] datetime2 NOT NULL,
    [UsedAt] datetime2 NULL,
    CONSTRAINT [PK_PasswordResetTokens] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PasswordResetTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [RememberMeTokens] (
    [Id] int NOT NULL IDENTITY,
    [UserId] uniqueidentifier NOT NULL,
    [TokenHash] nvarchar(500) NOT NULL,
    [IssuedAt] datetime2 NOT NULL,
    [ExpiresAt] datetime2 NOT NULL,
    [RevokedAt] datetime2 NULL,
    CONSTRAINT [PK_RememberMeTokens] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_RememberMeTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [VisaRecommendations] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [VisaTypeId] int NOT NULL,
    [LockedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_VisaRecommendations] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_VisaRecommendations_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_Cases_Status] ON [Cases] ([Status]);

CREATE INDEX [IX_Cases_UserId] ON [Cases] ([UserId]);

CREATE INDEX [IX_GuardianLinks_ChildUserId] ON [GuardianLinks] ([ChildUserId]);

CREATE INDEX [IX_GuardianLinks_GuardianUserId] ON [GuardianLinks] ([GuardianUserId]);

CREATE INDEX [IX_InterviewSessions_UserId] ON [InterviewSessions] ([UserId]);

CREATE INDEX [IX_PasswordResetTokens_ExpiresAt] ON [PasswordResetTokens] ([ExpiresAt]);

CREATE INDEX [IX_PasswordResetTokens_TokenHash] ON [PasswordResetTokens] ([TokenHash]);

CREATE INDEX [IX_PasswordResetTokens_UserId] ON [PasswordResetTokens] ([UserId]);

CREATE INDEX [IX_RememberMeTokens_ExpiresAt] ON [RememberMeTokens] ([ExpiresAt]);

CREATE INDEX [IX_RememberMeTokens_TokenHash] ON [RememberMeTokens] ([TokenHash]);

CREATE INDEX [IX_RememberMeTokens_UserId] ON [RememberMeTokens] ([UserId]);

CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);

CREATE INDEX [IX_VisaRecommendations_UserId] ON [VisaRecommendations] ([UserId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250901022830_AuthInit', N'9.0.8');

COMMIT;
GO


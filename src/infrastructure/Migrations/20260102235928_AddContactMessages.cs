using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace L4H.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddContactMessages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ContactMessages' AND xtype='U')
                BEGIN
                    CREATE TABLE [ContactMessages] (
                        [Id] int NOT NULL IDENTITY,
                        [Name] nvarchar(100) NOT NULL,
                        [Email] nvarchar(255) NOT NULL,
                        [Phone] nvarchar(50) NULL,
                        [Subject] nvarchar(200) NULL,
                        [Message] nvarchar(4000) NOT NULL,
                        [ConsultationType] nvarchar(50) NULL,
                        [ReferenceId] nvarchar(50) NOT NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        [IsProcessed] bit NOT NULL,
                        [ProcessedAt] datetime2 NULL,
                        [ProcessedBy] nvarchar(255) NULL,
                        [Notes] nvarchar(1000) NULL,
                        CONSTRAINT [PK_ContactMessages] PRIMARY KEY ([Id])
                    );
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContactMessages");
        }
    }
}

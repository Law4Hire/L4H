using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace L4H.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UnifiedHubPhase01 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdminPaths");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AdminPaths",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ParentPathId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    Icon = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Path = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    RequiredRole = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminPaths", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdminPaths_AdminPaths_ParentPathId",
                        column: x => x.ParentPathId,
                        principalTable: "AdminPaths",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AdminPaths_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AdminPaths_Users_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdminPaths_CreatedByUserId",
                table: "AdminPaths",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AdminPaths_DisplayOrder",
                table: "AdminPaths",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_AdminPaths_IsActive",
                table: "AdminPaths",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_AdminPaths_ParentPathId",
                table: "AdminPaths",
                column: "ParentPathId");

            migrationBuilder.CreateIndex(
                name: "IX_AdminPaths_Path",
                table: "AdminPaths",
                column: "Path");

            migrationBuilder.CreateIndex(
                name: "IX_AdminPaths_UpdatedByUserId",
                table: "AdminPaths",
                column: "UpdatedByUserId");
        }
    }
}

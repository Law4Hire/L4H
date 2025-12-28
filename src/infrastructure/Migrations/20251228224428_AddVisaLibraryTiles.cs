using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace L4H.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVisaLibraryTiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "VisaLibraryTiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisaLibraryTiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VisaLibraryTileMappings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VisaTypeId = table.Column<int>(type: "int", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisaLibraryTileMappings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VisaLibraryTileMappings_VisaLibraryTiles_TileId",
                        column: x => x.TileId,
                        principalTable: "VisaLibraryTiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VisaLibraryTileMappings_VisaTypes_VisaTypeId",
                        column: x => x.VisaTypeId,
                        principalTable: "VisaTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VisaLibraryTileMappings_TileId",
                table: "VisaLibraryTileMappings",
                column: "TileId");

            migrationBuilder.CreateIndex(
                name: "IX_VisaLibraryTileMappings_VisaTypeId",
                table: "VisaLibraryTileMappings",
                column: "VisaTypeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VisaLibraryTileMappings");

            migrationBuilder.DropTable(
                name: "VisaLibraryTiles");
        }
    }
}

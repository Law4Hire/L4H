using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace L4H.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddVisaEvaluationAndAnonymousToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add AnonymousToken to InterviewSessions
            migrationBuilder.AddColumn<Guid>(
                name: "AnonymousToken",
                table: "InterviewSessions",
                type: "uniqueidentifier",
                nullable: true);

            // Create VisaEvaluations table
            migrationBuilder.CreateTable(
                name: "VisaEvaluations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VisaTypeId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    MatchScore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Rank = table.Column<int>(type: "int", nullable: false),
                    Explanation = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    MissingInformation = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RequiredDocuments = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsUserSelected = table.Column<bool>(type: "bit", nullable: false),
                    UserSelectedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsAttorneyLocked = table.Column<bool>(type: "bit", nullable: false),
                    LockedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LockedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UnlockedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LockReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    UnlockReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisaEvaluations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VisaEvaluations_InterviewSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "InterviewSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VisaEvaluations_Users_LockedByUserId",
                        column: x => x.LockedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VisaEvaluations_VisaTypes_VisaTypeId",
                        column: x => x.VisaTypeId,
                        principalTable: "VisaTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            // Create indexes
            migrationBuilder.CreateIndex(
                name: "IX_InterviewSessions_AnonymousToken",
                table: "InterviewSessions",
                column: "AnonymousToken");

            migrationBuilder.CreateIndex(
                name: "IX_VisaEvaluations_SessionId",
                table: "VisaEvaluations",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_VisaEvaluations_VisaTypeId",
                table: "VisaEvaluations",
                column: "VisaTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_VisaEvaluations_SessionId_Rank",
                table: "VisaEvaluations",
                columns: new[] { "SessionId", "Rank" });

            migrationBuilder.CreateIndex(
                name: "IX_VisaEvaluations_IsUserSelected",
                table: "VisaEvaluations",
                column: "IsUserSelected");

            migrationBuilder.CreateIndex(
                name: "IX_VisaEvaluations_IsAttorneyLocked",
                table: "VisaEvaluations",
                column: "IsAttorneyLocked");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VisaEvaluations");

            migrationBuilder.DropIndex(
                name: "IX_InterviewSessions_AnonymousToken",
                table: "InterviewSessions");

            migrationBuilder.DropColumn(
                name: "AnonymousToken",
                table: "InterviewSessions");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace L4H.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVisaEligibilityResultsAndAttorneyLock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add attorney lock fields to Cases table
            migrationBuilder.AddColumn<int>(
                name: "AttorneySelectedVisaTypeId",
                table: "Cases",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsVisaLockedByAttorney",
                table: "Cases",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "VisaLockedAt",
                table: "Cases",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VisaLockedByStaffId",
                table: "Cases",
                type: "uniqueidentifier",
                nullable: true);

            // Add eligibility status and match score to VisaRecommendation table
            migrationBuilder.AddColumn<string>(
                name: "EligibilityStatus",
                table: "VisaRecommendations",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MatchScore",
                table: "VisaRecommendations",
                type: "int",
                nullable: true);

            // Create VisaEligibilityResults table
            migrationBuilder.CreateTable(
                name: "VisaEligibilityResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InterviewSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VisaTypeId = table.Column<int>(type: "int", nullable: false),
                    EligibilityStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    MatchScore = table.Column<int>(type: "int", nullable: false),
                    Rationale = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    MetRequirements = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    UnmetRequirements = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisaEligibilityResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VisaEligibilityResults_InterviewSessions_InterviewSessionId",
                        column: x => x.InterviewSessionId,
                        principalTable: "InterviewSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VisaEligibilityResults_VisaTypes_VisaTypeId",
                        column: x => x.VisaTypeId,
                        principalTable: "VisaTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            // Create indexes for Cases table
            migrationBuilder.CreateIndex(
                name: "IX_Cases_AttorneySelectedVisaTypeId",
                table: "Cases",
                column: "AttorneySelectedVisaTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Cases_IsVisaLockedByAttorney",
                table: "Cases",
                column: "IsVisaLockedByAttorney");

            // Create indexes for VisaEligibilityResults table
            migrationBuilder.CreateIndex(
                name: "IX_VisaEligibilityResults_InterviewSessionId",
                table: "VisaEligibilityResults",
                column: "InterviewSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_VisaEligibilityResults_VisaTypeId",
                table: "VisaEligibilityResults",
                column: "VisaTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_VisaEligibilityResults_InterviewSessionId_VisaTypeId",
                table: "VisaEligibilityResults",
                columns: new[] { "InterviewSessionId", "VisaTypeId" },
                unique: true);

            // Add foreign key constraint for AttorneySelectedVisaType
            migrationBuilder.AddForeignKey(
                name: "FK_Cases_VisaTypes_AttorneySelectedVisaTypeId",
                table: "Cases",
                column: "AttorneySelectedVisaTypeId",
                principalTable: "VisaTypes",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop foreign key constraint
            migrationBuilder.DropForeignKey(
                name: "FK_Cases_VisaTypes_AttorneySelectedVisaTypeId",
                table: "Cases");

            // Drop indexes from Cases table
            migrationBuilder.DropIndex(
                name: "IX_Cases_AttorneySelectedVisaTypeId",
                table: "Cases");

            migrationBuilder.DropIndex(
                name: "IX_Cases_IsVisaLockedByAttorney",
                table: "Cases");

            // Drop VisaEligibilityResults table
            migrationBuilder.DropTable(
                name: "VisaEligibilityResults");

            // Drop columns from VisaRecommendations table
            migrationBuilder.DropColumn(
                name: "EligibilityStatus",
                table: "VisaRecommendations");

            migrationBuilder.DropColumn(
                name: "MatchScore",
                table: "VisaRecommendations");

            // Drop columns from Cases table
            migrationBuilder.DropColumn(
                name: "AttorneySelectedVisaTypeId",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "IsVisaLockedByAttorney",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "VisaLockedAt",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "VisaLockedByStaffId",
                table: "Cases");
        }
    }
}

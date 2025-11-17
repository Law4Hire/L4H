using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace L4H.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateInterviewProcessChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EligibilityStatus",
                table: "VisaRecommendations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MatchScore",
                table: "VisaRecommendations",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "InterviewSessions",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AlterColumn<Guid>(
                name: "CaseId",
                table: "InterviewSessions",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

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

            migrationBuilder.CreateIndex(
                name: "IX_Cases_AttorneySelectedVisaTypeId",
                table: "Cases",
                column: "AttorneySelectedVisaTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Cases_IsVisaLockedByAttorney",
                table: "Cases",
                column: "IsVisaLockedByAttorney");

            migrationBuilder.CreateIndex(
                name: "IX_VisaEligibilityResults_InterviewSessionId",
                table: "VisaEligibilityResults",
                column: "InterviewSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_VisaEligibilityResults_InterviewSessionId_VisaTypeId",
                table: "VisaEligibilityResults",
                columns: new[] { "InterviewSessionId", "VisaTypeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VisaEligibilityResults_VisaTypeId",
                table: "VisaEligibilityResults",
                column: "VisaTypeId");

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
            migrationBuilder.DropForeignKey(
                name: "FK_Cases_VisaTypes_AttorneySelectedVisaTypeId",
                table: "Cases");

            migrationBuilder.DropTable(
                name: "VisaEligibilityResults");

            migrationBuilder.DropIndex(
                name: "IX_Cases_AttorneySelectedVisaTypeId",
                table: "Cases");

            migrationBuilder.DropIndex(
                name: "IX_Cases_IsVisaLockedByAttorney",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "EligibilityStatus",
                table: "VisaRecommendations");

            migrationBuilder.DropColumn(
                name: "MatchScore",
                table: "VisaRecommendations");

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

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "InterviewSessions",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "CaseId",
                table: "InterviewSessions",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);
        }
    }
}

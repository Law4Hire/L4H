using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace L4H.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPageConfigAndInterviewDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PageConfig",
                table: "InterviewQuestions",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "InterviewDocumentUploads",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InterviewSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuestionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OriginalFileName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    StoredFileName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    StoragePath = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AssociatedToUserAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InterviewDocumentUploads", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InterviewDocumentUploads_InterviewQuestions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "InterviewQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_InterviewDocumentUploads_InterviewSessions_InterviewSessionId",
                        column: x => x.InterviewSessionId,
                        principalTable: "InterviewSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_InterviewDocumentUploads_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InterviewDocumentUploads_InterviewSessionId",
                table: "InterviewDocumentUploads",
                column: "InterviewSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_InterviewDocumentUploads_QuestionId",
                table: "InterviewDocumentUploads",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_InterviewDocumentUploads_Status",
                table: "InterviewDocumentUploads",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_InterviewDocumentUploads_UserId",
                table: "InterviewDocumentUploads",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InterviewDocumentUploads");

            migrationBuilder.DropColumn(
                name: "PageConfig",
                table: "InterviewQuestions");
        }
    }
}

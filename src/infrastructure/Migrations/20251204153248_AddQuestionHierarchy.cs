using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace L4H.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestionHierarchy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ParentId",
                table: "InterviewQuestions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_InterviewQuestions_ParentId",
                table: "InterviewQuestions",
                column: "ParentId");

            migrationBuilder.AddForeignKey(
                name: "FK_InterviewQuestions_InterviewQuestions_ParentId",
                table: "InterviewQuestions",
                column: "ParentId",
                principalTable: "InterviewQuestions",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InterviewQuestions_InterviewQuestions_ParentId",
                table: "InterviewQuestions");

            migrationBuilder.DropIndex(
                name: "IX_InterviewQuestions_ParentId",
                table: "InterviewQuestions");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "InterviewQuestions");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace L4H.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDynamicInterviewFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ActionType",
                table: "QuestionOptions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QualifiedVisaCodes",
                table: "QuestionOptions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetPagePath",
                table: "QuestionOptions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TargetQuestionId",
                table: "QuestionOptions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ParentOptionValue",
                table: "InterviewQuestions",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActionType",
                table: "QuestionOptions");

            migrationBuilder.DropColumn(
                name: "QualifiedVisaCodes",
                table: "QuestionOptions");

            migrationBuilder.DropColumn(
                name: "TargetPagePath",
                table: "QuestionOptions");

            migrationBuilder.DropColumn(
                name: "TargetQuestionId",
                table: "QuestionOptions");

            migrationBuilder.DropColumn(
                name: "ParentOptionValue",
                table: "InterviewQuestions");
        }
    }
}

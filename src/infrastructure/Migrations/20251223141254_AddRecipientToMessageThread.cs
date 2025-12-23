using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace L4H.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRecipientToMessageThread : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "RecipientUserId",
                table: "MessageThreads",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MessageThreads_RecipientUserId",
                table: "MessageThreads",
                column: "RecipientUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_MessageThreads_Users_RecipientUserId",
                table: "MessageThreads",
                column: "RecipientUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MessageThreads_Users_RecipientUserId",
                table: "MessageThreads");

            migrationBuilder.DropIndex(
                name: "IX_MessageThreads_RecipientUserId",
                table: "MessageThreads");

            migrationBuilder.DropColumn(
                name: "RecipientUserId",
                table: "MessageThreads");
        }
    }
}

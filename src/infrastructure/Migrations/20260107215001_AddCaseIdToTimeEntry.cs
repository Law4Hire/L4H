using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace L4H.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCaseIdToTimeEntry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TimeEntries_Clients_ClientId",
                table: "TimeEntries");

            migrationBuilder.AddColumn<Guid>(
                name: "CaseId",
                table: "TimeEntries",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_TimeEntries_CaseId",
                table: "TimeEntries",
                column: "CaseId");

            migrationBuilder.AddForeignKey(
                name: "FK_TimeEntries_Cases_CaseId",
                table: "TimeEntries",
                column: "CaseId",
                principalTable: "Cases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TimeEntries_Clients_ClientId",
                table: "TimeEntries",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TimeEntries_Cases_CaseId",
                table: "TimeEntries");

            migrationBuilder.DropForeignKey(
                name: "FK_TimeEntries_Clients_ClientId",
                table: "TimeEntries");

            migrationBuilder.DropIndex(
                name: "IX_TimeEntries_CaseId",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "CaseId",
                table: "TimeEntries");

            migrationBuilder.AddForeignKey(
                name: "FK_TimeEntries_Clients_ClientId",
                table: "TimeEntries",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace L4H.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ChangeAssignedStaffIdToInt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop the old uniqueidentifier column
            migrationBuilder.DropColumn(
                name: "AssignedStaffId",
                table: "Cases");

            // Add the new int column
            migrationBuilder.AddColumn<int>(
                name: "AssignedStaffId",
                table: "Cases",
                type: "int",
                nullable: true);

            // Create index for the new column
            migrationBuilder.CreateIndex(
                name: "IX_Cases_AssignedStaffId",
                table: "Cases",
                column: "AssignedStaffId");

            // Add foreign key constraint to Attorneys table
            migrationBuilder.AddForeignKey(
                name: "FK_Cases_Attorneys_AssignedStaffId",
                table: "Cases",
                column: "AssignedStaffId",
                principalTable: "Attorneys",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop foreign key constraint
            migrationBuilder.DropForeignKey(
                name: "FK_Cases_Attorneys_AssignedStaffId",
                table: "Cases");

            // Drop index
            migrationBuilder.DropIndex(
                name: "IX_Cases_AssignedStaffId",
                table: "Cases");

            // Drop the int column
            migrationBuilder.DropColumn(
                name: "AssignedStaffId",
                table: "Cases");

            // Add back the uniqueidentifier column
            migrationBuilder.AddColumn<Guid>(
                name: "AssignedStaffId",
                table: "Cases",
                type: "uniqueidentifier",
                nullable: true);
        }
    }
}

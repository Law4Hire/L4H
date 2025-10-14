using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace L4H.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAttorneyIdToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AttorneyId",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_AttorneyId",
                table: "Users",
                column: "AttorneyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Attorneys_AttorneyId",
                table: "Users",
                column: "AttorneyId",
                principalTable: "Attorneys",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Attorneys_AttorneyId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_AttorneyId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "AttorneyId",
                table: "Users");
        }
    }
}

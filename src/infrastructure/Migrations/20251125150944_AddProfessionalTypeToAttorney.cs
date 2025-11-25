using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace L4H.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProfessionalTypeToAttorney : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProfessionalType",
                table: "Attorneys",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProfessionalType",
                table: "Attorneys");
        }
    }
}

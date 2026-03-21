using L4H.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace L4H.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(L4HDbContext))]
    [Migration("20260321000100_AddAttorneyDisplayOnStaffPage")]
    public partial class AddAttorneyDisplayOnStaffPage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "DisplayOnStaffPage",
                table: "Attorneys",
                type: "bit",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DisplayOnStaffPage",
                table: "Attorneys");
        }
    }
}

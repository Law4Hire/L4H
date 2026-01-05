using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace L4H.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExchangeSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExchangeClientId",
                table: "SiteConfigurations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExchangeClientSecret",
                table: "SiteConfigurations",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExchangeSystemEmail",
                table: "SiteConfigurations",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExchangeTenantId",
                table: "SiteConfigurations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExchangeClientId",
                table: "SiteConfigurations");

            migrationBuilder.DropColumn(
                name: "ExchangeClientSecret",
                table: "SiteConfigurations");

            migrationBuilder.DropColumn(
                name: "ExchangeSystemEmail",
                table: "SiteConfigurations");

            migrationBuilder.DropColumn(
                name: "ExchangeTenantId",
                table: "SiteConfigurations");
        }
    }
}

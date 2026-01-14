using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace L4H.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ResolvePendingModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "StripePublishableKey",
                table: "SiteConfigurations",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StripeSecretKey",
                table: "SiteConfigurations",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StripeWebhookSecret",
                table: "SiteConfigurations",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StripePublishableKey",
                table: "SiteConfigurations");

            migrationBuilder.DropColumn(
                name: "StripeSecretKey",
                table: "SiteConfigurations");

            migrationBuilder.DropColumn(
                name: "StripeWebhookSecret",
                table: "SiteConfigurations");
        }
    }
}

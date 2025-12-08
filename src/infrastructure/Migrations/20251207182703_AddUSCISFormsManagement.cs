using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace L4H.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUSCISFormsManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "USCISForms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FormNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FormName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    FormUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    EstimatedTimeMinutes = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_USCISForms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_USCISForms_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_USCISForms_Users_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "FormDependencies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ParentFormId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DependentFormId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VisaTypeId = table.Column<int>(type: "int", nullable: false),
                    IsRequired = table.Column<bool>(type: "bit", nullable: false),
                    DependencyReason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormDependencies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FormDependencies_USCISForms_DependentFormId",
                        column: x => x.DependentFormId,
                        principalTable: "USCISForms",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_FormDependencies_USCISForms_ParentFormId",
                        column: x => x.ParentFormId,
                        principalTable: "USCISForms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FormDependencies_VisaTypes_VisaTypeId",
                        column: x => x.VisaTypeId,
                        principalTable: "VisaTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FormPricing",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FormId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SelfFilePriceUSD = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    ParalegalPriceUSD = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    LawyerPriceUSD = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    LLCFeeUSD = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    LLCFeePercentage = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    EffectiveDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpirationDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormPricing", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FormPricing_USCISForms_FormId",
                        column: x => x.FormId,
                        principalTable: "USCISForms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FormPricing_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_FormPricing_Users_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "FormVisaTypeMappings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FormId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VisaTypeId = table.Column<int>(type: "int", nullable: false),
                    IsRequired = table.Column<bool>(type: "bit", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormVisaTypeMappings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FormVisaTypeMappings_USCISForms_FormId",
                        column: x => x.FormId,
                        principalTable: "USCISForms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FormVisaTypeMappings_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_FormVisaTypeMappings_Users_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_FormVisaTypeMappings_VisaTypes_VisaTypeId",
                        column: x => x.VisaTypeId,
                        principalTable: "VisaTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FormDependencies_DependentFormId",
                table: "FormDependencies",
                column: "DependentFormId");

            migrationBuilder.CreateIndex(
                name: "IX_FormDependencies_ParentFormId",
                table: "FormDependencies",
                column: "ParentFormId");

            migrationBuilder.CreateIndex(
                name: "IX_FormDependencies_ParentFormId_VisaTypeId",
                table: "FormDependencies",
                columns: new[] { "ParentFormId", "VisaTypeId" });

            migrationBuilder.CreateIndex(
                name: "IX_FormDependencies_VisaTypeId",
                table: "FormDependencies",
                column: "VisaTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_FormPricing_CreatedByUserId",
                table: "FormPricing",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_FormPricing_EffectiveDate",
                table: "FormPricing",
                column: "EffectiveDate");

            migrationBuilder.CreateIndex(
                name: "IX_FormPricing_FormId",
                table: "FormPricing",
                column: "FormId");

            migrationBuilder.CreateIndex(
                name: "IX_FormPricing_IsActive",
                table: "FormPricing",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_FormPricing_UpdatedByUserId",
                table: "FormPricing",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_FormVisaTypeMappings_CreatedByUserId",
                table: "FormVisaTypeMappings",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_FormVisaTypeMappings_DisplayOrder",
                table: "FormVisaTypeMappings",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_FormVisaTypeMappings_FormId_VisaTypeId",
                table: "FormVisaTypeMappings",
                columns: new[] { "FormId", "VisaTypeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FormVisaTypeMappings_UpdatedByUserId",
                table: "FormVisaTypeMappings",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_FormVisaTypeMappings_VisaTypeId",
                table: "FormVisaTypeMappings",
                column: "VisaTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_USCISForms_CreatedByUserId",
                table: "USCISForms",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_USCISForms_FormNumber",
                table: "USCISForms",
                column: "FormNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_USCISForms_IsActive",
                table: "USCISForms",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_USCISForms_UpdatedByUserId",
                table: "USCISForms",
                column: "UpdatedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FormDependencies");

            migrationBuilder.DropTable(
                name: "FormPricing");

            migrationBuilder.DropTable(
                name: "FormVisaTypeMappings");

            migrationBuilder.DropTable(
                name: "USCISForms");
        }
    }
}

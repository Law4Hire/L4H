const fs = require('fs');
const path = require('path');

const packageMappings = {
  // EntityFrameworkCore packages
  'Microsoft.EntityFrameworkCore': '10.0.3.1',
  'Microsoft.EntityFrameworkCore.SqlServer': '10.0.3.1',
  'Microsoft.EntityFrameworkCore.Design': '10.0.3.1',
  'Microsoft.EntityFrameworkCore.InMemory': '10.0.3.1',

  // ASP.NET Core packages
  'Microsoft.AspNetCore.Authentication.JwtBearer': '10.0.3.4',
  'Microsoft.AspNetCore.OpenApi': '10.0.3.4',
  'Microsoft.AspNetCore.Mvc.Testing': '10.0.3.4',

  // Extensions packages
  'Microsoft.Extensions.Hosting': '10.0.3.1',
  'Microsoft.Extensions.Http': '10.0.3.1',
  'Microsoft.Extensions.Localization': '10.0.3.4',
  'Microsoft.Extensions.Hosting.Abstractions': '10.0.3.1',
  'Microsoft.Extensions.Logging.Abstractions': '10.0.3.1',
  'Microsoft.Extensions.Options': '10.0.3.1',
  'Microsoft.Extensions.Localization.Abstractions': '10.0.3.4',
  'Microsoft.Extensions.Configuration.Abstractions': '10.0.3.1',
  'Microsoft.Extensions.DependencyInjection': '10.0.3.1'
};

function updateProjectFile(filePath) {
  console.log(`\nUpdating: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Update each package
  for (const [packageName, version] of Object.entries(packageMappings)) {
    const regex = new RegExp(`(<PackageReference Include="${packageName.replace('.', '\\.')}" Version=")9\\.0\\.\\d+`, 'g');
    content = content.replace(regex, `$1${version}`);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('  ✓ Updated successfully');
  } else {
    console.log('  - No changes needed');
  }
}

// Find all .csproj files
const projectFiles = [
  'src/api/L4H.Api.csproj',
  'src/infrastructure/L4H.Infrastructure.csproj',
  'src/shared/L4H.Shared.csproj',
  'src/scraper/L4H.ScraperWorker.csproj',
  'src/upload-gateway/L4H.UploadGateway.csproj',
  'tests/api.tests/L4H.Api.Tests.csproj',
  'tests/Infra.Tests/L4H.Infra.Tests.csproj',
  'tests/scraper.tests/L4H.Scraper.Tests.csproj',
  'tests/upload-gateway.tests/L4H.UploadGateway.Tests.csproj',
  'tests/ui.wrap/L4H.UI.Wrap.Tests.csproj',
  'tests/L4H.Api.IntegrationTests/L4H.Api.IntegrationTests.csproj',
  'tests/ui.e2e/L4H.UI.E2E.Tests.csproj'
];

console.log(`Found ${projectFiles.length} project files to update...`);

for (const file of projectFiles) {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    updateProjectFile(fullPath);
  } else {
    console.log(`  ⚠ File not found: ${file}`);
  }
}

console.log('\n✅ Update complete!');
console.log('\nNext steps:');
console.log('1. Run: dotnet restore');
console.log('2. Run: dotnet build');
console.log('3. Run: dotnet test');

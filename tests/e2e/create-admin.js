const https = require('https');
const http = require('http');

// Register the admin user
const registerData = JSON.stringify({
  email: 'dcann@cannlaw.com',
  password: 'SecureTest123!',
  confirmPassword: 'SecureTest123!',
  firstName: 'Diana',
  lastName: 'Cann',
  preferredLanguage: 'en'
});

const options = {
  hostname: 'localhost',
  port: 5175,
  path: '/register', // Assuming this is the frontend route
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': registerData.length
  }
};

console.log('Attempting to register admin user dcann@cannlaw.com...');
console.log('This will register the user through the normal flow.');
console.log('Then you need to manually update the database to set IsAdmin=true');
console.log('');
console.log('SQL Command:');
console.log("UPDATE Users SET IsAdmin = 1, IsActive = 1 WHERE Email = 'dcann@cannlaw.com'");
console.log('');
console.log('Run this in kubectl:');
console.log('kubectl exec -n l4h deployment/sqlserver -- /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd" -d L4H -C -Q "UPDATE Users SET IsAdmin = 1, IsActive = 1 WHERE Email = \'dcann@cannlaw.com\'"');

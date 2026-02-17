const fetch = require('node-fetch');

async function seedAttorneys() {
  try {
    console.log('Forcing attorney seed...');
    // Assuming running locally on port 8765 as per vite config proxy
    const response = await fetch('http://localhost:8765/api/v1/attorneys/force-seed', {
      method: 'POST'
    });

    if (response.ok) {
      console.log('Attorneys seeded successfully.');
    } else {
      console.error('Failed to seed attorneys:', response.status, response.statusText);
      const text = await response.text();
      console.error(text);
    }
  } catch (error) {
    console.error('Error seeding attorneys:', error);
  }
}

seedAttorneys();

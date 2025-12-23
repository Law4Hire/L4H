const fs = require('fs');
const path = require('path');
const https = require('https');

const photos = [
  { name: 'denise.jpg', url: 'https://cannlaw.com/images/denise.jpg' },
  { name: 'wen.jpg', url: 'https://cannlaw.com/images/wen.jpg' },
  { name: 'angela.jpg', url: 'https://cannlaw.com/images/angela.jpg' },
  { name: 'john.jpg', url: 'https://cannlaw.com/images/john.jpg' },
  { name: 'chika.jpg', url: 'https://cannlaw.com/images/chika.jpg' },
  { name: 'alex.jpg', url: 'https://cannlaw.com/images/alex.jpg' },
  { name: 'janice.jpg', url: 'https://cannlaw.com/images/janice.jpg' },
  { name: 'katherine.jpg', url: 'https://cannlaw.com/images/katherine.jpg' },
  { name: 'vivien.jpg', url: 'https://cannlaw.com/images/vivien.jpg' },
  { name: 'patricia.jpg', url: 'https://cannlaw.com/images/patricia.jpg' }
];

const targetDir = path.join(__dirname, 'web', 'cannlaw', 'public', 'images', 'attorneys');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else {
        file.close();
        fs.unlink(dest, () => {}); // Delete the empty file
        reject(new Error(`Status code: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('Starting downloads...');
  for (const photo of photos) {
    const dest = path.join(targetDir, photo.name);
    try {
      await download(photo.url, dest);
      console.log(`Successfully downloaded ${photo.name}`);
    } catch (err) {
      console.error(`Failed to download ${photo.name}: ${err.message}`);
    }
  }
  console.log('Finished downloads.');
}

main();

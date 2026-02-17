const fs = require('fs');
const path = require('path');
const https = require('https');

const photos = [
  { name: 'denise.jpg', url: 'https://cannlaw.com/images/dsc001.jpg' },
  { name: 'angela.jpg', url: 'https://cannlaw.com/images/ange.jpg' },
  { name: 'chika.jpg', url: 'https://cannlaw.com/images/chikaalone002editedps.jpg' },
  { name: 'alex.jpg', url: 'https://cannlaw.com/images/alex004.jpg' },
  { name: 'janice.jpg', url: 'https://cannlaw.com/images/janice010.jpg' }
];

const targetDir = path.join(__dirname, 'web', 'cannlaw', 'public', 'images', 'attorneys');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };
    https.get(url, options, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else {
        file.close();
        fs.unlink(dest, () => {}); 
        reject(new Error(`Status code: ${response.statusCode} for ${url}`));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('Starting downloads from cannlaw.com/images...');
  for (const photo of photos) {
    const dest = path.join(targetDir, photo.name);
    try {
      await download(photo.url, dest);
      console.log(`Successfully downloaded ${photo.name} from ${photo.url}`);
    } catch (err) {
      console.error(`Failed to download ${photo.name}: ${err.message}`);
    }
  }
  console.log('Finished downloads.');
}

main();

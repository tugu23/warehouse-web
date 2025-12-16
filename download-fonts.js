const https = require('https');
const fs = require('fs');
const path = require('path');

const fonts = [
  {
    url: 'https://github.com/google/fonts/raw/main/apache/roboto/static/Roboto-Regular.ttf',
    output: path.join(__dirname, 'public', 'fonts', 'Roboto-Regular.ttf')
  },
  {
    url: 'https://github.com/google/fonts/raw/main/apache/roboto/static/Roboto-Bold.ttf',
    output: path.join(__dirname, 'public', 'fonts', 'Roboto-Bold.ttf')
  }
];

function downloadFont(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`✅ Downloaded: ${path.basename(outputPath)}`);
            resolve();
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ Downloaded: ${path.basename(outputPath)}`);
          resolve();
        });
      }
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('📥 Downloading Roboto fonts...');
  
  // Ensure fonts directory exists
  const fontsDir = path.join(__dirname, 'public', 'fonts');
  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
  }

  try {
    for (const font of fonts) {
      await downloadFont(font.url, font.output);
    }
    console.log('🎉 All fonts downloaded successfully!');
  } catch (error) {
    console.error('❌ Error downloading fonts:', error.message);
    process.exit(1);
  }
}

main();


/**
 * Generate app icons from source logo
 * Install sharp first: npm install -D sharp
 * Run: node scripts/generate-app-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Sharp is not installed. Install it with: npm install -D sharp');
  process.exit(1);
}

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const SOURCE_IMAGE = path.join(ASSETS_DIR, 'dukaPOS-LOGO.jfif');

// Icon configurations
const ICON_CONFIGS = [
  { name: 'icon.png', width: 1024, height: 1024, fit: 'contain', background: '#ffffff' },
  { name: 'adaptive-icon.png', width: 1024, height: 1024, fit: 'contain', background: '#ffffff' },
  { name: 'splash.png', width: 1284, height: 2778, fit: 'contain', background: '#ffffff' },
  { name: 'favicon.png', width: 48, height: 48, fit: 'contain', background: '#ffffff' },
];

async function generateIcons() {
  console.log('🎨 Generating app icons from:', SOURCE_IMAGE);

  // Check if source exists
  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error('❌ Source image not found:', SOURCE_IMAGE);
    process.exit(1);
  }

  for (const config of ICON_CONFIGS) {
    const outputPath = path.join(ASSETS_DIR, config.name);
    
    try {
      await sharp(SOURCE_IMAGE)
        .resize(config.width, config.height, {
          fit: config.fit,
          background: config.background,
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: ${config.name} (${config.width}×${config.height})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${config.name}:`, error.message);
    }
  }

  console.log('\n✨ Icon generation complete!');
  console.log('📱 Icons are ready in the assets folder.');
}

generateIcons().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

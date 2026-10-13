/**
 * Script to help get and configure Sentry DSN
 * Run: node scripts/get-sentry-dsn.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔍 Sentry DSN Configuration Helper\n');
console.log('Organization: mcokoth-technologies');
console.log('Project: dukapos-mobile\n');

console.log('Get your DSN from:');
console.log('https://mcokoth-technologies.sentry.io/settings/projects/dukapos-mobile/keys/\n');

rl.question('Paste your Sentry DSN here: ', (dsn) => {
  if (!dsn || !dsn.includes('sentry.io')) {
    console.log('\n❌ Invalid DSN format. Should look like:');
    console.log('https://xxxxx@xxxxx.ingest.sentry.io/xxxxx\n');
    rl.close();
    return;
  }

  console.log('\n✅ Valid DSN received!\n');
  console.log('Updating configuration files...\n');

  try {
    // Update .env
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/SENTRY_DSN=.*/, `SENTRY_DSN=${dsn}`);
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env');

    // Update .env.production
    const envProdPath = path.join(__dirname, '..', '.env.production');
    let envProdContent = fs.readFileSync(envProdPath, 'utf8');
    envProdContent = envProdContent.replace(/SENTRY_DSN=.*/, `SENTRY_DSN=${dsn}`);
    fs.writeFileSync(envProdPath, envProdContent);
    console.log('✅ Updated .env.production');

    // Update eas.json
    const easPath = path.join(__dirname, '..', 'eas.json');
    let easContent = fs.readFileSync(easPath, 'utf8');
    const easJson = JSON.parse(easContent);
    
    if (easJson.build.development?.env) {
      easJson.build.development.env.SENTRY_DSN = dsn;
    }
    if (easJson.build.preview?.env) {
      easJson.build.preview.env.SENTRY_DSN = dsn;
    }
    if (easJson.build.production?.env) {
      easJson.build.production.env.SENTRY_DSN = dsn;
    }
    
    fs.writeFileSync(easPath, JSON.stringify(easJson, null, 2));
    console.log('✅ Updated eas.json');

    console.log('\n🎉 Sentry DSN configured successfully!\n');
    console.log('Next steps:');
    console.log('1. Test in development: npx expo start');
    console.log('2. Build APK: eas build --profile preview --platform android');
    console.log('3. Check crashes in: https://mcokoth-technologies.sentry.io/\n');

  } catch (error) {
    console.error('\n❌ Error updating files:', error.message);
  }

  rl.close();
});

#!/usr/bin/env node
/**
 * Secure Build Script for DukaPOS
 * 
 * This script prepares the app for production by:
 * 1. Validating security configurations
 * 2. Generating secure keys
 * 3. Checking for security issues
 * 4. Creating production build
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ERROR: ${message}`, 'red');
}

function warning(message) {
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Security validation checks
const checks = {
  /**
   * Check for console.log statements in source files
   */
  checkConsoleLogs: () => {
    info('Checking for console.log statements...');
    const srcDir = path.join(__dirname, '../src');
    let foundLogs = false;

    function searchDir(dir) {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          searchDir(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            if (line.includes('console.log') && !line.trim().startsWith('//')) {
              warning(`Found console.log in ${fullPath}:${index + 1}`);
              foundLogs = true;
            }
          });
        }
      });
    }

    searchDir(srcDir);
    
    if (foundLogs) {
      warning('Console.log statements found. These will be removed in production build.');
    } else {
      success('No console.log statements found');
    }
    
    return !foundLogs;
  },

  /**
   * Check if .env files are properly configured
   */
  checkEnvFiles: () => {
    info('Checking environment files...');
    
    const envExample = path.join(__dirname, '../.env.example');
    const envProduction = path.join(__dirname, '../.env.production');
    
    if (!fs.existsSync(envExample)) {
      error('.env.example not found');
      return false;
    }
    
    if (!fs.existsSync(envProduction)) {
      warning('.env.production not found - using defaults');
      return false;
    }
    
    // Check for placeholder values
    const envContent = fs.readFileSync(envProduction, 'utf8');
    
    if (envContent.includes('__INJECT_AT_BUILD__')) {
      warning('Production env contains placeholder values');
      return false;
    }
    
    if (envContent.includes('localhost') || envContent.includes('10.0.2.2')) {
      error('Production env contains development URLs');
      return false;
    }
    
    success('Environment files configured correctly');
    return true;
  },

  /**
   * Check for sensitive data in git
   */
  checkGitignore: () => {
    info('Checking .gitignore...');
    
    const gitignorePath = path.join(__dirname, '../../.gitignore');
    
    if (!fs.existsSync(gitignorePath)) {
      error('.gitignore not found');
      return false;
    }
    
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    
    const requiredEntries = [
      '.env.production',
      '*.key',
      '*.keystore',
      '*.jks',
      'secrets.json',
    ];
    
    const missing = requiredEntries.filter(entry => !gitignoreContent.includes(entry));
    
    if (missing.length > 0) {
      warning(`Missing .gitignore entries: ${missing.join(', ')}`);
      return false;
    }
    
    success('.gitignore properly configured');
    return true;
  },

  /**
   * Check TypeScript compilation
   */
  checkTypeScript: () => {
    info('Checking TypeScript compilation...');
    
    try {
      const { execSync } = require('child_process');
      execSync('npx tsc --noEmit', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
      success('TypeScript compilation successful');
      return true;
    } catch (error) {
      warning('TypeScript compilation has errors');
      return false;
    }
  },

  /**
   * Generate secure request signing key
   */
  generateSigningKey: () => {
    info('Generating request signing key...');
    
    const key = crypto.randomBytes(32).toString('base64');
    
    log(`\nRequest Signing Key (save this securely):\n${key}\n`, 'green');
    log('Add this to your .env.production as REQUEST_SIGNING_KEY', 'blue');
    
    return key;
  },

  /**
   * Validate app.json configuration
   */
  checkAppConfig: () => {
    info('Checking app configuration...');
    
    const appJsonPath = path.join(__dirname, '../app.json');
    
    if (!fs.existsSync(appJsonPath)) {
      error('app.json not found');
      return false;
    }
    
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    if (!appJson.expo.version) {
      error('App version not set');
      return false;
    }
    
    success(`App version: ${appJson.expo.version}`);
    return true;
  },

  /**
   * Check for hardcoded secrets
   */
  checkHardcodedSecrets: () => {
    info('Checking for hardcoded secrets...');
    
    const srcDir = path.join(__dirname, '../src');
    let foundSecrets = false;
    
    // Patterns that might indicate secrets
    const secretPatterns = [
      /api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/i,
      /secret[_-]?key\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/i,
      /password\s*[:=]\s*['"][^'"]+['"]/i,
      /token\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/i,
    ];
    
    function searchDir(dir) {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          searchDir(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          secretPatterns.forEach(pattern => {
            if (pattern.test(content)) {
              warning(`Possible hardcoded secret in ${fullPath}`);
              foundSecrets = true;
            }
          });
        }
      });
    }
    
    searchDir(srcDir);
    
    if (foundSecrets) {
      warning('Possible hardcoded secrets found - review manually');
      return false;
    }
    
    success('No obvious hardcoded secrets found');
    return true;
  },
};

// Main execution
async function main() {
  log('\n🔒 DukaPOS Security Build Check\n', 'blue');
  
  const results = {
    consoleLogs: checks.checkConsoleLogs(),
    envFiles: checks.checkEnvFiles(),
    gitignore: checks.checkGitignore(),
    typescript: checks.checkTypeScript(),
    appConfig: checks.checkAppConfig(),
    secrets: checks.checkHardcodedSecrets(),
  };
  
  log('\n📊 Security Check Summary\n', 'blue');
  
  let passed = 0;
  let failed = 0;
  
  Object.entries(results).forEach(([check, result]) => {
    if (result) {
      success(`${check}: PASSED`);
      passed++;
    } else {
      error(`${check}: FAILED`);
      failed++;
    }
  });
  
  log(`\n${passed} checks passed, ${failed} checks failed\n`);
  
  if (failed > 0) {
    warning('Some security checks failed. Review issues before production build.');
    process.exit(1);
  }
  
  // Generate signing key
  log('\n🔑 Generating Security Keys\n', 'blue');
  checks.generateSigningKey();
  
  log('\n✅ Security checks passed! Ready for production build.\n', 'green');
  log('Next steps:', 'blue');
  log('1. Update .env.production with generated keys');
  log('2. Run: npm run build:production');
  log('3. Test the production build thoroughly');
  log('4. Deploy to app stores\n');
}

// Run checks
main().catch(error => {
  log(`\n❌ Script error: ${error.message}\n`, 'red');
  process.exit(1);
});

# Build Verification Script for DukaPOS Mobile
# Run this before building production APK

Write-Host "DukaPOS Build Verification" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

$hasErrors = $false

# 1. Type Check
Write-Host "1. Running TypeScript type check..." -ForegroundColor Yellow
$typeCheckOutput = npx tsc --noEmit 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   PASSED - Type check successful" -ForegroundColor Green
} else {
    Write-Host "   FAILED - Type check errors found:" -ForegroundColor Red
    Write-Host $typeCheckOutput -ForegroundColor Red
    $hasErrors = $true
}

# 2. Check environment configuration
Write-Host ""
Write-Host "2. Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env.production") {
    Write-Host "   PASSED - .env.production exists" -ForegroundColor Green
} else {
    Write-Host "   WARNING - .env.production not found" -ForegroundColor Yellow
}

# 3. Check EAS build configuration
Write-Host ""
Write-Host "3. Checking EAS build configuration..." -ForegroundColor Yellow
if (Test-Path "eas.json") {
    Write-Host "   PASSED - eas.json exists" -ForegroundColor Green
} else {
    Write-Host "   FAILED - eas.json not found" -ForegroundColor Red
    $hasErrors = $true
}

# 4. Check app configuration
Write-Host ""
Write-Host "4. Checking app configuration..." -ForegroundColor Yellow
if (Test-Path "app.config.js") {
    Write-Host "   PASSED - app.config.js exists" -ForegroundColor Green
} else {
    Write-Host "   FAILED - app.config.js not found" -ForegroundColor Red
    $hasErrors = $true
}

# Summary
Write-Host ""
Write-Host "=============================" -ForegroundColor Cyan
if ($hasErrors) {
    Write-Host "BUILD VERIFICATION FAILED" -ForegroundColor Red
    Write-Host "Please fix the errors above before building." -ForegroundColor Red
    exit 1
} else {
    Write-Host "BUILD VERIFICATION PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now build the APK with:" -ForegroundColor Cyan
    Write-Host "  eas build --profile preview --platform android" -ForegroundColor White
    Write-Host "  OR" -ForegroundColor White
    Write-Host "  eas build --profile production --platform android" -ForegroundColor White
    exit 0
}

# Database Fix Verification Plan

## Issues Addressed

### Issue 1: Duplicate Column Error on Fresh Install
**Error Message:** `Database Error: Call to function 'NativeDatabase.execAsync' has been rejected. Caused by: duplicate column name: currentQuantity`

**Root Cause:** 
- Base schema (schema.ts) creates product_variants table with `currentQuantity` column
- Migration 6 tries to ADD the same column
- SQLite rejects duplicate column

**Fix Applied:**
- Added `currentQuantity` to Migration 4 (product_variants creation)
- Removed Migration 6 entirely
- Updated schema.ts to match Migration 4

### Issue 2: Missing Column Error  
**Error Message:** `Query failed: Call to function 'NativeDatabase.prepareAsync' has been rejected. Caused by: Error code: no such column: isActive`

**Root Cause:**
- Migration 4 created product_variants without `isActive` column
- Schema.ts expected `isActive` to exist
- Queries failed when trying to use the column

**Fix Applied:**
- Added `isActive INTEGER DEFAULT 1` to Migration 4
- Schema and migration now match

### Issue 3-5: Additional Schema Mismatches
**Problems:**
- products table: `sku` column mismatch
- suppliers table: `rating` column mismatch  
- expenses table: `date` column mismatch

**Fix Applied:**
- Updated schema.ts to include all columns
- Added defensive checks to migrations (PRAGMA table_info)
- Migrations now check if column exists before adding

## Files Modified

1. **src/database/schema.ts**
   ```diff
   + Added sku to products table
   + Added rating to suppliers table
   + Added date to expenses table
   + Added missing indexes to CREATE_INDEXES array
   ```

2. **src/database/index.ts**
   ```diff
   + Migration 1: Defensive check for sku column
   + Migration 2: Defensive checks for rating and date columns
   + Migration 4: Added currentQuantity and isActive columns
   - Removed Migration 6 (currentQuantity addition)
   + Fixed dropAllTables to include all tables
   ```

## Verification Steps

### A. Fresh Installation Test (Critical)
This simulates a new user installing the APK for the first time.

1. **Prepare:**
   - Uninstall app completely
   - Clear all app data
   - Build new APK with fixes

2. **Install & Launch:**
   - Install APK
   - Launch app
   - **Expected:** App opens without database errors
   - **Expected:** See business registration screen

3. **Complete Registration:**
   - Fill in business details
   - Submit registration
   - **Expected:** Registration succeeds
   - **Expected:** Navigate to main app screen

4. **Test Product Variants:**
   - Create a new product
   - Add a variant to the product
   - **Expected:** Variant creation succeeds
   - **Expected:** No "isActive" column error
   - **Expected:** No "currentQuantity" column error

5. **Test Full Workflow:**
   - Add stock to variant
   - Create a sale with the variant
   - **Expected:** All operations succeed
   - **Expected:** No database errors in logs

### B. Upgrade Path Test (Important)
This simulates an existing user upgrading to the new version.

1. **Prepare:**
   - Install previous version of app (if available)
   - Create some test data (products, sales, etc.)
   - Note the current database version

2. **Upgrade:**
   - Install new APK over existing installation
   - Launch app
   - **Expected:** App opens successfully
   - **Expected:** Migrations run without errors

3. **Verify Data:**
   - Check that all previous data is intact
   - **Expected:** Products, sales, etc. are still there
   - **Expected:** No data loss

4. **Test New Features:**
   - Create new variants
   - Test all functionality
   - **Expected:** Everything works

### C. Migration Logic Test

Check that defensive programming works:

1. **Schema Version Check:**
   - Enable dev logs
   - Launch app
   - **Expected:** See "Current database version: X" log
   - **Expected:** See "Migration X completed" for each migration

2. **Column Existence Check:**
   - Review logs for PRAGMA table_info calls
   - **Expected:** Migrations check before adding columns
   - **Expected:** No duplicate column errors

### D. Edge Cases

1. **Repeated Installation:**
   - Install app
   - Uninstall
   - Reinstall
   - **Expected:** Works every time

2. **Database Reset:**
   - Use app
   - Clear app data (Settings > Apps > App > Clear Data)
   - Launch app
   - **Expected:** Fresh database initialized correctly

## Success Criteria

✅ **Critical:**
- [ ] Fresh install launches without database errors
- [ ] User can complete business registration
- [ ] Product variants can be created without errors
- [ ] No "duplicate column" errors
- [ ] No "missing column" errors

✅ **Important:**
- [ ] Upgrade path works without data loss
- [ ] All migrations run successfully
- [ ] TypeScript compilation passes
- [ ] No runtime errors in dev logs

✅ **Nice to Have:**
- [ ] Defensive checks prevent future issues
- [ ] All tables properly indexed
- [ ] Performance is acceptable

## Rollback Plan

If issues are discovered:

1. **Immediate Actions:**
   - Document the specific error
   - Check if it's fresh install or upgrade
   - Collect device logs

2. **Quick Fix Options:**
   - Revert to previous APK version
   - Add emergency migration to fix specific issue
   - Update schema and rebuild

3. **Investigation:**
   - Review PRAGMA table_info output
   - Check migration execution order
   - Verify schema.ts matches migrations

## Post-Deployment Monitoring

After distributing the new APK:

1. **Monitor for errors:**
   - Check crash reports
   - Review user feedback
   - Monitor support requests

2. **Key metrics:**
   - Fresh installation success rate
   - Upgrade success rate
   - Database-related crash rate

3. **Follow-up actions:**
   - Address any reported issues quickly
   - Document lessons learned
   - Update prevention guidelines

## Prevention Guidelines

To avoid similar issues in future:

1. **Schema Changes Workflow:**
   - Update schema.ts with new columns/tables
   - Create migration with defensive checks
   - Test both fresh install and upgrade
   - Document the changes

2. **Code Review Checklist:**
   - [ ] Schema.ts matches latest migration state
   - [ ] Migration checks for column existence
   - [ ] Both scenarios tested
   - [ ] TypeScript compilation passes

3. **Testing Requirements:**
   - Always test fresh installation
   - Always test upgrade path
   - Test on multiple devices/OS versions
   - Check dev logs for errors

## Notes

- Database version after fixes: 5
- Migration 6 removed (no longer needed)
- All migrations now use defensive programming
- Schema and migrations are fully synchronized

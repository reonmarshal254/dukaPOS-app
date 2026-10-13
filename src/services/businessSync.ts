/**
 * Business Sync Service
 * 
 * Ensures business ID is always set and handles automatic sync to admin backend.
 */

import { executeQuerySingle, executeWrite } from '../database';
import { TABLES } from '../database/schema';
import { generateUUID } from '../utils/uuid';
import { getCurrentDateTime } from '../utils/datetime';
import { getBusinessID, storeBusinessID } from './secureStorage';

/**
 * Ensures a business ID exists. If not found in secure storage but exists in DB,
 * stores it. If no business exists at all, auto-generates one with placeholder data.
 * 
 * @returns The business ID (existing or newly generated)
 */
export async function ensureBusinessID(): Promise<string> {
  try {
    // Check secure storage first
    let businessId = await getBusinessID();
    
    if (businessId) {
      console.log('[businessSync] Business ID found in secure storage:', businessId);
      return businessId;
    }

    // Check if business exists in database
    const existingBusiness = await executeQuerySingle<{ id: string }>(
      `SELECT id FROM ${TABLES.BUSINESSES} LIMIT 1`
    );

    if (existingBusiness) {
      // Business exists in DB but not in secure storage — restore it
      businessId = existingBusiness.id;
      await storeBusinessID(businessId);
      console.log('[businessSync] Business ID restored from database:', businessId);
      return businessId;
    }

    // No business exists — auto-generate with placeholder data
    businessId = generateUUID();
    const now = getCurrentDateTime();

    await executeWrite(
      `INSERT INTO ${TABLES.BUSINESSES} (
        id, name, owner_name, phone, location, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        businessId,
        'My Business',
        'Business Owner',
        '0700000000',
        'Location',
        now,
        now,
      ]
    );

    await storeBusinessID(businessId);
    console.log('[businessSync] ✨ Auto-generated business ID:', businessId);
    
    return businessId;
  } catch (error) {
    console.error('[businessSync] Error ensuring business ID:', error);
    throw error;
  }
}

/**
 * Checks if the business has placeholder data (indicating auto-generated business)
 */
export async function hasPlaceholderData(): Promise<boolean> {
  try {
    const business = await executeQuerySingle<{ name: string }>(
      `SELECT name FROM ${TABLES.BUSINESSES} LIMIT 1`
    );
    return business?.name === 'My Business';
  } catch (error) {
    console.error('[businessSync] Error checking placeholder data:', error);
    return false;
  }
}

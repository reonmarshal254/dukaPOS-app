import { useQuery } from '@tanstack/react-query';
import { getDatabase, executeQuerySingle } from '../database';
import { TABLES } from '../database/schema';

interface Business {
  id: string;
  name: string;
  owner_name: string;
  phone: string;
  location: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to get the current business information
 */
export function useBusiness() {
  return useQuery({
    queryKey: ['business'],
    queryFn: async (): Promise<Business | null> => {
      try {
        const result = await executeQuerySingle<Business>(
          `SELECT * FROM ${TABLES.BUSINESSES} LIMIT 1`
        );
        return result || null;
      } catch (error) {
        console.error('Error fetching business:', error);
        return null;
      }
    },
    staleTime: Infinity, // Business info rarely changes
  });
}

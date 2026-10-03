import { useQuery } from '@tanstack/react-query';
import stockBatchRepository from '../services/repositories/stockBatchRepository';

/**
 * Hook to fetch all stock batches, optionally filtered by product
 */
export function useStockBatches(productId?: string) {
  return useQuery({
    queryKey: ['stockBatches', productId],
    queryFn: () => stockBatchRepository.getAll(productId),
  });
}

/**
 * Hook to fetch a single stock batch by ID
 */
export function useStockBatch(id: string) {
  return useQuery({
    queryKey: ['stockBatches', id],
    queryFn: () => stockBatchRepository.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch batches expiring within specified days
 */
export function useExpiringBatches(days: number = 30) {
  return useQuery({
    queryKey: ['stockBatches', 'expiring', days],
    queryFn: () => stockBatchRepository.getExpiringBatches(days),
  });
}

/**
 * Hook to fetch expired batches
 */
export function useExpiredBatches() {
  return useQuery({
    queryKey: ['stockBatches', 'expired'],
    queryFn: () => stockBatchRepository.getExpiredBatches(),
  });
}

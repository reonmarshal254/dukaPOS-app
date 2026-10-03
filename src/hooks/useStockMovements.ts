import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import stockMovementRepository from '../services/repositories/stockMovementRepository';
import { StockMovementType } from '../types';

interface UseStockMovementsOptions {
  productId?: string;
  type?: StockMovementType;
  startDate?: string;
  endDate?: string;
}

/**
 * Hook to fetch all stock movements with optional filters
 */
export function useStockMovements(options?: UseStockMovementsOptions) {
  return useQuery({
    queryKey: ['stockMovements', options],
    queryFn: () => stockMovementRepository.getAll(options),
  });
}

/**
 * Hook to create a new stock movement
 */
export function useCreateStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      productId: string;
      batchId?: string;
      type: StockMovementType;
      quantity: number;
      referenceId?: string;
      referenceType?: string;
      notes?: string;
    }) => stockMovementRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
      queryClient.invalidateQueries({ queryKey: ['stockBatches'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

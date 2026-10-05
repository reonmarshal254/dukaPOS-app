import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import saleRepository from '../services/repositories/saleRepository';

interface UseSalesOptions {
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Hook to fetch all sales with optional filters
 */
export function useSales(options?: UseSalesOptions) {
  return useQuery({
    queryKey: ['sales', options],
    queryFn: () => saleRepository.getAll(options),
  });
}

/**
 * Hook to fetch a single sale by ID
 */
export function useSale(id: string) {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: () => saleRepository.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch sale with details (items and payments)
 */
export function useSaleWithDetails(id: string) {
  return useQuery({
    queryKey: ['sales', id, 'details'],
    queryFn: () => saleRepository.getSaleWithDetails(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new sale
 */
export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      customerId?: string;
      receiptNumber: string;
      subtotal: number;
      discount: number;
      total: number;
      amountPaid: number;
      change: number;
      creditAmount: number;
      notes?: string;
    }) => saleRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
}

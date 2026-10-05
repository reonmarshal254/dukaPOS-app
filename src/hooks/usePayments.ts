import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import paymentRepository from '../services/repositories/paymentRepository';
import { PaymentMethod } from '../types';

interface UsePaymentsOptions {
  saleId?: string;
  customerId?: string;
  method?: PaymentMethod;
}

/**
 * Hook to fetch all payments with optional filters
 */
export function usePayments(options?: UsePaymentsOptions) {
  return useQuery({
    queryKey: ['payments', options],
    queryFn: () => paymentRepository.getAll(options),
  });
}

/**
 * Hook to create a new payment
 */
export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      saleId?: string;
      customerId?: string;
      method: PaymentMethod;
      amount: number;
      reference?: string;
      notes?: string;
    }) => paymentRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

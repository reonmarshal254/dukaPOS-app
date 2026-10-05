import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import expenseRepository from '../services/repositories/expenseRepository';
import { PaymentMethod } from '../types';

interface UseExpensesOptions {
  category?: string;
  startDate?: string;
  endDate?: string;
}

export function useExpenses(options?: UseExpensesOptions) {
  return useQuery({
    queryKey: ['expenses', options],
    queryFn: () => expenseRepository.getAll(options),
    staleTime: 0,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      category: string;
      description: string;
      amount: number;
      paymentMethod: PaymentMethod;
      notes?: string;
    }) => expenseRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'], exact: false });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'], exact: false });
    },
  });
}

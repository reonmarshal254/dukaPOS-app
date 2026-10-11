import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as expenseRepository from '../services/repositories/expenseRepository';
import { Expense, PaymentMethod } from '../types';

const QUERY_KEYS = {
  expenses: ['expenses'] as const,
  expense: (id: string) => ['expenses', id] as const,
  summary: ['expenses', 'summary'] as const,
  total: ['expenses', 'total'] as const,
};

interface CreateExpenseData {
  category: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  notes?: string;
}

interface UpdateExpenseData {
  category?: string;
  description?: string;
  amount?: number;
  paymentMethod?: PaymentMethod;
  date?: string;
  notes?: string;
}

interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Hook to fetch all expenses with optional filters
 */
export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: [...QUERY_KEYS.expenses, filters],
    queryFn: () => expenseRepository.getAll(filters),
  });
}

/**
 * Hook to fetch a single expense by ID
 */
export function useExpense(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.expense(id),
    queryFn: () => expenseRepository.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch expense summary by category
 */
export function useExpenseSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.summary, startDate, endDate],
    queryFn: () => expenseRepository.getSummaryByCategory(startDate, endDate),
  });
}

/**
 * Hook to fetch total expenses for a period
 */
export function useExpenseTotal(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.total, startDate, endDate],
    queryFn: () => expenseRepository.getTotalForPeriod(startDate, endDate),
  });
}

/**
 * Hook to create a new expense
 */
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExpenseData) => expenseRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.summary });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.total });
    },
  });
}

/**
 * Hook to update an expense
 */
export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseData }) =>
      expenseRepository.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expense(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.summary });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.total });
    },
  });
}

/**
 * Hook to delete an expense
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => expenseRepository.deleteById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.summary });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.total });
    },
  });
}

/**
 * Hook to search expenses
 */
export function useSearchExpenses(searchTerm: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.expenses, 'search', searchTerm],
    queryFn: () => expenseRepository.search(searchTerm),
    enabled: searchTerm.length > 0,
  });
}

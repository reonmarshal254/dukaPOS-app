import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import receiptRepository from '../services/repositories/receiptRepository';
import { SavedReceipt, ReceiptData } from '../types';

const RECEIPT_KEYS = {
  all: ['receipts'] as const,
  detail: (saleId: string) => ['receipts', saleId] as const,
  byNumber: (receiptNumber: string) => ['receipts', 'number', receiptNumber] as const,
};

/**
 * Get receipt by sale ID
 */
export function useReceipt(saleId: string) {
  return useQuery<SavedReceipt | null>({
    queryKey: RECEIPT_KEYS.detail(saleId),
    queryFn: () => receiptRepository.getReceiptBySaleId(saleId),
    enabled: !!saleId,
  });
}

/**
 * Get receipt by receipt number
 */
export function useReceiptByNumber(receiptNumber: string) {
  return useQuery<SavedReceipt | null>({
    queryKey: RECEIPT_KEYS.byNumber(receiptNumber),
    queryFn: () => receiptRepository.getReceiptByNumber(receiptNumber),
    enabled: !!receiptNumber,
  });
}

/**
 * Get all receipts
 */
export function useReceipts(limit?: number) {
  return useQuery<SavedReceipt[]>({
    queryKey: RECEIPT_KEYS.all,
    queryFn: () => receiptRepository.getAllReceipts(limit),
  });
}

/**
 * Save receipt mutation
 */
export function useSaveReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      saleId,
      receiptNumber,
      receiptData,
      imagePath,
    }: {
      saleId: string;
      receiptNumber: string;
      receiptData: ReceiptData;
      imagePath?: string;
    }) => {
      await receiptRepository.saveReceipt(saleId, receiptNumber, receiptData, imagePath);
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: RECEIPT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: RECEIPT_KEYS.detail(variables.saleId) });
      queryClient.invalidateQueries({ queryKey: RECEIPT_KEYS.byNumber(variables.receiptNumber) });
    },
  });
}

/**
 * Update receipt image mutation
 */
export function useUpdateReceiptImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      saleId,
      imagePath,
    }: {
      saleId: string;
      imagePath: string;
    }) => {
      await receiptRepository.updateReceiptImage(saleId, imagePath);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: RECEIPT_KEYS.detail(variables.saleId) });
      queryClient.invalidateQueries({ queryKey: RECEIPT_KEYS.all });
    },
  });
}

/**
 * Delete receipt mutation
 */
export function useDeleteReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (saleId: string) => {
      await receiptRepository.deleteReceipt(saleId);
    },
    onSuccess: (_, saleId) => {
      queryClient.invalidateQueries({ queryKey: RECEIPT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: RECEIPT_KEYS.detail(saleId) });
    },
  });
}

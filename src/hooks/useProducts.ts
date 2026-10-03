import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import productRepository from '../services/repositories/productRepository';
import { Product } from '../types';

interface UseProductsOptions {
  categoryId?: string;
  isActive?: boolean;
  search?: string;
}

/**
 * Hook to fetch all products with optional filters
 */
export function useProducts(options?: UseProductsOptions) {
  return useQuery({
    queryKey: ['products', options],
    queryFn: () => productRepository.getAll(options),
  });
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productRepository.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      categoryId?: string;
      barcode?: string;
      imageUrl?: string;
      localImagePath?: string;
      purchasePrice: number;
      sellingPrice: number;
      minStockThreshold?: number;
      unit?: string;
    }) => productRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

/**
 * Hook to update an existing product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      productRepository.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
    },
  });
}

/**
 * Hook to delete (soft delete) a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

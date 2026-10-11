import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as variantRepository from '../services/repositories/productVariantRepository';

const QUERY_KEYS = {
  variants: (productId: string) => ['products', productId, 'variants'] as const,
  variant: (id: string) => ['variants', id] as const,
  defaultVariant: (productId: string) => ['products', productId, 'defaultVariant'] as const,
};

interface CreateVariantData {
  productId: string;
  name: string;
  unit: string;
  sellingPrice: number;
  purchasePrice?: number;
  barcode?: string;
  sku?: string;
  isDefault?: boolean;
}

interface UpdateVariantData {
  name?: string;
  unit?: string;
  sellingPrice?: number;
  purchasePrice?: number;
  barcode?: string;
  sku?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

/**
 * Hook to fetch all variants for a product
 */
export function useProductVariants(productId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.variants(productId),
    queryFn: () => variantRepository.getByProductId(productId),
    enabled: !!productId,
  });
}

/**
 * Hook to fetch a single variant by ID
 */
export function useVariant(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.variant(id),
    queryFn: () => variantRepository.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch default variant for a product
 */
export function useDefaultVariant(productId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.defaultVariant(productId),
    queryFn: () => variantRepository.getDefaultVariant(productId),
    enabled: !!productId,
  });
}

/**
 * Hook to create a new variant
 */
export function useCreateVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVariantData) => variantRepository.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.variants(variables.productId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.defaultVariant(variables.productId) });
    },
  });
}

/**
 * Hook to update a variant
 */
export function useUpdateVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVariantData }) =>
      variantRepository.update(id, data),
    onSuccess: async (variant) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.variant(variant.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.variants(variant.productId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.defaultVariant(variant.productId) });
    },
  });
}

/**
 * Hook to delete a variant
 */
export function useDeleteVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) =>
      variantRepository.deleteById(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.variants(variables.productId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.defaultVariant(variables.productId) });
    },
  });
}

/**
 * Hook to check if product has variants
 */
export function useHasVariants(productId: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.variants(productId), 'hasVariants'],
    queryFn: () => variantRepository.hasVariants(productId),
    enabled: !!productId,
  });
}

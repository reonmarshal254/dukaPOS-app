import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as supplierRepository from '../services/repositories/supplierRepository';

const QUERY_KEYS = {
  suppliers: ['suppliers'] as const,
  supplier: (id: string) => ['suppliers', id] as const,
  supplierWithSupplies: (id: string) => ['suppliers', id, 'supplies'] as const,
  supplies: (supplierId: string) => ['suppliers', supplierId, 'supplies'] as const,
};

interface CreateSupplierData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  rating?: number;
  notes?: string;
}

interface UpdateSupplierData {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  rating?: number;
  notes?: string;
}

interface CreateSupplyData {
  supplierId: string;
  productName: string;
  quantity: number;
  unit: string;
  amount: number;
  supplyDate: string;
  notes?: string;
}

/**
 * Hook to fetch all suppliers
 */
export function useSuppliers() {
  return useQuery({
    queryKey: QUERY_KEYS.suppliers,
    queryFn: () => supplierRepository.getAll(),
  });
}

/**
 * Hook to fetch a single supplier by ID
 */
export function useSupplier(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.supplier(id),
    queryFn: () => supplierRepository.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch supplier with supply history
 */
export function useSupplierWithSupplies(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.supplierWithSupplies(id),
    queryFn: () => supplierRepository.getByIdWithSupplies(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new supplier
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplierData) => supplierRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers });
    },
  });
}

/**
 * Hook to update a supplier
 */
export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierData }) =>
      supplierRepository.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.supplier(variables.id) });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.supplierWithSupplies(variables.id),
      });
    },
  });
}

/**
 * Hook to delete a supplier
 */
export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => supplierRepository.deleteById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers });
    },
  });
}

/**
 * Hook to search suppliers
 */
export function useSearchSuppliers(searchTerm: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.suppliers, 'search', searchTerm],
    queryFn: () => supplierRepository.search(searchTerm),
    enabled: searchTerm.length > 0,
  });
}

/**
 * Hook to create a new supply record
 */
export function useCreateSupply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplyData) => supplierRepository.createSupply(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.supplies(variables.supplierId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.supplierWithSupplies(variables.supplierId),
      });
    },
  });
}

/**
 * Hook to get supplies for a supplier
 */
export function useSupplies(supplierId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.supplies(supplierId),
    queryFn: () => supplierRepository.getSuppliesBySupplierId(supplierId),
    enabled: !!supplierId,
  });
}

/**
 * Hook to delete a supply record
 */
export function useDeleteSupply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, supplierId }: { id: string; supplierId: string }) =>
      supplierRepository.deleteSupplyById(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.supplies(variables.supplierId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.supplierWithSupplies(variables.supplierId),
      });
    },
  });
}

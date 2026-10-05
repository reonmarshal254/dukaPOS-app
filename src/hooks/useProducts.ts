import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import productRepository from '../services/repositories/productRepository';
import { useCartStore } from '../stores/cartStore';
import { sendLowStockNotification, clearLowStockNotifiedId, isNotificationsEnabled } from '../services/notificationService';
import { Product } from '../types';

interface UseProductsOptions {
  categoryId?: string;
  isActive?: boolean;
  search?: string;
}

// ─── Low-stock notification helper ────────────────────────────────────────────
/**
 * Fetch current low-stock products and fire a notification for any that
 * haven't been notified yet.  Silently no-ops if notifications are disabled.
 */
export async function checkAndNotifyLowStock(): Promise<void> {
  try {
    const enabled = await isNotificationsEnabled();
    if (!enabled) return;

    const lowStock = await productRepository.getLowStock();
    if (lowStock.length === 0) return;

    await sendLowStockNotification(
      lowStock.map((p) => ({
        id: p.id,
        name: p.name,
        currentQuantity: p.currentQuantity,
        unit: p.unit,
      }))
    );
  } catch (err) {
    // Non-fatal — never crash the app over a notification
    console.warn('Low-stock notification check failed:', err);
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useProducts(options?: UseProductsOptions) {
  return useQuery({
    queryKey: ['products', options],
    queryFn: () => productRepository.getAll(options),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productRepository.getById(id),
    enabled: !!id,
  });
}

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
      initialQuantity?: number;
    }) => productRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['stockBatches'], exact: false });
      // A new product with low initial stock should trigger an alert
      checkAndNotifyLowStock();
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      productRepository.update(id, data),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });

      // If quantity increased the product may no longer be low-stock — clear
      // the dedup cache so it can be re-notified if it drops again later.
      if (
        variables.data.currentQuantity !== undefined &&
        variables.data.minStockThreshold !== undefined &&
        variables.data.currentQuantity > variables.data.minStockThreshold
      ) {
        await clearLowStockNotifiedId(variables.id).catch(() => {});
      }

      checkAndNotifyLowStock();
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const removeFromCart = useCartStore((state) => state.removeItem);

  return useMutation({
    mutationFn: (id: string) => productRepository.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['products'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['stockBatches'], exact: false });
      removeFromCart(id);
      // No low-stock check needed on delete
    },
  });
}

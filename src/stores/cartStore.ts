import { create } from 'zustand';
import { CartItem, Product, ProductVariant } from '../types';

interface CartState {
  items: CartItem[];
  discount: number; // percentage 0-100
  
  // Actions
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  updateQuantity: (itemIndex: number, quantity: number) => void;
  removeItem: (itemIndex: number) => void;
  setDiscount: (percentage: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

/**
 * Calculate item total based on product/variant price, quantity, and item-level discount
 */
function calculateItemTotal(product: Product, quantity: number, discount: number, variant?: ProductVariant): number {
  const price = variant ? variant.sellingPrice : product.sellingPrice;
  const subtotal = price * quantity;
  const discountAmount = Math.round((subtotal * discount) / 100);
  return subtotal - discountAmount;
}

/**
 * Generate a unique key for cart item (product + variant combination)
 */
function getItemKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}-${variantId}` : productId;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,

  addItem: (product: Product, quantity: number = 1, variant?: ProductVariant) => {
    set((state) => {
      const itemKey = getItemKey(product.id, variant?.id);
      const existingItemIndex = state.items.findIndex(
        (item) => getItemKey(item.product.id, item.variant?.id) === itemKey
      );

      if (existingItemIndex >= 0) {
        // Update existing item
        const newItems = [...state.items];
        const existingItem = newItems[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        newItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          total: calculateItemTotal(product, newQuantity, existingItem.discount, variant),
        };
        return { items: newItems };
      } else {
        // Add new item
        const newItem: CartItem = {
          product,
          variant,
          quantity,
          discount: 0, // item-level discount
          total: calculateItemTotal(product, quantity, 0, variant),
        };
        return { items: [...state.items, newItem] };
      }
    });
  },

  updateQuantity: (itemIndex: number, quantity: number) => {
    set((state) => {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        return { items: state.items.filter((_, index) => index !== itemIndex) };
      }

      const newItems = state.items.map((item, index) => {
        if (index === itemIndex) {
          return {
            ...item,
            quantity,
            total: calculateItemTotal(item.product, quantity, item.discount, item.variant),
          };
        }
        return item;
      });

      return { items: newItems };
    });
  },

  removeItem: (itemIndex: number) => {
    set((state) => ({
      items: state.items.filter((_, index) => index !== itemIndex),
    }));
  },

  setDiscount: (percentage: number) => {
    set({ discount: Math.max(0, Math.min(100, percentage)) });
  },

  clearCart: () => {
    set({ items: [], discount: 0 });
  },

  getSubtotal: () => {
    const state = get();
    return state.items.reduce((sum, item) => sum + item.total, 0);
  },

  getTotal: () => {
    const state = get();
    const subtotal = state.getSubtotal();
    const discountAmount = Math.round((subtotal * state.discount) / 100);
    return subtotal - discountAmount;
  },
}));

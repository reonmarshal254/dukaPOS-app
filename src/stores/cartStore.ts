import { create } from 'zustand';
import { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  discount: number; // percentage 0-100
  
  // Actions
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  setDiscount: (percentage: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

/**
 * Calculate item total based on product price, quantity, and item-level discount
 */
function calculateItemTotal(product: Product, quantity: number, discount: number): number {
  const subtotal = product.sellingPrice * quantity;
  const discountAmount = Math.round((subtotal * discount) / 100);
  return subtotal - discountAmount;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,

  addItem: (product: Product, quantity: number = 1) => {
    set((state) => {
      const existingItemIndex = state.items.findIndex(
        (item) => item.product.id === product.id
      );

      if (existingItemIndex >= 0) {
        // Update existing item
        const newItems = [...state.items];
        const existingItem = newItems[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        newItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          total: calculateItemTotal(product, newQuantity, existingItem.discount),
        };
        return { items: newItems };
      } else {
        // Add new item
        const newItem: CartItem = {
          product,
          quantity,
          discount: 0, // item-level discount
          total: calculateItemTotal(product, quantity, 0),
        };
        return { items: [...state.items, newItem] };
      }
    });
  },

  updateQuantity: (productId: string, quantity: number) => {
    set((state) => {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        return { items: state.items.filter((item) => item.product.id !== productId) };
      }

      const newItems = state.items.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            quantity,
            total: calculateItemTotal(item.product, quantity, item.discount),
          };
        }
        return item;
      });

      return { items: newItems };
    });
  },

  removeItem: (productId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
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

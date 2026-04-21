import { useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import type { CartItemInput } from '@/types/product';

export function useCart() {
  const {
    items,
    total,
    isLoading,
    error,
    fetchCart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemCount,
  } = useCartStore();

  useEffect(() => {
    fetchCart();
  }, []);

  return {
    items,
    total,
    isLoading,
    error,
    addItem: (item: CartItemInput, skuVariant?: Record<string, string>) =>
      addItem(item, skuVariant),
    removeItem,
    updateQuantity,
    clearCart,
    refreshCart: fetchCart,
    itemCount: getItemCount(),
  };
}

import { useCartStore } from '@/stores/cartStore'
import type { CartItemInput } from '@/types/product'

export function useCart() {
  const {
    items,
    isLoading,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
  } = useCartStore()

  return {
    items,
    isLoading,
    addItem: (item: CartItemInput) => {
      addItem(item)
    },
    removeItem,
    updateQuantity,
    clearCart,
    total: getTotal(),
    itemCount: getItemCount(),
  }
}

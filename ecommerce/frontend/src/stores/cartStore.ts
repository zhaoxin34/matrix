import { create } from 'zustand'
import type { CartItem, CartItemInput } from '@/types/product'

interface CartState {
  items: CartItem[]
  isLoading: boolean
  addItem: (item: CartItemInput) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,

  addItem: (item: CartItemInput) => {
    const items = get().items
    const existingIndex = items.findIndex(
      (i) => i.product.id === item.productId
    )

    if (existingIndex >= 0) {
      const updatedItems = [...items]
      updatedItems[existingIndex].quantity += item.quantity
      set({ items: updatedItems })
    } else {
      // This is a simplified cart - we don't have full product details
      // In a real app, you'd fetch the product or pass full details
      set({
        items: [
          ...items,
          {
            id: Date.now(),
            product: {
              id: item.productId,
              name: '',
              description: null,
              price: 0,
              original_price: null,
              stock: 0,
              brand: null,
              images: [],
              sales_count: 0,
              sku_variants: [],
              specifications: {},
              category_id: null,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            quantity: item.quantity,
            createdAt: new Date().toISOString(),
          },
        ],
      })
    }
  },

  removeItem: (productId: number) => {
    set({
      items: get().items.filter((item) => item.product.id !== productId),
    })
  },

  updateQuantity: (productId: number, quantity: number) => {
    const items = get().items
    const updatedItems = items.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    )
    set({ items: updatedItems })
  },

  clearCart: () => {
    set({ items: [] })
  },

  getTotal: () => {
    return get().items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    )
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0)
  },
}))

import { create } from 'zustand'
import type { CartItem, CartItemInput } from '@/types/product'

interface CartState {
  items: CartItem[]
  isLoading: boolean
  addItem: (item: CartItemInput) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
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
      set({ items: [...items, { ...item, id: Date.now().toString(), product: { id: item.productId, name: '', description: '', price: 0, stock: 0, images: [], category: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, createdAt: new Date().toISOString() }] })
    }
  },

  removeItem: (productId: string) => {
    set({
      items: get().items.filter((item) => item.product.id !== productId),
    })
  },

  updateQuantity: (productId: string, quantity: number) => {
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

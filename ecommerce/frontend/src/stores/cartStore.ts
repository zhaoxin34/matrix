import { create } from 'zustand'
import type { CartItem, CartItemInput } from '@/types/product'
import { cartApi } from '@/api/modules/cart'

interface CartState {
  items: CartItem[]
  total: number
  isLoading: boolean
  error: string | null
  sessionId: string | null
  fetchCart: () => Promise<void>
  addItem: (item: CartItemInput, skuVariant?: Record<string, string>) => Promise<void>
  removeItem: (cartItemId: number) => Promise<void>
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  isLoading: false,
  error: null,
  sessionId: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await cartApi.getCart()
      set({ items: data.items, total: data.total, isLoading: false })
    } catch (error) {
      set({ error: 'Failed to fetch cart', isLoading: false })
      console.error('Cart fetch error:', error)
    }
  },

  addItem: async (item: CartItemInput, skuVariant?: Record<string, string>) => {
    set({ isLoading: true, error: null })
    try {
      await cartApi.addToCart({ productId: item.productId, quantity: item.quantity, skuVariant })
      await get().fetchCart()
    } catch (error) {
      set({ error: 'Failed to add item', isLoading: false })
      console.error('Add to cart error:', error)
      throw error
    }
  },

  removeItem: async (cartItemId: number) => {
    set({ isLoading: true, error: null })
    try {
      await cartApi.removeFromCart(cartItemId)
      await get().fetchCart()
    } catch (error) {
      set({ error: 'Failed to remove item', isLoading: false })
      console.error('Remove from cart error:', error)
      throw error
    }
  },

  updateQuantity: async (cartItemId: number, quantity: number) => {
    set({ isLoading: true, error: null })
    try {
      await cartApi.updateCartItem(cartItemId, { quantity })
      await get().fetchCart()
    } catch (error) {
      set({ error: 'Failed to update quantity', isLoading: false })
      console.error('Update quantity error:', error)
      throw error
    }
  },

  clearCart: async () => {
    set({ isLoading: true, error: null })
    try {
      await cartApi.clearCart()
      set({ items: [], total: 0, isLoading: false })
    } catch (error) {
      set({ error: 'Failed to clear cart', isLoading: false })
      console.error('Clear cart error:', error)
      throw error
    }
  },

  getTotal: () => get().total,
  getItemCount: () => get().items.reduce((count, item) => count + item.quantity, 0)
}))

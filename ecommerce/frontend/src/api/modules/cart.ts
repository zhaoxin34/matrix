import apiClient from '../axios'
import type { ApiResponse } from '../types'
import type { CartItem } from '@/types/product'

const SESSION_KEY = 'cart_session_id'

// Helper to get/set session_id from localStorage (needed because cookie is set by backend:8000, but frontend runs on :3000)
const getSessionId = (): string | undefined => {
  return localStorage.getItem(SESSION_KEY) || undefined
}

const setSessionId = (sessionId: string) => {
  localStorage.setItem(SESSION_KEY, sessionId)
}

export const cartApi = {
  // GET /cart/items - Fetch all cart items
  getCart: async (): Promise<{ items: CartItem[], total: number }> => {
    const sessionId = getSessionId()
    const headers: Record<string, string> = {}
    if (sessionId) {
      headers['X-Cart-Session-Id'] = sessionId
    }
    const response = await apiClient.get<ApiResponse<{ items: CartItem[], total: number }>>('/cart/items', { headers })
    return response.data.data
  },

  // POST /cart/items - Add item to cart
  addToCart: async (data: { productId: number; quantity: number; skuVariant?: Record<string, string> }): Promise<CartItem> => {
    const sessionId = getSessionId()
    const headers: Record<string, string> = {}
    if (sessionId) {
      headers['X-Cart-Session-Id'] = sessionId
    }
    // Transform to backend format: product_id, quantity, sku_variant
    const backendData = {
      product_id: data.productId,
      quantity: data.quantity,
      sku_variant: data.skuVariant || null
    }
    const response = await apiClient.post<ApiResponse<CartItem>>('/cart/items', backendData, { headers })
    const item = response.data.data
    // Store session_id from response body if present (for guest users)
    if (item && (item as any).session_id) {
      setSessionId((item as any).session_id)
    }
    return item
  },

  // PUT /cart/items/{id} - Update cart item
  updateCartItem: async (id: number, data: { quantity: number }): Promise<CartItem> => {
    const response = await apiClient.put<ApiResponse<CartItem>>(`/cart/items/${id}`, data)
    return response.data.data
  },

  // DELETE /cart/items/{id} - Remove item
  removeFromCart: async (id: number): Promise<void> => {
    await apiClient.delete(`/cart/items/${id}`)
  },

  // DELETE /cart/items - Clear cart
  clearCart: async (): Promise<void> => {
    await apiClient.delete('/cart/items')
  }
}

import apiClient from '../axios'
import type { ApiResponse } from '../types'
import type { CartItem } from '@/types/product'

// Helper to get session cookie value for guest cart tracking
const getSessionId = (): string | undefined => {
  const match = document.cookie.match(/cart_session_id=([^;]+)/)
  return match ? match[1] : undefined
}

export const cartApi = {
  // GET /cart/items - Fetch all cart items
  getCart: async (): Promise<{ items: CartItem[], total: number }> => {
    const sessionId = getSessionId()
    const headers: Record<string, string> = {}
    if (sessionId) {
      headers['Cookie'] = `cart_session_id=${sessionId}`
    }
    const response = await apiClient.get<ApiResponse<{ items: CartItem[], total: number }>>('/cart/items', { headers })
    return response.data.data
  },

  // POST /cart/items - Add item to cart
  addToCart: async (data: { productId: number; quantity: number; skuVariant?: Record<string, string> }): Promise<CartItem> => {
    const sessionId = getSessionId()
    const headers: Record<string, string> = {}
    if (sessionId) {
      headers['Cookie'] = `cart_session_id=${sessionId}`
    }
    // Transform to backend format: product_id, quantity, sku_variant
    const backendData = {
      product_id: data.productId,
      quantity: data.quantity,
      sku_variant: data.skuVariant || null
    }
    const response = await apiClient.post<ApiResponse<CartItem>>('/cart/items', backendData, { headers })
    return response.data.data
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

import apiClient from '../axios'
import type { Order } from '@/types/order'

// Helper to get session cookie value for guest order tracking
const getSessionId = (): string | undefined => {
  const match = document.cookie.match(/cart_session_id=([^;]+)/)
  return match ? match[1] : undefined
}

export interface OrderCreateInput {
  recipient_name?: string
  phone?: string
  province?: string
  city?: string
  district?: string
  street?: string
}

export const orderApi = {
  // GET /orders - Fetch all orders for current identity
  list: async (): Promise<Order[]> => {
    const sessionId = getSessionId()
    const headers: Record<string, string> = {}
    if (sessionId) {
      headers['Cookie'] = `cart_session_id=${sessionId}`
    }
    const response = await apiClient.get<Order[]>('/orders', { headers })
    return response.data || []
  },

  // GET /orders/:id - Fetch single order
  detail: async (id: number): Promise<Order> => {
    const sessionId = getSessionId()
    const headers: Record<string, string> = {}
    if (sessionId) {
      headers['Cookie'] = `cart_session_id=${sessionId}`
    }
    const response = await apiClient.get<Order>(`/orders/${id}`, { headers })
    return response.data
  },

  // POST /orders - Create order from cart
  create: async (data: OrderCreateInput): Promise<Order> => {
    const sessionId = getSessionId()
    const headers: Record<string, string> = {}
    if (sessionId) {
      headers['Cookie'] = `cart_session_id=${sessionId}`
    }
    // Transform to backend format
    const backendData = {
      recipient_name: data.recipient_name,
      phone: data.phone,
      province: data.province,
      city: data.city,
      district: data.district,
      street: data.street,
    }
    const response = await apiClient.post<Order>('/orders', backendData, { headers })
    return response.data
  },
}
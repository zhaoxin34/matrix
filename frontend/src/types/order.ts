export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  id: string
  productId: string
  productName: string
  price: number
  quantity: number
  subtotal: number
}

export interface Order {
  id: string
  orderNumber: string
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  shippingAddress: Address
  createdAt: string
  updatedAt: string
}

export interface Address {
  id: string
  recipientName: string
  phone: string
  province: string
  city: string
  district: string
  street: string
  postalCode?: string
}

export interface OrderCreateInput {
  items: Array<{ productId: string; quantity: number }>
  shippingAddress: Omit<Address, 'id'>
}

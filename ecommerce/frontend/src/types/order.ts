export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: number;
  product_id: number;
  product_name?: string; // from product relationship
  price: number; // unit_price from order_item
  quantity: number;
  subtotal?: number; // calculated
}

export interface Order {
  id: number;
  order_number?: string; // backend may not have this
  user_id: number;
  session_id?: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  // Inline address fields
  recipient_name?: string;
  phone?: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
}

export interface Address {
  id: number;
  recipient_name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  street: string;
  is_default?: boolean;
}

export interface OrderCreateInput {
  recipient_name?: string;
  phone?: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
}

// Backend generates order number as "ORD-{id}" or similar if needed
export const getOrderNumber = (order: Order): string => {
  return `ORD-${order.id.toString().padStart(8, '0')}`;
};

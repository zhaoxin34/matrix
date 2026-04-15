export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  images: string[]
  category: string
  createdAt: string
  updatedAt: string
}

export interface ProductCreateInput {
  name: string
  description: string
  price: number
  stock: number
  images?: string[]
  category: string
}

export interface CartItem {
  id: string
  product: Product
  quantity: number
  createdAt: string
}

export interface CartItemInput {
  productId: string
  quantity: number
}

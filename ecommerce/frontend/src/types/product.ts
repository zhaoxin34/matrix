export interface Product {
  id: number
  name: string
  description: string | null
  price: number
  original_price: number | null
  stock: number
  brand: string | null
  images: string[]
  sales_count: number
  sku_variants: Record<string, string[]>[]
  specifications: Record<string, string>
  category_id: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductListResponse {
  items: Product[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface Category {
  id: number
  name: string
  description: string | null
  parent_id: number | null
  level: number
  sort_order: number
}

export interface CategoryTree extends Category {
  children: Category[]
}

export interface SearchSuggestion {
  id: number
  name: string
}

export interface CartItem {
  id: number
  product: Product
  quantity: number
  createdAt: string
}

export interface CartItemInput {
  productId: number
  quantity: number
  skuVariant?: Record<string, string>
}

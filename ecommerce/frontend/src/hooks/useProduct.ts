import { useState, useEffect, useCallback } from 'react'
import { productApi } from '@/api/modules/product'
import type { Product } from '@/types/product'

interface UseProductListReturn {
  products: Product[]
  loading: boolean
  error: Error | null
  page: number
  pageSize: number
  total: number
  fetchProducts: (page?: number, pageSize?: number) => Promise<void>
  setPage: (page: number) => void
}

export function useProductList(
  initialPage = 1,
  initialPageSize = 10
): UseProductListReturn {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [total, setTotal] = useState(0)

  const fetchProducts = useCallback(
    async (pageNum = page, pageSizeNum = pageSize) => {
      setLoading(true)
      setError(null)
      try {
        const response = await productApi.list(pageNum, pageSizeNum)
        setProducts(response.data)
        setTotal(response.total)
        setPage(pageNum)
        setPageSize(pageSizeNum)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch products')
        setError(error)
      } finally {
        setLoading(false)
      }
    },
    [page, pageSize]
  )

  useEffect(() => {
    void fetchProducts()
  }, [fetchProducts])

  return {
    products,
    loading,
    error,
    page,
    pageSize,
    total,
    fetchProducts,
    setPage,
  }
}

interface UseProductDetailReturn {
  product: Product | null
  loading: boolean
  error: Error | null
  fetchProduct: (id: string) => Promise<void>
}

export function useProductDetail(): UseProductDetailReturn {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchProduct = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await productApi.detail(id)
      setProduct(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch product')
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [])

  return { product, loading, error, fetchProduct }
}

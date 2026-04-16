import { useState, useEffect, useCallback } from 'react'
import { productApi, type ProductListParams } from '@/api/modules/product'
import type { Product, ProductListResponse, CategoryTree, SearchSuggestion } from '@/types/product'

interface UseProductListReturn {
  products: Product[]
  loading: boolean
  error: Error | null
  page: number
  pageSize: number
  total: number
  pages: number
  fetchProducts: (params?: ProductListParams) => Promise<void>
  setPage: (page: number) => void
  categoryId?: number
  brand?: string
}

export function useProductList(initialParams: ProductListParams = {}): UseProductListReturn {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [page, setPage] = useState(initialParams.page || 1)
  const [pageSize, setPageSize] = useState(initialParams.limit || 20)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)
  const [params, setParams] = useState<ProductListParams>(initialParams)

  const fetchProducts = useCallback(async (newParams?: ProductListParams) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = { ...params, ...newParams, page: newParams?.page || page, limit: newParams?.limit || pageSize }
      const response = await productApi.list(queryParams)
      setProducts(response.items)
      setTotal(response.total)
      setPages(response.pages)
      if (newParams) setParams(newParams)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch products'))
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, params])

  useEffect(() => {
    void fetchProducts()
  }, [page, pageSize])

  return {
    products,
    loading,
    error,
    page,
    pageSize,
    total,
    pages,
    fetchProducts,
    setPage: (p: number) => { setPage(p); void fetchProducts({ ...params, page: p }) },
    categoryId: params.category_id,
    brand: params.brand,
  }
}

interface UseProductDetailReturn {
  product: Product | null
  loading: boolean
  error: Error | null
  fetchProduct: (id: number) => Promise<void>
}

export function useProductDetail(): UseProductDetailReturn {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchProduct = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await productApi.detail(id)
      setProduct(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch product'))
    } finally {
      setLoading(false)
    }
  }, [])

  return { product, loading, error, fetchProduct }
}

interface UseCategoryTreeReturn {
  categories: CategoryTree[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useCategoryTree(): UseCategoryTreeReturn {
  const [categories, setCategories] = useState<CategoryTree[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await productApi.getCategories()
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch categories'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { categories, loading, error, refetch }
}

interface UseSearchSuggestionsReturn {
  suggestions: SearchSuggestion[]
  loading: boolean
  search: (q: string) => Promise<void>
  clear: () => void
}

export function useSearchSuggestions(): UseSearchSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return }
    setLoading(true)
    try {
      const data = await productApi.search(q)
      setSuggestions(data)
    } catch { setSuggestions([]) }
    finally { setLoading(false) }
  }, [])

  const clear = useCallback(() => setSuggestions([]), [])

  return { suggestions, loading, search, clear }
}

interface UseBrandsReturn {
  brands: string[]
  loading: boolean
  refetch: () => Promise<void>
}

export function useBrands(): UseBrandsReturn {
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await productApi.getBrands()
      setBrands(data)
    } catch { setBrands([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void refetch() }, [refetch])

  return { brands, loading, refetch }
}
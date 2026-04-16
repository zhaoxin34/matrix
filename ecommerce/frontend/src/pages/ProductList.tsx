import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Typography,
  Spin,
  message,
  Select,
  Slider,
  Pagination,
  Badge,
  Dropdown,
  AutoComplete,
} from 'antd'
import { useProductList, useCategoryTree, useBrands, useSearchSuggestions } from '@/hooks/useProduct'
import { formatCurrency } from '@/utils/format'
import type { ProductListParams } from '@/api/modules/product'

const { Title, Paragraph, Text } = Typography

const SORT_OPTIONS = [
  { value: 'created_at-desc', label: '最新上架' },
  { value: 'price-asc', label: '价格从低到高' },
  { value: 'price-desc', label: '价格从高到低' },
  { value: 'sales_count-desc', label: '销量优先' },
]

export function ProductList() {
  const navigate = useNavigate()
  const [params, setParams] = useState<ProductListParams>({ page: 1, limit: 20 })
  const [sortValue, setSortValue] = useState('created_at-desc')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [inStock] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined)

  const { products, loading, error, total } = useProductList(params)
  const { categories } = useCategoryTree()
  const { brands } = useBrands()
  const { suggestions, search, clear } = useSearchSuggestions()

  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value)
    clear()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.length >= 2) {
      debounceRef.current = setTimeout(() => { search(value) }, 300)
    }
  }, [search, clear])

  const handleCategorySelect = useCallback((categoryId: number | undefined) => {
    setSelectedCategory(categoryId)
    setParams(p => ({ ...p, category_id: categoryId, page: 1 }))
  }, [])

  const handleBrandChange = useCallback((brand: string | undefined) => {
    setParams(p => ({ ...p, brand, page: 1 }))
  }, [])

  const handleSortChange = useCallback((value: string) => {
    setSortValue(value)
    const [sortBy, sortOrder] = value.split('-')
    setParams(p => ({ ...p, sort_by: sortBy, sort_order: sortOrder as 'asc' | 'desc', page: 1 }))
  }, [])

  const handlePriceChange = useCallback((value: number[]) => {
    const [min, max] = value
    setPriceRange([min, max])
    setParams(p => ({ ...p, min_price: min || undefined, max_price: max || undefined, page: 1 }))
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setParams(p => ({ ...p, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleSuggestionClick = useCallback((productId: number) => {
    clear()
    setSearchValue('')
    navigate(`/products/${productId}`)
  }, [navigate, clear])

  const getProductImage = (product: { images?: string[]; name?: string }) => {
    if (product.images && product.images.length > 0) {
      return <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    }
    return <Paragraph style={{ color: '#999' }}>商品图片</Paragraph>
  }

  if (error) {
    message.error('加载商品失败')
    return null
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 16 }}>商品列表</Title>

        {/* Search Bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <AutoComplete
            style={{ flex: 1, maxWidth: 400 }}
            value={searchValue}
            onSearch={handleSearch}
            onSelect={(id) => handleSuggestionClick(Number(id))}
            placeholder="搜索商品..."
            options={suggestions.map(s => ({ value: String(s.id), label: s.name }))}
          />
          <Select
            style={{ width: 200 }}
            placeholder="分类"
            allowClear
            value={selectedCategory}
            onChange={handleCategorySelect}
          >
            {categories.map(cat => (
              <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
            ))}
          </Select>
          <Select
            style={{ width: 160 }}
            placeholder="品牌"
            allowClear
            value={params.brand}
            onChange={handleBrandChange}
          >
            {brands.map(b => <Select.Option key={b} value={b}>{b}</Select.Option>)}
          </Select>
          <Select value={sortValue} onChange={handleSortChange} style={{ width: 140 }}>
            {SORT_OPTIONS.map(o => <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>)}
          </Select>
        </div>

        {/* Filter Row */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Text>价格区间:</Text>
          <Slider
            range
            min={0}
            max={100000}
            step={100}
            value={priceRange}
            onChange={handlePriceChange}
            style={{ width: 200 }}
            tipFormatter={(v) => `¥${v}`}
          />
          <Text>{formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}</Text>
          <Badge status={inStock ? 'success' : 'default'} text="只看有货" />
        </div>
      </div>

      {/* Category Sidebar */}
      <Row gutter={24}>
        <Col span={5}>
          <Card size="small" title="分类" extra={<a onClick={() => handleCategorySelect(undefined)}>清除</a>}>
            {categories.map(cat => (
              <div key={cat.id} style={{ marginBottom: 12 }}>
                <Dropdown
                  menu={{
                    items: cat.children.map(child => ({
                      key: child.id,
                      label: child.name,
                      onClick: () => handleCategorySelect(child.id),
                    })),
                  }}
                >
                  <a onClick={(e) => { e.preventDefault(); handleCategorySelect(cat.id) }}>
                    {selectedCategory === cat.id ? <strong>{cat.name}</strong> : cat.name}
                    {cat.children.length > 0 && ' ▼'}
                  </a>
                </Dropdown>
                {selectedCategory && (() => {
                  const sel = categories.find(c => c.id === selectedCategory) || cat.children.find(c => c.id === selectedCategory)
                  return sel ? <div style={{ paddingLeft: 16, fontSize: 12, color: '#666' }}>{sel.name}</div> : null
                })()}
              </div>
            ))}
          </Card>
        </Col>

        {/* Product Grid */}
        <Col span={19}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
          ) : (
            <>
              <Row gutter={[16, 16]}>
                {products.map(product => (
                  <Col key={product.id} xs={24} sm={12} md={8} lg={6}>
                    <Card
                      hoverable
                      onClick={() => navigate(`/products/${product.id}`)}
                      cover={
                        <div style={{ height: 200, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {getProductImage(product)}
                        </div>
                      }
                    >
                      <Card.Meta
                        title={product.name}
                        description={
                          <div>
                            <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                              {product.brand && <span>品牌: {product.brand} </span>}
                              {product.description}
                            </Paragraph>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 16 }}>
                                {formatCurrency(product.price)}
                              </span>
                              {product.original_price && product.original_price > product.price && (
                                <span style={{ color: '#999', textDecoration: 'line-through', fontSize: 12 }}>
                                  {formatCurrency(product.original_price)}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                              销量: {product.sales_count} | 库存: {product.stock}
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
              {total > 0 && (
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                  <Pagination
                    current={params.page}
                    pageSize={params.limit}
                    total={total}
                    onChange={handlePageChange}
                    showSizeChanger
                    pageSizeOptions={[20, 40, 60, 100]}
                    onShowSizeChange={(_, size) => setParams(p => ({ ...p, limit: size, page: 1 }))}
                  />
                </div>
              )}
            </>
          )}
        </Col>
      </Row>
    </div>
  )
}
# Phase 5 — Product Catalog

**Status:** planning
**Milestone:** v1.1 Feature Implementation
**Created:** 2026-04-16

---

## Executive Summary

Phase 5 implements the product catalog with category navigation, product listing with pagination, product detail pages, search with autocomplete, and filtering/sorting capabilities.

**Key changes:**
- Backend: Category tree endpoint, product listing with pagination/filter/sort, search with autocomplete
- Frontend: Product list page with sidebar filters, product detail page with image carousel and SKU selector

---

## Task Breakdown

### Wave 1: Backend Foundation

1. **Extend Category model** (`ecommerce/backend/src/app/models/category.py`)
   - Add `parent_id` for L1/L2 hierarchy
   - Add `level` field (1 or 2)
   - Add `sort_order` field

2. **Extend Product model** (`ecommerce/backend/src/app/models/product.py`)
   - Add `brand` field
   - Add `original_price` field (for sale tracking)
   - Add `images` field (JSON list of image URLs)
   - Add `sales_count` field
   - Add `sku_variants` field (JSON for variants like color/size)
   - Add `specifications` field (JSON for tech specs)

3. **Create product schemas** (`ecommerce/backend/src/app/schemas/product.py`)
   - `ProductResponse` — full product data
   - `ProductListResponse` — paginated list
   - `CategoryResponse` — category with children
   - `SearchSuggestion` — for autocomplete

4. **Create product service** (`ecommerce/backend/src/app/services/product_service.py`)
   - `get_category_tree()` — L1 + L2 categories
   - `get_products()` — paginated, filtered, sorted
   - `search_products()` — keyword search with autocomplete
   - `get_product_by_id()` — full product detail

### Wave 2: Backend Endpoints

5. **Add category endpoints** (`ecommerce/backend/src/app/api/v1/categories.py`)
   - `GET /categories` — full tree with L1/L2
   - `GET /categories/:id` — single category with products

6. **Extend product endpoints** (`ecommerce/backend/src/app/api/v1/products.py`)
   - `GET /products` — list with pagination, filter, sort params
   - `GET /products/search` — autocomplete suggestions
   - `GET /products/:id` — detail with variants

### Wave 3: Frontend

7. **Update product types** (`ecommerce/frontend/src/types/product.ts`)
   - Add brand, images, original_price, sales_count, sku_variants, specifications

8. **Update product API** (`ecommerce/frontend/src/api/modules/product.ts`)
   - Add category tree, search, filter params

9. **Update ProductList page** (`ecommerce/frontend/src/pages/ProductList.tsx`)
   - Add sidebar with category tree
   - Add search with autocomplete
   - Add filter controls (brand, price, stock)
   - Add sort bar
   - Add pagination

10. **Update ProductDetail page** (`ecommerce/frontend/src/pages/ProductDetail.tsx`)
    - Add image carousel
    - Add price display with sale indicator
    - Add stock status badge
    - Add SKU selector
    - Add quantity input
    - Add specifications table

11. **Update Home page** (`ecommerce/frontend/src/pages/Home.tsx`)
    - Add L1 category display
    - Link to filtered product list

---

## Verification Checklist

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1 | Category hierarchy (L1 → L2) navigable | GET /categories returns tree structure |
| 2 | Product listing with 20 items/page | GET /products?page=1&limit=20 returns 20 items |
| 3 | Product detail with images/price/stock | GET /products/:id returns full data |
| 4 | Search finds products by keyword | GET /products/search?q=keyword works |
| 5 | Autocomplete returns top 10 | Search input shows suggestions after typing |
| 6 | Filters work (brand, price, stock) | GET /products?brand=X&min_price=100&in_stock=true |
| 7 | Sorting works | GET /products?sort=price_asc, etc. |

---

## Dependencies

- Phase 4 (Auth) — API client with token handling
- ecommerce/backend/src/app/models/product.py — Product model base
- ecommerce/backend/src/app/models/category.py — Category model base
- ecommerce/frontend/src/pages/ProductList.tsx — existing page scaffold
- ecommerce/frontend/src/pages/ProductDetail.tsx — existing page scaffold

---

## File Structure

```
ecommerce/backend/src/app/
├── api/v1/
│   ├── products.py      # MODIFY — add pagination, filter, sort, search
│   └── categories.py     # MODIFY — add tree structure
├── schemas/
│   └── product.py        # CREATE — ProductResponse, ProductListResponse, etc.
├── services/
│   └── product_service.py # CREATE — category tree, product listing, search

ecommerce/frontend/src/
├── pages/
│   ├── ProductList.tsx    # MODIFY — sidebar, search, filters, pagination
│   └── ProductDetail.tsx  # MODIFY — carousel, variants, specifications
├── types/
│   └── product.ts        # MODIFY — add missing fields
├── api/
│   └── modules/product.ts # MODIFY — add search/filter params
└── App.tsx               # MODIFY — category routes if needed

ecommerce/backend/alembic/versions/
└── 003_add_product_fields.py  # CREATE — migration for new Product fields
```

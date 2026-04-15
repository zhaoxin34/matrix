---
objective: React + TypeScript frontend project scaffold with Vite, Ant Design, routing, state management, API client, ESLint, Prettier, git hooks, Makefile
wave: 1
files_modified:
  - frontend/
  - Makefile
  - hooks/
tasks: 8
---

# Plan: Frontend Architecture

## What This Builds

A complete React + TypeScript frontend project scaffold following the project prompts specification. Creates the directory structure, all component files, routing, state management, API client, and development infrastructure.

## Tasks

### 1. Create project structure and package.json

Create the complete frontend directory structure per prompts specification:

```
frontend/
├── src/
│   ├── api/
│   │   ├── axios.ts
│   │   ├── modules/
│   │   │   ├── product.ts
│   │   │   ├── order.ts
│   │   │   ├── user.ts
│   │   │   └── cart.ts
│   │   └── types.ts
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── product/
│   │   ├── cart/
│   │   └── order/
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── ProductList.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── Cart.tsx
│   │   ├── Checkout.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── UserProfile.tsx
│   │   └── OrderList.tsx
│   ├── hooks/
│   │   ├── useProduct.ts
│   │   ├── useCart.ts
│   │   ├── useAuth.ts
│   │   └── useAsync.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── cartStore.ts
│   │   └── uiStore.ts
│   ├── utils/
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── storage.ts
│   ├── types/
│   │   ├── product.ts
│   │   ├── order.ts
│   │   ├── user.ts
│   │   └── api.ts
│   ├── styles/
│   │   ├── variables.less
│   │   └── global.less
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .eslintrc.cjs
├── .prettierrc
└── .gitignore
```

### 2. Initialize Vite + React + TypeScript project

Create package.json with all dependencies from the prompts:
- react, react-dom
- react-router-dom
- antd, @ant-design/icons
- axios
- zustand
- react-hook-form, zod, @hookform/resolvers
- recharts
- typescript, vite, @vitejs/plugin-react

Create tsconfig.json with strict mode

Create vite.config.ts with path alias `@/` -> `src/`

### 3. Configure ESLint + Prettier

Create `.eslintrc.cjs` with:
- @typescript-eslint/recommended
- react-hooks/recommended
- react/recommended

Create `.prettierrc` with:
- semi: true
- singleQuote: true
- tabWidth: 2
- trailingComma: "es5"
- printWidth: 100

### 4. Create API layer

Create `src/api/axios.ts`:
- Base URL: http://localhost:8000/api/v1
- Request interceptor: add JWT token from authStore
- Response interceptor: handle 401 redirect to login, global error handling
- Timeout: 30000ms

Create `src/api/types.ts`:
- ApiResponse<T> interface
- API error types

Create `src/api/modules/`:
- product.ts: list, detail, create APIs
- order.ts: create, list, detail APIs
- user.ts: login, register, profile APIs
- cart.ts: cart CRUD APIs

### 5. Create Zustand stores

Create `src/stores/authStore.ts`:
- user state
- token state
- login, logout, register actions
- persist to localStorage

Create `src/stores/cartStore.ts`:
- cart items state
- add, remove, update quantity actions
- computed total

Create `src/stores/uiStore.ts`:
- loading state
- notification state
- modal state

### 6. Create hooks

Create `src/hooks/useAsync.ts`:
- Generic async data fetching hook
- Returns { data, loading, error, execute }

Create `src/hooks/useAuth.ts`:
- Wrapper around authStore
- Returns { user, isAuthenticated, login, logout }

Create `src/hooks/useProduct.ts`:
- Product list, detail fetching
- Pagination support

Create `src/hooks/useCart.ts`:
- Wrapper around cartStore
- Computed cart total

### 7. Create layout and common components

Create `src/components/layout/Header.tsx`:
- Logo, navigation links
- Cart icon with item count
- User dropdown (login/logout)

Create `src/components/layout/Footer.tsx`:
- Simple footer

Create `src/components/layout/MainLayout.tsx`:
- Combines Header, content, Footer

Create `src/styles/variables.less`:
- CSS variables for colors, spacing

Create `src/styles/global.less`:
- Global styles, reset CSS

### 8. Create pages (placeholder)

Create placeholder pages that import MainLayout and show basic content:
- Home.tsx: Welcome page
- ProductList.tsx: Product listing page
- ProductDetail.tsx: Product detail page
- Cart.tsx: Shopping cart page
- Login.tsx: Login form
- Register.tsx: Registration form
- UserProfile.tsx: User profile page
- OrderList.tsx: Order history page

### 9. Create Makefile and git hooks

Create Makefile in frontend/ with targets:
- help, install, dev, build, lint, format, type-check, test, clean

Create hooks/pre-commit in frontend/ that runs lint and type-check

Create .env.example:
- VITE_API_BASE_URL=http://localhost:8000/api/v1
- VITE_APP_TITLE=电商网站

## Success Criteria

- Frontend project structure matches prompt specification
- Vite + React 19 + TypeScript configured
- Ant Design 5 + React Router 6 + Zustand configured
- ESLint + Prettier configured
- Axios API client with JWT interceptor
- Git hooks configured (pre-commit)
- Makefile with lint, format, type-check, test commands
- Frontend can connect to backend API

---
phase: quick-v1.0-v1.1-e2e
plan: "01"
type: execute
wave: "1"
depends_on: []
files_modified: []
autonomous: true
requirements: []
must_haves:
  truths:
    - "Backend API smoke tests pass (health check, key endpoints return 200)"
    - "Frontend loads without errors on home page"
    - "User can login/logout with email+password"
    - "User can login with phone+SMS code"
    - "User can reset password via email"
    - "User can browse product list and view product details"
    - "User can search products by keyword"
    - "User can filter products by category"
  artifacts:
    - path: "e2e-test-case/ecommerce/playwright.config.ts"
      provides: "Playwright test configuration"
    - path: "e2e-test-case/ecommerce/pages/LoginPage.ts"
      provides: "Login page object model"
    - path: "e2e-test-case/ecommerce/pages/ProductListPage.ts"
      provides: "Product list page object model"
    - path: "e2e-test-case/ecommerce/tests/v1.0-smoke.spec.ts"
      provides: "v1.0 smoke tests (API + frontend load)"
    - path: "e2e-test-case/ecommerce/tests/v1.1-auth.spec.ts"
      provides: "v1.1 auth E2E tests"
    - path: "e2e-test-case/ecommerce/tests/v1.1-products.spec.ts"
      provides: "v1.1 product browsing/search/filter E2E tests"
---

<objective>
Add E2E test cases for milestones v1.0 and v1.1 using Playwright.

Purpose: Establish automated smoke and regression tests for core user journeys.
Output: Playwright test suite in e2e-test-case/ecommerce/ covering v1.0 and v1.1 features.
</objective>

<context>
@ecommerce/frontend/src/pages/Login.tsx
@ecommerce/frontend/src/pages/ProductList.tsx
@ecommerce/frontend/src/pages/ProductDetail.tsx
@ecommerce/frontend/src/pages/ForgotPassword.tsx
@ecommerce/frontend/src/pages/Register.tsx

Frontend dev server: http://localhost:3000
Backend API: http://localhost:8000/api/v1
</context>

<tasks>

<task type="auto">
  <name>Task 1: Initialize Playwright project</name>
  <files>e2e-test-case/ecommerce/playwright.config.ts</files>
  <action>
Initialize Playwright project in e2e-test-case/ecommerce/:

```bash
cd e2e-test-case/ecommerce
npm init -y
npm install -D @playwright/test
npx playwright install chromium
```

Create playwright.config.ts with:
- testDir: "./tests"
- baseURL: "http://localhost:3000"
- timeout: 30000
- reporter: "html"
- use: { headless: true, screenshot: "only-on-failure" }
- projects: [chromium only for quick execution]

Create directory structure:
- e2e-test-case/ecommerce/pages/ (Page Object Models)
- e2e-test-case/ecommerce/tests/ (test specs)
- e2e-test-case/ecommerce/fixtures/ (test data)
</action>
  <verify>
ls e2e-test-case/ecommerce/ && npx playwright --version
</verify>
  <done>Playwright installed, config exists, directories created</done>
</task>

<task type="auto">
  <name>Task 2: Create Page Object Models</name>
  <files>e2e-test-case/ecommerce/pages/LoginPage.ts, e2e-test-case/ecommerce/pages/ProductListPage.ts, e2e-test-case/ecommerce/pages/ProductDetailPage.ts, e2e-test-case/ecommerce/pages/ForgotPasswordPage.ts, e2e-test-case/ecommerce/pages/HomePage.ts</files>
  <action>
Create reusable Page Object Models for the pages under test.

**LoginPage.ts** - export class LoginPage:
- readonly page: Page
- phoneTab, emailTab (locators)
- phoneInput, codeInput, emailInput, passwordInput
- loginButton, errorMessage, logoutButton
- goto(), loginWithEmail(email, password), loginWithPhone(phone, code), getErrorMessage()

**ProductListPage.ts** - export class ProductListPage:
- searchInput, searchButton
- categoryFilters (array of filter buttons)
- productCards (locator for product items)
- firstProductCard
- goto(), search(keyword), filterByCategory(categoryName), getProductCount()

**ProductDetailPage.ts** - export class ProductDetailPage:
- productName, productPrice, addToCartButton
- goto(productId)

**ForgotPasswordPage.ts** - export class ForgotPasswordPage:
- emailInput, sendCodeButton, successMessage
- goto(), sendResetCode(email)

**HomePage.ts** - export class HomePage:
- heroSection, navigationBar, featuredProducts
- goto(), isLoaded()

Use data-testid attributes where possible. Prefer getByRole and getByLabel over CSS selectors.
</action>
  <verify>
ls e2e-test-case/ecommerce/pages/
</verify>
  <done>All Page Object Models created with goto(), login(), search(), filter() methods</done>
</task>

<task type="auto">
  <name>Task 3: Write v1.0 and v1.1 E2E test specs</name>
  <files>e2e-test-case/ecommerce/tests/v1.0-smoke.spec.ts, e2e-test-case/ecommerce/tests/v1.1-auth.spec.ts, e2e-test-case/ecommerce/tests/v1.1-products.spec.ts</files>
  <action>
Create three test spec files:

**tests/v1.0-smoke.spec.ts** - Backend + Frontend smoke tests:
- `test("backend health check returns 200")` - GET http://localhost:8000/api/v1/health
- `test("frontend home page loads without crash")` - goto /, check no console errors
- `test("frontend login page loads")` - goto /login, check form visible
- `test("frontend product list page loads")` - goto /products, check product cards visible

**tests/v1.1-auth.spec.ts** - Authentication flows:
- `test("user can login with email and password")` - use LoginPage, check redirect to home/dashboard
- `test("user can logout")` - login first, then click logout, check redirect to login
- `test("user can login with phone and SMS code")` - use LoginPage.loginWithPhone (mocked SMS in test env)
- `test("user can request password reset")` - goto ForgotPasswordPage, send code, check success message
- `test("invalid credentials show error")` - login with wrong password, check error message visible

**tests/v1.1-products.spec.ts** - Product catalog flows:
- `test("product list page displays products")` - goto ProductListPage, check productCards.count() > 0
- `test("product search returns results")` - search for known keyword, check results appear
- `test("product search shows no results for unknown keyword")` - search for "xyznonexistent", check empty state
- `test("category filter shows only filtered products")` - filter by category, verify products match
- `test("clicking product opens product detail")` - click first product, check ProductDetailPage loaded

For phone login SMS code: since SMS is mocked in v1.1, use a fixed test code "123456" that the mock accepts.
For password reset: mock the email API or use a test email endpoint.

Use test.describe() to group related tests. Each test should be independent and clean up after itself (logout if logged in).
</action>
  <verify>
npx playwright test --list 2>/dev/null | head -30
</verify>
  <done>
- v1.0 smoke tests: backend API + frontend loads pass
- v1.1 auth tests: login/logout/phone/password reset work
- v1.1 product tests: browse/search/filter work
</done>
</task>

</tasks>

<verification>
npx playwright test
</verification>

<success_criteria>
- playwright.config.ts exists with correct baseURL and settings
- All Page Object Models (LoginPage, ProductListPage, ProductDetailPage, ForgotPasswordPage, HomePage) exist
- v1.0-smoke.spec.ts has 4 passing smoke tests
- v1.1-auth.spec.ts has 5 passing auth tests
- v1.1-products.spec.ts has 5 passing product tests
- All tests use Playwright best practices (Page Object Model, no brittle selectors)
</success_criteria>

<output>
After completion, create .planning/quick/260416-vyt-milestone-v1-0-v1-1-e2e/260416-vyt-SUMMARY.md
</output>

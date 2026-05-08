Tentu, ini adalah versi yang sudah dirombak dan disesuaikan untuk konteks **Netcatalog** (Katalog Produk, Kategori, dan Manajemen Stok/Inventory).

Silakan salin kode di bawah ini untuk menimpa file `vercel-react-performance.md` milikmu:

***

# Vercel React Performance Best Practices

> **Source:** Vercel Engineering React Best Practices  
> **Impact Priority:** CRITICAL to LOW  
> **Applies to:** Next.js 16, React 19, TypeScript

This guide adapts Vercel's performance optimization patterns for the **Netcatalog** codebase.

---

## 1. Eliminating Waterfalls (CRITICAL)

### 1.1 Defer Await Until Needed

Move `await` operations into the branches where they're actually used.

**❌ Incorrect: Always fetches auth even for early returns**

```typescript
// app/api/products/route.ts
export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const body = await request.json() // This could fail parsing first
  
  if (!body.id) {
    return Response.json({ error: 'ID required' }, { status: 400 })
  }
  
  if (!session || session.user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  // Only now we need session
  return deleteProduct(body.id)
}
```

**✅ Correct: Validates first, then fetches**

```typescript
// app/api/products/route.ts
export async function DELETE(request: Request) {
  const body = await request.json()
  
  if (!body.id) {
    return Response.json({ error: 'ID required' }, { status: 400 })
  }
  
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session || session.user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  return deleteProduct(body.id)
}
```

### 1.2 Promise.all() for Independent Operations

**❌ Incorrect: Sequential execution in API routes**

```typescript
// app/admin/dashboard/page.tsx
async function getDashboardData() {
  const products = await getProducts()         // 100ms
  const categories = await getCategories()     // 100ms
  const inventory = await getInventoryStats()  // 100ms
  return { products, categories, inventory }   // Total: 300ms
}
```

**✅ Correct: Parallel execution**

```typescript
// app/admin/dashboard/page.tsx
async function getDashboardData() {
  const [products, categories, inventory] = await Promise.all([
    getProducts(),
    getCategories(),
    getInventoryStats()
  ])
  return { products, categories, inventory }   // Total: ~100ms
}
```

### 1.3 Prevent Waterfall Chains in Data Fetching

**❌ Incorrect: Each component waits for parent**

```tsx
// app/admin/products/[id]/page.tsx
export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id)              // 100ms
  const category = await getCategory(product.categoryId)   // 100ms (waits)
  const stockHistory = await getStockHistory(params.id)    // 100ms (waits)
  
  return <ProductDetailClient product={product} category={category} history={stockHistory} />
}
```

**✅ Correct: Start all promises early**

```tsx
// app/admin/products/[id]/page.tsx
export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const productPromise = getProduct(params.id)
  const stockHistoryPromise = getStockHistory(params.id)
  
  const product = await productPromise
  
  // Category fetch depends on product, but history doesn't
  const [category, stockHistory] = await Promise.all([
    getCategory(product.categoryId),
    stockHistoryPromise
  ])
  
  return <ProductDetailClient product={product} category={category} history={stockHistory} />
}
```

**✅ Even Better: Component composition with Suspense**

```tsx
// app/admin/products/[id]/page.tsx
export default function ProductDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="admin-layout">
      <Suspense fallback={<ProductHeaderSkeleton />}>
        <ProductHeader id={params.id} />
      </Suspense>
      <Suspense fallback={<StockHistorySkeleton />}>
        <StockHistoryChart id={params.id} />
      </Suspense>
      <Suspense fallback={<RelatedProductsSkeleton />}>
        <RelatedProducts id={params.id} />
      </Suspense>
    </div>
  )
}

// Each component fetches its own data
async function ProductHeader({ id }: { id: string }) {
  const product = await getProduct(id)
  return <h1>{product.name}</h1>
}
```

---

## 2. Bundle Size Optimization (CRITICAL)

### 2.1 Avoid Barrel File Imports

**❌ Incorrect: Imports entire icon library**

```tsx
// components/ui/icons.tsx
import { Check, X, Menu, User, Settings, Package } from '@phosphor-icons/react'
// Loads entire library even if only using 6 icons
```

**✅ Correct: Import individual icons**

```tsx
// components/ui/icons.tsx
import { Check } from '@phosphor-icons/react/dist/icons/Check'
import { X } from '@phosphor-icons/react/dist/icons/X'
import { Package } from '@phosphor-icons/react/dist/icons/Package'
// Loads only what's needed
```

**Alternative: Already configured in next.config.ts**

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react']
  }
}
```

### 2.2 Dynamic Imports for Heavy Components

**❌ Incorrect: Heavy chart library in initial bundle**

```tsx
// app/admin/dashboard/page.tsx
import { InventoryTrendsChart } from '@/components/admin/InventoryTrendsChart'
// ~100KB+ added to initial bundle

export default function DashboardPage() {
  return <InventoryTrendsChart />
}
```

**✅ Correct: Lazy load heavy components**

```tsx
// app/admin/dashboard/page.tsx
import dynamic from 'next/dynamic'

const InventoryTrendsChart = dynamic(
  () => import('@/components/admin/InventoryTrendsChart').then(m => m.InventoryTrendsChart),
  { 
    ssr: false,  // Charts usually use browser APIs (canvas/svg)
    loading: () => <ChartSkeleton /> 
  }
)

export default function DashboardPage() {
  return <InventoryTrendsChart />
}
```

### 2.3 Defer Non-Critical Libraries

**❌ Incorrect: Analytics blocks hydration**

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />  // Blocks hydration
      </body>
    </html>
  )
}
```

**✅ Correct: Load after hydration**

```tsx
// app/layout.tsx
import dynamic from 'next/dynamic'

const Analytics = dynamic(
  () => import('@vercel/analytics/react').then(m => m.Analytics),
  { ssr: false }
)

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />  {/* Loads after hydration */}
      </body>
    </html>
  )
}
```

---

## 3. Server-Side Performance (HIGH)

### 3.1 React.cache() for Per-Request Deduplication

**❌ Incorrect: Same request made multiple times**

```tsx
// app/admin/products/page.tsx
async function getStats() {
  const products = await getProducts()  // Query 1
  const published = products.filter(p => p.status === 'published')
  const total = products.length
  
  return { published, total }
}

// app/admin/page.tsx
async function getOverview() {
  const products = await getProducts()  // Query 1 again!
  return { products }
}
```

**✅ Correct: Cache per request**

```typescript
// lib/api/products.ts
import { cache } from 'react'

export const getProducts = cache(async () => {
  const client = await pool.connect()
  try {
    const result = await client.query('SELECT * FROM products')
    return result.rows
  } finally {
    client.release()
  }
})

// Now multiple calls in same request are deduplicated
```

### 3.2 Minimize Serialization at RSC Boundaries

**❌ Incorrect: Passing entire objects to Client Components**

```tsx
// app/admin/products/page.tsx
import { ProductsClient } from './ProductsClient'

export default async function Page() {
  const products = await getProducts()
  
  return (
    <ProductsClient 
      products={products}  // Serializes full objects including description blobs
    />
  )
}
```

**✅ Correct: Pass minimal data needed**

```tsx
// app/admin/products/page.tsx
import { ProductsClient } from './ProductsClient'

export default async function Page() {
  const products = await getProducts()
  
  return (
    <ProductsClient 
      initialData={products}
      // Client uses TanStack Query for real-time updates
    />
  )
}

// Client fetches fresh data via useProducts(initialData)
```

---

## 4. Client-Side Data Fetching (MEDIUM-HIGH)

### 4.1 Use TanStack Query for Deduplication

**❌ Incorrect: Multiple components fetch same data**

```tsx
// components/admin/ProductList.tsx
function ProductList() {
  const [products, setProducts] = useState([])
  
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts)
  }, [])
  return <List products={products} />
}

// components/admin/LowStockAlert.tsx
function LowStockAlert() {
  const [products, setProducts] = useState([])
  
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts)  // Duplicate!
  }, [])
  return <Alert data={products} />
}
```

**✅ Correct: TanStack Query deduplicates automatically**

```tsx
// components/admin/ProductList.tsx
function ProductList() {
  const { data: products } = useProducts()
  return <List products={products} />
}

// components/admin/LowStockAlert.tsx
function LowStockAlert() {
  const { data: products } = useProducts()
  return <Alert data={products} />
}

// Only one request made, shared across components
```

---

## 5. Re-render Optimization (MEDIUM)

### 5.1 Extract to Memoized Components

**❌ Incorrect: Expensive calculations on every render**

```tsx
// components/admin/InventoryDashboard.tsx
function InventoryDashboard({ products, movements }) {
  // Runs on every render
  const stockTrends = calculateStockTrends(products, movements)
  const forecastData = generateForecast(stockTrends)
  
  return (
    <div>
      {forecastData.map(data => <TrendCard key={data.id} {...data} />)}
    </div>
  )
}
```

**✅ Correct: Memoize expensive work**

```tsx
// components/admin/InventoryDashboard.tsx
function InventoryDashboard({ products, movements }) {
  const stockTrends = useMemo(
    () => calculateStockTrends(products, movements),
    [products, movements]
  )
  
  const forecastData = useMemo(
    () => generateForecast(stockTrends),
    [stockTrends]
  )
  
  return (
    <div>
      {forecastData.map(data => <TrendCard key={data.id} {...data} />)}
    </div>
  )
}
```

### 5.2 Defer State Reads to Usage Point

**❌ Incorrect: Subscribing to state only used in callbacks**

```tsx
function ProductActions({ productId }) {
  const { data: product } = useProduct(productId)
  const { mutate: deleteProduct } = useDeleteProduct()
  
  // Subscribes to full product object
  const handleDelete = useCallback(() => {
    if (confirm('Delete ' + product.name + '?')) {
      deleteProduct(product.id)
    }
  }, [product, deleteProduct])
  
  return <button onClick={handleDelete}>Delete</button>
}
```

**✅ Correct: Read at point of use**

```tsx
function ProductActions({ productId }) {
  const { data: product } = useProduct(productId)
  const { mutate: deleteProduct } = useDeleteProduct()
  
  const handleDelete = useCallback(() => {
    // Read product inside callback
    if (confirm('Delete ' + product?.name + '?')) {
      deleteProduct(productId)
    }
  }, [productId, product?.name, deleteProduct])
  
  return <button onClick={handleDelete}>Delete</button>
}
```

### 5.3 Use Functional setState for Stable Callbacks

**❌ Incorrect: Stale closure in async operations**

```tsx
function ProductEntryForm() {
  const [products, setProducts] = useState([])
  const { mutate: createProduct } = useCreateProduct()
  
  const handleAdd = useCallback((newProduct) => {
    createProduct(newProduct, {
      onSuccess: (data) => {
        setProducts([...products, data])  // products might be stale!
      }
    })
  }, [createProduct, products])  // Must include products
  
  return <Form onSubmit={handleAdd} />
}
```

**✅ Correct: Functional update**

```tsx
function ProductEntryForm() {
  const [products, setProducts] = useState([])
  const { mutate: createProduct } = useCreateProduct()
  
  const handleAdd = useCallback((newProduct) => {
    createProduct(newProduct, {
      onSuccess: (data) => {
        setProducts(prev => [...prev, data])  // Always fresh
      }
    })
  }, [createProduct])  // No need for products in deps
  
  return <Form onSubmit={handleAdd} />
}
```

### 5.4 Use startTransition for Non-Urgent Updates

**❌ Incorrect: UI freezes on heavy operations**

```tsx
function InventoryReportGenerator({ inventoryData }) {
  const [report, setReport] = useState(null)
  
  const generate = () => {
    // Heavy computation blocks UI
    const result = generateMonthlyReport(inventoryData)
    setReport(result)
  }
  
  return (
    <>
      <button onClick={generate}>Generate Report</button>
      {report && <ReportView data={report} />}
    </>
  )
}
```

**✅ Correct: Mark as transition**

```tsx
import { useTransition } from 'react'

function InventoryReportGenerator({ inventoryData }) {
  const [report, setReport] = useState(null)
  const [isPending, startTransition] = useTransition()
  
  const generate = () => {
    startTransition(() => {
      // Marked as non-urgent
      const result = generateMonthlyReport(inventoryData)
      setReport(result)
    })
  }
  
  return (
    <>
      <button onClick={generate} disabled={isPending}>
        {isPending ? 'Generating...' : 'Generate Report'}
      </button>
      {isPending && <Spinner />}
      {report && <ReportView data={report} />}
    </>
  )
}
```

---

## 6. Rendering Performance (MEDIUM)

### 6.1 Hoist Static JSX Elements

**❌ Incorrect: Recreating elements on every render**

```tsx
function ProductCard({ product }) {
  return (
    <div className="card">
      <Icon icon={<PackageIcon />} />  {/* New element every render */}
      <h3>{product.name}</h3>
    </div>
  )
}
```

**✅ Correct: Static elements outside component**

```tsx
const packageIcon = <PackageIcon />

function ProductCard({ product }) {
  return (
    <div className="card">
      <Icon icon={packageIcon} />  {/* Same element reference */}
      <h3>{product.name}</h3>
    </div>
  )
}
```

### 6.2 CSS content-visibility for Long Lists

**❌ Incorrect: All list items render**

```tsx
function ProductCatalogList({ products }) {
  return (
    <div className="list">
      {products.map(p => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
```

**✅ Correct: content-visibility for off-screen items**

```tsx
function ProductCatalogList({ products }) {
  return (
    <div className="list">
      {products.map(p => (
        <div key={p.id} style={{ contentVisibility: 'auto' }}>
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  )
}
```

### 6.3 Use Explicit Conditional Rendering

**❌ Incorrect: && can render unexpected values**

```tsx
function ProductCount({ products }) {
  return (
    <div>
      {products.length && <span>{products.length} products found</span>}
      {/* Renders "0" when empty! */}
    </div>
  )
}
```

**✅ Correct: Use ternary for conditionals**

```tsx
function ProductCount({ products }) {
  return (
    <div>
      {products.length > 0 ? <span>{products.length} products found</span> : null}
    </div>
  )
}
```

---

## 7. JavaScript Performance (LOW-MEDIUM)

### 7.1 Build Index Maps for Repeated Lookups

**❌ Incorrect: O(n) lookup in loop**

```tsx
function InventoryMovementList({ movements, products }) {
  return (
    <ul>
      {movements.map(movement => {
        const product = products.find(p => p.id === movement.productId)  // O(n) each iteration
        return (
          <li key={movement.id}>
            {product?.name}: {movement.type} {movement.quantity}
          </li>
        )
      })}
    </ul>
  )
}
```

**✅ Correct: O(1) lookup with Map**

```tsx
function InventoryMovementList({ movements, products }) {
  const productMap = useMemo(() => {
    const map = new Map()
    products.forEach(p => map.set(p.id, p))
    return map
  }, [products])
  
  return (
    <ul>
      {movements.map(movement => {
        const product = productMap.get(movement.productId)  // O(1)
        return (
          <li key={movement.id}>
            {product?.name}: {movement.type} {movement.quantity}
          </li>
        )
      })}
    </ul>
  )
}
```

### 7.2 Combine Multiple Array Iterations

**❌ Incorrect: Multiple passes over array**

```tsx
function processProducts(products) {
  const published = products.filter(p => p.status === 'published')
  const names = published.map(p => p.name)
  const sorted = names.sort()  // Mutates!
  return sorted
}
```

**✅ Correct: Single iteration**

```tsx
function processProducts(products) {
  return products
    .filter(p => p.status === 'published')
    .map(p => p.name)
    .toSorted()  // Immutable sort
}
```

### 7.3 Use Set for O(1) Lookups

**❌ Incorrect: Array includes check**

```tsx
function ProductSelector({ products, selectedIds }) {
  return (
    <ul>
      {products.map(product => {
        const isSelected = selectedIds.includes(product.id)  // O(n) check
        return <ProductRow key={product.id} product={product} selected={isSelected} />
      })}
    </ul>
  )
}
```

**✅ Correct: Set for O(1) lookup**

```tsx
function ProductSelector({ products, selectedIds }) {
  const selectedSet = useMemo(
    () => new Set(selectedIds),
    [selectedIds]
  )
  
  return (
    <ul>
      {products.map(product => {
        const isSelected = selectedSet.has(product.id)  // O(1)
        return <ProductRow key={product.id} product={product} selected={isSelected} />
      })}
    </ul>
  )
}
```

---

## Quick Reference: Impact by Priority

| Priority | Category | Rules |
|----------|----------|-------|
| **CRITICAL** | Eliminating Waterfalls | `Promise.all()`, defer await, prevent chains |
| **CRITICAL** | Bundle Size | Dynamic imports, barrel file avoidance |
| **HIGH** | Server-Side | React.cache(), parallel fetching |
| **MEDIUM-HIGH** | Client Fetching | TanStack Query for deduplication |
| **MEDIUM** | Re-renders | useMemo, useTransition, functional setState |
| **MEDIUM** | Rendering | content-visibility, hoisted JSX |
| **LOW-MEDIUM** | JS Performance | Index maps, combined iterations |

## Common Netcatalog Patterns

### Server Component Pattern

```tsx
// app/admin/dashboard/page.tsx
import { cache } from 'react'

const getAdminStats = cache(async () => {
  const client = await pool.connect()
  try {
    const [products, categories, inventory] = await Promise.all([
      client.query('SELECT * FROM products'),
      client.query('SELECT * FROM categories'),
      client.query('SELECT * FROM inventory_movements ORDER BY "createdAt" DESC LIMIT 100')
    ])
    return { 
      products: products.rows,
      categories: categories.rows,
      movements: inventory.rows
    }
  } finally {
    client.release()
  }
})

export default async function AdminPage() {
  const stats = await getAdminStats()
  return <AdminDashboard initialData={stats} />
}
```

### Client Component Pattern

```tsx
// components/admin/AdminDashboard.tsx
'use client'

import { useProducts, useCategories, useInventory } from '@/lib/hooks'

export function AdminDashboard({ initialData }) {
  const { data: products } = useProducts({ initialData: initialData.products })
  const { data: categories } = useCategories({ initialData: initialData.categories })
  const { data: movements } = useInventory({ initialData: initialData.movements })
  
  // Use useMemo for derived data
  const stats = useMemo(() => ({
    totalProducts: products?.length || 0,
    activeCategories: categories?.filter(c => !c.isHidden).length || 0,
    lowStockItems: products?.filter(p => p.stockCount <= 5).length || 0
  }), [products, categories])
  
  return <DashboardStats stats={stats} />
}
```

---

**Resources:**
- [Vercel React Best Practices](https://github.com/vercel/react-best-practices)
- [React Documentation](https://react.dev)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
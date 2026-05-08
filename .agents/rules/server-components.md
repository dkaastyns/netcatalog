***

# React Server Components Data Fetching Pattern

## Overview

This codebase uses a **Server Component-first** data fetching pattern where:
- Server Components fetch data directly using PostgreSQL pool
- SQL queries are written inline in Server Components
- Data is passed to Client Components as props
- Pool connections are managed with proper cleanup

## When to Use Server Components vs Client Components

### Use Server Components When:
- **Fetching initial data** on page load (database queries, API calls)
- **Accessing server-side resources** (database, file system)
- **Rendering static content** that doesn't need interactivity
- **SEO-sensitive content** that needs to be in the initial HTML (like public product catalogs)
- **No browser APIs needed** (localStorage, window, document)

### Use Client Components When:
- **User interactivity** is required (add to cart buttons, stock adjustment forms, filter dialogs)
- **State management** with React hooks (useState, useEffect)
- **Browser APIs** are needed
- **Real-time updates** are required
- **Client-side mutations** (create product, update stock, delete operations)

### Pattern in This Codebase:
```tsx
// app/admin/products/page.tsx (Server Component)
async function getProducts() { /* ... */ }

export default async function AdminProductsPage() {
  const products = await getProducts(); // Fetch on server
  return <ProductsClient products={products} />; // Pass to client
}

// components/admin/ProductsClient.tsx (Client Component)
'use client';
export default function ProductsClient({ products }: Props) {
  // Handle interactivity, mutations, state (like data tables & sorting)
}
```

## Data Fetching Pattern with pg Pool

### Required Setup

```typescript
// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export { pool };
```

### Standard Fetch Pattern

```typescript
import { pool } from "@/lib/db";

// Define interface for type safety
interface Product {
  id: number;
  name: string;
  price: number;
  status: string;
  // ... other fields
}

async function getProducts(): Promise<Product[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM products ORDER BY "createdAt" DESC
    `);
    return result.rows;
  } finally {
    client.release(); // MUST release connection
  }
}

export default async function Page() {
  const products = await getProducts();
  return <ProductsClient products={products} />;
}
```

### Critical Rules:

1. **Always use `pool.connect()`** - Never use `pool.query()` directly
2. **Always release in `finally` block** - Ensures connection is returned to pool
3. **Use parameterized queries** - For dynamic values, use `$1, $2` placeholders
4. **Return typed results** - Define interfaces for query results

## Error Handling

### Philosophy: Let It Throw

Server Components should **not** typically catch errors from database queries. Let them throw so Next.js error boundaries handle them:

```typescript
// CORRECT: Let errors bubble up
async function getProduct(id: number) {
  const client = await pool.connect();
  try {
    const result = await client.query(`SELECT * FROM products WHERE id = $1`, [id]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

// WRONG: Don't catch and swallow errors
async function getProductWrong(id: number) {
  try {
    const client = await pool.connect();
    // ... query
  } catch (error) {
    console.error(error); // ❌ Don't do this
    return null;
  }
}
```

### When to Handle Errors:

- **Expected null results** - Use `|| null` or similar for "not found" scenarios
- **Conditional rendering** - Handle missing data for UI decisions
- **Not Found pages** - Use Next.js `notFound()` for 404s

```typescript
import { notFound } from "next/navigation";

export default async function ProductDetailPage({ params }: Props) {
  const product = await getProduct(params.id);
  
  if (!product) {
    notFound(); // Returns 404 page
  }
  
  return <ProductDetail product={product} />;
}
```

## Passing Data to Client Components

### Pattern 1: Direct Props (Most Common)

```typescript
// Server Component
export default async function AdminCategoriesPage() {
  const categories = await getCategories();
  return <CategoriesClient categories={categories} />;
}

// Client Component
'use client';
interface CategoriesClientProps {
  categories: Category[];
}
export default function CategoriesClient({ categories }: CategoriesClientProps) {
  // Use categories prop
}
```

### Pattern 2: With Pre-computed Values

```typescript
// Server Component
export default async function AdminInventoryPage() {
  const products = await getAllProductsWithStock();
  const lowStockCount = products.filter((p) => p.stockCount <= 5).length;
  
  return (
    <InventoryDashboardClient 
      products={products} 
      lowStockCount={lowStockCount} // Pre-computed on server
    />
  );
}
```

### Pattern 3: With Grouped/Transformed Data

```typescript
// Server Component
export default async function CatalogPage() {
  const products = await getPublishedProducts();
  
  // Group by category on server for easy rendering
  const groupedByCategory: Record<number, Product[]> = {};
  products.forEach((product) => {
    if (!groupedByCategory[product.categoryId]) {
      groupedByCategory[product.categoryId] = [];
    }
    groupedByCategory[product.categoryId].push(product);
  });
  
  return <CatalogGridClient groupedProducts={groupedByCategory} />;
}
```

### Pattern 4: Multiple Data Sources

```typescript
export default async function ProductOverviewPage({ params }: Props) {
  const { id } = await params;
  
  // Fetch multiple related datasets simultaneously
  const [product, inventoryHistory, categoryName] = await Promise.all([
    getProduct(id),
    getStockHistory(id),
    getCategoryNameForProduct(id)
  ]);
  
  return (
    <ProductDetailView 
      product={product} 
      history={inventoryHistory}
      categoryName={categoryName}
    />
  );
}
```

## SQL Query Patterns

### 1. Basic SELECT with Ordering

```typescript
async function getUsers() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT id, name, email, role, "createdAt"
      FROM "user"
      ORDER BY "createdAt" DESC
    `);
    return result.rows;
  } finally {
    client.release();
  }
}
```

### 2. INNER JOIN for Related Data

```typescript
async function getAllProducts(): Promise<Product[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT p.*, c.name as "categoryName", c.slug as "categorySlug",
             u.name as "addedByName"
      FROM products p
      JOIN categories c ON p."categoryId" = c.id
      JOIN "user" u ON p."createdBy" = u.id
      ORDER BY p."createdAt" DESC
    `);
    return result.rows;
  } finally {
    client.release();
  }
}
```

### 3. LEFT JOIN with Subquery for Aggregates (Crucial for Stock Calculation)

```typescript
async function getProductsWithStock() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT p.*, COALESCE(inv.total_stock, 0) as "stockCount"
      FROM products p
      LEFT JOIN (
        SELECT "productId", SUM(quantity) as total_stock
        FROM inventory_movements
        GROUP BY "productId"
      ) inv ON p.id = inv."productId"
      ORDER BY p."createdAt" DESC
    `);
    return result.rows;
  } finally {
    client.release();
  }
}
```

### 4. Complex Query with Multiple Joins and Aggregations

```typescript
async function getAdvancedInventoryStats(): Promise<InventoryStats[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
        p.id,
        p.name,
        p.price,
        c.name as "categoryName",
        COALESCE(inv.current_stock, 0) as "stockCount",
        COALESCE(sales.total_sold, 0) as "itemsSold",
        EXISTS (
          SELECT 1 FROM inventory_movements im
          WHERE im."productId" = p.id 
          AND im."createdAt" >= NOW() - INTERVAL '7 days'
          LIMIT 1
        ) as "recentlyUpdated"
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      LEFT JOIN (
        SELECT "productId", SUM(quantity) as current_stock 
        FROM inventory_movements 
        GROUP BY "productId"
      ) inv ON p.id = inv."productId"
      LEFT JOIN (
        SELECT "productId", SUM(ABS(quantity)) as total_sold 
        FROM inventory_movements 
        WHERE type = 'out' 
        GROUP BY "productId"
      ) sales ON p.id = sales."productId"
      ORDER BY "stockCount" ASC, p.name ASC
    `);
    return result.rows;
  } finally {
    client.release();
  }
}
```

### 5. Subquery in SELECT Clause

```typescript
async function getCategoriesOverview(): Promise<CategoryOverview[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        c.id,
        c.name,
        (SELECT COUNT(*) FROM products p WHERE p."categoryId" = c.id) as "productCount",
        c.description
      FROM categories c
      ORDER BY c.name ASC
    `);
    return result.rows;
  } finally {
    client.release();
  }
}
```

### 6. CASE Statements for Conditional Logic

```typescript
async function getRecentTransactions(): Promise<Transaction[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
        im.id,
        p.name as "productName",
        im.quantity,
        im."notes",
        CASE 
          WHEN im.type = 'in' THEN 'Stock In'
          WHEN im.type = 'out' THEN 'Sale / Deduction'
          WHEN im.type = 'opname' THEN 'Stock Opname'
          ELSE 'Unknown'
        END as "transactionType",
        u.name as "actorName"
      FROM inventory_movements im
      JOIN products p ON im."productId" = p.id
      JOIN "user" u ON im."userId" = u.id
      ORDER BY im."createdAt" DESC 
      LIMIT 50`
    );
    return result.rows;
  } finally {
    client.release();
  }
}
```

### 7. Multiple Queries in Single Function

```typescript
async function getAdminDashboardStats() {
  const client = await pool.connect();
  try {
    // Run multiple queries
    const totalProducts = await client.query(
      `SELECT COUNT(*) FROM products WHERE status = 'published'`
    );
    
    const lowStockAlerts = await client.query(
      `SELECT COUNT(*) FROM (
         SELECT p.id, COALESCE(SUM(im.quantity), 0) as stock
         FROM products p
         LEFT JOIN inventory_movements im ON p.id = im."productId"
         GROUP BY p.id
         HAVING COALESCE(SUM(im.quantity), 0) <= 5
       ) as low_stock_items`
    );
    
    const outOfStockAlerts = await client.query(
      `SELECT COUNT(*) FROM (
         SELECT p.id, COALESCE(SUM(im.quantity), 0) as stock
         FROM products p
         LEFT JOIN inventory_movements im ON p.id = im."productId"
         GROUP BY p.id
         HAVING COALESCE(SUM(im.quantity), 0) <= 0
       ) as out_of_stock_items`
    );
    
    return {
      totalPublishedProducts: parseInt(totalProducts.rows[0].count),
      lowStockItems: parseInt(lowStockAlerts.rows[0].count),
      outOfStockItems: parseInt(outOfStockAlerts.rows[0].count),
    };
  } finally {
    client.release();
  }
}
```

## SQL Pattern Guidelines

### Quoted Identifiers

PostgreSQL identifiers with uppercase letters or special characters must be quoted:

```sql
-- Use double quotes for column/table names with camelCase
SELECT "categoryId", "productName", "createdAt"
FROM products
WHERE status = 'published'
```

### Parameterized Queries

Always use parameterized queries for dynamic values:

```typescript
// ✅ CORRECT
await client.query(`SELECT * FROM products WHERE id = $1`, [id]);

// ❌ WRONG - SQL injection risk
await client.query(`SELECT * FROM products WHERE id = ${id}`);
```

### COALESCE for Null Handling

Use COALESCE to provide default values for NULL results (Very important for products with NO stock history yet):

```sql
SELECT p.*, COALESCE(inv.total_stock, 0) as stock_count
```

### FILTER Clause

Use FILTER for conditional aggregation:

```sql
COUNT(*) FILTER (WHERE type = 'out') as total_sales_transactions
```

## Complete Example: Product Management Page

```typescript
// app/admin/products/page.tsx
import { pool } from "@/lib/db";
import ProductsClient from "@/components/admin/ProductsClient";

interface ProductWithStock {
  id: number;
  name: string;
  slug: string;
  price: number;
  status: string;
  categoryId: number;
  stockCount: number;
}

async function getProductsForAdmin(): Promise<ProductWithStock[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT p.*, COALESCE(inv.stock_count, 0) as "stockCount"
      FROM products p
      LEFT JOIN (
        SELECT "productId", SUM(quantity) as stock_count
        FROM inventory_movements
        GROUP BY "productId"
      ) inv ON p.id = inv."productId"
      ORDER BY p."createdAt" DESC
    `);
    return result.rows;
  } finally {
    client.release();
  }
}

export default async function AdminProductsPage() {
  const products = await getProductsForAdmin();
  return <ProductsClient products={products} />;
}
```

```typescript
// components/admin/ProductsClient.tsx
'use client';

import { useState } from 'react';
import { ProductWithStock } from '@/types';

interface ProductsClientProps {
  products: ProductWithStock[];
}

export default function ProductsClient({ products }: ProductsClientProps) {
  const [editing, setEditing] = useState<ProductWithStock | null>(null);
  
  // Handle interactivity, forms, data table sorting, mutations...
  
  return (
    <div>
      {/* Render products table with client-side filters */}
    </div>
  );
}
```

## Security Considerations

1. **Never expose database credentials** - Use environment variables
2. **Always use parameterized queries** - Prevents SQL injection
3. **Validate user input** - Before using in queries (e.g. Zod schemas)
4. **Handle authentication in Server Components** - Use auth headers/cookies to protect the admin dashboard.

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function ProtectedAdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== 'admin') {
    return null; // Or redirect to login
  }

  const stats = await getAdminDashboardStats();
  return <DashboardClient stats={stats} />;
}
```

## Performance Tips

1. **Fetch only needed columns** - Don't use `SELECT *` if you only need the product ID and Name.
2. **Use appropriate indexes** - On frequently queried columns (e.g., `categoryId`, `productId` in inventory_movements).
3. **Consider query result caching** - Next.js built-in caching for public catalog pages.
4. **Parallelize independent queries** - Use `Promise.all()`.
5. **Limit result sets** - Use pagination (`LIMIT` and `OFFSET`) for large inventory histories.

```typescript
// Parallel queries
const [products, categories] = await Promise.all([
  getProducts(),
  getCategories()
]);
```
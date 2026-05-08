# Cache Invalidation Rules — Netcatalog (Network Device Catalog)

AI Agent Instruction: Follow these rules precisely whenever any mutation (POST/PUT/DELETE) is performed. Incorrect cache invalidation causes stale `stockCount` values in the UI, which is a **critical business bug** for a product catalog that sells network devices.

---

## Overview

React Query caches server data on the client. After every mutation, relevant caches must be invalidated so the UI refetches fresh data. This project uses a structured query key system to make invalidation predictable and auditable.

---

## 1. Query Key Reference

All query keys live in `/lib/query-keys.ts`. **Never hard-code key strings in API files.**

```typescript
// /lib/query-keys.ts

export const queryKeys = {
  products: {
    all: ['products'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.products.all, 'list', filters ?? {}] as const,
    detail: (id: string | number) =>
      [...queryKeys.products.all, 'detail', id.toString()] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: () => [...queryKeys.categories.all, 'list'] as const,
    detail: (id: string | number) =>
      [...queryKeys.categories.all, 'detail', id.toString()] as const,
  },
  brands: {
    all: ['brands'] as const,
    list: () => [...queryKeys.brands.all, 'list'] as const,
    detail: (id: string | number) =>
      [...queryKeys.brands.all, 'detail', id.toString()] as const,
  },
  inventory: {
    all: ['inventory'] as const,
    history: (productId: string | number) =>
      [...queryKeys.inventory.all, 'history', productId.toString()] as const,
    summary: () => [...queryKeys.inventory.all, 'summary'] as const,
  },
  stockAlerts: {
    all: ['stockAlerts'] as const,
    list: () => [...queryKeys.stockAlerts.all, 'list'] as const,
  },
};
```

---

## 2. Invalidation Matrix (Full Reference)

### Products

| Operation | Invalidate |
|-----------|-----------|
| `createProduct` | `queryKeys.products.list()` |
| `updateProduct(id)` | `queryKeys.products.list()` + `queryKeys.products.detail(id)` |
| `deleteProduct(id)` | `queryKeys.products.list()` |
| `updateProductStatus(id)` | `queryKeys.products.list()` + `queryKeys.products.detail(id)` |

### Inventory / Stock

| Operation | Invalidate |
|-----------|-----------|
| `adjustStock({ productId })` | `queryKeys.products.list()` + `queryKeys.products.detail(productId)` + `queryKeys.inventory.all` + `queryKeys.stockAlerts.list()` |
| `bulkAdjustStock` | `queryKeys.products.all` + `queryKeys.inventory.all` + `queryKeys.stockAlerts.list()` |
| `receiveStock (purchase)` | same as `adjustStock` for each affected product |

### Categories

| Operation | Invalidate |
|-----------|-----------|
| `createCategory` | `queryKeys.categories.list()` |
| `updateCategory(id)` | `queryKeys.categories.list()` + `queryKeys.categories.detail(id)` |
| `deleteCategory(id)` | `queryKeys.categories.list()` + `queryKeys.products.list()` (products may change display) |

### Brands

| Operation | Invalidate |
|-----------|-----------|
| `createBrand` | `queryKeys.brands.list()` |
| `updateBrand(id)` | `queryKeys.brands.list()` + `queryKeys.brands.detail(id)` |
| `deleteBrand(id)` | `queryKeys.brands.list()` + `queryKeys.products.list()` |

### Stock Alerts

| Operation | Invalidate |
|-----------|-----------|
| `createStockAlert` | `queryKeys.stockAlerts.list()` |
| `updateStockAlert(id)` | `queryKeys.stockAlerts.list()` |
| `deleteStockAlert(id)` | `queryKeys.stockAlerts.list()` |

---

## 3. Granularity Rules

### Use `queryKeys.products.list()` (not `.all`) for single-product mutations
```typescript
// CORRECT — only invalidates list queries
queryClient.invalidateQueries({ queryKey: queryKeys.products.list() });

// WRONG — invalidates everything including product details you didn't change
queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
```

### Use `queryKeys.products.all` only for bulk operations
```typescript
// Bulk stock adjustment touches ALL products — invalidate broadly
queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
```

### Always include stockAlerts after any stock mutation
Low-stock alerts depend on `minStockLevel` vs `stockCount`. Any stock adjustment can change alert state.
```typescript
queryClient.invalidateQueries({ queryKey: queryKeys.stockAlerts.list() });
```

---

## 4. Stock Adjustment — Full Invalidation Example

```typescript
// /lib/api/inventory.ts

export async function adjustStock(input: AdjustStockInput): Promise<StockMovement> {
  const response = await fetch('/api/inventory/adjust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to adjust stock');
  }

  const data = await response.json();

  // 1. Update product list (stockCount column changes)
  queryClient.invalidateQueries({ queryKey: queryKeys.products.list() });

  // 2. Update product detail page (stockCount badge changes)
  queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(input.productId) });

  // 3. Update inventory history table
  queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });

  // 4. Re-evaluate low-stock alerts
  queryClient.invalidateQueries({ queryKey: queryKeys.stockAlerts.list() });

  return data;
}
```

---

## 5. Common Mistakes to Avoid

| Mistake | Why It's Wrong | Correct Approach |
|---------|---------------|-----------------|
| Forgetting `stockAlerts` invalidation after stock adjustment | Alert badge stays stale even when stock drops below threshold | Always include `stockAlerts.list()` in stock mutations |
| Invalidating `products.all` for single product update | Causes all product detail queries to refetch unnecessarily | Use `products.list()` + `products.detail(id)` |
| Not invalidating `products.list()` after category delete | Products in that category may still show deleted category name | Invalidate both `categories.list()` and `products.list()` |
| Invalidating before `response.ok` check | Cache is cleared even when the mutation failed | Always invalidate **after** confirming success |
| Using raw string keys instead of `queryKeys` | Typos cause silent mismatches — queries never invalidate | Always use `queryKeys.*` helpers |

---

## 6. Invalidation Order Convention

Always invalidate in this order for consistency and readability:

1. Primary entity (e.g., `products.list`, `products.detail`)
2. Related inventory (`inventory.all`)
3. Alert state (`stockAlerts.list`)
4. Other cross-domain keys

---

## 7. Checklist

- [ ] Every POST/PUT/DELETE function calls `queryClient.invalidateQueries`
- [ ] Single-entity mutations use `.list()` and `.detail(id)`, not `.all`
- [ ] Bulk mutations use `.all` for broad invalidation
- [ ] Stock-touching mutations always invalidate `stockAlerts.list()`
- [ ] Invalidation happens **after** `response.ok` check
- [ ] No hard-coded query key strings — always use `queryKeys.*`
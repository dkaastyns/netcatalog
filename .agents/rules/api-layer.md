# API Layer Pattern — Netcatalog (Network Device Catalog)

AI Agent Instruction: Follow these patterns when creating, modifying, or reviewing API modules for the Netcatalog project. This catalog specifically handles **network devices** (routers, switches, access points, firewalls, SFP modules, cables, etc.) with real-time stock count management.

---

## Overview

This project uses a centralized API layer in `/lib/api/` that wraps all HTTP requests with:

- Type-safe interfaces tailored for network device products, categories, brands, and inventory.
- Consistent error handling.
- Automatic cache invalidation for mutations (crucial for real-time stock updates).
- Clean exports through a barrel file.

---

## 1. File Structure & Naming Conventions

```
lib/api/
├── index.ts              # Barrel export - exports everything from all files
├── products.ts           # Network device product catalog operations
├── categories.ts         # Device categories (router, switch, AP, firewall, etc.)
├── brands.ts             # Device brands (Cisco, Mikrotik, Ubiquiti, TP-Link, etc.)
├── inventory.ts          # Stock management and movement history
├── stockAlerts.ts        # Low-stock and out-of-stock alert rules
├── users.ts              # Admin/User management
```

| Rule | Convention |
|------|-----------|
| File naming | Plural domain name, camelCase (e.g., `products.ts`, `stockAlerts.ts`) |
| File location | Always in `/lib/api/` directory |
| Export in index.ts | Must add `export * from './new-file';` to `/lib/api/index.ts` |
| Function naming | `fetch<Entity>s` for GET list, `fetch<Entity>` for GET single, `create<Entity>` for POST, `update<Entity>` for PUT, `delete<Entity>` for DELETE |
| Interface naming | `<Entity>` for response type, `Create<Entity>Input` for POST body, `Update<Entity>Input` for PUT body |

---

## 2. Interface Definitions — Network Device Domain

Define TypeScript interfaces at the top of each API file.

```typescript
// ─── products.ts ───────────────────────────────────────────────

export type DeviceCategory =
  | 'router'
  | 'switch'
  | 'access-point'
  | 'firewall'
  | 'sfp-module'
  | 'cable'
  | 'rack'
  | 'ups'
  | 'other';

export type DeviceStatus = 'draft' | 'published' | 'discontinued';

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;                    // e.g. MKT-RB750Gr3
  description: string;
  shortDescription: string;
  price: number;                  // selling price (IDR)
  costPrice: number;              // purchase/cost price (IDR)
  stockCount: number;             // current on-hand stock
  minStockLevel: number;          // threshold for low-stock alert
  status: DeviceStatus;
  categoryId: number;
  brandId: number;
  warrantyMonths: number;         // warranty period in months
  partNumber: string;             // manufacturer part number
  specs: Record<string, string>;  // key-value specs, e.g. { ports: "8", speed: "1Gbps" }
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  slug: string;
  sku: string;
  description?: string;
  shortDescription?: string;
  price: number;
  costPrice: number;
  minStockLevel: number;
  categoryId: number;
  brandId: number;
  warrantyMonths?: number;
  partNumber?: string;
  specs?: Record<string, string>;
  imageUrls?: string[];
  status: 'draft' | 'published';
}

export interface UpdateProductInput extends CreateProductInput {
  status: DeviceStatus;
}

// ─── inventory.ts ──────────────────────────────────────────────

export type StockMovementType = 'purchase' | 'sale' | 'return' | 'adjustment' | 'opname' | 'damaged';

export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  type: StockMovementType;
  quantity: number;               // positive = in, negative = out
  stockBefore: number;
  stockAfter: number;
  referenceNo: string;            // PO number, SO number, etc.
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface AdjustStockInput {
  productId: number;
  quantity: number;               // positive = addition, negative = deduction
  type: StockMovementType;
  referenceNo?: string;
  notes?: string;
}

export interface BulkAdjustStockInput {
  movements: AdjustStockInput[];
}
```

### Guidelines

- Export all interfaces (they are used in hooks and components).
- Use strict union types for enums — never plain `string`.
- Always include `createdAt` / `updatedAt` on entity interfaces.
- `stockCount` is **read-only from the API** — never send it in create/update inputs; it is managed exclusively through inventory adjustments.
- `specs` is a flexible `Record<string, string>` to accommodate diverse device specifications.

---

## 3. Error Handling Pattern

Standard pattern for **ALL** API functions:

```typescript
if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error || 'Descriptive error message');
}
```

| Rule | Detail |
|------|--------|
| Always check `response.ok` | Covers HTTP 200–299 |
| Parse error from JSON | Backend returns `{ error: "message" }` |
| Throw `new Error` | Use backend message or a clear fallback string |
| Order matters | Error check **before** parsing success response |

---

## 4. Cache Invalidation After Mutations

Always invalidate affected queries after successful mutations. **This is critical for stockCount accuracy** across the product list, detail page, and dashboard widgets.

### Query Key Structure (`/lib/query-keys.ts`)

```typescript
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
  },
  brands: {
    all: ['brands'] as const,
    list: () => [...queryKeys.brands.all, 'list'] as const,
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

### Invalidation Matrix

| Operation | Queries to Invalidate |
|-----------|----------------------|
| CREATE product | `products.list` |
| UPDATE product | `products.list` + `products.detail(id)` |
| DELETE product | `products.list` |
| ADJUST stock (single) | `products.list` + `products.detail(productId)` + `inventory.all` + `stockAlerts.list` |
| BULK adjust stock | `products.all` + `inventory.all` + `stockAlerts.list` |
| CREATE/UPDATE category | `categories.list` |
| CREATE/UPDATE brand | `brands.list` |

---

## 5. Complete Code Examples

### GET with filters (fetchProducts)

```typescript
export async function fetchProducts(filters?: {
  categoryId?: number;
  brandId?: number;
  status?: DeviceStatus;
  search?: string;
  lowStock?: boolean;
}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (filters?.categoryId) params.set('categoryId', String(filters.categoryId));
  if (filters?.brandId) params.set('brandId', String(filters.brandId));
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.lowStock) params.set('lowStock', 'true');

  const url = params.size ? `/api/products?${params}` : '/api/products';
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch products');
  }

  return response.json();
}
```

### POST — Adjust Stock

```typescript
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

  // Critical: invalidate all stock-related caches
  queryClient.invalidateQueries({ queryKey: queryKeys.products.list() });
  queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(input.productId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.stockAlerts.list() });

  return data;
}
```

### PUT — Update Product

```typescript
export async function updateProduct(id: number, input: UpdateProductInput): Promise<Product> {
  const response = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update product');
  }

  const data = await response.json();

  queryClient.invalidateQueries({ queryKey: queryKeys.products.list() });
  queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });

  return data;
}
```

### DELETE — Delete Product

```typescript
export async function deleteProduct(id: number): Promise<void> {
  const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete product');
  }

  queryClient.invalidateQueries({ queryKey: queryKeys.products.list() });
}
```

---

## 6. Export Pattern from `index.ts`

```typescript
// /lib/api/index.ts
export * from './brands';
export * from './categories';
export * from './inventory';
export * from './products';
export * from './stockAlerts';
export * from './users';
// Add new exports alphabetically
```

---

## 7. Checklist for New API Module

- [ ] File created at `/lib/api/[domain].ts`
- [ ] Interfaces defined and exported (`Entity`, `CreateInput`, `UpdateInput`)
- [ ] All functions use consistent error handling (`if (!response.ok) { throw new Error(...) }`)
- [ ] All mutation functions include correct cache invalidation
- [ ] Cross-domain cache invalidation verified (stock adjustments hit product + inventory + alert caches)
- [ ] `export * from './[domain]';` added to `/lib/api/index.ts` (alphabetical)
- [ ] Query keys added to `/lib/query-keys.ts` if new domain
- [ ] `stockCount` is never sent in product create/update payloads

---

## Related Files

- `/lib/api/index.ts` — Barrel exports
- `/lib/query-keys.ts` — Query key definitions
- `/lib/query-client.ts` — React Query client configuration
# Feature Flow — Netcatalog (Network Device Catalog)

AI Agent Instruction: Follow these feature flows when building UI pages and forms for the Netcatalog project. Each flow maps the user journey to the components, hooks, and API calls involved.

---

## 1. Product Catalog Page (`/products`)

### User Journey
1. Admin opens `/products`
2. Sees a table/grid of all network devices with stock badges
3. Can filter by category, brand, status, or search by name/SKU
4. Low-stock items are visually flagged
5. Can click to view detail, edit, or delete

### Data Flow
```
Page mounts
  → useProducts({ categoryId, brandId, status, search, lowStock })
    → fetchProducts(filters)
      → GET /api/products?...
        → Returns Product[]
          → Table renders with stockCount badges
```

### Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| `ProductsPage` | Layout, filter state, pagination |
| `ProductFilters` | Category/brand/status dropdowns + search input |
| `ProductTable` | Renders product rows |
| `ProductRow` | Single row: name, SKU, category, brand, price, stockBadge, actions |
| `StockBadge` | Color-coded pill: green (ok), yellow (low), red (out of stock) |
| `DeleteProductDialog` | Confirm dialog before `useDeleteProduct` mutation |

### StockBadge Logic
```typescript
// components/StockBadge.tsx
type BadgeVariant = 'ok' | 'low' | 'empty';

function getVariant(stockCount: number, minStockLevel: number): BadgeVariant {
  if (stockCount === 0) return 'empty';
  if (stockCount <= minStockLevel) return 'low';
  return 'ok';
}

// Styles
const variantStyles = {
  ok:    'bg-emerald-100 text-emerald-800',
  low:   'bg-amber-100  text-amber-800',
  empty: 'bg-red-100    text-red-800',
};
```

---

## 2. Add Product Flow (`/products/new`)

### User Journey
1. Admin clicks "Add Product"
2. Fills in: name, SKU (auto-generated or manual), category, brand, price, cost price, min stock level, warranty, specs, images
3. Saves → product created with `stockCount: 0`
4. Redirected to product detail page
5. Admin then uses "Add Stock" to set initial inventory via stock adjustment

### Data Flow
```
Form submits
  → useCreateProduct()
    → createProduct(input)
      → POST /api/products { ...input, stockCount omitted }
        → Product created with stockCount: 0
          → queryKeys.products.list() invalidated
            → Redirect to /products/:id
```

### Key Rules
- The form must **never** include a `stockCount` field.
- After creation, guide the admin to adjust stock using the inventory adjustment form.
- SKU field should offer an auto-generate button using the brand code + model name pattern.

---

## 3. Stock Adjustment Flow

### User Journey
1. Admin opens product detail page
2. Clicks "Adjust Stock" button
3. Modal opens with fields: type (dropdown), quantity, reference number, notes
4. Admin submits
5. `stockCount` badge updates immediately (via cache invalidation)
6. Movement appears in stock history table below

### Data Flow
```
Modal submits
  → useAdjustStock()
    → adjustStock({ productId, quantity, type, referenceNo, notes })
      → POST /api/inventory/adjust
        → DB transaction: create StockMovement + update Product.stockCount
          → Invalidates: products.list, products.detail, inventory.all, stockAlerts
            → Modal closes, stockCount badge refreshes
```

### Quantity Sign Convention (UI)
The form uses **absolute values** with a separate direction (addition/deduction). The API receives a **signed quantity**:

```typescript
// In form submit handler
const signedQuantity = formData.direction === 'deduction'
  ? -Math.abs(formData.quantity)
  : Math.abs(formData.quantity);

adjustStock({ productId, quantity: signedQuantity, type: formData.type, ... });
```

---

## 4. Product Detail Page (`/products/:id`)

### Sections

| Section | Data Source |
|---------|------------|
| Product info header | `useProduct(id)` |
| Stock status badge | `product.stockCount` + `product.minStockLevel` |
| Specs table | `product.specs` (key-value pairs) |
| Stock history table | `useStockHistory(id)` |
| Adjust Stock button | Opens adjustment modal |

### Component Tree
```
ProductDetailPage
├── ProductHeader         (name, SKU, brand, category, status badge)
├── PriceCard             (price, costPrice, margin %)
├── StockCard             (stockCount badge, minStockLevel, "Adjust Stock" CTA)
├── SpecsTable            (renders product.specs as key-value grid)
├── StockHistoryTable     (useStockHistory — movement type, qty, date, ref)
└── AdjustStockModal      (conditionally rendered)
```

---

## 5. Dashboard (`/`)

### Widgets

| Widget | Data | Hook |
|--------|------|------|
| Total Products | Count of all products | `useDashboardStats` |
| Published | Count of published products | `useDashboardStats` |
| Out of Stock | Count where stockCount = 0 | `useDashboardStats` |
| Low Stock Alert | Count where stockCount ≤ minStockLevel | `useStockAlerts` |
| Inventory Value | Sum of costPrice × stockCount | `useDashboardStats` |
| Recent Movements | Last 10 stock movements | `useStockHistory` (global) |
| Low Stock Table | Products near or at 0 | `useStockAlerts` |

---

## 6. Page to Route Mapping

| Page | Route | Auth |
|------|-------|------|
| Dashboard | `/` | Admin |
| Product List | `/products` | Admin |
| Add Product | `/products/new` | Admin |
| Product Detail | `/products/:id` | Admin |
| Edit Product | `/products/:id/edit` | Admin |
| Inventory History | `/inventory` | Admin |
| Categories | `/categories` | Admin |
| Brands | `/brands` | Admin |
| Stock Alerts | `/stock-alerts` | Admin |

---

## 7. Checklist for New Feature

- [ ] Feature flow documented: user journey → data flow → components
- [ ] Page uses hooks (not raw API calls)
- [ ] Form never includes `stockCount` as editable input
- [ ] Stock adjustment uses signed quantity (positive in, negative out)
- [ ] `StockBadge` variant matches `stockCount` vs `minStockLevel`
- [ ] Loading states handled (skeleton or spinner)
- [ ] Error states handled (error boundary or inline error message)
- [ ] Redirect after successful create/delete mutation
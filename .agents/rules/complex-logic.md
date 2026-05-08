# Complex Business Logic — Netcatalog (Network Device Catalog)

AI Agent Instruction: Follow these rules when implementing business logic for stock management, pricing, and device-specific catalog rules. Business logic lives in route handlers and utility functions — never in UI components.

---

## 1. Stock Count Management

### Source of Truth
`stockCount` on the `Product` record is the **single source of truth** for available stock. It is:
- **Computed** from all stock movements in the database.
- **Never** manually edited via product update forms.
- **Only** modified through the `/api/inventory/adjust` endpoint using atomic transactions.

### Stock Movement Types

| Type | Effect on stockCount | When to Use |
|------|---------------------|-------------|
| `purchase` | Positive (+) | Goods received from supplier |
| `sale` | Negative (−) | Product sold to customer |
| `return` | Positive (+) | Customer returned item |
| `adjustment` | Positive or Negative | Manual correction by admin |
| `opname` | Positive or Negative | Physical stock count reconciliation |
| `damaged` | Negative (−) | Items damaged/written off |

### Transaction Pattern

Stock adjustment **must always** be a database transaction:

```typescript
// CORRECT: Atomic transaction
await db.$transaction([
  db.stockMovement.create({ data: movementData }),
  db.product.update({ where: { id }, data: { stockCount: newCount } }),
]);

// WRONG: Two separate queries — not atomic, creates inconsistency risk
await db.stockMovement.create({ data: movementData });
await db.product.update({ where: { id }, data: { stockCount: newCount } });
```

### Stock Validation Rules

```typescript
// Rule 1: Stock cannot go negative
if (stockAfter < 0) {
  throw new Error(`Insufficient stock: available ${stockBefore}, requested ${Math.abs(quantity)}`);
}

// Rule 2: Discontinued products cannot be restocked (purchase type)
if (product.status === 'discontinued' && type === 'purchase') {
  throw new Error('Cannot add stock to a discontinued product');
}

// Rule 3: Quantity of 0 is invalid
if (quantity === 0) {
  throw new Error('Quantity cannot be 0');
}
```

---

## 2. Low-Stock Alert Logic

A product triggers a low-stock alert when:

```
stockCount <= minStockLevel
```

`minStockLevel` is set per-product at creation time. Recommended defaults by device category:

| Category | Default minStockLevel |
|----------|-----------------------|
| Router | 3 |
| Switch | 3 |
| Access Point | 3 |
| Firewall | 2 |
| SFP Module | 10 |
| Cable | 20 |
| Rack | 1 |
| UPS | 2 |

### Fetching Alerts (Server Side)

```typescript
// GET /api/stock-alerts
const lowStockProducts = await db.product.findMany({
  where: {
    status: 'published',
    stockCount: { lte: db.raw('min_stock_level') },
  },
  orderBy: { stockCount: 'asc' },
});
```

---

## 3. Pricing Rules

### Price Fields

| Field | Description | Constraint |
|-------|-------------|------------|
| `price` | Selling price to customer (IDR) | Must be > 0 |
| `costPrice` | Purchase/cost price (IDR) | Must be ≥ 0 |

### Margin Calculation (Read-Only, Derived)

```typescript
// Computed in utility, never stored in DB
export function calculateMargin(price: number, costPrice: number): number {
  if (costPrice === 0) return 100;
  return ((price - costPrice) / price) * 100;
}

// Display helper
export function formatMargin(price: number, costPrice: number): string {
  return `${calculateMargin(price, costPrice).toFixed(1)}%`;
}
```

### Stock Value Calculation

```typescript
// Total inventory value at cost
export function calculateInventoryValue(products: Product[]): number {
  return products.reduce((sum, p) => sum + p.costPrice * p.stockCount, 0);
}

// Total inventory value at selling price
export function calculateInventoryRetailValue(products: Product[]): number {
  return products.reduce((sum, p) => sum + p.price * p.stockCount, 0);
}
```

---

## 4. SKU Generation Convention

SKU format for network devices: `{BRAND_CODE}-{MODEL_CODE}`

```typescript
// Example generator — call when user leaves SKU field blank
export function generateSku(brandCode: string, modelName: string): string {
  const model = modelName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
  return `${brandCode.toUpperCase()}-${model}`;
}

// Examples:
// Mikrotik RB750Gr3 → MKT-RB750GR3
// Ubiquiti UniFi AP AC Pro → UBQ-UNIFIAPACP
// Cisco SG350-28 → CSC-SG35028
```

Brand codes to register in `/lib/constants/brandCodes.ts`:

```typescript
export const BRAND_CODES: Record<string, string> = {
  'Mikrotik': 'MKT',
  'Ubiquiti': 'UBQ',
  'Cisco': 'CSC',
  'TP-Link': 'TPL',
  'D-Link': 'DLK',
  'Netgear': 'NTG',
  'Juniper': 'JNP',
  'Fortinet': 'FTN',
  'Huawei': 'HWY',
};
```

---

## 5. Product Status Lifecycle

```
draft ──────────► published ──────────► discontinued
  ▲                   │
  └───────────────────┘ (can revert to draft)
```

| Transition | Allowed | Condition |
|-----------|---------|-----------|
| `draft` → `published` | ✅ | Always |
| `published` → `draft` | ✅ | Always |
| `published` → `discontinued` | ✅ | Always |
| `discontinued` → `published` | ❌ | Not allowed |
| `discontinued` → `draft` | ❌ | Not allowed |

Enforce in route handler:

```typescript
if (
  currentProduct.status === 'discontinued' &&
  (body.status === 'published' || body.status === 'draft')
) {
  return NextResponse.json(
    { error: 'Discontinued products cannot be reactivated' },
    { status: 400 }
  );
}
```

---

## 6. Device Specs Schema

`specs` is stored as `JSON` / `Record<string, string>`. Recommended keys per category:

```typescript
// Router
{ ports: '5', speed: '1Gbps', wireless: 'No', cpu: '880MHz', ram: '256MB' }

// Switch
{ ports: '24', poe: 'Yes', managed: 'Yes', speed: '1Gbps', sfpSlots: '4' }

// Access Point
{ standard: 'WiFi 6', frequency: '2.4GHz/5GHz', mimo: '4x4', poe: '802.3af' }

// Firewall
{ throughput: '1Gbps', vpnTunnels: '100', ips: 'Yes', ports: '8' }

// SFP Module
{ type: 'LC', distance: '10km', wavelength: '1310nm', speed: '1Gbps' }
```

---

## 7. Utility Functions Location

All shared business logic utilities live in `/lib/utils/`:

```
lib/utils/
├── stock.ts        # calculateMargin, calculateInventoryValue, isLowStock
├── sku.ts          # generateSku, validateSkuFormat
├── format.ts       # formatCurrency (IDR), formatStock, formatDate
├── specs.ts        # getSpecsTemplate(category), mergeSpecs
```

```typescript
// lib/utils/format.ts

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatStock(count: number): string {
  if (count === 0) return 'Out of Stock';
  if (count <= 5) return `Low Stock (${count})`;
  return count.toString();
}
```

---

## 8. Checklist

- [ ] All `stockCount` modifications go through `/api/inventory/adjust` only
- [ ] Stock adjustments use `db.$transaction([...])` — never two separate queries
- [ ] `stockCount` rejected as input in product create/update route handlers
- [ ] Low-stock alerts compare `stockCount <= minStockLevel`
- [ ] Status lifecycle transitions are validated server-side
- [ ] Margin and inventory value are computed client-side from `price`/`costPrice` — not stored in DB
- [ ] Currency formatting uses `id-ID` locale with `IDR` currency
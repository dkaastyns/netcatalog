# Route Handlers Pattern — Netcatalog (Network Device Catalog)

AI Agent Instruction: Follow these patterns when creating or modifying Next.js App Router route handlers (`/app/api/**`) for the Netcatalog project.

---

## Overview

Route handlers are the backend API layer. They handle database queries, validation, business logic (e.g. stock constraint checks), and return consistent JSON responses. They live in `/app/api/` following Next.js App Router conventions.

---

## 1. File Structure

```
app/api/
├── products/
│   ├── route.ts                  # GET /api/products, POST /api/products
│   └── [id]/
│       └── route.ts              # GET /api/products/:id, PUT, DELETE
├── categories/
│   ├── route.ts
│   └── [id]/route.ts
├── brands/
│   ├── route.ts
│   └── [id]/route.ts
├── inventory/
│   ├── route.ts                  # GET /api/inventory (history)
│   └── adjust/
│       └── route.ts              # POST /api/inventory/adjust
├── stock-alerts/
│   └── route.ts                  # GET /api/stock-alerts
```

---

## 2. Response Conventions

All route handlers return `NextResponse.json()`. Use these status codes consistently:

| Scenario | Status Code |
|----------|-------------|
| Successful GET | 200 |
| Successful POST (created) | 201 |
| Successful PUT | 200 |
| Successful DELETE | 200 with `{ success: true }` |
| Validation error | 400 with `{ error: "message" }` |
| Not found | 404 with `{ error: "Not found" }` |
| Server/DB error | 500 with `{ error: "message" }` |

```typescript
// Success
return NextResponse.json(data, { status: 200 });

// Created
return NextResponse.json(data, { status: 201 });

// Validation error
return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 });

// Not found
return NextResponse.json({ error: 'Product not found' }, { status: 404 });

// Server error
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
```

---

## 3. GET Handler Pattern

```typescript
// app/api/products/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const brandId = searchParams.get('brandId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const lowStock = searchParams.get('lowStock') === 'true';

    const products = await db.product.findMany({
      where: {
        ...(categoryId && { categoryId: Number(categoryId) }),
        ...(brandId && { brandId: Number(brandId) }),
        ...(status && { status }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { partNumber: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(lowStock && { stockCount: { lte: db.raw('min_stock_level') } }),
      },
      include: { category: true, brand: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('[GET /api/products]', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
```

---

## 4. POST Handler Pattern

```typescript
// app/api/products/route.ts (continued)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate required fields
    if (!body.name || !body.sku || !body.price || !body.categoryId || !body.brandId) {
      return NextResponse.json(
        { error: 'name, sku, price, categoryId, and brandId are required' },
        { status: 400 }
      );
    }

    // 2. Business rule: price must be positive
    if (body.price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      );
    }

    // 3. Check SKU uniqueness
    const existing = await db.product.findUnique({ where: { sku: body.sku } });
    if (existing) {
      return NextResponse.json(
        { error: `SKU '${body.sku}' is already in use` },
        { status: 400 }
      );
    }

    // 4. Create product (stockCount starts at 0, managed by inventory)
    const product = await db.product.create({
      data: {
        name: body.name,
        slug: body.slug ?? body.name.toLowerCase().replace(/\s+/g, '-'),
        sku: body.sku,
        description: body.description ?? '',
        shortDescription: body.shortDescription ?? '',
        price: body.price,
        costPrice: body.costPrice ?? 0,
        stockCount: 0,              // ALWAYS starts at 0
        minStockLevel: body.minStockLevel ?? 5,
        status: body.status ?? 'draft',
        categoryId: body.categoryId,
        brandId: body.brandId,
        warrantyMonths: body.warrantyMonths ?? 0,
        partNumber: body.partNumber ?? '',
        specs: body.specs ?? {},
        imageUrls: body.imageUrls ?? [],
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('[POST /api/products]', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
```

---

## 5. Stock Adjustment Handler — Business Logic

```typescript
// app/api/inventory/adjust/route.ts

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity, type, referenceNo, notes } = body;

    // 1. Validate
    if (!productId || quantity === undefined || !type) {
      return NextResponse.json(
        { error: 'productId, quantity, and type are required' },
        { status: 400 }
      );
    }

    // 2. Fetch current stock
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const stockBefore = product.stockCount;
    const stockAfter = stockBefore + quantity;

    // 3. Business rule: stock cannot go negative
    if (stockAfter < 0) {
      return NextResponse.json(
        {
          error: `Insufficient stock. Current: ${stockBefore}, Requested deduction: ${Math.abs(quantity)}`,
        },
        { status: 400 }
      );
    }

    // 4. Transactional update: update stockCount + record movement
    const [movement] = await db.$transaction([
      db.stockMovement.create({
        data: {
          productId,
          type,
          quantity,
          stockBefore,
          stockAfter,
          referenceNo: referenceNo ?? '',
          notes: notes ?? '',
          createdBy: 'system', // replace with auth session user
        },
      }),
      db.product.update({
        where: { id: productId },
        data: { stockCount: stockAfter },
      }),
    ]);

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error('[POST /api/inventory/adjust]', error);
    return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 });
  }
}
```

---

## 6. Business Rules for Network Device Catalog

Enforce these in route handlers (not in the frontend):

| Rule | Where Enforced |
|------|---------------|
| `stockCount` always starts at 0 on product creation | POST `/api/products` |
| Stock cannot go below 0 | POST `/api/inventory/adjust` |
| SKU must be unique | POST `/api/products` |
| Price must be > 0 | POST & PUT `/api/products` |
| `costPrice` must be ≥ 0 | POST & PUT `/api/products` |
| Stock adjustments are transactional (movement + stockCount update atomically) | POST `/api/inventory/adjust` |
| Discontinued products cannot be adjusted | POST `/api/inventory/adjust` |

---

## 7. Checklist for New Route Handler

- [ ] Wraps body in `try/catch` with `console.error` logging
- [ ] Returns `{ error: "..." }` with correct HTTP status on failure
- [ ] Validates required fields and returns 400 for missing/invalid input
- [ ] Business rule violations return 400, not 500
- [ ] Stock adjustments use `db.$transaction([...])` — never update stockCount without recording a movement
- [ ] `stockCount` is never accepted as input in product create/update handlers
- [ ] `GET` handlers support relevant query string filters (`categoryId`, `brandId`, `search`, `lowStock`)
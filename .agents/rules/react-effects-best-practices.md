
# React Effects Best Practices

> **Core Principle:** Effects are an escape hatch from the React paradigm. They let you "step outside" of React and synchronize your components with some external system. If there is no external system involved, you shouldn't need an Effect.

## When NOT to Use Effects

### 1. Transforming Data for Rendering

**❌ Don't use Effects to derive values from props/state:**

```tsx
// BAD: Unnecessary Effect
function ProductCard({ product }) {
  const [statusBadge, setStatusBadge] = useState('');
  
  useEffect(() => {
    setStatusBadge(product.stockCount > 0 ? 'IN STOCK' : 'OUT OF STOCK');
  }, [product.stockCount]);
  
  return <span>{statusBadge}</span>;
}
```

**✅ Calculate during rendering:**

```tsx
// GOOD: Calculate during rendering
function ProductCard({ product }) {
  const statusBadge = product.stockCount > 0 ? 'IN STOCK' : 'OUT OF STOCK';
  
  return <span>{statusBadge}</span>;
}
```

### 2. Caching Expensive Calculations

**❌ Don't use Effects + state for caching:**

```tsx
// BAD: Effect for caching
function ProductList({ products, searchQuery }) {
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  useEffect(() => {
    setFilteredProducts(products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())));
  }, [products, searchQuery]);
  
  return <ul>{filteredProducts.map(...)}</ul>;
}
```

**✅ Use `useMemo` for expensive calculations:**

```tsx
// GOOD: useMemo for expensive operations
function ProductList({ products, searchQuery }) {
  const filteredProducts = useMemo(
    () => products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [products, searchQuery]
  );
  
  return <ul>{filteredProducts.map(...)}</ul>;
}
```

**Note:** In this codebase, we use TanStack Query for server state, so data fetching doesn't need useMemo.

### 3. Resetting State When Props Change

**❌ Don't reset state in Effects:**

```tsx
// BAD: Resetting state in Effect
function EditProductForm({ product }) {
  const [price, setPrice] = useState(product.price);
  
  useEffect(() => {
    setPrice(product.price);
  }, [product.id]);
  
  return <input type="number" value={price} onChange={...} />;
}
```

**✅ Use the `key` prop to reset state:**

```tsx
// GOOD: Use key to reset component state
function ProductEditor({ product }) {
  return (
    <EditProductForm 
      key={product.id} 
      product={product} 
    />
  );
}

function EditProductForm({ product }) {
  const [price, setPrice] = useState(product.price);
  // State resets automatically when product.id changes in the parent component
  
  return <input type="number" value={price} onChange={...} />;
}
```

### 4. Handling User Events

**❌ Don't put event logic in Effects:**

```tsx
// BAD: Event logic in Effect
function AdjustStockButton({ onAdjust }) {
  const [isAdjusting, setIsAdjusting] = useState(false);
  
  useEffect(() => {
    if (isAdjusting) {
      onAdjust().then(() => {
        showNotification('Stock updated successfully!');
        setIsAdjusting(false);
      });
    }
  }, [isAdjusting, onAdjust]);
  
  return <button onClick={() => setIsAdjusting(true)}>Update Stock</button>;
}
```

**✅ Handle events in event handlers:**

```tsx
// GOOD: Event logic in event handler
function AdjustStockButton({ onAdjust }) {
  const [isAdjusting, setIsAdjusting] = useState(false);
  
  const handleClick = async () => {
    setIsAdjusting(true);
    try {
      await onAdjust();
      showNotification('Stock updated successfully!');
    } finally {
      setIsAdjusting(false);
    }
  };
  
  return (
    <button onClick={handleClick} disabled={isAdjusting}>
      Update Stock
    </button>
  );
}
```

### 5. Notifying Parent About State Changes

**❌ Don't sync state to parent in Effects:**

```tsx
// BAD: Notifying parent in Effect
function CategorySelect({ categories, onSelectionChange }) {
  const [selectedId, setSelectedId] = useState(null);
  
  useEffect(() => {
    const category = categories.find(c => c.id === selectedId);
    onSelectionChange(category);
  }, [selectedId, categories, onSelectionChange]);
  
  return <select onChange={e => setSelectedId(e.target.value)}>...</select>;
}
```

**✅ Update both in event handler:**

```tsx
// GOOD: Update both states in event handler
function CategorySelect({ categories, onSelectionChange }) {
  const handleChange = (e) => {
    const categoryId = e.target.value;
    const category = categories.find(c => c.id === categoryId);
    onSelectionChange(category);
  };
  
  return <select onChange={handleChange}>...</select>;
}
```

Or better, lift state up:

```tsx
// BEST: Lift state up
function CategorySelect({ categories, selectedId, onChange }) {
  return (
    <select value={selectedId} onChange={e => onChange(e.target.value)}>
      {categories.map(category => (
        <option key={category.id} value={category.id}>{category.name}</option>
      ))}
    </select>
  );
}
```

### 6. Chains of Computations

**❌ Don't chain Effects that set state:**

```tsx
// BAD: Chain of Effects
function DashboardLowStockAlert() {
  const [products, setProducts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [hasAlert, setHasAlert] = useState(false);
  
  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);
  
  useEffect(() => {
    const lowStock = products.filter(p => p.stockCount <= 5);
    setLowStockItems(lowStock);
  }, [products]);
  
  useEffect(() => {
    setHasAlert(lowStockItems.length > 0);
  }, [lowStockItems]);
  
  useEffect(() => {
    if (hasAlert) {
      notifyAdmin('Action required: Low stock items detected!');
    }
  }, [hasAlert]);
}
```

**✅ Calculate everything during rendering or in event handlers:**

```tsx
// GOOD: Calculate during rendering
function DashboardLowStockAlert() {
  const { data: products = [] } = useProducts();
  
  const lowStockItems = useMemo(() => {
    return products.filter(p => p.stockCount <= 5);
  }, [products]);
  
  const hasAlert = lowStockItems.length > 0;
  
  // For side effects like notifications, use useEffect only for external sync
  useEffect(() => {
    if (hasAlert) {
      notifyAdmin('Action required: Low stock items detected!');
    }
  }, [hasAlert]);
  
  if (!hasAlert) return null;
  return <AlertBanner items={lowStockItems} />;
}
```

## When to ACTUALLY Use Effects

Effects are for synchronizing with external systems:

### 1. Connecting to External APIs

```tsx
// GOOD: Effect for browser API
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    
    function handleOffline() {
      setIsOnline(false);
    }
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
}
```

### 2. Syncing with Non-React Widgets

```tsx
// GOOD: Effect for external widget
function AdminSalesChart({ data }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Initialize external chart library (e.g., Chart.js)
    chartInstance.current = new ExternalChartLibrary(chartRef.current);
    
    return () => {
      chartInstance.current?.destroy();
    };
  }, []);
  
  useEffect(() => {
    chartInstance.current?.update(data);
  }, [data]);
  
  return <div ref={chartRef} />;
}
```

### 3. Analytics (Component Display)

```tsx
// GOOD: Effect for analytics
function ProductDetailPage({ productId }) {
  useEffect(() => {
    analytics.track('Product Viewed', { productId });
  }, [productId]);
  
  return <ProductDetails id={productId} />;
}
```

## In This Codebase

### Don't Use Effects For:

1. **Data fetching** - Use TanStack Query hooks (`useProducts`, `useCategories`, `useInventory`, etc.)
2. **Form submissions** - Handle in `onSubmit` event handlers
3. **Cache invalidation** - Let TanStack Query handle it
4. **Derived state** - Calculate during rendering (like total stock value)
5. **Prop change resets** - Use `key` prop

### Use Effects For:

1. **Browser API subscriptions** - `window` events, `document` listeners
2. **External library integration** - Advanced charts on the dashboard
3. **Analytics tracking** - When a product page mounts/updates
4. **Manual DOM manipulation** - When necessary (rare in this codebase)

## Decision Tree

```text
Do you need to synchronize with an external system?
├── No → Don't use an Effect
│   ├── Is it derived data? → Calculate during rendering
│   ├── Is it expensive? → Use useMemo
│   ├── Is it from user events? → Use event handlers
│   └── Is it resetting state? → Use key prop
└── Yes → Use an Effect
    ├── Browser API? → useEffect with cleanup
    ├── Non-React widget? → useEffect with ref
    └── Analytics? → useEffect
```

## Common Mistakes in This Codebase

### ❌ Fetching Data in Effects

```tsx
// DON'T DO THIS - We have TanStack Query
function BadComponent() {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(setProducts);
  }, []);
  
  return <ProductGrid products={products} />;
}

// DO THIS INSTEAD
function GoodComponent() {
  const { data: products } = useProducts();
  return <ProductGrid products={products} />;
}
```

### ❌ Setting State from Props in Effects

```tsx
// DON'T DO THIS
function BadForm({ category }) {
  const [name, setName] = useState('');
  
  useEffect(() => {
    setName(category.name);
  }, [category]);
}

// DO THIS INSTEAD
function GoodForm({ category }) {
  const [name, setName] = useState(category.name);
  // Use key={category.id} on the parent component calling this form
}
```

### ❌ Notification Logic in Effects

```tsx
// DON'T DO THIS
function BadButton() {
  const [isSuccess, setIsSuccess] = useState(false);
  
  useEffect(() => {
    if (isSuccess) {
      toast.success('Product created!');
      setIsSuccess(false);
    }
  }, [isSuccess]);
  
  const handleClick = () => {
    createProduct().then(() => setIsSuccess(true));
  };
}

// DO THIS INSTEAD
function GoodButton() {
  const handleClick = async () => {
    await createProduct();
    toast.success('Product created!');
  };
}
```

## Summary

| Scenario | Solution |
|----------|----------|
| Derived data | Calculate in render |
| Expensive calculation | `useMemo` |
| Reset state on prop change | `key` prop |
| User events | Event handlers |
| External system sync | `useEffect` |
| Data fetching | TanStack Query |
| Analytics | `useEffect` (mount only) |

## Resources

- [React Docs: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [React Docs: Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
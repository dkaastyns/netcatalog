// ============================================================
// Netcatalog — TanStack Query Key Factory
// Centralized query keys for granular cache invalidation
// ============================================================

export const queryKeys = {
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.products.details(), id] as const,
    bySlug: (slug: string) =>
      [...queryKeys.products.all, "slug", slug] as const,
  },

  categories: {
    all: ["categories"] as const,
    lists: () => [...queryKeys.categories.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.categories.lists(), filters] as const,
    details: () => [...queryKeys.categories.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.categories.details(), id] as const,
  },

  inventory: {
    all: ["inventory"] as const,
    lists: () => [...queryKeys.inventory.all, "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.inventory.lists(), filters] as const,
    byProduct: (productId: number) =>
      [...queryKeys.inventory.all, "product", productId] as const,
  },
} as const;

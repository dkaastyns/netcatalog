"use client";

// ============================================================
// Netcatalog — Products React Query Hooks
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/api/products";
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductWithStock,
  PaginatedResponse,
} from "@/types";

/** Fetch paginated products with stock counts */
export function useProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: number;
}) {
  return useQuery<PaginatedResponse<ProductWithStock>>({
    queryKey: queryKeys.products.list(params),
    queryFn: () => getProducts(params),
  });
}

/** Fetch a single product by ID */
export function useProduct(id: number) {
  return useQuery<ProductWithStock>({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => getProductById(id),
    enabled: !!id,
  });
}

/** Create product mutation */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

/** Update product mutation */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProductInput) => updateProduct(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(variables.id),
      });
    },
  });
}

/** Delete product mutation */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
    },
  });
}

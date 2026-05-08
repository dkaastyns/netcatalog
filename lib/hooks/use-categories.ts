"use client";

// ============================================================
// Netcatalog — Categories React Query Hooks
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/api/categories";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/types";

/** Fetch all categories */
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: queryKeys.categories.lists(),
    queryFn: () => getCategories(),
  });
}

/** Fetch a single category by ID */
export function useCategory(id: number) {
  return useQuery<Category>({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => getCategoryById(id),
    enabled: !!id,
  });
}

/** Create category mutation */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

/** Update category mutation */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCategoryInput) => updateCategory(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.detail(variables.id),
      });
    },
  });
}

/** Delete category mutation */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

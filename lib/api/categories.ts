// ============================================================
// Netcatalog — Categories API Layer (Client-Side)
// ============================================================

import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/types";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

const BASE_URL = "/api/categories";

/** Fetch all categories */
export async function getCategories(): Promise<Category[]> {
  const response = await fetch(BASE_URL);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch categories");
  }
  const result = await response.json();
  return result.data;
}

/** Fetch a single category by ID */
export async function getCategoryById(id: number): Promise<Category> {
  const response = await fetch(`${BASE_URL}/${id}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch category");
  }
  const result = await response.json();
  return result.data;
}

/** Create a new category */
export async function createCategory(
  input: CreateCategoryInput
): Promise<Category> {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to create category");
  }
  const result = await response.json();

  const queryClient = getQueryClient();
  queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });

  return result.data;
}

/** Update an existing category */
export async function updateCategory(
  input: UpdateCategoryInput
): Promise<Category> {
  const { id, ...body } = input;
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update category");
  }
  const result = await response.json();

  const queryClient = getQueryClient();
  queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });

  return result.data;
}

/** Delete a category */
export async function deleteCategory(id: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete category");
  }

  const queryClient = getQueryClient();
  queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
}

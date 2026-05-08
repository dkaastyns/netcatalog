// ============================================================
// Netcatalog — Products API Layer (Client-Side)
// Uses fetch → Next.js API Routes → Supabase
// ============================================================

import type {
  ProductWithStock,
  CreateProductInput,
  UpdateProductInput,
  PaginatedResponse,
} from "@/types";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

const BASE_URL = "/api/products";

/** Fetch all products with stock count & category name */
export async function getProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: number;
}): Promise<PaginatedResponse<ProductWithStock>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.categoryId)
    searchParams.set("categoryId", String(params.categoryId));

  const url = searchParams.toString()
    ? `${BASE_URL}?${searchParams.toString()}`
    : BASE_URL;

  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch products");
  }
  return response.json();
}

/** Fetch a single product by ID */
export async function getProductById(
  id: number
): Promise<ProductWithStock> {
  const response = await fetch(`${BASE_URL}/${id}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch product");
  }
  const result = await response.json();
  return result.data;
}

/** Create a new product */
export async function createProduct(
  input: CreateProductInput
): Promise<ProductWithStock> {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to create product");
  }
  const result = await response.json();

  // Invalidate product lists so UI refreshes
  const queryClient = getQueryClient();
  queryClient.invalidateQueries({ queryKey: queryKeys.products.all });

  return result.data;
}

/** Update an existing product */
export async function updateProduct(
  input: UpdateProductInput
): Promise<ProductWithStock> {
  const { id, ...body } = input;
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update product");
  }
  const result = await response.json();

  const queryClient = getQueryClient();
  queryClient.invalidateQueries({ queryKey: queryKeys.products.all });

  return result.data;
}

/** Delete a product */
export async function deleteProduct(id: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete product");
  }

  const queryClient = getQueryClient();
  queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
}

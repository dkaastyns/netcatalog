// ============================================================
// Netcatalog — Inventory API Layer (Client-Side)
// ============================================================

import type {
  InventoryMovementWithDetails,
  AdjustStockInput,
} from "@/types";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

const BASE_URL = "/api/inventory";

/** Fetch inventory movements, optionally filtered by productId */
export async function getInventoryMovements(
  productId?: number
): Promise<InventoryMovementWithDetails[]> {
  const url = productId
    ? `${BASE_URL}?productId=${productId}`
    : BASE_URL;

  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch inventory movements");
  }
  const result = await response.json();
  return result.data;
}

/** Adjust stock — create an inventory movement */
export async function adjustStock(
  input: AdjustStockInput
): Promise<InventoryMovementWithDetails> {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to adjust stock");
  }
  const result = await response.json();

  // Invalidate both inventory history AND products list so stockCount updates
  const queryClient = getQueryClient();
  queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.products.all });

  return result.data;
}

"use client";

// ============================================================
// Netcatalog — Inventory React Query Hooks
// ============================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  getInventoryMovements,
  adjustStock,
} from "@/lib/api/inventory";
import type {
  InventoryMovementWithDetails,
  AdjustStockInput,
} from "@/types";

/** Fetch all inventory movements */
export function useInventoryMovements(productId?: number) {
  return useQuery<InventoryMovementWithDetails[]>({
    queryKey: productId
      ? queryKeys.inventory.byProduct(productId)
      : queryKeys.inventory.lists(),
    queryFn: () => getInventoryMovements(productId),
  });
}

/** Adjust stock mutation — invalidates both inventory AND products */
export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AdjustStockInput) => adjustStock(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(variables.productId),
      });
    },
  });
}

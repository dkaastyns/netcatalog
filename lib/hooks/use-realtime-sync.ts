"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

export function useRealtimeSync() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to changes on the inventory_movements and products tables
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory_movements" },
        () => {
          // Invalidate client-side cache
          queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
          // Refresh server components
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, queryClient]);
}

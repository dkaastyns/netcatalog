// ============================================================
// Netcatalog — TypeScript Type Definitions
// Maps directly to the Supabase PostgreSQL schema
// ============================================================

// ── Auth / User Types ──────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: "admin" | "user";
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  expiresAt: string;
  token: string;
  createdAt: string;
  updatedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string;
}

export interface Account {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  scope: string | null;
  password: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Category Types ─────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateCategoryInput {
  id: number;
  name?: string;
  slug?: string;
  description?: string;
}

// ── Product Types ──────────────────────────────────────────

export type ProductStatus = "draft" | "published" | "archived";

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  status: ProductStatus;
  categoryId: number | null;
  image: string | null;
  createdBy: string | null;
  formFactor: string | null;
  connectivity: string | null;
  management: string | null;
  warranty: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Product with dynamically calculated stock from inventory_movements */
export interface ProductWithStock extends Product {
  categoryName: string | null;
  categorySlug: string | null;
  stockCount: number; // Derived from SUM(inventory_movements.quantity)
}

export interface CreateProductInput {
  name: string;
  slug: string;
  description?: string;
  price: number;
  status?: ProductStatus;
  categoryId?: number;
  image?: string;
  formFactor?: string;
  connectivity?: string;
  management?: string;
  warranty?: string;
}

export interface UpdateProductInput {
  id: number;
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  status?: ProductStatus;
  categoryId?: number | null;
}

// ── Inventory Movement Types ───────────────────────────────

export type MovementType = "in" | "out" | "opname";

export interface InventoryMovement {
  id: number;
  productId: number;
  quantity: number;
  type: MovementType;
  notes: string | null;
  userId: string;
  createdAt: string;
}

/** Inventory movement with joined user & product names */
export interface InventoryMovementWithDetails extends InventoryMovement {
  productName: string;
  userName: string;
}

export interface AdjustStockInput {
  productId: number;
  quantity: number;
  type: MovementType;
  notes?: string;
}

// ── API Response Types ─────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
}

// ── Pagination ─────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}
// ── Order / Checkout Types ────────────────────────────────
export type OrderStatus =
  | "pending"    // Menunggu Pembayaran
  | "preparing"  // Pesanan Disiapkan
  | "packing"    // Di Packing
  | "shipped"    // Dihantar
  | "out_for_delivery" // Menuju Alamat
  | "delivered"  // Sampai
  | "completed"  // Selesai
  | "cancelled"; // Dibatalkan

export interface Order {
  id: number;
  productId: number;
  userId: string | null;
  quantity: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  companyName: string | null;
  customerAddress: string | null;
  notes: string | null;
  status: OrderStatus;
  paymentProof: string | null;
  isReadByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  createdAt: string;
}

export interface OrderWithDetails extends Order {
  productName: string | null;
  itemCount: number;
  items?: OrderItem[];
}

export interface CreateOrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  notes?: string;
  paymentProof?: string;
  items: {
    id: number;
    quantity: number;
    price: number;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

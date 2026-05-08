// ============================================================
// Netcatalog — API Barrel Export
// ============================================================

export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./products";

export {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./categories";

export {
  getInventoryMovements,
  adjustStock,
} from "./inventory";

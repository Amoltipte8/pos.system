import { pgTable, text, serial, integer, boolean, timestamp, decimal, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("cashier"), // admin, cashier
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  barcode: text("barcode").unique(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(5),
  categoryId: integer("category_id").references(() => categories.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Sales table
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  transactionId: text("transaction_id").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, card, upi
  status: text("status").notNull().default("completed"), // completed, cancelled, refunded
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Sale items table
export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

// Stock movements table for inventory tracking
export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  type: text("type").notNull(), // in, out, adjustment
  quantity: integer("quantity").notNull(),
  reason: text("reason").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sales: many(sales),
  stockMovements: many(stockMovements),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  saleItems: many(saleItems),
  stockMovements: many(stockMovements),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  sales: many(sales),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, {
    fields: [stockMovements.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [stockMovements.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  description: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  barcode: true,
  price: true,
  cost: true,
  stock: true,
  minStock: true,
  categoryId: true,
  isActive: true,
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
  name: true,
  email: true,
  phone: true,
  address: true,
});

export const insertSaleSchema = createInsertSchema(sales).pick({
  transactionId: true,
  customerId: true,
  userId: true,
  subtotal: true,
  tax: true,
  discount: true,
  total: true,
  paymentMethod: true,
  status: true,
});

export const insertSaleItemSchema = createInsertSchema(saleItems).pick({
  saleId: true,
  productId: true,
  quantity: true,
  unitPrice: true,
  total: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).pick({
  productId: true,
  type: true,
  quantity: true,
  reason: true,
  userId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;

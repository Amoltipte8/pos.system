import { 
  users, products, categories, customers, sales, saleItems, stockMovements,
  type User, type InsertUser, type Product, type InsertProduct, 
  type Category, type InsertCategory, type Customer, type InsertCustomer,
  type Sale, type InsertSale, type SaleItem, type InsertSaleItem,
  type StockMovement, type InsertStockMovement
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Category methods
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Product methods
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  getLowStockProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Customer methods
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;

  // Sale methods
  getSales(limit?: number): Promise<Sale[]>;
  getSale(id: number): Promise<Sale | undefined>;
  getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;
  updateSale(id: number, sale: Partial<InsertSale>): Promise<Sale | undefined>;

  // Sale item methods
  getSaleItems(saleId: number): Promise<SaleItem[]>;
  createSaleItem(saleItem: InsertSaleItem): Promise<SaleItem>;

  // Stock movement methods
  getStockMovements(productId?: number): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;

  // Analytics methods
  getDailySalesStats(date: Date): Promise<{
    totalSales: number;
    totalTransactions: number;
    totalProductsSold: number;
  }>;

  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount > 0;
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(products.name);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.barcode, barcode));
    return product || undefined;
  }

  async getLowStockProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(sql`${products.stock} <= ${products.minStock}`)
      .orderBy(products.stock);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount > 0;
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(customers.name);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return result.rowCount > 0;
  }

  // Sale methods
  async getSales(limit: number = 50): Promise<Sale[]> {
    return await db
      .select()
      .from(sales)
      .orderBy(desc(sales.createdAt))
      .limit(limit);
  }

  async getSale(id: number): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale || undefined;
  }

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    return await db
      .select()
      .from(sales)
      .where(and(
        gte(sales.createdAt, startDate),
        lte(sales.createdAt, endDate)
      ))
      .orderBy(desc(sales.createdAt));
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    const [newSale] = await db
      .insert(sales)
      .values(sale)
      .returning();
    return newSale;
  }

  async updateSale(id: number, sale: Partial<InsertSale>): Promise<Sale | undefined> {
    const [updated] = await db
      .update(sales)
      .set(sale)
      .where(eq(sales.id, id))
      .returning();
    return updated || undefined;
  }

  // Sale item methods
  async getSaleItems(saleId: number): Promise<SaleItem[]> {
    return await db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, saleId));
  }

  async createSaleItem(saleItem: InsertSaleItem): Promise<SaleItem> {
    const [newSaleItem] = await db
      .insert(saleItems)
      .values(saleItem)
      .returning();
    return newSaleItem;
  }

  // Stock movement methods
  async getStockMovements(productId?: number): Promise<StockMovement[]> {
    if (productId) {
      return await db
        .select()
        .from(stockMovements)
        .where(eq(stockMovements.productId, productId))
        .orderBy(desc(stockMovements.createdAt));
    }
    return await db
      .select()
      .from(stockMovements)
      .orderBy(desc(stockMovements.createdAt))
      .limit(100);
  }

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    const [newMovement] = await db
      .insert(stockMovements)
      .values(movement)
      .returning();
    return newMovement;
  }

  // Analytics methods
  async getDailySalesStats(date: Date): Promise<{
    totalSales: number;
    totalTransactions: number;
    totalProductsSold: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [salesStats] = await db
      .select({
        totalSales: sql<number>`COALESCE(SUM(${sales.total}), 0)`,
        totalTransactions: sql<number>`COUNT(*)`,
      })
      .from(sales)
      .where(and(
        gte(sales.createdAt, startOfDay),
        lte(sales.createdAt, endOfDay),
        eq(sales.status, 'completed')
      ));

    const [productsStats] = await db
      .select({
        totalProductsSold: sql<number>`COALESCE(SUM(${saleItems.quantity}), 0)`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(and(
        gte(sales.createdAt, startOfDay),
        lte(sales.createdAt, endOfDay),
        eq(sales.status, 'completed')
      ));

    return {
      totalSales: Number(salesStats.totalSales),
      totalTransactions: Number(salesStats.totalTransactions),
      totalProductsSold: Number(productsStats.totalProductsSold),
    };
  }
}

export const storage = new DatabaseStorage();

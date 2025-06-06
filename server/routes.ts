import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertProductSchema, insertCategorySchema, insertCustomerSchema,
  insertSaleSchema, insertSaleItemSchema, insertStockMovementSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Categories routes
  app.get("/api/categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  app.put("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, validatedData);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update category" });
      }
    }
  });

  app.delete("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCategory(id);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Products routes
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/low-stock", requireAuth, async (req, res) => {
    try {
      const products = await storage.getLowStockProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock products" });
    }
  });

  app.get("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get("/api/products/barcode/:barcode", requireAuth, async (req, res) => {
    try {
      const barcode = req.params.barcode;
      const product = await storage.getProductByBarcode(barcode);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create product" });
      }
    }
  });

  app.put("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, validatedData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update product" });
      }
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProduct(id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Customers routes
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create customer" });
      }
    }
  });

  app.put("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(id, validatedData);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update customer" });
      }
    }
  });

  app.delete("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCustomer(id);
      if (!deleted) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Sales routes
  app.get("/api/sales", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const sales = await storage.getSales(limit);
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.get("/api/sales/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      const items = await storage.getSaleItems(id);
      res.json({ ...sale, items });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sale" });
    }
  });

  app.post("/api/sales", requireAuth, async (req, res) => {
    try {
      const { items, ...saleData } = req.body;
      
      // Validate sale data
      const validatedSale = insertSaleSchema.parse({
        ...saleData,
        userId: req.user.id,
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });

      // Create the sale
      const sale = await storage.createSale(validatedSale);

      // Create sale items and update stock
      for (const item of items) {
        const validatedItem = insertSaleItemSchema.parse({
          ...item,
          saleId: sale.id
        });
        await storage.createSaleItem(validatedItem);

        // Update product stock
        const product = await storage.getProduct(item.productId);
        if (product) {
          await storage.updateProduct(item.productId, {
            stock: product.stock - item.quantity
          });

          // Create stock movement record
          await storage.createStockMovement({
            productId: item.productId,
            type: 'out',
            quantity: -item.quantity,
            reason: `Sale ${sale.transactionId}`,
            userId: req.user.id
          });
        }
      }

      const items_created = await storage.getSaleItems(sale.id);
      res.status(201).json({ ...sale, items: items_created });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create sale" });
      }
    }
  });

  // Stock movements routes
  app.get("/api/stock-movements", requireAuth, async (req, res) => {
    try {
      const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
      const movements = await storage.getStockMovements(productId);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stock movements" });
    }
  });

  app.post("/api/stock-movements", requireAuth, async (req, res) => {
    try {
      const validatedData = insertStockMovementSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const movement = await storage.createStockMovement(validatedData);
      
      // Update product stock
      const product = await storage.getProduct(movement.productId);
      if (product) {
        const newStock = movement.type === 'in' 
          ? product.stock + movement.quantity 
          : product.stock + movement.quantity; // quantity is already negative for 'out'
        
        await storage.updateProduct(movement.productId, { stock: newStock });
      }
      
      res.status(201).json(movement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create stock movement" });
      }
    }
  });

  // Analytics routes
  app.get("/api/analytics/daily-stats", requireAuth, async (req, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const stats = await storage.getDailySalesStats(date);
      const lowStockProducts = await storage.getLowStockProducts();
      
      res.json({
        ...stats,
        lowStockCount: lowStockProducts.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

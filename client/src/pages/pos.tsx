import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout";
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Smartphone, 
  Percent, Receipt, UserPlus, ScanLine, Settings, Clock, 
  TrendingUp, X, Edit, Save, Printer, RefreshCw, DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface CartItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  total: number;
}

export default function POS() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage");
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [quickAddDialogOpen, setQuickAddDialogOpen] = useState(false);
  const [holdSales, setHoldSales] = useState<{ id: string; cart: CartItem[]; customer: string }[]>([]);
  const [activeTab, setActiveTab] = useState("sale1");
  const [tabs, setTabs] = useState([{ id: "sale1", name: "Sale 1", cart: [], customer: "" }]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isBarcodeScanMode, setIsBarcodeScanMode] = useState(false);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const createSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const res = await apiRequest("POST", "/api/sales", saleData);
      return await res.json();
    },
    onSuccess: () => {
      setCart([]);
      setSelectedCustomer("");
      setDiscount(0);
      setAmountReceived("");
      toast({
        title: "Sale completed",
        description: "Sale has been processed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Sale failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredProducts = (products || []).filter((product: any) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm)
  );

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const price = parseFloat(product.price);
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        total: price
      }]);
    }
  };

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCart(cart.map(item => {
      if (item.id === id) {
        const price = parseFloat(item.price);
        return {
          ...item,
          quantity: newQuantity,
          total: price * newQuantity
        };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Advanced calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = discountType === "percentage" 
    ? (subtotal * discount) / 100 
    : discount;
  const afterDiscount = subtotal - discountAmount;
  const tax = afterDiscount * 0.1; // 10% tax
  const total = afterDiscount + tax;
  const changeAmount = parseFloat(amountReceived) - total;

  // Barcode scanner
  const handleBarcodeSearch = async (barcode: string) => {
    if (!barcode.trim()) return;
    
    const product = filteredProducts.find((p: any) => p.barcode === barcode);
    if (product) {
      addToCart(product);
      setBarcodeInput("");
      toast({
        title: "Product added",
        description: `${product.name} added to cart`,
      });
    } else {
      toast({
        title: "Product not found",
        description: "No product found with this barcode",
        variant: "destructive",
      });
    }
  };

  // Quick actions
  const clearCart = () => {
    setCart([]);
    setSelectedCustomer("");
    setDiscount(0);
    setAmountReceived("");
  };

  const holdSale = () => {
    if (cart.length === 0) return;
    
    const saleId = `hold-${Date.now()}`;
    setHoldSales([...holdSales, {
      id: saleId,
      cart: [...cart],
      customer: selectedCustomer
    }]);
    clearCart();
    toast({
      title: "Sale held",
      description: "Sale has been placed on hold",
    });
  };

  const retrieveHeldSale = (heldSale: any) => {
    setCart(heldSale.cart);
    setSelectedCustomer(heldSale.customer);
    setHoldSales(holdSales.filter(h => h.id !== heldSale.id));
    toast({
      title: "Sale retrieved",
      description: "Held sale has been retrieved",
    });
  };



  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    const saleData = {
      customerId: selectedCustomer && selectedCustomer !== "walk-in" ? parseInt(selectedCustomer) : null,
      subtotal: subtotal.toString(),
      tax: tax.toString(),
      discount: discountAmount.toString(),
      total: total.toString(),
      paymentMethod,
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.total.toString()
      }))
    };

    createSaleMutation.mutate(saleData);
  };

  return (
    <Layout>
      <div className="space-y-4">
        {/* Advanced POS Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Point of Sale</h1>
              <p className="text-blue-100">Terminal ID: POS-001 • {new Date().toLocaleDateString()}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="secondary" 
                onClick={() => setIsBarcodeScanMode(!isBarcodeScanMode)}
                className={isBarcodeScanMode ? "bg-green-100 text-green-800" : ""}
              >
                <ScanLine className="mr-2 h-4 w-4" />
                {isBarcodeScanMode ? "Scan Mode ON" : "Scan Mode OFF"}
              </Button>
            </div>
          </div>
        </div>



        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Barcode Scanner */}
            {isBarcodeScanMode && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <ScanLine className="h-5 w-5 text-green-600" />
                    <Input
                      placeholder="Scan or enter barcode..."
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleBarcodeSearch(barcodeInput);
                        }
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    <Button 
                      onClick={() => handleBarcodeSearch(barcodeInput)}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search and Categories */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Products</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Dialog open={quickAddDialogOpen} onOpenChange={setQuickAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Quick Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Quick Add Product</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input placeholder="Product name" />
                          <Input placeholder="Price" type="number" />
                          <Button className="w-full">Add to Cart</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products, barcode, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                    <p>Loading products...</p>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                    {filteredProducts.map((product: any) => (
                      <Card
                        key={product.id}
                        className="cursor-pointer hover:shadow-md transition-all hover:scale-105 border-2 hover:border-blue-200"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-3">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                              <span className="text-xl">📦</span>
                            </div>
                            <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                            <p className="text-xs text-gray-500 mb-2">Stock: {product.stock}</p>
                            <div className="space-y-1">
                              <div className="text-lg font-bold text-green-600">
                                ₹{parseFloat(product.price).toLocaleString('en-IN')}
                              </div>
                              <Button size="sm" className="w-full h-8 text-xs">
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>{searchTerm ? "No products found" : "No products available"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Advanced Cart Section */}
          <div className="space-y-4">
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Cart ({cart.length} items)
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={holdSale}
                      disabled={cart.length === 0}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Hold
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCart}
                      disabled={cart.length === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {cart.length > 0 ? (
                  <div className="space-y-1 max-h-80 overflow-y-auto px-6">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                          <p className="text-sm text-gray-500">₹{item.price} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center space-x-1 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-medium w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.id)}
                            className="h-6 w-6 p-0 ml-1 hover:bg-red-100 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="ml-2 font-bold text-green-600 min-w-0">
                          ₹{item.total.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 px-6">
                    <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Cart is empty</p>
                    <p className="text-sm">Add products to start a sale</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                    {(customers || []).map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Discount Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Percent className="mr-2 h-5 w-5" />
                  Discount
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex space-x-2">
                  <Select value={discountType} onValueChange={(value: "percentage" | "amount") => setDiscountType(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">%</SelectItem>
                      <SelectItem value="amount">₹</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="0"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="flex-1"
                  />
                </div>
                {discount > 0 && (
                  <p className="text-sm text-green-600">
                    Discount: ₹{discountAmount.toLocaleString('en-IN')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Calculation Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount:</span>
                      <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Tax (10%):</span>
                    <span>₹{tax.toLocaleString('en-IN')}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={paymentMethod === "cash" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentMethod("cash")}
                      className="flex flex-col items-center p-3 h-auto"
                    >
                      <Banknote className="h-4 w-4 mb-1" />
                      <span className="text-xs">Cash</span>
                    </Button>
                    <Button
                      variant={paymentMethod === "card" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentMethod("card")}
                      className="flex flex-col items-center p-3 h-auto"
                    >
                      <CreditCard className="h-4 w-4 mb-1" />
                      <span className="text-xs">Card</span>
                    </Button>
                    <Button
                      variant={paymentMethod === "upi" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentMethod("upi")}
                      className="flex flex-col items-center p-3 h-auto"
                    >
                      <Smartphone className="h-4 w-4 mb-1" />
                      <span className="text-xs">UPI</span>
                    </Button>
                  </div>
                </div>

                {paymentMethod === "cash" && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Amount Received</label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setAmountReceived(total.toString())}
                      >
                        Exact
                      </Button>
                    </div>
                    {amountReceived && parseFloat(amountReceived) >= total && (
                      <p className="text-sm text-green-600 mt-2">
                        Change: ₹{changeAmount.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Button 
                    className="w-full h-12 text-lg font-bold"
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || createSaleMutation.isPending}
                  >
                    <Receipt className="mr-2 h-5 w-5" />
                    {createSaleMutation.isPending ? "Processing..." : `Pay ₹${total.toLocaleString('en-IN')}`}
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                    <Button variant="outline" size="sm">
                      <Save className="mr-2 h-4 w-4" />
                      Quote
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Held Sales */}
            {holdSales.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Clock className="mr-2 h-5 w-5" />
                    Held Sales ({holdSales.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {holdSales.map((heldSale) => (
                      <div key={heldSale.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">{heldSale.cart.length} items</p>
                          <p className="text-xs text-gray-500">{heldSale.customer || "Walk-in"}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => retrieveHeldSale(heldSale)}
                        >
                          Retrieve
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout";
import { 
  DollarSign, 
  Receipt, 
  Package, 
  AlertTriangle,
  ShoppingCart,
  Plus,
  TrendingUp,
  ArrowUp
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: dailyStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/daily-stats"],
  });

  const { data: recentSales, isLoading: salesLoading } = useQuery({
    queryKey: ["/api/sales?limit=10"],
  });

  const { data: lowStockProducts, isLoading: lowStockLoading } = useQuery({
    queryKey: ["/api/products/low-stock"],
  });

  const statsCards = [
    {
      title: "Today's Sales",
      value: `₹${dailyStats?.totalSales?.toLocaleString('en-IN') || '0'}`,
      change: "+12.5% from yesterday",
      icon: DollarSign,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Transactions",
      value: dailyStats?.totalTransactions?.toString() || '0',
      change: "+8.2% from yesterday",
      icon: Receipt,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Products Sold",
      value: dailyStats?.totalProductsSold?.toString() || '0',
      change: "+15.3% from yesterday",
      icon: Package,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      title: "Low Stock Items",
      value: dailyStats?.lowStockCount?.toString() || '0',
      change: "Needs attention",
      icon: AlertTriangle,
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
    },
  ];

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPaymentBadgeColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'card': return 'bg-green-100 text-green-800';
      case 'cash': return 'bg-blue-100 text-blue-800';
      case 'upi': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                    <p className={`text-sm mt-1 ${card.title === 'Low Stock Items' ? 'text-orange-600' : 'text-green-600'}`}>
                      {card.title !== 'Low Stock Items' && <ArrowUp className="inline h-3 w-3 mr-1" />}
                      {card.title === 'Low Stock Items' && <AlertTriangle className="inline h-3 w-3 mr-1" />}
                      {card.change}
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${card.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Transactions</CardTitle>
                <Link href="/reports">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {salesLoading ? (
                <div className="p-6">Loading transactions...</div>
              ) : recentSales && recentSales.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentSales.map((sale: any) => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {sale.transactionId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ₹{parseFloat(sale.total).toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant="secondary" 
                              className={getPaymentBadgeColor(sale.paymentMethod)}
                            >
                              {sale.paymentMethod.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTime(sale.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No transactions yet today
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions Panel */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/pos">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 min-h-[44px]">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  New Sale
                </Button>
              </Link>
              <Link href="/inventory">
                <Button className="w-full bg-green-600 hover:bg-green-700 min-h-[44px]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline" className="w-full min-h-[44px]">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Reports
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* Low Stock Alert */}
          {lowStockProducts && lowStockProducts.length > 0 && (
            <Card className="border-red-200 bg-red-50 shadow-sm">
              <CardHeader>
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <CardTitle className="text-red-800">Low Stock Alert</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStockProducts.slice(0, 3).map((product: any) => (
                    <div key={product.id} className="flex justify-between items-center">
                      <span className="text-sm text-red-700">{product.name}</span>
                      <Badge variant="destructive" className="text-xs">
                        {product.stock} left
                      </Badge>
                    </div>
                  ))}
                </div>
                {lowStockProducts.length > 3 && (
                  <Link href="/inventory">
                    <Button variant="ghost" size="sm" className="mt-3 text-red-600 hover:text-red-800">
                      View All Low Stock Items →
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}

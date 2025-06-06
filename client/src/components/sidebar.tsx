import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings,
  ScanBarcode,
  LogOut,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const navigationItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Point of Sale", href: "/pos", icon: ShoppingCart },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  return (
    <aside className={cn(
      "bg-white w-64 min-h-screen shadow-lg transform transition-transform duration-300 ease-in-out fixed lg:relative z-30",
      sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <ScanBarcode className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">ModernPOS</h1>
            <p className="text-sm text-gray-500">Point of Sale System</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="mt-6">
        <div className="px-4 space-y-2">
          {navigationItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center px-4 py-3 text-gray-700 rounded-lg transition-colors min-h-[44px]",
                  isActive
                    ? "bg-blue-50 text-blue-700 border-r-4 border-blue-600"
                    : "hover:bg-gray-50"
                )}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* User Profile */}
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {user?.username}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="h-8 w-8 p-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

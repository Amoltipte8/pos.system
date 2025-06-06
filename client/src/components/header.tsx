import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, Search, Bell } from "lucide-react";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

export default function Header({ setSidebarOpen }: HeaderProps) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden h-10 w-10 p-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
            <p className="text-sm text-gray-500">Today, {currentDate}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-3 bg-gray-100 rounded-lg px-4 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products, customers..."
              className="bg-transparent border-0 outline-none text-sm w-64 h-6 p-0"
            />
          </div>
          <Button variant="ghost" size="sm" className="relative h-10 w-10 p-0">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </Button>
        </div>
      </div>
    </header>
  );
}

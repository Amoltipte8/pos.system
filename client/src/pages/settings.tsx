import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import Layout from "@/components/layout";
import { Settings as SettingsIcon, Plus, Edit, Trash2, Tag, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCategorySchema } from "@shared/schema";
import { z } from "zod";

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  const categoryForm = useForm<z.infer<typeof insertCategorySchema>>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertCategorySchema>) => {
      const res = await apiRequest("POST", "/api/categories", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Category created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsCategoryDialogOpen(false);
      categoryForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<z.infer<typeof insertCategorySchema>> }) => {
      const res = await apiRequest("PUT", `/api/categories/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Category updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Category deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onCategorySubmit = (data: z.infer<typeof insertCategorySchema>) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      description: category.description || "",
    });
    setIsCategoryDialogOpen(true);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    categoryForm.reset();
    setIsCategoryDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your POS system settings and configurations</p>
        </div>

        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Username</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">{user?.username}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'}>
                    <Shield className="mr-1 h-3 w-3" />
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              User account created: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </div>
          </CardContent>
        </Card>

        {/* Product Categories Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Tag className="mr-2 h-5 w-5" />
                Product Categories
              </CardTitle>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddCategory} size="sm" className="bg-green-600 hover:bg-green-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? "Edit Category" : "Add New Category"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...categoryForm}>
                    <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                      <FormField
                        control={categoryForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter category name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={categoryForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter category description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCategoryDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                        >
                          {editingCategory ? "Update Category" : "Create Category"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <div className="text-center py-8">Loading categories...</div>
            ) : categories && categories.length > 0 ? (
              <div className="space-y-3">
                {categories.map((category: any) => (
                  <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {new Date(category.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteCategoryMutation.mutate(category.id)}
                        disabled={deleteCategoryMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No categories created yet</p>
                <p className="text-sm">Create your first product category to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <SettingsIcon className="mr-2 h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Application Name</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">ModernPOS</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Version</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">1.0.0</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-xs">✓</Badge>
                  <span className="text-sm text-gray-600">Point of Sale Processing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-xs">✓</Badge>
                  <span className="text-sm text-gray-600">Inventory Management</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-xs">✓</Badge>
                  <span className="text-sm text-gray-600">Customer Management</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-xs">✓</Badge>
                  <span className="text-sm text-gray-600">Sales Reporting</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-xs">✓</Badge>
                  <span className="text-sm text-gray-600">Multi-Payment Methods</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-xs">✓</Badge>
                  <span className="text-sm text-gray-600">Real-time Stock Tracking</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Application Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Tax Rate</h4>
                  <p className="text-sm text-gray-600">Default tax rate applied to sales</p>
                </div>
                <Badge variant="secondary">10%</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Currency</h4>
                  <p className="text-sm text-gray-600">Display currency for prices</p>
                </div>
                <Badge variant="secondary">INR (₹)</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Low Stock Threshold</h4>
                  <p className="text-sm text-gray-600">Default minimum stock level</p>
                </div>
                <Badge variant="secondary">5 units</Badge>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">
                To modify these settings, please contact your system administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

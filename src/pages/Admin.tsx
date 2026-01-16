import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  BarChart3, 
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Save,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Users,
  Coffee,
  ClipboardList,
  Tags,
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCafe } from '@/context/CafeContext';
import { useCategories, useCategoryMutations } from '@/hooks/useCategories';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useTables, useTableMutations } from '@/hooks/useTables';
import { toast } from 'sonner';
import OrdersManagement from '@/components/admin/OrdersManagement';
import StaffManagement from '@/components/admin/StaffManagement';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string;
  category_name: string;
  image_url: string | null;
  image_file?: File;
  is_veg: boolean;
  is_popular: boolean;
  is_available: boolean;
}

interface DailySales {
  date: string;
  total_orders: number;
  total_revenue: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const { cafe, loading: cafeLoading } = useCafe();
  const { data: categories = [] } = useCategories();
  const { data: menuItems = [] } = useMenuItems();
  const { data: tables = [] } = useTables();
  const { createCategory, updateCategory, deleteCategory } = useCategoryMutations();
  const { createTable, deleteTable, createBulkTables } = useTableMutations();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [todayStats, setTodayStats] = useState({
    orders: 0,
    revenue: 0,
    avgOrder: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Set loading to false once auth and cafe are loaded
  useEffect(() => {
    if (!authLoading && !cafeLoading) {
      setLoading(false);
    }
  }, [authLoading, cafeLoading]);

  // Fetch data once cafe is available
  useEffect(() => {
    if (user && cafe?.id && !authLoading && !cafeLoading) {
      fetchDailySales();
      fetchTodayStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cafe?.id, authLoading, cafeLoading]);

  const fetchDailySales = async () => {
    if (!cafe?.id) {
      setDailySales([]);
      return;
    }
    
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .eq('cafe_id', cafe.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .in('status', ['ready', 'served']);

      if (error) {
        console.error('Error fetching sales:', error);
        setDailySales([]);
        return;
      }

      // Group by date
      const salesByDate: Record<string, { orders: number; revenue: number }> = {};
      data?.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('en-IN');
        if (!salesByDate[date]) {
          salesByDate[date] = { orders: 0, revenue: 0 };
        }
        salesByDate[date].orders++;
        salesByDate[date].revenue += Number(order.total_amount);
      });

      const salesArray = Object.entries(salesByDate).map(([date, stats]) => ({
        date,
        total_orders: stats.orders,
        total_revenue: stats.revenue,
      }));

      setDailySales(salesArray);
    } catch (error) {
      console.error('Error fetching daily sales:', error);
      setDailySales([]);
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    if (!cafe?.id) return null;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `menu-images/${cafe.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchTodayStats = async () => {
    if (!cafe?.id) {
      setTodayStats({ orders: 0, revenue: 0, avgOrder: 0 });
      return;
    }
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('cafe_id', cafe.id)
        .gte('created_at', today.toISOString());

      if (error) {
        console.error('Error fetching today stats:', error);
        setTodayStats({ orders: 0, revenue: 0, avgOrder: 0 });
        return;
      }

      if (data) {
        const revenue = data.reduce((sum, order) => sum + Number(order.total_amount), 0);
        setTodayStats({
          orders: data.length,
          revenue,
          avgOrder: data.length > 0 ? Math.round(revenue / data.length) : 0,
        });
      } else {
        setTodayStats({ orders: 0, revenue: 0, avgOrder: 0 });
      }
    } catch (error) {
      console.error('Error fetching today stats:', error);
      setTodayStats({ orders: 0, revenue: 0, avgOrder: 0 });
    }
  };

  const handleSaveItem = async () => {
    if (!editingItem || !cafe?.id) return;

    const isNew = !editingItem.id;
    
    try {
      let imageUrl = editingItem.image_url;

      // Handle image upload if a file is selected
      if (editingItem.image_file) {
        imageUrl = await handleImageUpload(editingItem.image_file);
        if (!imageUrl) return; // Upload failed
      }

      if (isNew) {
        const categoryName = categories.find(c => c.id === editingItem.category_id)?.name || '';
        const { error } = await supabase
          .from('menu_items')
          .insert({
            name: editingItem.name,
            description: editingItem.description,
            price: editingItem.price,
            category: categoryName,
            category_id: editingItem.category_id,
            cafe_id: cafe.id,
            image_url: imageUrl,
            is_veg: editingItem.is_veg,
            is_popular: editingItem.is_popular,
            is_available: editingItem.is_available,
          });
        if (error) throw error;
        toast.success('Menu item added!');
      } else {
        const categoryName = categories.find(c => c.id === editingItem.category_id)?.name || '';
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: editingItem.name,
            description: editingItem.description,
            price: editingItem.price,
            category: categoryName,
            category_id: editingItem.category_id,
            image_url: imageUrl,
            is_veg: editingItem.is_veg,
            is_popular: editingItem.is_popular,
            is_available: editingItem.is_available,
          })
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Menu item updated!');
      }
      
      setIsDialogOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      console.error('Error saving item:', error);
      toast.error(error.message || 'Failed to save item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Menu item deleted!');
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error(error.message || 'Failed to delete item');
    }
  };

  const openNewItemDialog = () => {
    setEditingItem({
      id: '',
      name: '',
      description: '',
      price: 0,
      category_id: categories[0]?.id || '',
      category_name: categories[0]?.name || '',
      image_url: null,
      is_veg: true,
      is_popular: false,
      is_available: true,
    });
    setIsDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!editingCategory || !cafe?.id) return;

    const isNew = !editingCategory.id;
    
    try {
      if (isNew) {
        await createCategory.mutateAsync({
          name: editingCategory.name,
          icon: editingCategory.icon,
          description: editingCategory.description,
          display_order: 0
        });
        toast.success('Category added!');
      } else {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          name: editingCategory.name,
          icon: editingCategory.icon,
          description: editingCategory.description,
        });
        toast.success('Category updated!');
      }
      
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    // Check if category has menu items
    const hasItems = menuItems.some(item => item.category_id === id);
    if (hasItems) {
      toast.error('Cannot delete category with existing menu items. Please reassign or delete the items first.');
      return;
    }

    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await deleteCategory.mutateAsync(id);
      toast.success('Category deleted!');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Failed to delete category');
    }
  };

  const openNewCategoryDialog = () => {
    setEditingCategory({
      id: '',
      name: '',
      icon: '🍽️',
      description: '',
    });
    setIsCategoryDialogOpen(true);
  };

  const handleAddTable = async () => {
    if (!cafe?.id) return;

    try {
      // Find the next available table number
      const existingNumbers = tables.map(t => parseInt(t.table_number)).sort((a, b) => a - b);
      let nextNumber = 1;
      for (const num of existingNumbers) {
        if (nextNumber === num) nextNumber++;
        else break;
      }

      await createTable.mutateAsync(String(nextNumber));
      toast.success(`Table ${nextNumber} added!`);
    } catch (error: any) {
      console.error('Error adding table:', error);
      toast.error(error.message || 'Failed to add table');
    }
  };

  const handleDeleteTable = async (id: string, tableNumber: string) => {
    if (!confirm(`Are you sure you want to delete Table ${tableNumber}?`)) return;

    try {
      await deleteTable.mutateAsync(id);
      toast.success(`Table ${tableNumber} deleted!`);
    } catch (error: any) {
      console.error('Error deleting table:', error);
      toast.error(error.message || 'Failed to delete table');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || cafeLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Coffee className="w-12 h-12 mx-auto text-primary animate-pulse mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar - Fixed/Sticky */}
      <aside className="w-64 bg-card border-r border-border hidden md:block fixed left-0 top-0 bottom-0 overflow-y-auto">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Coffee className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif font-bold">{cafe?.name || 'Admin'}</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'dashboard' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'orders' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'menu' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted'
            }`}
          >
            <UtensilsCrossed className="w-5 h-5" />
            Menu Items
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'categories' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted'
            }`}
          >
            <Tags className="w-5 h-5" />
            Categories
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'tables' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted'
            }`}
          >
            <Hash className="w-5 h-5" />
            Tables
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'staff' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted'
            }`}
          >
            <Users className="w-5 h-5" />
            Staff
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'analytics' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Analytics
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'Admin' : 'Staff'}
              </p>
            </div>
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content - Scrollable */}
      <main className="flex-1 p-6 overflow-y-auto md:ml-64">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-bold">Dashboard</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Orders</p>
                    <p className="text-3xl font-bold mt-1">{todayStats.orders}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Revenue</p>
                    <p className="text-3xl font-bold mt-1">₹{todayStats.revenue}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                    <p className="text-3xl font-bold mt-1">₹{todayStats.avgOrder}</p>
                  </div>
                  <div className="w-12 h-12 bg-accent/30 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-accent-foreground" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button className="w-full justify-start gap-2" onClick={() => navigate('/kitchen')}>
                    <UtensilsCrossed className="w-4 h-4" />
                    Open Kitchen Display
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/qr-codes')}>
                    <ClipboardList className="w-4 h-4" />
                    Manage QR Codes
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveTab('menu')}>
                    <Plus className="w-4 h-4" />
                    Add Menu Item
                  </Button>
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Menu Overview</h3>
                <div className="space-y-2">
                  {categories.map(cat => {
                    const count = menuItems.filter(i => i.category_id === cat.id).length;
                    return (
                      <div key={cat.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{cat.name}</span>
                        <span className="font-medium">{count} items</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold">Menu Items</h2>
              <Button onClick={openNewItemDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </div>

            {/* Menu Items by Category */}
            {categories.map(category => {
              const items = menuItems.filter(i => i.category_id === category.id);
              if (items.length === 0) return null;
              
              return (
                <div key={category.id} className="space-y-4">
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  <div className="grid gap-4">
                    {items.map(item => (
                      <Card key={item.id} className="p-4">
                        <div className="flex items-center gap-4">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="w-16 h-16 object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                              <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.name}</span>
                              {item.isPopular && (
                                <Badge variant="secondary" className="text-xs">Popular</Badge>
                              )}
                              {!item.isAvailable && (
                                <Badge variant="destructive" className="text-xs">Unavailable</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-lg">₹{item.price}</span>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingItem(item);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold">Categories</h2>
              <Button onClick={openNewCategoryDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            </div>

            <div className="space-y-4">
              {categories.map(category => (
                <Card key={category.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setEditingCategory(category);
                          setIsCategoryDialogOpen(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold">Tables</h2>
              <Button onClick={handleAddTable} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Table
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map(table => (
                <Card key={table.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Table {table.table_number}</h3>
                      <p className="text-sm text-muted-foreground">QR Code available</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteTable(table.id, table.table_number)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && <OrdersManagement />}

        {activeTab === 'staff' && <StaffManagement />}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-bold">Sales Analytics</h2>
            
            {/* 7-Day Sales */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Last 7 Days</h3>
              {dailySales.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No sales data available yet
                </p>
              ) : (
                <div className="space-y-4">
                  {dailySales.map(day => (
                    <div key={day.date} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{day.date}</p>
                        <p className="text-sm text-muted-foreground">{day.total_orders} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{day.total_revenue}</p>
                        <p className="text-sm text-muted-foreground">
                          Avg: ₹{Math.round(day.total_revenue / day.total_orders)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Top Items - Placeholder */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Popular Items</h3>
              <div className="space-y-3">
                {menuItems.filter(i => i.is_popular).map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span>{item.name}</span>
                    <Badge variant="secondary">Popular</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Edit/Add Item Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.id ? 'Edit Menu Item' : 'Add New Item'}
            </DialogTitle>
          </DialogHeader>
          
          {editingItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="Item name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Item description"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Image</Label>
                <div className="space-y-2">
                  {editingItem.image_url && (
                    <div className="relative">
                      <img 
                        src={editingItem.image_url} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setEditingItem({ ...editingItem, image_url: null, image_file: undefined })}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditingItem({ ...editingItem, image_file: file });
                        // Create preview URL
                        const previewUrl = URL.createObjectURL(file);
                        setEditingItem({ ...editingItem, image_url: previewUrl, image_file: file });
                      }
                    }}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <p className="text-sm text-muted-foreground">Uploading...</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={editingItem.category_id}
                    onValueChange={(value) => setEditingItem({ ...editingItem, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_veg">Vegetarian</Label>
                <Switch
                  id="is_veg"
                  checked={editingItem.is_veg}
                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, is_veg: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_popular">Mark as Popular</Label>
                <Switch
                  id="is_popular"
                  checked={editingItem.is_popular}
                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, is_popular: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_available">Available</Label>
                <Switch
                  id="is_available"
                  checked={editingItem.is_available}
                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, is_available: checked })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 gap-2" onClick={handleSaveItem}>
                  <Save className="w-4 h-4" />
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Add Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory?.id ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
          </DialogHeader>
          
          {editingCategory && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="Category name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cat-icon">Icon</Label>
                <Input
                  id="cat-icon"
                  value={editingCategory.icon}
                  onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                  placeholder="🍽️"
                />
                <p className="text-sm text-muted-foreground">Use emoji or icon</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cat-description">Description</Label>
                <Input
                  id="cat-description"
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Category description"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsCategoryDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 gap-2" onClick={handleSaveCategory}>
                  <Save className="w-4 h-4" />
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  BarChart3, 
  Settings, 
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Users,
  Coffee
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
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_veg: boolean;
  is_popular: boolean;
  is_available: boolean;
}

interface DailySales {
  date: string;
  total_orders: number;
  total_revenue: number;
}

const categories = ['Starters', 'Burgers', 'Pizza & Pasta', 'Chinese', 'Beverages', 'Desserts'];

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  useEffect(() => {
    if (user) {
      fetchMenuItems();
      fetchDailySales();
      fetchTodayStats();
    }
  }, [user]);

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching menu:', error);
    } else {
      setMenuItems(data || []);
    }
    setLoading(false);
  };

  const fetchDailySales = async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('orders')
      .select('created_at, total_amount')
      .gte('created_at', sevenDaysAgo.toISOString())
      .in('status', ['ready', 'served']);

    if (error) {
      console.error('Error fetching sales:', error);
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
  };

  const fetchTodayStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', today.toISOString());

    if (!error && data) {
      const revenue = data.reduce((sum, order) => sum + Number(order.total_amount), 0);
      setTodayStats({
        orders: data.length,
        revenue,
        avgOrder: data.length > 0 ? Math.round(revenue / data.length) : 0,
      });
    }
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;

    const isNew = !editingItem.id;
    
    try {
      if (isNew) {
        const { error } = await supabase
          .from('menu_items')
          .insert({
            name: editingItem.name,
            description: editingItem.description,
            price: editingItem.price,
            category: editingItem.category,
            is_veg: editingItem.is_veg,
            is_popular: editingItem.is_popular,
            is_available: editingItem.is_available,
          });
        if (error) throw error;
        toast.success('Menu item added!');
      } else {
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: editingItem.name,
            description: editingItem.description,
            price: editingItem.price,
            category: editingItem.category,
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
      fetchMenuItems();
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
      fetchMenuItems();
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
      category: 'Starters',
      image_url: null,
      is_veg: true,
      is_popular: false,
      is_available: true,
    });
    setIsDialogOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || loading) {
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
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border hidden md:block">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Coffee className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif font-bold">Bistro@17</h1>
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

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
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
                    <Settings className="w-4 h-4" />
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
                    const count = menuItems.filter(i => i.category === cat).length;
                    return (
                      <div key={cat} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{cat}</span>
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
              const items = menuItems.filter(i => i.category === category);
              if (items.length === 0) return null;
              
              return (
                <div key={category} className="space-y-4">
                  <h3 className="font-semibold text-lg">{category}</h3>
                  <div className="grid gap-4">
                    {items.map(item => (
                      <Card key={item.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${item.is_veg ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.name}</span>
                                {item.is_popular && (
                                  <Badge variant="secondary" className="text-xs">Popular</Badge>
                                )}
                                {!item.is_available && (
                                  <Badge variant="destructive" className="text-xs">Unavailable</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-lg">₹{item.price}</span>
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
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
                    value={editingItem.category}
                    onValueChange={(value) => setEditingItem({ ...editingItem, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
    </div>
  );
};

export default Admin;

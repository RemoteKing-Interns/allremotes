import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { Package, Plus, Pencil, Trash2, Upload, Download, TrendingUp, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/');
      toast.error('Admin access required');
    } else if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      const [productsRes, ordersRes, customersRes, analyticsRes] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/orders`),
        axios.get(`${API}/customers`),
        axios.get(`${API}/analytics/dashboard`)
      ]);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
      setCustomers(customersRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await axios.delete(`${API}/products/${productId}`);
      toast.success('Product deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleCSVExport = async () => {
    try {
      const response = await axios.get(`${API}/products/export-csv`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Products exported successfully');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export products');
    }
  };

  const handleCSVImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/products/import-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message);
      fetchData();
    } catch (error) {
      console.error('Error importing:', error);
      toast.error(error.response?.data?.detail || 'Failed to import products');
    }

    event.target.value = '';
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status?status=${newStatus}`);
      toast.success('Order status updated');
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update order status');
    }
  };

  if (authLoading || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }} data-testid="admin-title">
            Admin Dashboard
          </h1>
          <p className="text-text-secondary">Complete store management & analytics</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5" data-testid="admin-tabs">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" data-testid="overview-tab">
            {loading ? (
              <div className="text-center py-12">Loading analytics...</div>
            ) : analytics && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white border border-border rounded-sm p-6" data-testid="revenue-card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-primary/10 rounded">
                        <DollarSign className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-sm font-medium text-text-secondary">Total Revenue</h3>
                    </div>
                    <p className="text-3xl font-black text-primary" style={{ fontFamily: 'Chivo, sans-serif' }}>
                      ${analytics.total_revenue.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-white border border-border rounded-sm p-6" data-testid="orders-card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-primary/10 rounded">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-sm font-medium text-text-secondary">Total Orders</h3>
                    </div>
                    <p className="text-3xl font-black" style={{ fontFamily: 'Chivo, sans-serif' }}>
                      {analytics.total_orders}
                    </p>
                  </div>

                  <div className="bg-white border border-border rounded-sm p-6" data-testid="products-card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-primary/10 rounded">
                        <TrendingUp className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-sm font-medium text-text-secondary">Total Products</h3>
                    </div>
                    <p className="text-3xl font-black" style={{ fontFamily: 'Chivo, sans-serif' }}>
                      {analytics.total_products}
                    </p>
                  </div>

                  <div className="bg-white border border-border rounded-sm p-6" data-testid="low-stock-card">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-status-warning/10 rounded">
                        <AlertTriangle className="h-6 w-6 text-status-warning" />
                      </div>
                      <h3 className="text-sm font-medium text-text-secondary">Low Stock</h3>
                    </div>
                    <p className="text-3xl font-black text-status-warning" style={{ fontFamily: 'Chivo, sans-serif' }}>
                      {analytics.low_stock_products}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white border border-border rounded-sm p-6">
                    <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
                      Monthly Revenue
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analytics.monthly_sales}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#D90429" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white border border-border rounded-sm p-6">
                    <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
                      Top Products
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.top_products}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="quantity" fill="#D90429" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="products" data-testid="products-tab">
            <div className="bg-white border border-border rounded-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Chivo, sans-serif' }}>
                  Products Management
                </h2>
                <div className="flex gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCSVImport}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="import-csv-button"
                  >
                    <Upload className="h-4 w-4 mr-2" /> Import CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCSVExport}
                    data-testid="export-csv-button"
                  >
                    <Download className="h-4 w-4 mr-2" /> Export CSV
                  </Button>
                  <Button
                    className="bg-primary text-white hover:bg-primary/90"
                    onClick={() => toast.info('Add product form - Use CSV import or contact developer')}
                    data-testid="add-product-button"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Product
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">Loading products...</div>
              ) : (
                <div className="overflow-x-auto" data-testid="products-table">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-sm font-bold">Product</th>
                        <th className="text-left p-3 text-sm font-bold">Category</th>
                        <th className="text-left p-3 text-sm font-bold">Price</th>
                        <th className="text-left p-3 text-sm font-bold">Stock</th>
                        <th className="text-left p-3 text-sm font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product.id} className="border-b border-border" data-testid={`product-row-${product.id}`}>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded" />
                              <div>
                                <p className="font-medium text-sm">{product.name}</p>
                                <p className="text-xs text-text-secondary">{product.brand}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-sm">{product.category}</td>
                          <td className="p-3 text-sm font-bold">${product.price.toFixed(2)}</td>
                          <td className="p-3">
                            <span className={`text-sm ${product.stock < 10 ? 'text-status-warning font-bold' : ''}`}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toast.info('Edit feature - Use CSV export/import')}
                                data-testid={`edit-product-${product.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteProduct(product.id)}
                                data-testid={`delete-product-${product.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders" data-testid="orders-tab">
            <div className="bg-white border border-border rounded-sm p-6">
              <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Order Management
              </h2>

              {loading ? (
                <div className="text-center py-12">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-text-secondary mb-4" />
                  <p className="text-text-secondary">No orders yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto" data-testid="orders-table">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-sm font-bold">Order ID</th>
                        <th className="text-left p-3 text-sm font-bold">Customer</th>
                        <th className="text-left p-3 text-sm font-bold">Total</th>
                        <th className="text-left p-3 text-sm font-bold">Status</th>
                        <th className="text-left p-3 text-sm font-bold">Date</th>
                        <th className="text-left p-3 text-sm font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} className="border-b border-border" data-testid={`order-row-${order.id}`}>
                          <td className="p-3 text-sm font-mono">#{order.id.slice(0, 8)}</td>
                          <td className="p-3 text-sm">{order.user_email}</td>
                          <td className="p-3 text-sm font-bold">${order.total.toFixed(2)}</td>
                          <td className="p-3">
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleOrderStatusUpdate(order.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toast.info(`Order details: ${order.items.length} items`)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="customers" data-testid="customers-tab">
            <div className="bg-white border border-border rounded-sm p-6">
              <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Customer Management
              </h2>

              {loading ? (
                <div className="text-center py-12">Loading customers...</div>
              ) : customers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-text-secondary mb-4" />
                  <p className="text-text-secondary">No customers yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto" data-testid="customers-table">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-sm font-bold">Name</th>
                        <th className="text-left p-3 text-sm font-bold">Email</th>
                        <th className="text-left p-3 text-sm font-bold">Total Orders</th>
                        <th className="text-left p-3 text-sm font-bold">Total Spent</th>
                        <th className="text-left p-3 text-sm font-bold">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map(customer => (
                        <tr key={customer.id} className="border-b border-border">
                          <td className="p-3 text-sm font-medium">{customer.name}</td>
                          <td className="p-3 text-sm">{customer.email}</td>
                          <td className="p-3 text-sm">{customer.total_orders}</td>
                          <td className="p-3 text-sm font-bold">${customer.total_spent.toFixed(2)}</td>
                          <td className="p-3 text-sm">{new Date(customer.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" data-testid="settings-tab">
            <div className="bg-white border border-border rounded-sm p-6">
              <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Store Settings
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold mb-3">CSV Import Template</h3>
                  <p className="text-sm text-text-secondary mb-3">
                    Use this format for bulk product import:
                  </p>
                  <div className="bg-background p-4 rounded font-mono text-xs overflow-x-auto">
                    name,description,category,brand,model,price,stock,images,featured<br/>
                    "Toyota Camry Remote","OEM remote key","car-remotes","Toyota","Camry",95.00,20,"url1|url2",true
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold mb-3">Quick Actions</h3>
                  <div className="flex gap-3">
                    <Button onClick={() => toast.info('Feature coming soon')}>
                      Backup Database
                    </Button>
                    <Button variant="outline" onClick={() => toast.info('Feature coming soon')}>
                      Generate Reports
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;

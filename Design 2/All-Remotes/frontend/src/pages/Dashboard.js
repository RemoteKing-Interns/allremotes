import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { Package, User } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      fetchOrders();
    }
  }, [user, authLoading, navigate]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders?user_email=${user.email}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }} data-testid="dashboard-title">
            My Dashboard
          </h1>
          <p className="text-text-secondary">Welcome back, {user.name}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-border rounded-sm p-6" data-testid="account-info">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Chivo, sans-serif' }}>Account Information</h2>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-text-secondary">Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Role</p>
                <p className="font-medium capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-sm p-6" data-testid="order-stats">
            <div className="flex items-center gap-3 mb-4">
              <Package className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Chivo, sans-serif' }}>Order Statistics</h2>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-sm text-text-secondary">Total Orders</p>
                <p className="font-bold text-2xl text-primary" style={{ fontFamily: 'Chivo, sans-serif' }}>
                  {orders.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-border rounded-sm p-6">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Chivo, sans-serif' }}>
            My Orders
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="border border-border rounded-sm p-4 animate-pulse">
                  <div className="h-4 bg-border mb-2"></div>
                  <div className="h-4 bg-border w-2/3"></div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8" data-testid="no-orders">
              <Package className="h-12 w-12 mx-auto text-text-secondary mb-4" />
              <p className="text-text-secondary">You haven't placed any orders yet.</p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="orders-list">
              {orders.map(order => (
                <div key={order.id} className="border border-border rounded-sm p-4" data-testid={`order-${order.id}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-lg">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-text-secondary">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        order.status === 'paid'
                          ? 'bg-status-success/10 text-status-success'
                          : 'bg-status-warning/10 text-status-warning'
                      }`}
                      data-testid={`order-status-${order.id}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-text-secondary">Product x {item.quantity}</span>
                        <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border mt-3 pt-3 flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="font-black text-xl text-primary" style={{ fontFamily: 'Chivo, sans-serif' }}>
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

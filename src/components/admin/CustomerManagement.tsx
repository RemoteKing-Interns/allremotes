"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, Plus, Edit2, Trash2, Mail, Phone, Calendar, ShoppingCart, Shield, Search, Filter, Download, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, X, MapPin, ShoppingBag, Clock, Star, Award } from "lucide-react";
import toast from "react-hot-toast";

interface ChannelBreakdown {
  channel: string;
  orders: number;
  spent: number;
}

interface Customer {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  firstOrderDate?: string;
  registrationDate: string;
  status: 'active' | 'inactive' | 'banned';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  orderIds?: string[];
  channels?: string[];
  channelBreakdown?: ChannelBreakdown[];
}

interface CustomerAnalytics {
  totalCustomers: number;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  returningCustomers: number;
  topCustomers: Array<{ name: string; email: string; totalSpent: number; totalOrders: number; channels: string[] }>;
  channelDistribution: Array<{ channel: string; customers: number; orders: number; revenue: number }>;
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
    status: "active" as 'active' | 'inactive' | 'banned',
    notes: "",
  });
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });
  const [sortBy, setSortBy] = useState<'totalSpent' | 'totalOrders' | 'lastOrderDate' | 'name'>('totalSpent');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalOrders = customers.reduce((sum, c) => sum + c.totalOrders, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const returningCustomers = customers.filter(c => c.totalOrders > 1).length;
    const avgCustomerSpend = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    return { totalCustomers, totalRevenue, totalOrders, avgOrderValue, returningCustomers, avgCustomerSpend };
  }, [customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/customers");
      const data = await response.json();
      if (response.ok) {
        setCustomers(data.customers);
        setAnalytics(data.analytics || null);
      } else {
        toast.error(data.error || "Failed to fetch customers");
      }
    } catch (error) {
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("Customer created successfully");
        setShowAddModal(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: {
            street: "",
            city: "",
            state: "",
            zip: "",
            country: "",
          },
          status: "active",
          notes: "",
        });
        fetchCustomers();
      } else {
        toast.error(data.error || "Failed to create customer");
      }
    } catch (error) {
      toast.error("Failed to create customer");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCustomer) return;
    
    try {
      const customerId = editingCustomer._id || editingCustomer.id;
      const response = await fetch("/api/admin/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: customerId,
          updates: formData,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("Customer updated successfully");
        setShowEditModal(false);
        setEditingCustomer(null);
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: {
            street: "",
            city: "",
            state: "",
            zip: "",
            country: "",
          },
          status: "active",
          notes: "",
        });
        fetchCustomers();
      } else {
        toast.error(data.error || "Failed to update customer");
      }
    } catch (error) {
      toast.error("Failed to update customer");
    }
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return;
    
    try {
      const response = await fetch(`/api/admin/customers?id=${customerId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("Customer deleted successfully");
        fetchCustomers();
      } else {
        toast.error(data.error || "Failed to delete customer");
      }
    } catch (error) {
      toast.error("Failed to delete customer");
    }
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      address: customer.address || {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "",
      },
      status: customer.status,
      notes: customer.notes || "",
    });
    setShowEditModal(true);
  };

  const openViewModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'banned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !filters.search || 
      customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      customer.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      (customer.phone || '').includes(filters.search);
    
    const matchesStatus = !filters.status || customer.status === filters.status;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortBy === 'totalSpent') cmp = a.totalSpent - b.totalSpent;
    else if (sortBy === 'totalOrders') cmp = a.totalOrders - b.totalOrders;
    else if (sortBy === 'lastOrderDate') {
      const aDate = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
      const bDate = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
      cmp = aDate - bDate;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Username', 'Phone', 'City', 'State', 'Total Orders', 'Total Spent', 'First Order', 'Last Order', 'Channels', 'Channel Breakdown'];
    const rows = filteredCustomers.map(c => [
      c.name, c.email, c.username || '', c.phone || '', c.address?.city || '', c.address?.state || '',
      c.totalOrders, `$${c.totalSpent.toFixed(2)}`,
      c.firstOrderDate ? new Date(c.firstOrderDate).toLocaleDateString() : '',
      c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : '',
      (c.channels || []).join('; '),
      (c.channelBreakdown || []).map(cb => `${cb.channel}:${cb.orders}orders/$${cb.spent.toFixed(2)}`).join('; '),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Customer Management</h1>
          <p className="text-neutral-600">View customer profiles, order history, and spending analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={filteredCustomers.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-neutral-700 rounded-lg ring-1 ring-inset ring-neutral-200 hover:bg-neutral-50 transition-colors disabled:opacity-40"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus size={16} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-violet-600 bg-violet-50' },
          { label: 'Avg Order Value', value: `$${stats.avgOrderValue.toFixed(2)}`, icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
          { label: 'Avg Customer Spend', value: `$${stats.avgCustomerSpend.toFixed(2)}`, icon: ShoppingBag, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Returning Customers', value: `${stats.returningCustomers} (${stats.totalCustomers > 0 ? Math.round(stats.returningCustomers / stats.totalCustomers * 100) : 0}%)`, icon: Award, color: 'text-rose-600 bg-rose-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className={`inline-flex items-center justify-center h-9 w-9 rounded-lg ${stat.color} mb-3`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
            <p className="text-xs text-neutral-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Analytics: Channel Distribution + Top Customers */}
      {analytics && analytics.channelDistribution.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Channel Distribution */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Channel Distribution
            </h3>
            <div className="space-y-3">
              {analytics.channelDistribution.map((ch) => {
                const maxRevenue = Math.max(...analytics.channelDistribution.map(c => c.revenue), 1);
                const barWidth = (ch.revenue / maxRevenue) * 100;
                const channelColors: Record<string, string> = {
                  website: 'bg-blue-500',
                  ebay: 'bg-yellow-500',
                  amazon: 'bg-orange-500',
                  temu: 'bg-red-500',
                  aliexpress: 'bg-rose-500',
                };
                const barColor = channelColors[ch.channel] || 'bg-neutral-500';
                return (
                  <div key={ch.channel} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${barColor}`} />
                        <span className="font-medium text-neutral-900 capitalize">{ch.channel}</span>
                        <span className="text-neutral-400 text-xs">
                          {ch.customers} customers · {ch.orders} orders
                        </span>
                      </div>
                      <span className="font-bold text-neutral-900">AU${ch.revenue.toFixed(2)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Customers */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Top Customers
            </h3>
            <div className="space-y-3">
              {analytics.topCustomers.map((tc, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-700' :
                    i === 1 ? 'bg-slate-100 text-slate-700' :
                    i === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-neutral-100 text-neutral-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 truncate">{tc.name}</p>
                    <p className="text-xs text-neutral-500">{tc.totalOrders} orders · {tc.channels.join(', ')}</p>
                  </div>
                  <p className="text-sm font-bold text-emerald-600 shrink-0">AU${tc.totalSpent.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
            </select>
          </div>

          <button
            onClick={() => setFilters({ status: "", search: "" })}
            className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-800"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700" onClick={() => handleSort('name')}>
                  <span className="inline-flex items-center gap-1">Customer {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}</span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Channels
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700" onClick={() => handleSort('totalOrders')}>
                  <span className="inline-flex items-center gap-1">Orders {sortBy === 'totalOrders' && (sortDir === 'asc' ? '↑' : '↓')}</span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700" onClick={() => handleSort('totalSpent')}>
                  <span className="inline-flex items-center gap-1">Total Spent {sortBy === 'totalSpent' && (sortDir === 'asc' ? '↑' : '↓')}</span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700" onClick={() => handleSort('lastOrderDate')}>
                  <span className="inline-flex items-center gap-1">Last Order {sortBy === 'lastOrderDate' && (sortDir === 'asc' ? '↑' : '↓')}</span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredCustomers.map((customer) => {
                const tier = customer.totalSpent > 500 ? 'gold' : customer.totalSpent > 100 ? 'silver' : 'bronze';
                const tierConfig = {
                  gold: { label: 'Gold', color: 'bg-amber-100 text-amber-800', icon: Star },
                  silver: { label: 'Silver', color: 'bg-slate-100 text-slate-700', icon: Award },
                  bronze: { label: 'Bronze', color: 'bg-orange-100 text-orange-700', icon: ShoppingBag },
                };
                const TierIcon = tierConfig[tier].icon;
                return (
                  <tr key={customer._id || customer.id} className="hover:bg-neutral-50 cursor-pointer" onClick={() => openViewModal(customer)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                          {customer.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="ml-4 min-w-0">
                          <div className="text-sm font-medium text-neutral-900 truncate">{customer.name}</div>
                          <div className="text-sm text-neutral-500 truncate">
                            {customer.email || customer.username || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      <div className="space-y-1">
                        {customer.phone && (
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.address?.city && (
                          <div className="flex items-center text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {customer.address.city}, {customer.address.state}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        {(customer.channels || ['website']).map(ch => (
                          <span key={ch} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ch === 'ebay' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      <span className="font-semibold">{customer.totalOrders}</span>
                      <span className="text-neutral-400 ml-1">order{customer.totalOrders !== 1 ? 's' : ''}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-900">
                      ${customer.totalSpent.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {customer.lastOrderDate ? (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-neutral-400" />
                          {new Date(customer.lastOrderDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${tierConfig[tier].color}`}>
                        <TierIcon className="h-3 w-3" />
                        {tierConfig[tier].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openViewModal(customer)}
                        className="text-neutral-600 hover:text-neutral-900 mr-3"
                        title="View Details"
                      >
                        <Shield size={16} />
                      </button>
                      <button
                        onClick={() => openEditModal(customer)}
                        className="text-neutral-600 hover:text-neutral-900 mr-3"
                        title="Edit Customer"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(customer._id || customer.id!)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Customer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No customers found</h3>
            <p className="text-neutral-500 mb-4">
              {customers.length === 0 
                ? "Customers will appear here once orders are placed." 
                : "No customers match your current filters"}
            </p>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Add Customer</h2>
            <p className="text-sm text-neutral-600 mb-6">
              Create a new customer account for store access and order management.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Address
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Street"
                    value={formData.address.street}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, street: e.target.value }
                    }))}
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.address.city}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, city: e.target.value }
                    }))}
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={formData.address.state}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, state: e.target.value }
                    }))}
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="ZIP"
                    value={formData.address.zip}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, zip: e.target.value }
                    }))}
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      name: "",
                      email: "",
                      phone: "",
                      address: {
                        street: "",
                        city: "",
                        state: "",
                        zip: "",
                        country: "",
                      },
                      status: "active",
                      notes: "",
                    });
                  }}
                  className="px-4 py-2 text-neutral-600 hover:text-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Edit Customer</h2>
            <p className="text-sm text-neutral-600 mb-6">
              Update customer details and account information.
            </p>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Address
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Street"
                    value={formData.address.street}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, street: e.target.value }
                    }))}
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.address.city}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, city: e.target.value }
                    }))}
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={formData.address.state}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, state: e.target.value }
                    }))}
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="ZIP"
                    value={formData.address.zip}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, zip: e.target.value }
                    }))}
                    className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCustomer(null);
                    setFormData({
                      name: "",
                      email: "",
                      phone: "",
                      address: {
                        street: "",
                        city: "",
                        state: "",
                        zip: "",
                        country: "",
                      },
                      status: "active",
                      notes: "",
                    });
                  }}
                  className="px-4 py-2 text-neutral-600 hover:text-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Update Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Customer Drawer */}
      {showViewModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => { setShowViewModal(false); setSelectedCustomer(null); }}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header with gradient */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white relative">
              <button
                onClick={() => { setShowViewModal(false); setSelectedCustomer(null); }}
                className="absolute top-4 right-4 rounded-full p-1.5 hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
                  {selectedCustomer.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedCustomer.name}</h2>
                  <p className="text-white/80 text-sm flex items-center mt-1">
                    <Mail className="h-3.5 w-3.5 mr-1" />
                    {selectedCustomer.email || selectedCustomer.username || 'No contact'}
                  </p>
                  {selectedCustomer.phone && (
                    <p className="text-white/80 text-sm flex items-center mt-0.5">
                      <Phone className="h-3.5 w-3.5 mr-1" />
                      {selectedCustomer.phone}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {(selectedCustomer.channels || ['website']).map(ch => (
                  <span key={ch} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm">
                    {ch}
                  </span>
                ))}
                {(() => {
                  const tier = selectedCustomer.totalSpent > 500 ? 'Gold' : selectedCustomer.totalSpent > 100 ? 'Silver' : 'Bronze';
                  return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm">
                      <Star className="h-3 w-3" />
                      {tier} Member
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 p-6 border-b border-neutral-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-neutral-900">{selectedCustomer.totalOrders}</p>
                <p className="text-xs text-neutral-500 mt-1">Total Orders</p>
              </div>
              <div className="text-center border-x border-neutral-200">
                <p className="text-2xl font-bold text-emerald-600">${selectedCustomer.totalSpent.toFixed(2)}</p>
                <p className="text-xs text-neutral-500 mt-1">Total Spent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-neutral-900">
                  ${selectedCustomer.totalOrders > 0 ? (selectedCustomer.totalSpent / selectedCustomer.totalOrders).toFixed(2) : '0.00'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">Avg Order</p>
              </div>
            </div>

            {/* Per-Channel Breakdown */}
            {selectedCustomer.channelBreakdown && selectedCustomer.channelBreakdown.length > 0 && (
              <div className="p-6 border-b border-neutral-200">
                <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Spending by Channel
                </h3>
                <div className="space-y-2">
                  {selectedCustomer.channelBreakdown.map((cb) => {
                    const maxSpent = Math.max(...selectedCustomer.channelBreakdown!.map(c => c.spent), 1);
                    const barWidth = (cb.spent / maxSpent) * 100;
                    const channelColors: Record<string, string> = {
                      website: 'bg-blue-500',
                      ebay: 'bg-yellow-500',
                      amazon: 'bg-orange-500',
                      temu: 'bg-red-500',
                      aliexpress: 'bg-rose-500',
                    };
                    const barColor = channelColors[cb.channel] || 'bg-neutral-500';
                    return (
                      <div key={cb.channel} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-neutral-900 capitalize">{cb.channel}</span>
                          <span className="text-neutral-500 text-xs">
                            {cb.orders} order{cb.orders !== 1 ? 's' : ''} · <span className="font-bold text-neutral-900">AU${cb.spent.toFixed(2)}</span>
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${barWidth}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order History */}
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Order History
              </h3>
              {selectedCustomer.orderIds && selectedCustomer.orderIds.length > 0 ? (
                <div className="space-y-2">
                  {selectedCustomer.orderIds.map((orderId, i) => (
                    <div key={orderId} className="flex items-center justify-between bg-neutral-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-neutral-500">#{i + 1}</span>
                        <span className="text-sm font-mono font-medium text-neutral-900">#{orderId}</span>
                      </div>
                      <a
                        href={`/admin/orders`}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        View →
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-400">No orders found</p>
              )}
            </div>

            {/* Timeline */}
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Customer Timeline
              </h3>
              <div className="space-y-3">
                {selectedCustomer.firstOrderDate && (
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">First Order</p>
                      <p className="text-xs text-neutral-500">{new Date(selectedCustomer.firstOrderDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                {selectedCustomer.lastOrderDate && (
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Last Order</p>
                      <p className="text-xs text-neutral-500">{new Date(selectedCustomer.lastOrderDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                {selectedCustomer.firstOrderDate && selectedCustomer.lastOrderDate && selectedCustomer.firstOrderDate !== selectedCustomer.lastOrderDate && (
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Customer Lifetime</p>
                      <p className="text-xs text-neutral-500">
                        {Math.round((new Date(selectedCustomer.lastOrderDate).getTime() - new Date(selectedCustomer.firstOrderDate).getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            {selectedCustomer.address && selectedCustomer.address.street && (
              <div className="p-6 border-b border-neutral-200">
                <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Shipping Address
                </h3>
                <div className="bg-neutral-50 p-3 rounded-lg">
                  <p className="text-sm text-neutral-700">
                    {selectedCustomer.address.street}<br />
                    {selectedCustomer.address.city}, {selectedCustomer.address.state} {selectedCustomer.address.zip}<br />
                    {selectedCustomer.address.country}
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedCustomer.notes && (
              <div className="p-6 border-b border-neutral-200">
                <h3 className="text-sm font-semibold text-neutral-700 mb-3">Notes</h3>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                  <p className="text-sm text-neutral-700">{selectedCustomer.notes}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-6 flex gap-3">
              <button
                onClick={() => { setShowViewModal(false); setSelectedCustomer(null); }}
                className="flex-1 px-4 py-2.5 text-neutral-600 hover:text-neutral-800 border border-neutral-300 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => { setShowViewModal(false); openEditModal(selectedCustomer); }}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Edit Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

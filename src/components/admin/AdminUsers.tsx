"use client";

import React, { useEffect, useState } from "react";
import { Users, Plus, Edit2, Trash2, Shield, Key, Mail, Copy, Check, RefreshCw, X, Clock, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";

interface AdminUser {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  permissions: string[];
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", permissions: ["*"] as string[] });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [resetSending, setResetSending] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    permissions: [] as string[],
  });

  useEffect(() => {
    fetchUsers();
    fetchInvites();
  }, []);

  const sendResetLink = async (user: AdminUser) => {
    const id = user._id || user.id;
    if (!id) return;
    setResetSending(id);
    try {
      const storedUser = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
      const resp = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-email": storedUser.email || "" },
        body: JSON.stringify({ targetUserId: id }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed to send reset email");
      toast.success(`Reset link sent to ${user.email}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link");
    } finally {
      setResetSending(null);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
      } else {
        toast.error(data.error || "Failed to fetch users");
      }
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    setInvitesLoading(true);
    try {
      const res = await fetch("/api/admin/invite");
      const data = await res.json();
      if (res.ok) setInvites(data.invites);
    } catch {}
    finally { setInvitesLoading(false); }
  };

  const revokeInvite = async (invite: any) => {
    if (!confirm(`Revoke invite for ${invite.email}?`)) return;
    try {
      const res = await fetch(`/api/admin/invite?${invite.id ? `id=${invite.id}` : `token=${invite.token}`}`, { method: "DELETE" });
      if (res.ok) { toast.success("Invite revoked"); fetchInvites(); }
      else toast.error("Failed to revoke");
    } catch { toast.error("Failed to revoke"); }
  };

  const resendInvite = async (invite: any) => {
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: invite.email, name: invite.name, permissions: invite.permissions }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.emailSent ? `Invite resent to ${invite.email}` : "New invite created (copy link)");
        fetchInvites();
      } else toast.error(data.error || "Failed to resend");
    } catch { toast.error("Failed to resend"); }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteLink("");
    try {
      const response = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.emailSent) {
          toast.success(`Invite sent to ${inviteForm.email}`);
        } else {
          toast(`Email not sent — copy the link below to share manually`, { icon: "⚠️" });
        }
        fetchInvites();
        if (data.acceptUrl) setInviteLink(data.acceptUrl);
        setInviteForm({ name: "", email: "", permissions: ["*"] });
      } else {
        toast.error(data.error || "Failed to send invite");
      }
    } catch {
      toast.error("Failed to send invite");
    } finally {
      setInviteLoading(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("User created successfully");
        setShowAddModal(false);
        setFormData({ name: "", email: "", password: "", permissions: [] });
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to create user");
      }
    } catch (error) {
      toast.error("Failed to create user");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;
    
    try {
      const userId = editingUser._id || editingUser.id;
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          updates: {
            name: formData.name,
            email: formData.email,
            permissions: formData.permissions,
          },
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("User updated successfully");
        setShowEditModal(false);
        setEditingUser(null);
        setFormData({ name: "", email: "", password: "", permissions: [] });
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to update user");
      }
    } catch (error) {
      toast.error("Failed to update user");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("User deleted successfully");
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      permissions: user.permissions,
    });
    setShowEditModal(true);
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const availablePermissions = [
    { value: "*",          label: "Full Access",   description: "All sections — superadmin" },
    { value: "dashboard",  label: "Dashboard",     description: "View home dashboard & stats" },
    { value: "orders",     label: "Orders",        description: "View & manage orders, returns, abandoned carts" },
    { value: "products",   label: "Products",      description: "Manage products, categories, brands & inventory" },
    { value: "customers",  label: "Customers",     description: "View customers, reviews & messages" },
    { value: "marketing",  label: "Marketing",     description: "Create promotions & discount codes" },
    { value: "content",    label: "Content",       description: "Edit homepage & site navigation" },
    { value: "analytics",  label: "Analytics",     description: "View reports & live visitor view" },
    { value: "admin_users",label: "Admin Users",   description: "Invite & manage admin accounts and logs" },
    { value: "settings",   label: "Settings",      description: "Change store-wide settings" },
  ];

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
          <h1 className="text-2xl font-bold text-neutral-900">Admin Users</h1>
          <p className="text-neutral-600">Manage admin user accounts and permissions (not customer accounts)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowInviteModal(true); setInviteLink(""); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            <Mail size={16} />
            Send Invite
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus size={16} />
            Add User
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {users.map((user) => (
                <tr key={user._id || user.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-900">{user.name}</div>
                        <div className="text-sm text-neutral-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.includes("*") ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Full Access
                        </span>
                      ) : (
                        user.permissions.slice(0, 3).map((permission) => (
                          <span
                            key={permission}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {permission.replace("/admin/", "")}
                          </span>
                        ))
                      )}
                      {user.permissions.length > 3 && !user.permissions.includes("*") && (
                        <span className="text-xs text-neutral-500">
                          +{user.permissions.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => sendResetLink(user)}
                        disabled={resetSending === (user._id || user.id)}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-neutral-200 text-neutral-600 hover:text-emerald-700 hover:border-emerald-300 disabled:opacity-50"
                        title="Send password reset link"
                      >
                        {resetSending === (user._id || user.id)
                          ? <RefreshCw size={11} className="animate-spin" />
                          : <Key size={11} />}
                        Reset
                      </button>
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-neutral-600 hover:text-neutral-900"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id || user.id!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No admin users</h3>
            <p className="text-neutral-500 mb-4">Get started by adding your first admin user for admin panel access</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus size={16} />
              Add User
            </button>
          </div>
        )}
      </div>

      {/* Pending Invites */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Invites</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Sent invite links and their current status</p>
          </div>
          <button
            onClick={fetchInvites}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded"
            title="Refresh"
          >
            <RefreshCw size={15} className={invitesLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {invitesLoading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600" />
          </div>
        ) : invites.length === 0 ? (
          <div className="py-10 text-center text-sm text-neutral-400">
            No invites sent yet. Use &ldquo;Send Invite&rdquo; to invite a new admin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Name / Email</th>
                  <th className="px-6 py-3 text-left">Access</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Sent</th>
                  <th className="px-6 py-3 text-left">Expires</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {invites.map((inv) => {
                  const statusMap: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
                    pending:  { icon: <Clock size={12} />,        cls: "bg-amber-50 text-amber-700 border border-amber-200",   label: "Pending" },
                    accepted: { icon: <CheckCircle2 size={12} />, cls: "bg-green-50 text-green-700 border border-green-200",   label: "Accepted" },
                    expired:  { icon: <XCircle size={12} />,      cls: "bg-neutral-100 text-neutral-500 border border-neutral-200", label: "Expired" },
                  };
                  const s = statusMap[inv.status] || statusMap.expired;
                  return (
                    <tr key={inv.id || inv.token} className="hover:bg-neutral-50">
                      <td className="px-6 py-3">
                        <div className="text-sm font-medium text-neutral-900">{inv.name}</div>
                        <div className="text-xs text-neutral-500">{inv.email}</div>
                      </td>
                      <td className="px-6 py-3">
                        {inv.permissions?.includes("*") ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-700">Full Access</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {(inv.permissions || []).map((p: string) => (
                              <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 capitalize">{p.replace("_", " ")}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>
                          {s.icon}{s.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-neutral-500">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-xs text-neutral-500">
                        {inv.status === "accepted"
                          ? <span className="text-green-600">Used {new Date(inv.usedAt).toLocaleDateString()}</span>
                          : new Date(inv.expiresAt).toLocaleDateString()
                        }
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status !== "accepted" && (
                            <button
                              onClick={() => resendInvite(inv)}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-neutral-200 text-neutral-600 hover:text-emerald-700 hover:border-emerald-300"
                              title="Resend invite"
                            >
                              <RefreshCw size={11} /> Resend
                            </button>
                          )}
                          <button
                            onClick={() => revokeInvite(inv)}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-neutral-200 text-neutral-600 hover:text-red-600 hover:border-red-300"
                            title="Delete invite"
                          >
                            <X size={11} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Add Admin User</h2>
            <p className="text-sm text-neutral-600 mb-6">
              Create a new admin account with specific permissions for admin panel access.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
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

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-2 border border-neutral-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {availablePermissions.map((permission) => (
                    <label key={permission.value} className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.value)}
                        onChange={() => togglePermission(permission.value)}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <div className="font-medium text-neutral-900">{permission.label}</div>
                        <div className="text-sm text-neutral-500">{permission.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: "", email: "", password: "", permissions: [] });
                  }}
                  className="px-4 py-2 text-neutral-600 hover:text-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Edit Admin User</h2>
            <p className="text-sm text-neutral-600 mb-6">
              Update admin user permissions and details.
            </p>
            
            <form onSubmit={handleUpdate} className="space-y-6">
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

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-2 border border-neutral-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {availablePermissions.map((permission) => (
                    <label key={permission.value} className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.value)}
                        onChange={() => togglePermission(permission.value)}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <div className="font-medium text-neutral-900">{permission.label}</div>
                        <div className="text-sm text-neutral-500">{permission.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setFormData({ name: "", email: "", password: "", permissions: [] });
                  }}
                  className="px-4 py-2 text-neutral-600 hover:text-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-1">Send Admin Invite</h2>
            <p className="text-sm text-neutral-500 mb-5">
              An email will be sent with a link to set up their own password and 2FA.
            </p>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="jane@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Permissions</label>
                <div className="space-y-2 border border-neutral-200 rounded-lg p-3 max-h-52 overflow-y-auto">
                  {availablePermissions.map((perm) => (
                    <label key={perm.value} className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={inviteForm.permissions.includes(perm.value)}
                        onChange={() => {
                          setInviteForm(prev => {
                            const has = prev.permissions.includes(perm.value);
                            let next = has
                              ? prev.permissions.filter(p => p !== perm.value)
                              : [...prev.permissions, perm.value];
                            // If full access ticked, clear everything else; if unticked, keep rest
                            if (!has && perm.value === "*") next = ["*"];
                            if (has && perm.value === "*") next = [];
                            return { ...prev, permissions: next };
                          });
                        }}
                      />
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{perm.label}</div>
                        <div className="text-xs text-neutral-500">{perm.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Result link */}
              {inviteLink && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700 font-medium mb-2">Email not configured — share this link manually:</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={inviteLink}
                      className="flex-1 text-xs bg-white border border-amber-200 rounded px-2 py-1 font-mono truncate"
                    />
                    <button type="button" onClick={copyInviteLink} className="p-1.5 text-amber-700 hover:text-amber-900">
                      {linkCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowInviteModal(false); setInviteLink(""); setInviteForm({ name: "", email: "", permissions: ["*"] }); }}
                  className="px-4 py-2 text-neutral-600 hover:text-neutral-800"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {inviteLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Mail size={16} />
                  )}
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

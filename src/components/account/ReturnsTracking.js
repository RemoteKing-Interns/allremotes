import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { tw, btn } from './tw';

export default function ReturnsTracking() {
  const { user } = useAuth();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const email = user?.email || '';

  useEffect(() => {
    loadReturns();
  }, [email]);

  const loadReturns = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const resp = await fetch(`/api/returns?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error || 'Failed to load returns');
      setReturns(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTracking = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const resp = await fetch(`/api/returns/${selectedReturn.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: trackingNumber.trim() })
      });

      if (!resp.ok) throw new Error('Failed to submit tracking number');

      await loadReturns();
      setSelectedReturn(null);
      setTrackingNumber('');
    } catch (err) {
      setError(err?.message || 'Failed to submit tracking number');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      approved: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
      shipped: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      received: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
      refunded: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      cancelled: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
    };
    const style = statusMap[status] || statusMap.pending;
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${style.bg} ${style.text} ${style.border} border`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={tw.section}>
        <h2 className={tw.sectionTitle}>Returns & Refunds</h2>
        <div className={tw.emptyState}>
          <p>Loading returns…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={tw.section}>
      <h2 className={tw.sectionTitle}>Returns & Refunds</h2>

      {error && <div className={`${tw.error} mb-4`}>{error}</div>}

      {returns.length === 0 ? (
        <div className={tw.emptyState}>
          <p>No return requests yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => (
            <div key={ret.id} className={tw.card}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={tw.strongText}>Return #{ret.id}</h3>
                    {getStatusBadge(ret.status)}
                  </div>
                  <p className="text-sm text-neutral-600 mb-2">Order: {ret.orderId}</p>
                  <p className="text-xs text-neutral-500">
                    Submitted: {new Date(ret.createdAt).toLocaleDateString()}
                  </p>
                  {ret.trackingNumber && (
                    <p className="text-sm text-neutral-700 mt-2">
                      <strong>Tracking:</strong> {ret.trackingNumber}
                    </p>
                  )}
                </div>
                {ret.status === 'approved' && !ret.trackingNumber && (
                  <button
                    onClick={() => setSelectedReturn(ret)}
                    className={btn.secondarySm}
                  >
                    Add Tracking
                  </button>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                  Items ({ret.items?.length || 0})
                </p>
                <ul className="text-sm text-neutral-700 space-y-1">
                  {ret.items?.map((item, idx) => (
                    <li key={idx}>
                      {item.productName} x{item.quantity} - AU${Number(item.price || 0).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>

              {ret.reasonDetails && (
                <div className="mt-3 pt-3 border-t border-neutral-200">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                    Reason
                  </p>
                  <p className="text-sm text-neutral-700">{ret.reasonDetails}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-neutral-900">Add Tracking Number</h3>
              <button onClick={() => setSelectedReturn(null)} className="text-neutral-400 hover:text-neutral-600 text-2xl">×</button>
            </div>

            <form onSubmit={handleSubmitTracking} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Tracking Number *
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter your return shipping tracking number"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-accent focus:ring-accent"
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setSelectedReturn(null)}
                  className={btn.outline}
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className={btn.gradient}>
                  {submitting ? 'Submitting...' : 'Submit Tracking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

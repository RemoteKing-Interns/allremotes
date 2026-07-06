"use client";

import { useEffect, useState } from "react";
import { Search, Package, Cpu, Radio, Layers, Image as ImageIcon, ChevronDown, ChevronLeft, ChevronRight, Loader2, X, Building2, FileText, MessageSquare, Save } from "lucide-react";

interface CompleteKey {
  _id?: string;
  car_brand: string;
  title: string;
  manufacturer: string;
  vehicle: string;
  chip: string;
  frequency: string;
  buttons: string;
  blade: string;
  product_url: string;
  image_url: string;
  description: string;
  comments?: string;
}

export default function CompleteKeysPage() {
  const [keys, setKeys] = useState<CompleteKey[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [savingComment, setSavingComment] = useState<string | null>(null);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.set("search", search);
      if (selectedBrand) params.set("brand", selectedBrand);

      const res = await fetch(`/api/complete-keys?${params.toString()}`);
      const data = await res.json();
      setKeys(data.keys || []);
      setBrands(data.brands || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch keys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [page, search, selectedBrand]);

  const totalPages = Math.ceil(total / limit);

  const saveComment = async (keyId: string) => {
    setSavingComment(keyId);
    try {
      const res = await fetch('/api/complete-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: keyId, comment: comments[keyId] || '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save comment');
      // Update local key data
      setKeys(prev => prev.map(k => k._id === keyId ? { ...k, comments: comments[keyId] } : k));
    } catch (err) {
      console.error('Failed to save comment:', err);
      alert('Failed to save comment');
    } finally {
      setSavingComment(null);
    }
  };

  const getImageUrl = (url: string) => {
    if (!url || url === "🔗") return null;
    return `/api/complete-keys/images/${encodeURIComponent(url)}`;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Filters - Sticky */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
              />
            </div>

            {/* Brand Filter */}
            <div className="relative sm:w-48">
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-3 pr-8 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 appearance-none bg-white text-sm"
              >
                <option value="">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
            <p>No keys found matching your criteria.</p>
          </div>
        ) : (
          <>

            <div className="grid grid-cols-1 gap-4">
              {keys.map((key) => {
                const imageUrl = getImageUrl(key.image_url);
                return (
                  <div
                    key={key._id}
                    className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Image */}
                      {imageUrl ? (
                        <div className="md:w-80 md:h-80 bg-neutral-100 relative flex-shrink-0 cursor-pointer" onClick={() => setExpandedImage(imageUrl)}>
                          <img
                            src={imageUrl}
                            alt={key.title}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="md:w-80 md:h-80 bg-neutral-100 flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="h-12 w-12 text-neutral-300" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-1 rounded">
                            {key.car_brand}
                          </span>
                          {key.manufacturer && (
                            <span className="text-xs text-neutral-500 flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {key.manufacturer}
                            </span>
                          )}
                        </div>

                        <h3 className="font-semibold text-neutral-900 mb-2" title={key.title}>
                          {key.title}
                        </h3>

                        <p className="text-sm text-neutral-600 mb-3" title={key.vehicle}>
                          {key.vehicle}
                        </p>

                        {/* Specs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs">
                          <div className="flex items-center gap-2 text-neutral-500">
                            <Cpu className="h-3.5 w-3.5" />
                            <span className="truncate" title={key.chip}>{key.chip}</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-500">
                            <Radio className="h-3.5 w-3.5" />
                            <span>{key.frequency}</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-500">
                            <Layers className="h-3.5 w-3.5" />
                            <span>{key.buttons} buttons</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-500">
                            <FileText className="h-3.5 w-3.5" />
                            <span>{key.blade} blade</span>
                          </div>
                        </div>

                        {/* Description */}
                        {key.description && (
                          <div className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded border border-neutral-100 mb-3">
                            {key.description}
                          </div>
                        )}

                        {/* Comments */}
                        <div className="border-t border-neutral-100 pt-3">
                          <div className="flex items-center gap-2 mb-2 text-xs font-medium text-neutral-700">
                            <MessageSquare className="h-3.5 w-3.5" />
                            Comments
                          </div>
                          <textarea
                            value={comments[key._id || ''] || key.comments || ''}
                            onChange={(e) => setComments(prev => ({ ...prev, [key._id || '']: e.target.value }))}
                            placeholder="Add a comment..."
                            className="w-full text-xs p-2 border border-neutral-300 rounded focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                            rows={2}
                          />
                          <button
                            onClick={() => saveComment(key._id || '')}
                            disabled={savingComment === key._id}
                            className="mt-2 inline-flex items-center gap-1.5 text-xs bg-violet-600 text-white px-3 py-1.5 rounded hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingComment === key._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3" />
                            )}
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="text-sm text-neutral-600">
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Image Lightbox */}
            {expandedImage && (
              <div
                className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                onClick={() => setExpandedImage(null)}
              >
                <button
                  className="absolute top-4 right-4 text-white hover:text-neutral-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedImage(null);
                  }}
                >
                  <X className="h-8 w-8" />
                </button>
                <img
                  src={expandedImage}
                  alt="Expanded view"
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

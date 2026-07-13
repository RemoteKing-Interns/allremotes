"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Search, Upload, Loader2, ImageIcon } from "lucide-react";
import ProductImage from "./ProductImage";

interface MediaItem {
  key: string;
  url: string;
  signedUrl: string;
  size: number;
  lastModified: string;
  type: string;
  kind: string;
  extension: string;
}

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (urls: string[]) => void;
  onUpload: (files: File[]) => Promise<string[]>;
  existingImages?: string[];
  fallbackLetter?: string;
}

const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onUpload,
  existingImages = [],
  fallbackLetter,
}) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      let all: MediaItem[] = [];
      let token: string | null = null;
      let safety = 0;
      do {
        const res = await fetch(`/api/media${token ? `?token=${encodeURIComponent(token)}` : ""}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) throw new Error(data?.error || "Failed to load media");
        if (Array.isArray(data.items)) {
          all = [...all, ...data.items];
        }
        token = data.nextToken || null;
        safety++;
      } while (token && safety < 50);
      setItems(all);
    } catch (err: any) {
      setFetchError(err?.message || "Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelected(new Set());
      setSearch("");
      fetchMedia();
    }
  }, [isOpen]);

  const existingSet = useMemo(() => new Set(existingImages), [existingImages]);

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase().trim();
    return items.filter((item) => {
      if (item.kind !== "image") return false;
      if (existingSet.has(item.url)) return false;
      if (!term) return true;
      return item.key.toLowerCase().includes(term);
    });
  }, [items, search, existingSet]);

  const toggleSelection = (url: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls = await onUpload(files);
      if (Array.isArray(urls) && urls.length > 0) {
        onSelect(urls);
        onClose();
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddSelected = () => {
    if (selected.size === 0) return;
    onSelect([...selected]);
    onClose();
  };

  const filenameFromKey = (key: string) => key.split("/").pop() || key;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-4xl max-h-[90vh] flex-col rounded-xl bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-neutral-900">Media Library</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search media..."
              className="h-10 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-4 text-sm text-neutral-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading..." : "Upload New"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="mt-3 text-sm">Loading media...</p>
            </div>
          ) : fetchError ? (
            <div className="py-12 text-center text-red-600">
              <p className="font-medium">Failed to load media</p>
              <p className="mt-1 text-sm">{fetchError}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
              <ImageIcon className="h-10 w-10" />
              <p className="mt-2 text-sm">No images found.</p>
              <p className="text-xs">Upload new images or clear the search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredItems.map((item) => {
                const isSelected = selected.has(item.url);
                const filename = filenameFromKey(item.key);
                const letter = filename?.charAt(0)?.toUpperCase() || fallbackLetter || "?";

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleSelection(item.url)}
                    className={`group relative aspect-square rounded-lg border-2 bg-white transition hover:shadow-md ${
                      isSelected ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-neutral-200 hover:border-emerald-400"
                    }`}
                  >
                    <ProductImage
                      src={item.url}
                      alt={filename}
                      fallbackLetter={letter}
                      className="h-full w-full object-contain p-2"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-2 py-1 text-center text-xs text-white opacity-0 transition group-hover:opacity-100">
                      {filename}
                    </div>
                    {isSelected && (
                      <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3">
          <div className="text-sm text-neutral-600">
            {selected.size > 0 ? `${selected.size} selected` : "Click images to select"}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddSelected}
              disabled={selected.size === 0}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPickerModal;

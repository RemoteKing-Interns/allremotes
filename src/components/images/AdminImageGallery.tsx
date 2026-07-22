"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Trash2, Eye, Upload, GripVertical } from "lucide-react";
import ProductImage from "./ProductImage";
import MediaPickerModal from "./MediaPickerModal";
import { filterDummyImages, getFallbackLetter } from "@/lib/images";

interface AdminImageGalleryProps {
  product: any;
  images?: string[];
  onChange?: (images: string[]) => void;
  onUpload?: (files: File[]) => Promise<string[]>;
}

/**
 * Admin product image gallery.
 * Controlled by the parent, supports:
 *  - drag-and-drop reorder
 *  - multiple upload
 *  - delete
 *  - preview
 *  - broken-image badge
 *  - contiguous numbering (#1, #2, #3)
 */
const AdminImageGallery: React.FC<AdminImageGalleryProps> = ({
  product,
  images = [],
  onChange,
  onUpload,
}) => {
  const workingImages = useMemo(
    () => filterDummyImages(images.map((img) => String(img)).filter(Boolean)),
    [images]
  );
  const fallbackLetter = getFallbackLetter(product);

  useEffect(() => {
    setBrokenSet(new Set());
  }, [workingImages]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [brokenSet, setBrokenSet] = useState<Set<number>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);

    if (
      Number.isNaN(fromIndex) ||
      fromIndex === toIndex ||
      fromIndex < 0 ||
      fromIndex >= workingImages.length ||
      toIndex < 0 ||
      toIndex >= workingImages.length
    ) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...workingImages];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    onChange?.(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setBrokenSet(new Set());
  };

  const handleDelete = (index: number) => {
    const next = workingImages.filter((_, idx) => idx !== index);
    onChange?.(next);
  };

  const handleImageLoad = (index: number) => {
    setBrokenSet((prev) => {
      if (!prev.has(index)) return prev;
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const handleImageError = (index: number) => {
    setBrokenSet((prev) => new Set([...prev, index]));
  };

  const getBadge = (index: number) => {
    if (brokenSet.has(index)) return { label: "Broken", color: "bg-amber-500" };
    if (index === 0) return { label: "Main", color: "bg-emerald-500" };
    return { label: `#${index + 1}`, color: "bg-neutral-600" };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900">
          Media
          <span className="ml-2 text-sm font-normal text-neutral-400">
            ({workingImages.length} image{workingImages.length !== 1 ? "s" : ""})
          </span>
        </h3>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {workingImages.map((img, idx) => {
          const badge = getBadge(idx);
          const isDragging = draggedIndex === idx;
          const isDragOver = dragOverIndex === idx;

          return (
            <div
              key={`img-${idx}-${img}`}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, idx)}
              className={`relative group aspect-square rounded-lg border-2 overflow-hidden bg-neutral-50 cursor-move ${
                isDragging ? "ring-2 ring-blue-500 shadow-lg scale-[1.02] z-10" : ""
              } ${
                isDragOver
                  ? "ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/50"
                  : "border-neutral-300"
              }`}
            >
              <ProductImage
                src={img}
                alt={`Product image ${idx + 1}`}
                fallbackLetter={fallbackLetter}
                className="w-full h-full object-contain p-2"
                loading="lazy"
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                onLoad={() => handleImageLoad(idx)}
                onError={() => handleImageError(idx)}
              />

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewImage(img);
                  }}
                  className="p-2 bg-white rounded-lg text-blue-600 hover:bg-blue-50"
                  title="Preview"
                >
                  <Eye size={16} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(idx);
                  }}
                  className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Badge */}
              <span
                className={`absolute top-2 left-2 px-2 py-0.5 text-white text-xs font-medium rounded ${badge.color}`}
              >
                {badge.label}
              </span>

              {/* Drag Handle */}
              <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-70 transition-opacity text-white pointer-events-none">
                <GripVertical size={16} />
              </div>
            </div>
          );
        })}

        {/* Upload Area */}
        {onUpload && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="aspect-square rounded-lg border-2 border-dashed border-neutral-300 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-neutral-500 hover:text-emerald-600"
          >
            <Upload size={24} />
            <span className="text-xs font-medium">Upload Images</span>
          </button>
        )}
      </div>

      {/* Media Picker Modal */}
      {pickerOpen && onUpload && (
        <MediaPickerModal
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(urls) => {
            const unique = urls.filter((u) => !workingImages.includes(u));
            onChange?.([...workingImages, ...unique]);
            setBrokenSet(new Set());
          }}
          onUpload={onUpload}
          existingImages={workingImages}
          fallbackLetter={fallbackLetter}
        />
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative w-full h-full max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-2 -right-2 p-2 bg-white rounded-full shadow-lg hover:bg-neutral-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <ProductImage
              src={previewImage}
              alt="Preview"
              fallbackLetter={fallbackLetter}
              className="object-contain bg-white rounded-lg"
              loading="eager"
              fill
              sizes="(max-width: 1536px) 90vw, 90vw"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminImageGallery;

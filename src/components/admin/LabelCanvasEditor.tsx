"use client";

import React, { useRef, useState, useCallback } from "react";

export interface CanvasField {
  id: string;
  label: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontWeight?: string;
  dataKey?: string;
}

interface LabelCanvasEditorProps {
  fields: CanvasField[];
  layoutWidth?: number;
  layoutHeight?: number;
  onChange: (id: string, updates: Partial<CanvasField>) => void;
  onSelect?: (id: string | null) => void;
  onDragEnd?: () => void;
  selectedId?: string | null;
  scale?: number;
  showGrid?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
}

const ALIGN_THRESHOLD = 6;

export default function LabelCanvasEditor({
  fields,
  layoutWidth = 252,
  layoutHeight = 79,
  onChange,
  onSelect,
  onDragEnd,
  selectedId,
  scale = 3,
  showGrid = true,
  snapToGrid = true,
  gridSize = 5,
}: LabelCanvasEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, fx: 0, fy: 0, fw: 0, fh: 0 });
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });

  const snap = useCallback((val: number) => {
    if (!snapToGrid) return val;
    return Math.round(val / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

  const computeGuides = useCallback((activeField: CanvasField, allFields: CanvasField[]) => {
    const v: number[] = [];
    const h: number[] = [];

    // Canvas center
    v.push(layoutWidth / 2);
    h.push(layoutHeight / 2);

    // Other field edges
    for (const f of allFields) {
      if (f.id === activeField.id) continue;
      const fw = f.width || 240;
      const fh = f.height || 18;
      v.push(f.x, f.x + fw, f.x + fw / 2);
      h.push(f.y, f.y + fh, f.y + fh / 2);
    }

    return { v, h };
  }, [layoutWidth, layoutHeight]);

  const snapToGuides = useCallback(
    (val: number, guides: number[], isVertical: boolean) => {
      const size = isVertical ? (dragging ? (fields.find(f => f.id === dragging)?.width || 240) : 0) : (dragging ? (fields.find(f => f.id === dragging)?.height || 18) : 0);
      for (const g of guides) {
        if (Math.abs(val - g) < ALIGN_THRESHOLD) return g;
        if (size > 0 && Math.abs(val + size - g) < ALIGN_THRESHOLD) return g - size;
        if (size > 0 && Math.abs(val + size / 2 - g) < ALIGN_THRESHOLD) return g - size / 2;
      }
      return val;
    },
    [dragging, fields]
  );

  const handleMouseDown = (e: React.MouseEvent, field: CanvasField, mode: "drag" | "resize") => {
    e.stopPropagation();
    e.preventDefault();
    onSelect?.(field.id);
    setDragStart({
      mx: e.clientX,
      my: e.clientY,
      fx: field.x,
      fy: field.y,
      fw: field.width || 240,
      fh: field.height || 18,
    });
    if (mode === "drag") setDragging(field.id);
    else setResizing(field.id);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging && !resizing) return;
    const activeId = dragging || resizing;
    if (!activeId) return;

    const field = fields.find(f => f.id === activeId);
    if (!field) return;

    const dx = (e.clientX - dragStart.mx) / scale;
    const dy = (e.clientY - dragStart.my) / scale;

    if (dragging) {
      let newX = snap(dragStart.fx + dx);
      let newY = snap(dragStart.fy + dy);

      // Snap to alignment guides
      const allGuides = computeGuides(field, fields);
      newX = snapToGuides(newX, allGuides.v, true);
      newY = snapToGuides(newY, allGuides.h, false);

      // Clamp to canvas
      const fw = field.width || 240;
      const fh = field.height || 18;
      newX = Math.max(0, Math.min(newX, layoutWidth - fw));
      newY = Math.max(0, Math.min(newY, layoutHeight - fh));

      // Update visible guides
      const activeGuides: { v: number[]; h: number[] } = { v: [], h: [] };
      for (const g of allGuides.v) {
        if (Math.abs(newX - g) < ALIGN_THRESHOLD || Math.abs(newX + fw - g) < ALIGN_THRESHOLD || Math.abs(newX + fw / 2 - g) < ALIGN_THRESHOLD) {
          activeGuides.v.push(g);
        }
      }
      for (const g of allGuides.h) {
        if (Math.abs(newY - g) < ALIGN_THRESHOLD || Math.abs(newY + fh - g) < ALIGN_THRESHOLD || Math.abs(newY + fh / 2 - g) < ALIGN_THRESHOLD) {
          activeGuides.h.push(g);
        }
      }
      setGuides(activeGuides);

      onChange(field.id, { x: Math.round(newX), y: Math.round(newY) });
    }

    if (resizing) {
      let newW = snap(dragStart.fw + dx);
      let newH = snap(dragStart.fh + dy);
      newW = Math.max(20, Math.min(newW, layoutWidth - field.x));
      newH = Math.max(10, Math.min(newH, layoutHeight - field.y));
      onChange(field.id, { width: Math.round(newW), height: Math.round(newH) });
    }
  }, [dragging, resizing, dragStart, fields, scale, snap, computeGuides, snapToGuides, layoutWidth, layoutHeight, onChange]);

  const handleMouseUp = useCallback(() => {
    if (dragging || resizing) onDragEnd?.();
    setDragging(null);
    setResizing(null);
    setGuides({ v: [], h: [] });
  }, [dragging, resizing, onDragEnd]);

  const handleCanvasClick = () => {
    onSelect?.(null);
  };

  const gridStyle = showGrid
    ? {
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize * scale}px ${gridSize * scale}px`,
      }
    : {};

  return (
    <div
      ref={canvasRef}
      className="relative bg-white border-2 border-dashed border-neutral-300 rounded-lg mx-auto select-none"
      style={{
        width: `${layoutWidth * scale}px`,
        height: `${layoutHeight * scale}px`,
        maxWidth: '100%',
        ...gridStyle,
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      {/* Alignment guides */}
      {guides.v.map((x, i) => (
        <div
          key={`v-${i}`}
          className="absolute bg-red-400 pointer-events-none"
          style={{ left: `${x * scale}px`, top: 0, width: '1px', height: '100%' }}
        />
      ))}
      {guides.h.map((y, i) => (
        <div
          key={`h-${i}`}
          className="absolute bg-red-400 pointer-events-none"
          style={{ top: `${y * scale}px`, left: 0, height: '1px', width: '100%' }}
        />
      ))}

      {fields.map((field) => {
        const isSelected = selectedId === field.id;
        const fw = field.width || 240;
        const fh = field.height || 18;
        return (
          <div
            key={field.id}
            className={`absolute rounded cursor-move transition-shadow ${
              isSelected
                ? 'bg-blue-100 border-2 border-blue-500 shadow-md z-10'
                : 'bg-blue-50 border border-blue-200 hover:border-blue-300'
            }`}
            style={{
              left: `${field.x * scale}px`,
              top: `${field.y * scale}px`,
              width: `${fw * scale}px`,
              height: `${fh * scale}px`,
              overflow: 'hidden',
            }}
            onMouseDown={(e) => handleMouseDown(e, field, "drag")}
          >
            <span
              className="block px-1 truncate text-blue-900 font-medium"
              style={{
                fontSize: `${Math.max(8, (field.fontSize || 12) * (scale / 3))}px`,
                fontWeight: field.fontWeight,
                lineHeight: `${fh * scale}px`,
              }}
            >
              {field.label}
            </span>
            {isSelected && (
              <>
                {/* Resize handle - bottom right */}
                <div
                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-se-resize"
                  onMouseDown={(e) => handleMouseDown(e, field, "resize")}
                />
                {/* Position label */}
                <div className="absolute -top-5 left-0 text-[10px] text-blue-600 font-mono whitespace-nowrap pointer-events-none">
                  {field.x},{field.y} · {fw}×{fh}
                </div>
              </>
            )}
          </div>
        );
      })}
      {fields.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm">
          Add fields to see layout
        </div>
      )}
    </div>
  );
}

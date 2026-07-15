"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, Printer, Star, Eye, Copy } from "lucide-react";
import type { LabelTemplate, LabelField } from "../../lib/dymo";
import {
  loadDymoFramework,
  renderLabelFromOptions,
  getSelectedDymoPrinter,
  getSelectedLabelTemplateId,
  setSelectedLabelTemplateId,
} from "../../lib/dymo";
import LabelCanvasEditor from "./LabelCanvasEditor";

export default function LabelTemplatesSection() {
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<LabelTemplate | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [saving, setSaving] = useState(false);
  const [defaultTemplateId, setDefaultTemplateId] = useState("");
  const [preview, setPreview] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [dymoReady, setDymoReady] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);

  const availableFields: Array<{ id: string; label: string; type: LabelField['type'] }> = [
    { id: 'orderId', label: 'Order ID', type: 'text' },
    { id: 'customerName', label: 'Customer Name', type: 'text' },
    { id: 'customerEmail', label: 'Customer Email', type: 'text' },
    { id: 'customerPhone', label: 'Contact Number', type: 'text' },
    { id: 'address', label: 'Street Address', type: 'text' },
    { id: 'suburb', label: 'Suburb', type: 'text' },
    { id: 'state', label: 'State', type: 'text' },
    { id: 'postcode', label: 'Postcode', type: 'text' },
    { id: 'items', label: 'Product List', type: 'text' },
    { id: 'barcode', label: 'Barcode', type: 'barcode' },
    { id: 'qrcode', label: 'QR Code', type: 'qrcode' },
  ];

  useEffect(() => {
    loadTemplates();
    setDefaultTemplateId(getSelectedLabelTemplateId());
    loadDymoFramework().then(() => setDymoReady(true)).catch(() => setDymoReady(false));
  }, []);

  const generatePreview = useCallback(async (template: LabelTemplate | null) => {
    if (!template || template.fields.length === 0) { setPreview(""); return; }
    setPreviewing(true);
    try {
      const printerName = getSelectedDymoPrinter();
      const dataUri = await renderLabelFromOptions({
        orderId: 'PREVIEW',
        customerName: 'John Smith',
        customerEmail: 'john@example.com',
        customerPhone: '0400 000 000',
        address: '123 Sample Street',
        suburb: 'Sampleville',
        state: 'NSW',
        postcode: '2000',
        items: [{ name: 'Sample Product', quantity: 1 }],
        template,
        printerName,
        fieldValues: {
          customerName: 'John Smith',
          customerEmail: 'john@example.com',
          customerPhone: '0400 000 000',
          address: '123 Sample Street',
          suburb: 'Sampleville',
          state: 'NSW',
          postcode: '2000',
          orderId: 'PREVIEW',
          items: '1x Sample Product',
        },
      });
      setPreview(dataUri);
    } catch (err) {
      console.error('Preview failed:', err);
      setPreview("");
    } finally {
      setPreviewing(false);
    }
  }, []);

  useEffect(() => {
    if (dymoReady && selectedTemplate) {
      const timer = setTimeout(() => void generatePreview(selectedTemplate), 300);
      return () => clearTimeout(timer);
    }
  }, [selectedTemplate, dymoReady, generatePreview]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch("/api/admin/label-templates");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setTemplates(list);
      const defaultId = getSelectedLabelTemplateId();
      if (defaultId && list.find(t => t.id === defaultId)) {
        setSelectedTemplate(list.find(t => t.id === defaultId) || null);
      } else if (list.length > 0) {
        setSelectedTemplate(list[0]);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const createNewTemplate = () => {
    const newTemplate: LabelTemplate = {
      id: `template_${Date.now()}`,
      name: 'New Template',
      fields: [
        { id: 'customerName_1', type: 'text', label: 'Customer Name', dataKey: 'customerName', x: 5, y: 8, width: 240, height: 18, fontSize: 14, fontWeight: 'bold' },
        { id: 'address_1', type: 'text', label: 'Address', dataKey: 'address', x: 5, y: 28, width: 240, height: 16, fontSize: 11, fontWeight: 'normal' },
        { id: 'suburb_1', type: 'text', label: 'Suburb', dataKey: 'suburb', x: 5, y: 46, width: 120, height: 14, fontSize: 10, fontWeight: 'normal' },
        { id: 'state_1', type: 'text', label: 'State', dataKey: 'state', x: 130, y: 46, width: 50, height: 14, fontSize: 10, fontWeight: 'normal' },
        { id: 'postcode_1', type: 'text', label: 'Postcode', dataKey: 'postcode', x: 185, y: 46, width: 60, height: 14, fontSize: 10, fontWeight: 'normal' },
      ],
      layout: { width: 252, height: 79 },
    };
    setTemplates([...templates, newTemplate]);
    setSelectedTemplate(newTemplate);
  };

  const duplicateTemplate = (tmpl: LabelTemplate) => {
    const copy: LabelTemplate = {
      ...tmpl,
      id: `template_${Date.now()}`,
      name: `${tmpl.name} (Copy)`,
      fields: tmpl.fields.map(f => ({ ...f, id: `${f.id}_${Date.now()}` })),
    };
    setTemplates([...templates, copy]);
    setSelectedTemplate(copy);
  };

  const addFieldToTemplate = (fieldId: string, fieldType: LabelField['type']) => {
    if (!selectedTemplate) return;

    const field = availableFields.find(f => f.id === fieldId);
    if (!field) return;

    const newField: LabelField = {
      id: `${fieldId}_${Date.now()}`,
      type: fieldType,
      label: field.label,
      dataKey: fieldId,
      x: 10,
      y: 10 + (selectedTemplate.fields.length * 20),
      width: 240,
      height: 18,
      fontSize: 12,
      fontWeight: 'normal',
    };

    const updatedTemplate = {
      ...selectedTemplate,
      fields: [...selectedTemplate.fields, newField],
    };

    setSelectedTemplate(updatedTemplate);
    setTemplates(templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
  };

  const removeFieldFromTemplate = (fieldId: string) => {
    if (!selectedTemplate) return;

    const updatedTemplate = {
      ...selectedTemplate,
      fields: selectedTemplate.fields.filter(f => f.id !== fieldId),
    };

    setSelectedTemplate(updatedTemplate);
    setTemplates(templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
  };

  const updateFieldPosition = (fieldId: string, x: number, y: number) => {
    if (!selectedTemplate) return;

    const updatedTemplate = {
      ...selectedTemplate,
      fields: selectedTemplate.fields.map(f =>
        f.id === fieldId ? { ...f, x, y } : f
      ),
    };

    setSelectedTemplate(updatedTemplate);
    setTemplates(templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
  };

  const updateFieldStyle = (fieldId: string, style: Partial<LabelField>) => {
    if (!selectedTemplate) return;

    const updatedTemplate = {
      ...selectedTemplate,
      fields: selectedTemplate.fields.map(f =>
        f.id === fieldId ? { ...f, ...style } : f
      ),
    };

    setSelectedTemplate(updatedTemplate);
    setTemplates(templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
  };

  const saveTemplate = async () => {
    if (!selectedTemplate) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/label-templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(selectedTemplate),
      });

      if (!res.ok) throw new Error("Failed to save template");

      await loadTemplates();
    } catch (error) {
      console.error("Failed to save template:", error);
      alert("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await fetch(`/api/admin/label-templates?id=${id}`, { method: 'DELETE' });
      if (defaultTemplateId === id) {
        setSelectedLabelTemplateId('');
        setDefaultTemplateId('');
      }
      await loadTemplates();
    } catch (error) {
      alert('Failed to delete template');
    }
  };

  const setAsDefault = (id: string) => {
    setSelectedLabelTemplateId(id);
    setDefaultTemplateId(id);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Label Templates</h1>
          <p className="mt-2 text-neutral-600">
            Customize DYMO label templates for shipping labels. Add fields, set boundaries, and preview in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Template List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-neutral-900">Templates</h2>
                <button
                  onClick={createNewTemplate}
                  className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  title="New template"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-neutral-900 truncate">{template.name}</p>
                      {defaultTemplateId === template.id && (
                        <Star size={14} className="text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">{template.fields.length} fields</p>
                    <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                      {defaultTemplateId !== template.id && (
                        <button
                          onClick={() => setAsDefault(template.id)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Set default
                        </button>
                      )}
                      <button
                        onClick={() => duplicateTemplate(template)}
                        className="text-xs text-neutral-500 hover:underline"
                      >
                        <Copy size={11} className="inline" /> Duplicate
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        <Trash2 size={11} className="inline" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
                {templates.length === 0 && !loadingTemplates && (
                  <p className="text-sm text-neutral-500 text-center py-4">No templates yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Template Editor */}
          <div className="lg:col-span-3">
            {selectedTemplate ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={selectedTemplate.name}
                      onChange={(e) => {
                        const updated = { ...selectedTemplate, name: e.target.value };
                        setSelectedTemplate(updated);
                        setTemplates(templates.map(t => t.id === updated.id ? updated : t));
                      }}
                      className="text-xl font-bold text-neutral-900 border-none focus:outline-none focus:ring-0"
                    />
                    {defaultTemplateId === selectedTemplate.id && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        <Star size={12} className="fill-amber-500" /> Default
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {defaultTemplateId !== selectedTemplate.id && (
                      <button
                        onClick={() => setAsDefault(selectedTemplate.id)}
                        className="flex items-center gap-2 px-3 py-2 border border-neutral-300 rounded-lg text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                      >
                        <Star size={16} />
                        Set as default
                      </button>
                    )}
                    <button
                      onClick={saveTemplate}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save size={16} />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Fields & Controls */}
                  <div className="space-y-4">
                    {/* Add fields */}
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-3">Add Field</h3>
                      <div className="flex flex-wrap gap-2">
                        {availableFields.map((field) => {
                          const exists = selectedTemplate.fields.some(f => f.dataKey === field.id);
                          return (
                            <button
                              key={field.id}
                              disabled={exists}
                              onClick={() => addFieldToTemplate(field.id, field.type)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 bg-white hover:bg-blue-50 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Plus size={12} className="text-blue-600" />
                              {field.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Field list with full boundary controls */}
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-3">Fields & Boundaries</h3>
                      <div className="space-y-3">
                        {selectedTemplate.fields.length === 0 && (
                          <p className="text-sm text-neutral-400 py-4 text-center">No fields. Add one above.</p>
                        )}
                        {selectedTemplate.fields.map((field) => (
                          <div key={field.id} className="p-3 bg-neutral-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-neutral-800">{field.label}</span>
                              <button
                                onClick={() => removeFieldFromTemplate(field.id)}
                                className="text-red-500 hover:text-red-700"
                                title="Remove field"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="grid grid-cols-6 gap-2">
                              {[
                                { prop: 'x', label: 'X', min: 0, max: 252 },
                                { prop: 'y', label: 'Y', min: 0, max: 79 },
                                { prop: 'width', label: 'W', min: 20, max: 252 },
                                { prop: 'height', label: 'H', min: 10, max: 79 },
                                { prop: 'fontSize', label: 'Font', min: 6, max: 32 },
                              ].map(({ prop, label: plabel, min, max }) => (
                                <div key={prop}>
                                  <label className="block text-[10px] text-neutral-500 mb-0.5">{plabel}</label>
                                  <input
                                    type="number"
                                    value={(field as any)[prop] ?? (prop === 'width' ? 240 : prop === 'height' ? 18 : prop === 'fontSize' ? 12 : 0)}
                                    min={min}
                                    max={max}
                                    onChange={(e) => updateFieldStyle(field.id, { [prop]: parseInt(e.target.value) || 0 } as any)}
                                    className="w-full px-1.5 py-1 text-xs border border-neutral-300 rounded"
                                  />
                                </div>
                              ))}
                              <div>
                                <label className="block text-[10px] text-neutral-500 mb-0.5">Weight</label>
                                <select
                                  value={field.fontWeight || 'normal'}
                                  onChange={(e) => updateFieldStyle(field.id, { fontWeight: e.target.value })}
                                  className="w-full px-1 py-1 text-xs border border-neutral-300 rounded"
                                >
                                  <option value="normal">Normal</option>
                                  <option value="bold">Bold</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Visual layout editor */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-neutral-900">Layout Editor</h3>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showGrid}
                              onChange={(e) => setShowGrid(e.target.checked)}
                              className="h-3 w-3 accent-blue-600"
                            />
                            Grid
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={snapToGrid}
                              onChange={(e) => setSnapToGrid(e.target.checked)}
                              className="h-3 w-3 accent-blue-600"
                            />
                            Snap
                          </label>
                        </div>
                      </div>
                      <LabelCanvasEditor
                        fields={selectedTemplate.fields}
                        layoutWidth={selectedTemplate.layout.width}
                        layoutHeight={selectedTemplate.layout.height}
                        onChange={(id, updates) => {
                          const updated = {
                            ...selectedTemplate,
                            fields: selectedTemplate.fields.map(f => f.id === id ? { ...f, ...updates } : f),
                          };
                          setSelectedTemplate(updated);
                          setTemplates(templates.map(t => t.id === updated.id ? updated : t));
                        }}
                        onSelect={setSelectedFieldId}
                        selectedId={selectedFieldId}
                        showGrid={showGrid}
                        snapToGrid={snapToGrid}
                        onDragEnd={() => void generatePreview(selectedTemplate)}
                      />
                      <p className="text-xs text-neutral-400 mt-2 text-center">
                        Drag to move · Drag corner to resize · Red lines show alignment · Values in points (1/72 inch)
                      </p>
                    </div>
                  </div>

                  {/* Right: Live DYMO Preview */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-neutral-900">Live DYMO Preview</h3>
                      <button
                        onClick={() => void generatePreview(selectedTemplate)}
                        disabled={previewing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
                      >
                        <Eye size={14} />
                        {previewing ? 'Generating...' : 'Refresh'}
                      </button>
                    </div>
                    <div className="flex items-center justify-center min-h-[250px] rounded-lg border border-neutral-200 bg-neutral-50 p-4 sticky top-4">
                      {previewing ? (
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      ) : preview ? (
                        <img
                          src={preview}
                          alt="Label preview"
                          className="rounded-lg border border-neutral-200 bg-white shadow-sm"
                          style={{ maxHeight: 400, width: 'auto' }}
                        />
                      ) : (
                        <div className="text-center">
                          <Printer size={48} className="mx-auto text-neutral-300 mb-3" />
                          <p className="text-sm text-neutral-400">
                            {dymoReady ? 'Add fields to see preview' : 'DYMO Connect not detected'}
                          </p>
                        </div>
                      )}
                    </div>
                    {!dymoReady && (
                      <p className="mt-2 text-xs text-amber-600">
                        DYMO Connect service is not running. Preview requires DYMO Connect to be installed and running.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Printer size={48} className="mx-auto text-neutral-300 mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Template Selected</h3>
                <p className="text-neutral-600 mb-4">Select a template from the list or create a new one</p>
                <button
                  onClick={createNewTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Create Template
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

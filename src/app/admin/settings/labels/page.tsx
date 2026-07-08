"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import { Plus, Trash2, Save, Printer, Download, Upload } from "lucide-react";
import type { LabelTemplate, LabelField } from "../../../../lib/dymo";

export default function LabelSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<LabelTemplate | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [saving, setSaving] = useState(false);

  // Available fields for drag-and-drop
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
    if (!loading && !user) {
      router.push("/admin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch("/api/admin/label-templates");
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedTemplate(data[0]);
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
      fields: [],
      layout: { width: 72, height: 252 },
    };
    setTemplates([...templates, newTemplate]);
    setSelectedTemplate(newTemplate);
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
      y: 10 + (selectedTemplate.fields.length * 30),
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
      alert("Template saved successfully");
    } catch (error) {
      console.error("Failed to save template:", error);
      alert("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Label Templates</h1>
          <p className="mt-2 text-neutral-600">
            Customize DYMO label templates for shipping labels. Drag and drop fields to design your label layout.
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
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`w-full text-left p-3 rounded-lg border ${
                      selectedTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <p className="font-medium text-neutral-900">{template.name}</p>
                    <p className="text-xs text-neutral-500">{template.fields.length} fields</p>
                  </button>
                ))}
                {templates.length === 0 && (
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
                  <div className="flex gap-2">
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
                  {/* Available Fields */}
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-4">Available Fields</h3>
                    <div className="space-y-2">
                      {availableFields.map((field) => (
                        <button
                          key={field.id}
                          onClick={() => addFieldToTemplate(field.id, field.type)}
                          className="w-full flex items-center gap-3 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-left"
                        >
                          <Plus size={16} className="text-blue-600" />
                          <span className="font-medium text-neutral-900">{field.label}</span>
                          <span className="text-xs text-neutral-500 ml-auto capitalize">{field.type}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Label Preview */}
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-4">Label Preview</h3>
                    <div
                      className="relative bg-white border-2 border-dashed border-neutral-300 rounded-lg mx-auto"
                      style={{
                        width: `${selectedTemplate.layout.width * 3}px`,
                        height: `${selectedTemplate.layout.height * 3}px`,
                        maxWidth: '100%',
                      }}
                    >
                      {selectedTemplate.fields.map((field) => (
                        <div
                          key={field.id}
                          className="absolute p-2 bg-blue-50 border border-blue-200 rounded cursor-move"
                          style={{
                            left: `${field.x * 3}px`,
                            top: `${field.y * 3}px`,
                            fontSize: `${field.fontSize}px`,
                            fontWeight: field.fontWeight,
                          }}
                          draggable
                          onDragEnd={(e) => {
                            const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                            if (rect) {
                              const x = Math.round((e.clientX - rect.left) / 3);
                              const y = Math.round((e.clientY - rect.top) / 3);
                              updateFieldPosition(field.id, Math.max(0, x), Math.max(0, y));
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-blue-900">{field.label}</span>
                            <button
                              onClick={() => removeFieldFromTemplate(field.id)}
                              className="p-1 hover:bg-red-100 rounded"
                            >
                              <Trash2 size={12} className="text-red-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {selectedTemplate.fields.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm">
                          Drag fields here
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Field Style Editor */}
                {selectedTemplate.fields.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-neutral-200">
                    <h3 className="font-semibold text-neutral-900 mb-4">Field Styles</h3>
                    <div className="space-y-4">
                      {selectedTemplate.fields.map((field) => (
                        <div key={field.id} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg">
                          <span className="font-medium text-neutral-900 w-32">{field.label}</span>
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-neutral-600">Size:</label>
                            <input
                              type="number"
                              value={field.fontSize}
                              onChange={(e) => updateFieldStyle(field.id, { fontSize: parseInt(e.target.value) })}
                              className="w-16 px-2 py-1 border border-neutral-300 rounded"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-neutral-600">Weight:</label>
                            <select
                              value={field.fontWeight}
                              onChange={(e) => updateFieldStyle(field.id, { fontWeight: e.target.value })}
                              className="px-2 py-1 border border-neutral-300 rounded"
                            >
                              <option value="normal">Normal</option>
                              <option value="bold">Bold</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

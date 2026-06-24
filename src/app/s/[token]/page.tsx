"use client";

import { use, useEffect, useState } from "react";
import ProductSpreadsheet from "../../../components/admin/ProductSpreadsheet";
import { Share2, Lock, Clock, AlertCircle } from "lucide-react";

export default function SharedSpreadsheet({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;
  const [permission, setPermission] = useState<"read" | "edit" | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [createdBy, setCreatedBy] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [shareConfig, setShareConfig] = useState<{ columns: string[]; shareMode: string } | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/admin/spreadsheet/share?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Invalid or expired link");
          setLoading(false);
          return;
        }

        setPermission(data.permission);
        setExpiresAt(new Date(data.expiresAt));
        setCreatedBy(data.createdBy);
        setShareConfig({ columns: data.columns || [], shareMode: data.shareMode || "all" });
        setLoading(false);
      } catch {
        setError("Failed to validate access link");
        setLoading(false);
      }
    };
    validateToken();
  }, [token]);

  const formatTimeRemaining = () => {
    if (!expiresAt) return "";
    const diff = expiresAt.getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m remaining` : `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
            <h2 className="text-xl font-semibold text-neutral-900">Access Denied</h2>
          </div>
          <p className="text-neutral-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-50 overflow-hidden">
      {/* Compact Info Bar */}
      <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-4 py-2 flex items-center gap-4">
        <div className="flex items-center">
          <Share2 className="h-4 w-4 text-emerald-600 mr-1.5" />
          <span className="text-sm font-medium text-neutral-700">Shared Spreadsheet</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center">
            <Lock className={`h-3.5 w-3.5 mr-1 ${permission === "read" ? "text-amber-500" : "text-green-500"}`} />
            <span className={`font-medium ${permission === "read" ? "text-amber-600" : "text-green-600"}`}>
              {permission === "read" ? "Read Only" : "Can Edit"}
            </span>
          </div>
          <div className="flex items-center text-neutral-500">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>{formatTimeRemaining()}</span>
          </div>
          <span className="text-neutral-400">
            Shared by: <span className="text-neutral-600 font-medium">{(!createdBy || createdBy === "unknown") ? "AllRemotes" : createdBy}</span>
          </span>
        </div>
      </div>

      {/* Full-screen spreadsheet */}
      <div className="flex-1 overflow-auto p-2">
        <ProductSpreadsheet
          onBack={() => {}}
          readOnly={true}
          shareConfig={shareConfig}
          fullHeight
        />
      </div>
    </div>
  );
}

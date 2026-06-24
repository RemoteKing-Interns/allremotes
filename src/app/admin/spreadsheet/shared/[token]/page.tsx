"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductSpreadsheet from "../../../../../components/admin/ProductSpreadsheet";
import { Share2, Lock, Clock, AlertCircle } from "lucide-react";

export default function SharedSpreadsheet({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [token, setToken] = useState(resolvedParams.token);
  const [permission, setPermission] = useState<"read" | "edit" | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [createdBy, setCreatedBy] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [shareConfig, setShareConfig] = useState<{ columns: string[]; shareMode: string } | null>(null);

  useEffect(() => {
    validateToken();
  }, [token]);

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
      setShareConfig({
        columns: data.columns || [],
        shareMode: data.shareMode || "all"
      });
      setLoading(false);
    } catch (err: any) {
      setError("Failed to validate access link");
      setLoading(false);
    }
  };

  const formatTimeRemaining = () => {
    if (!expiresAt) return "";
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
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
          <p className="text-neutral-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/admin")}
            className="w-full bg-emerald-600 text-white rounded-lg py-2 px-4 hover:bg-emerald-700 transition-colors"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Access Info Bar */}
        <div className="mb-6 bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Share2 className="h-5 w-5 text-emerald-600 mr-2" />
                <span className="text-sm font-medium text-neutral-700">Shared Spreadsheet</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  {permission === "read" ? (
                    <Lock className="h-4 w-4 text-amber-500 mr-1" />
                  ) : (
                    <Lock className="h-4 w-4 text-green-500 mr-1" />
                  )}
                  <span className={`text-xs font-medium ${
                    permission === "read" ? "text-amber-600" : "text-green-600"
                  }`}>
                    {permission === "read" ? "Read Only" : "Can Edit"}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-neutral-500 mr-1" />
                  <span className="text-xs text-neutral-600">{formatTimeRemaining()}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => router.push("/admin")}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Admin Panel →
            </button>
          </div>
          
          {createdBy && (
            <div className="mt-2 text-xs text-neutral-500">
              Shared by: {createdBy}
              {shareConfig && shareConfig.shareMode === "selected" && (
                <span className="ml-2">
                  ({shareConfig.columns.length} columns selected)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Spreadsheet */}
        <ProductSpreadsheet 
          onBack={() => router.push("/admin")} 
          readOnly={permission === "read"}
          shareConfig={shareConfig}
        />
      </div>
    </div>
  );
}

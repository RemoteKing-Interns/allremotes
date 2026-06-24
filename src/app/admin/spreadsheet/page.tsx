"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import ProductSpreadsheet from "../../../components/admin/ProductSpreadsheet";
import { useRouter } from "next/navigation";
import { Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";

export default function AdminSpreadsheet() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 relative">
      {/* Floating Controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white rounded-lg shadow-lg border border-neutral-200 p-2">
        <button
          onClick={handleZoomOut}
          className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleZoomReset}
          className="px-2 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors min-w-[3rem] text-center"
        >
          {zoomLevel}%
        </button>
        <button
          onClick={handleZoomIn}
          className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <div className="w-px h-6 bg-neutral-300 mx-1" />
        <button
          onClick={toggleFullscreen}
          className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* Main Content */}
      <div 
        className={`${isFullscreen ? 'h-screen overflow-auto' : 'min-h-screen'}`}
        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
      >
        {isFullscreen ? (
          <div className="p-4">
            <ProductSpreadsheet onBack={() => router.push("/admin")} />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-neutral-900">Product Spreadsheet</h1>
              <p className="text-sm text-neutral-600 mt-1">
                Excel-like product editor. Share this URL: {typeof window !== 'undefined' ? window.location.href : ''}
              </p>
            </div>
            
            <ProductSpreadsheet onBack={() => router.push("/admin")} />
          </div>
        )}
      </div>
    </div>
  );
}

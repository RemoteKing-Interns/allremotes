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
    <div className="h-screen w-screen flex flex-col bg-neutral-50 overflow-hidden">
      {/* Floating Controls */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-1 bg-white rounded-lg shadow-lg border border-neutral-200 p-1.5">
        <button
          onClick={handleZoomOut}
          className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={handleZoomReset}
          className="px-2 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors min-w-[3rem] text-center"
        >
          {zoomLevel}%
        </button>
        <button
          onClick={handleZoomIn}
          className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>
        <div className="w-px h-5 bg-neutral-300 mx-1" />
        <button
          onClick={toggleFullscreen}
          className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>

      {/* Spreadsheet fills full viewport */}
      <div
        className="flex-1 overflow-auto p-3"
        style={{ zoom: `${zoomLevel}%` }}
      >
        <ProductSpreadsheet onBack={() => router.push("/admin")} fullHeight />
      </div>
    </div>
  );
}

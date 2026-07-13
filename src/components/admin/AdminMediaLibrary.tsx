"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Film,
  FileText,
  Music,
  File,
  FolderOpen,
  Trash2,
  Copy,
  Upload,
  Search,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface MediaItem {
  key: string;
  url: string;
  signedUrl?: string;
  size: number;
  lastModified: string;
  type: string;
  kind: string;
  extension: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileKind(key: string, extension: string) {
  if (key.endsWith("/")) return "folder";
  const ext = extension.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "avif", "bmp", "ico"].includes(ext)) {
    return "image";
  }
  if (["mp4", "webm", "ogg", "ogv", "mov", "mkv", "avi"].includes(ext)) return "video";
  if (["mp3", "wav", "m4a", "ogg", "oga", "flac"].includes(ext)) return "audio";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "json"].includes(ext)) {
    return "document";
  }
  return "other";
}

function kindIcon(kind: string, className: string) {
  if (kind === "image") return <Image className={className} />;
  if (kind === "video") return <Film className={className} />;
  if (kind === "audio") return <Music className={className} />;
  if (kind === "pdf") return <FileText className={className} />;
  if (kind === "document") return <FileText className={className} />;
  if (kind === "folder") return <FolderOpen className={className} />;
  return <File className={className} />;
}

const AdminMediaLibrary: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterKind, setFilterKind] = useState("all");
  const [prefixFilter, setPrefixFilter] = useState("");
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    setLoading(true);
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
        setConfigured(data.configured !== false);
        if (Array.isArray(data.items)) {
          all = [...all, ...data.items];
        }
        token = data.nextToken || null;
        safety++;
      } while (token && safety < 50);
      setItems(all);
    } catch (err: any) {
      console.error("Media load error:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (item.key.endsWith("/")) continue;
      const parts = item.key.split("/");
      const prefix = parts.length > 1 ? parts[0] + "/" : "__other__/";
      counts.set(prefix, (counts.get(prefix) || 0) + 1);
    }
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    const otherPrefix = "__other__/";
    let result = [...items];

    if (prefixFilter === "") {
      // Root view shows folders only
      result = result.filter((item) => item.kind === "folder");
    } else if (prefixFilter === "__other__") {
      // Other folder contains un-prefixed files
      result = result.filter((item) => item.kind !== "folder" && !item.key.includes("/"));
    } else {
      // Inside a real folder
      result = result.filter((item) => item.kind !== "folder" && item.key.startsWith(prefixFilter));
    }

    const otherCount = folderCounts.get(otherPrefix) || 0;
    if (prefixFilter === "" && otherCount > 0 && !result.some((i) => i.key === otherPrefix)) {
      result.push({
        key: otherPrefix,
        url: "",
        signedUrl: "",
        size: 0,
        lastModified: new Date().toISOString(),
        type: "folder",
        kind: "folder",
        extension: "",
      });
    }

    result = result.filter((item) => {
      const kind = getFileKind(item.key, item.extension);
      const matchesSearch = item.key.toLowerCase().includes(search.toLowerCase());
      const matchesKind = filterKind === "all" || kind === filterKind || (prefixFilter === "" && kind === "folder");
      return matchesSearch && matchesKind;
    });

    return result.sort((a, b) => {
      const aKind = getFileKind(a.key, a.extension);
      const bKind = getFileKind(b.key, b.extension);
      const aFolder = aKind === "folder" ? 0 : 1;
      const bFolder = bKind === "folder" ? 0 : 1;
      if (aFolder !== bFolder) return aFolder - bFolder;
      return a.key.localeCompare(b.key);
    });
  }, [items, search, filterKind, prefixFilter, folderCounts]);

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("files", file));
      const res = await fetch("/api/media", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.details ? `${data.error}: ${data.details}` : data?.error || "Upload failed");
      await fetchMedia();
    } catch (err: any) {
      alert(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    if (!confirm("This will permanently delete the file from S3. Confirm again?")) return;
    setDeletingKey(key);
    try {
      const res = await fetch("/api/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      await fetchMedia();
    } catch (err: any) {
      alert(err?.message || "Delete failed");
    } finally {
      setDeletingKey(null);
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied((prev) => (prev === url ? null : prev)), 1500);
    } catch {
      alert("Copy failed");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    uploadFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  if (!configured) {
    return (
      <div className="animate-in fade-in duration-300">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Content</h1>
        <p className="mt-1 text-sm text-neutral-500">S3 is not configured. Media library cannot be used.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Content</h1>
          <p className="mt-1 text-sm text-neutral-500">Upload, browse, copy URLs, and manage media in the S3 bucket.</p>
          <p className="mt-1 text-xs text-amber-700">
            Previews use signed S3 links. The <strong>Copy</strong> button gives the public URL, which works only if the S3 bucket/objects are public.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading..." : "Upload Files"}
        </button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files)} />
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`mb-8 rounded-xl border-2 border-dashed p-8 text-center transition ${
          dragging ? "border-primary bg-primary/5" : "border-neutral-300 bg-white"
        }`}
      >
        <Upload className="mx-auto h-8 w-8 text-neutral-400" />
        <p className="mt-2 text-sm text-neutral-600">Drag and drop files here, or click Upload Files</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename"
            className="h-11 w-full rounded-lg border border-neutral-300 bg-white pl-10 pr-10 text-sm text-neutral-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={filterKind}
          onChange={(e) => setFilterKind(e.target.value)}
          className="h-11 rounded-lg border border-neutral-300 bg-white px-4 text-sm text-neutral-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="audio">Audio</option>
          <option value="pdf">PDFs</option>
          <option value="document">Documents</option>
          <option value="folder">Folders</option>
          <option value="other">Other</option>
        </select>
      </div>

      {prefixFilter && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-neutral-500">Filtered by folder:</span>
          <span className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-800">{prefixFilter === "__other__" ? "Other" : prefixFilter}</span>
          <button
            onClick={() => setPrefixFilter("")}
            className="flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center text-sm font-medium text-neutral-500">
          No media found.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredItems.map((item) => {
            const kind = getFileKind(item.key, item.extension);
            const isFolder = kind === "folder";
            const isImage = kind === "image";
            const isVideo = kind === "video";
            const isAudio = kind === "audio";
            const isOtherFolder = isFolder && item.key === "__other__/";
            const filename = isOtherFolder ? "Other" : isFolder ? item.key : item.key.split("/").pop() || item.key;
            const subtitle = isOtherFolder ? "Files not in any folder" : item.key;

            return (
              <div
                key={item.key}
                onClick={() => isFolder && setPrefixFilter(isOtherFolder ? "__other__" : item.key)}
                className={`group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md ${
                  isFolder ? "cursor-pointer hover:bg-neutral-50" : ""
                }`}
              >
                <div className="relative flex aspect-square items-center justify-center bg-neutral-50 p-2">
                  {isImage ? (
                    <div className="relative flex h-full w-full items-center justify-center">
                      {kindIcon(kind, "absolute h-12 w-12 text-neutral-300")}
                      <img
                        src={item.signedUrl || item.url}
                        alt={filename}
                        className="absolute inset-0 z-10 h-full w-full object-contain p-2"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  ) : isVideo ? (
                    <video src={item.signedUrl || item.url} controls className="h-full w-full object-contain" preload="metadata" />
                  ) : isAudio ? (
                    <audio src={item.signedUrl || item.url} controls className="w-full" />
                  ) : isFolder ? (
                    <div className="flex flex-col items-center gap-2 text-primary">
                      {kindIcon(kind, "h-16 w-16")}
                      <span className="text-[10px] font-medium uppercase text-neutral-500">Folder</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-neutral-400">
                      {kindIcon(kind, "h-12 w-12")}
                      <span className="text-[10px] uppercase">{item.extension || "file"}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <p className="truncate text-xs font-medium text-neutral-900" title={filename}>
                    {filename}
                  </p>
                  <p className="truncate text-[10px] text-neutral-500" title={subtitle}>
                    {subtitle}
                  </p>
                  {isFolder ? (
                    <p className="text-[10px] text-neutral-500">{folderCounts.get(item.key) || 0} files</p>
                  ) : (
                    <p className="text-[10px] text-neutral-500">{formatBytes(item.size)} · {formatDate(item.lastModified)}</p>
                  )}
                  <div className="mt-auto flex items-center gap-2 pt-2">
                    {!isFolder && (
                      <button
                        onClick={(e) => { e.stopPropagation(); copyUrl(item.url); }}
                        className="flex flex-1 items-center justify-center gap-1 rounded-md bg-neutral-100 px-2 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
                      >
                        {copied === item.url ? <span className="text-green-600">Copied</span> : <><Copy className="h-3 w-3" /> Copy</>}
                      </button>
                    )}
                    {!isFolder && (
                      <a
                        href={item.signedUrl || item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center rounded-md bg-neutral-100 p-1.5 text-neutral-700 hover:bg-neutral-200"
                        title="Open"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {!isFolder && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.key); }}
                        disabled={deletingKey === item.key}
                        className="flex items-center justify-center rounded-md bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingKey === item.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminMediaLibrary;

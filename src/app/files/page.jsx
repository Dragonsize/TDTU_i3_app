"use client";
import React, { useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import PageLoader from "@/components/PageLoader";
import { useRouter } from "next/navigation";
import { dFetch } from "@/lib/api";
import {
  FileText, Upload, Download, Trash2, Users, Lock, Globe,
  X, AlertCircle, Loader2, Image, File, Eye
} from "lucide-react";

function FileImagePreview({ file }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true); setError(""); setImgUrl(null);
    dFetch(`/api/documents/${file.id}/download`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch file");
        const data = await res.json().catch(() => null);
        if (data?.url) return dFetch(data.url).then((r) => r.blob());
        throw new Error("No file URL");
      })
      .then((blob) => { if (isMounted) setImgUrl(URL.createObjectURL(blob)); })
      .catch(() => { if (isMounted) setError("Could not preview image."); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; if (imgUrl) URL.revokeObjectURL(imgUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id]);

  if (loading) return <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>;
  if (error) return <span className="text-red-500 text-sm">{error}</span>;
  if (!imgUrl) return <span className="text-gray-400 text-sm">No image</span>;
  return <img src={imgUrl} alt={file.filename || "Preview"} className="max-h-80 max-w-full rounded-xl shadow border border-gray-100 object-contain" />;
}

function TextPreview({ fileId }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true); setError(""); setContent("");
    dFetch(`/api/documents/${fileId}/download`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch file");
        const data = await res.json().catch(() => null);
        if (data?.url) return dFetch(data.url).then((r) => r.text());
        throw new Error("No file URL");
      })
      .then((txt) => { if (isMounted) setContent(txt); })
      .catch(() => { if (isMounted) setError("Could not preview file."); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [fileId]);

  if (loading) return <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>;
  if (error) return <span className="text-red-500 text-sm">{error}</span>;
  if (!content) return <span className="text-gray-400 text-sm">No content</span>;
  return (
    <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 max-h-80 overflow-auto font-mono bg-gray-50 p-4 rounded-xl border border-gray-100">
      {content.length > 3000 ? content.slice(0, 3000) + "\n... (truncated)" : content}
    </pre>
  );
}

function getFileIcon(fileType) {
  if (!fileType) return File;
  if (fileType.startsWith("image")) return Image;
  return FileText;
}

function formatFileSize(bytes) {
  if (typeof bytes !== "number" || Number.isNaN(bytes)) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function FilesPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [shareScope, setShareScope] = useState("individual");
  const [selectedAccessScope, setSelectedAccessScope] = useState("individual");
  const [selectedAccessProject, setSelectedAccessProject] = useState("");
  const [accessSaving, setAccessSaving] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const canManageSelectedAccess = Boolean(selectedFile && currentUser && selectedFile.uploaded_by === currentUser.id);

  const router = typeof window !== "undefined" ? require("next/navigation").useRouter() : null;

  const fetchFiles = async () => {
    try {
      const response = await dFetch("/api/documents", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to load files");
      const data = await response.json();
      setFiles(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await dFetch("/api/projects", { credentials: "include" });
      if (!response.ok) return;
      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => {
    fetchFiles();
    fetchProjects();
    dFetch("/api/profile", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) setCurrentUser(data.profile);
        else if (router) router.push("/login");
      })
      .catch(() => { if (router) router.push("/login"); });
  }, []);

  useEffect(() => {
    if (!selectedFile) { setAccessError(""); return; }
    setSelectedAccessScope(selectedFile.project_id ? "project" : "individual");
    setSelectedAccessProject(selectedFile.project_id || "");
    setAccessError("");
  }, [selectedFile]);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (shareScope === "project" && !selectedProject) throw new Error("Choose a project to share with all members.");
      if (shareScope === "project" && selectedProject) formData.append("project_id", selectedProject);
      const response = await fetch("/api/documents/upload", { method: "POST", body: formData, credentials: "include" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Upload failed");
      }
      await fetchFiles();
    } catch (err) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (documentId, filename) => {
    try {
      const response = await dFetch(`/api/documents/${documentId}/download`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to download");
      const data = await response.json();
      if (data.url) {
        const fileResp = await fetch(data.url);
        if (!fileResp.ok) throw new Error("Failed to fetch file");
        const blob = await fileResp.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename || "";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }
    } catch (err) {
      setError(err.message || "Failed to download file");
    }
  };

  const handleDelete = async (documentId) => {
    setDeleting(true);
    setDeleteError("");
    try {
      const resp = await fetch(`/api/documents/${documentId}/delete`, { method: "POST", credentials: "include" });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to delete file");
      }
      await fetchFiles();
      setSelectedFile(null);
    } catch (err) {
      setDeleteError(err.message || "Failed to delete file");
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectedFileAccessSave = async () => {
    if (!selectedFile) return;
    const targetProjectId = selectedAccessScope === "project" ? selectedAccessProject : null;
    if (selectedAccessScope === "project" && !targetProjectId) {
      setAccessError("Choose a project."); return;
    }
    if ((selectedFile.project_id || null) === targetProjectId) { setAccessError(""); return; }
    setAccessSaving(true);
    setAccessError("");
    try {
      const response = await fetch(`/api/documents/${selectedFile.id}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ project_id: targetProjectId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to update access");
      }
      const updated = await response.json();
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? { ...f, ...updated } : f)));
      setSelectedFile((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
    } catch (err) {
      setAccessError(err.message || "Failed to update access");
    } finally {
      setAccessSaving(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  if (loading) {
    return (
      <AppShell user={currentUser} activePath="/files" contentClassName="flex-1">
        <PageLoader label="Loading files..." />
      </AppShell>
    );
  }

  return (
    <AppShell user={currentUser} activePath="/files" contentClassName="flex-1 bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-sky-500" />
            Files
          </h1>
          <div className="flex items-center gap-3">
            {/* Share scope selector */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
              {shareScope === "individual" ? <Lock className="w-4 h-4 text-gray-400" /> : <Globe className="w-4 h-4 text-blue-500" />}
              <select
                value={shareScope}
                onChange={(e) => { setShareScope(e.target.value); if (e.target.value === "individual") setSelectedProject(""); }}
                className="text-sm text-gray-700 font-medium bg-transparent outline-none"
              >
                <option value="individual">Private upload</option>
                <option value="project">Project upload</option>
              </select>
            </div>
            {shareScope === "project" && (
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="h-10 bg-white border border-gray-200 rounded-xl px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm"
              >
                <option value="">Choose project...</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title || p.name}</option>)}
              </select>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-black transition-all active:scale-[0.98] disabled:opacity-60 shadow-sm"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} disabled={uploading} />
          </div>
        </div>

        {(error || uploadError) && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error || uploadError}
          </div>
        )}

        {/* Drop Zone + Files Card */}
        <div
          className={`bg-white rounded-3xl shadow-sm border-2 ${isDragging ? "border-blue-400 bg-blue-50/30" : "border-gray-100"} overflow-hidden transition-colors`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
        >
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-500" />
              All Files
              <span className="text-sm font-normal text-gray-400">({files.length})</span>
            </h3>
            {isDragging && <span className="text-sm font-medium text-blue-600">Drop to upload</span>}
          </div>

          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium mb-1">No files yet</p>
              <p className="text-sm text-gray-400">Upload a file or drag and drop it here</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 inline-flex items-center gap-2 text-sm text-sky-600 font-semibold hover:text-sky-700"
              >
                <Upload className="w-4 h-4" /> Upload File
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-6">
              {files.map((file) => {
                const Icon = getFileIcon(file.file_type);
                return (
                  <button
                    key={file.id}
                    className="flex flex-col items-center gap-2.5 p-3 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group text-center cursor-pointer"
                    onClick={() => setSelectedFile(file)}
                  >
                    <div className="w-16 h-16 bg-sky-50 border border-sky-100 rounded-2xl flex items-center justify-center group-hover:bg-sky-100 transition-colors shadow-sm">
                      <Icon className="w-7 h-7 text-sky-500" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 truncate w-full">{file.filename || "Untitled"}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${file.project_id ? "text-blue-600 border-blue-100 bg-blue-50" : "text-gray-500 border-gray-100 bg-gray-50"}`}>
                      {file.project_id ? <><Globe className="w-2.5 h-2.5 inline mr-0.5" />Shared</> : <><Lock className="w-2.5 h-2.5 inline mr-0.5" />Private</>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* File Detail Modal */}
        {selectedFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
              {/* Preview */}
              <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100 min-h-[200px]">
                {selectedFile.file_type?.startsWith("image") ? (
                  <FileImagePreview file={selectedFile} />
                ) : selectedFile.file_type?.startsWith("text") ? (
                  <div className="w-full overflow-auto max-h-80">
                    <TextPreview fileId={selectedFile.id} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <File className="w-16 h-16" />
                    <span className="text-sm font-medium">No preview available</span>
                  </div>
                )}
              </div>

              {/* Info Panel */}
              <div className="w-full md:w-72 flex flex-col p-6 gap-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{selectedFile.filename || "Untitled"}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedFile.file_type || "Unknown"} · {formatFileSize(selectedFile.file_size)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">By: {selectedFile.profiles?.username || selectedFile.username || "Unknown"}</p>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors ml-2 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border w-fit ${selectedFile.project_id ? "text-blue-600 border-blue-100 bg-blue-50" : "text-gray-600 border-gray-100 bg-gray-50"}`}>
                  {selectedFile.project_id ? <><Globe className="w-3.5 h-3.5" /> Shared to project</> : <><Lock className="w-3.5 h-3.5" /> Private</>}
                </div>

                {/* Access Control */}
                {canManageSelectedAccess && (
                  <div className="bg-gray-50 rounded-2xl border border-gray-100 p-3 space-y-2">
                    <p className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Access
                    </p>
                    <select
                      value={selectedAccessScope}
                      onChange={(e) => { setSelectedAccessScope(e.target.value); if (e.target.value === "individual") setSelectedAccessProject(""); }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    >
                      <option value="individual">Private (only me)</option>
                      <option value="project">Project (all members)</option>
                    </select>
                    {selectedAccessScope === "project" && (
                      <select
                        value={selectedAccessProject}
                        onChange={(e) => setSelectedAccessProject(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                      >
                        <option value="">Choose project...</option>
                        {projects.map((p) => <option key={p.id} value={p.id}>{p.title || p.name}</option>)}
                      </select>
                    )}
                    {accessError && <p className="text-xs text-red-600">{accessError}</p>}
                    <button
                      onClick={handleSelectedFileAccessSave}
                      disabled={accessSaving}
                      className="w-full bg-gray-900 text-white rounded-xl py-2 text-xs font-semibold hover:bg-black transition-all disabled:opacity-60"
                    >
                      {accessSaving ? "Saving..." : "Save Access"}
                    </button>
                  </div>
                )}

                {deleteError && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600">
                    <AlertCircle className="w-3.5 h-3.5" /> {deleteError}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleDownload(selectedFile.id, selectedFile.filename)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 text-white rounded-xl py-2.5 text-xs font-semibold hover:bg-black transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button
                    onClick={() => !deleting && handleDelete(selectedFile.id)}
                    disabled={deleting}
                    className="flex items-center justify-center gap-1.5 border border-red-100 bg-red-50 text-red-600 rounded-xl px-3 py-2.5 text-xs font-semibold hover:bg-red-100 transition-all disabled:opacity-60"
                  >
                    {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

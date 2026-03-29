"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import AppShell from "@/components/AppShell";
import PageLoader from "@/components/PageLoader";
import SkeletonLoader from "@/components/SkeletonLoader";
import { useRouter } from "next/navigation";
import { dFetch } from "@/lib/api";
import {
  FileText, Upload, Download, Trash2, Users, Lock, Globe,
  X, AlertCircle, Loader2, Image, File, Eye, Plus, GitBranch
} from "lucide-react";

function FileImagePreview({ file }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true); setError(""); setImgUrl(null);
    dFetch(`/api/documents/${file.id}/download`)
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

  if (loading) return <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />;
  if (error) return <span className="text-red-500 text-sm">{error}</span>;
  if (!imgUrl) return <span className="text-gray-400 text-sm">No image</span>;
  // Blob/object URLs are generated at runtime, so native img is intentional here.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={imgUrl} alt={file.filename || "Preview"} className="max-h-80 max-w-full rounded-xl shadow border border-gray-100 object-contain" />;
}

function TextPreview({ fileId }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true); setError(""); setContent("");
    dFetch(`/api/documents/${fileId}/download`)
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

  if (loading) return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
      <div className="h-4 bg-gray-200 rounded w-4/6" />
      <div className="h-40 bg-gray-200 rounded-xl mt-4" />
    </div>
  );
  if (error) return <span className="text-red-500 text-sm">{error}</span>;
  if (!content) return <span className="text-gray-400 text-sm">No content</span>;
  return (
    <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-300 max-h-80 overflow-auto font-mono bg-gray-50 dark:bg-neutral-950 p-4 rounded-xl border border-gray-100 dark:border-white/10">
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

  const [selectedProjectMembers, setSelectedProjectMembers] = useState([]);
  const [showCreateFlowModal, setShowCreateFlowModal] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDesc, setNewFlowDesc] = useState("");
  const [selectedFlowMember, setSelectedFlowMember] = useState("");
  const [creatingFlow, setCreatingFlow] = useState(false);
  const [flowError, setFlowError] = useState("");

  const isLead = useMemo(() => {
    if (!currentUser || !selectedProject || selectedProjectMembers.length === 0) return false;
    const projectMember = selectedProjectMembers.find(m => m.id === currentUser.id);
    return projectMember && (projectMember.role === "lead" || projectMember.role === "admin");
  }, [currentUser, selectedProject, selectedProjectMembers]);

  const canManageSelectedAccess = Boolean(selectedFile && currentUser && selectedFile.uploaded_by === currentUser.id);

  const router = useRouter();

  const fetchFiles = async () => {
    try {
      const response = await dFetch("/api/documents");
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
      const response = await dFetch("/api/projects");
      if (!response.ok) return;
      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch { }
  };

  useEffect(() => {
    fetchFiles();
    fetchProjects();
    dFetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) setCurrentUser(data.profile);
        else if (router) router.push("/login");
      })
      .catch(() => { if (router) router.push("/login"); });
  }, [router]);

  useEffect(() => {
    if (!selectedFile) { setAccessError(""); return; }
    setSelectedAccessScope(selectedFile.project_id ? "project" : "individual");
    setSelectedAccessProject(selectedFile.project_id || "");
    setAccessError("");
  }, [selectedFile]);

  useEffect(() => {
    if (!selectedProject) {
      setSelectedProjectMembers([]);
      return;
    }
    dFetch(`/api/projects/${selectedProject}/members`)
      .then(res => res.ok ? res.json() : [])
      .then(setSelectedProjectMembers)
      .catch(() => setSelectedProjectMembers([]));
  }, [selectedProject]);

  const handleCreateFlow = async (e) => {
    e.preventDefault();
    if (!isLead) {
      setFlowError("Insufficient permissions");
      return;
    }
    if (!newFlowName.trim() || !selectedFlowMember || !selectedProject) return;
    setCreatingFlow(true);
    setFlowError("");
    try {
      const res = await dFetch(`/api/projects/${selectedProject}/workflows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newFlowName.trim(),
          description: newFlowDesc.trim(),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to create flow");
      }
      const workflow = await res.json();

      const member = selectedProjectMembers.find(m => m.id === selectedFlowMember);
      if (member) {
        await dFetch(`/api/workflows/${workflow.id}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: member.username, role: "member" }),
        });
      }

      setShowCreateFlowModal(false);
      setNewFlowName("");
      setNewFlowDesc("");
      setSelectedFlowMember("");
      alert("Flow created successfully!");
    } catch (err) {
      setFlowError(err.message);
    } finally {
      setCreatingFlow(false);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (shareScope === "project" && !selectedProject) throw new Error("Choose a project to share with all members.");
      if (shareScope === "project" && selectedProject) formData.append("project_id", selectedProject);
      const response = await dFetch("/api/documents/upload", { method: "POST", body: formData });
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
      const response = await dFetch(`/api/documents/${documentId}/download`);
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
      const resp = await dFetch(`/api/documents/${documentId}/delete`, { method: "POST" });
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
      const response = await dFetch(`/api/documents/${selectedFile.id}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
      <AppShell user={currentUser} activePath="/files" contentClassName="flex-1 bg-gray-50/50 dark:bg-neutral-950/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <SkeletonLoader count={2} type="header" />
          <SkeletonLoader count={6} type="file-list" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell user={currentUser} activePath="/files" contentClassName="flex-1 bg-gray-50/50 dark:bg-neutral-950/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-sky-500" />
            Files
          </h1>
          <div className="flex items-center gap-3">
            {/* Share scope selector */}
            <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 shadow-sm">
              {shareScope === "individual" ? <Lock className="w-4 h-4 text-gray-400" /> : <Globe className="w-4 h-4 text-blue-500" />}
              <select
                value={shareScope}
                onChange={(e) => { setShareScope(e.target.value); if (e.target.value === "individual") setSelectedProject(""); }}
                className="text-sm text-gray-700 dark:text-white font-medium bg-transparent outline-none [&>option]:text-gray-900"
              >
                <option value="individual">Private upload</option>
                <option value="project">Project upload</option>
              </select>
            </div>
            {shareScope === "project" && (
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="h-10 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/10 rounded-xl px-3 text-sm text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm [&>option]:text-gray-900"
              >
                <option value="">Choose project...</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title || p.name}</option>)}
              </select>
            )}

            {isLead && (
              <button
                onClick={() => setShowCreateFlowModal(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Create Flow
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-black dark:hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-60 shadow-sm"
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
          className={`bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border-2 ${isDragging ? "border-blue-400 bg-blue-50/30" : "border-gray-100 dark:border-white/10"} overflow-hidden transition-colors`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
        >
          <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-500" />
              All Files
              <span className="text-sm font-normal text-gray-400">({files.length})</span>
            </h3>
            {isDragging && <span className="text-sm font-medium text-blue-600">Drop to upload</span>}
          </div>

          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600" />
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
                    className="flex flex-col items-center gap-2.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-neutral-800 border border-transparent hover:border-gray-100 dark:hover:border-white/10 transition-all group text-center cursor-pointer"
                    onClick={() => setSelectedFile(file)}
                  >
                    <div className="w-16 h-16 bg-sky-50 border border-sky-100 rounded-2xl flex items-center justify-center group-hover:bg-sky-100 transition-colors shadow-sm">
                      <Icon className="w-7 h-7 text-sky-500" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate w-full">{file.filename || "Untitled"}</span>
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
              {/* Preview */}
              <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-neutral-950/50 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/10 min-h-[200px]">
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
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{selectedFile.filename || "Untitled"}</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{selectedFile.file_type || "Unknown"} · {formatFileSize(selectedFile.file_size)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">By: {selectedFile.profiles?.username || selectedFile.username || "Unknown"}</p>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors ml-2 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border w-fit ${selectedFile.project_id ? "text-blue-600 border-blue-100 bg-blue-50" : "text-gray-600 border-gray-100 bg-gray-50"}`}>
                  {selectedFile.project_id ? <><Globe className="w-3.5 h-3.5" /> Shared to project</> : <><Lock className="w-3.5 h-3.5" /> Private</>}
                </div>

                {/* Access Control */}
                {canManageSelectedAccess && (
                  <div className="bg-gray-50 dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-white/5 p-3 space-y-2">
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Access
                    </p>
                    <select
                      value={selectedAccessScope}
                      onChange={(e) => { setSelectedAccessScope(e.target.value); if (e.target.value === "individual") setSelectedAccessProject(""); }}
                      className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all [&>option]:text-gray-900"
                    >
                      <option value="individual">Private (only me)</option>
                      <option value="project">Project (all members)</option>
                    </select>
                    {selectedAccessScope === "project" && (
                      <select
                        value={selectedAccessProject}
                        onChange={(e) => setSelectedAccessProject(e.target.value)}
                        className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all [&>option]:text-gray-900"
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
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl py-2.5 text-xs font-semibold hover:bg-black dark:hover:bg-gray-200 transition-all shadow-sm"
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

        {/* Create Flow Modal */}
        {showCreateFlowModal && (
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-[40px] shadow-2xl p-10 w-full max-w-xl border border-white dark:border-white/10 relative">
              <button
                className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-900 transition-all"
                onClick={() => setShowCreateFlowModal(false)}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                  <GitBranch className="w-3 h-3" /> New Workflow
                </span>
                <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Create Flow</h3>
                <p className="text-sm text-gray-400 mt-2 font-medium">Designate a teammate to lead this new flow.</p>
              </div>

              <form onSubmit={handleCreateFlow} className="space-y-6">
                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-2 ml-1">Flow Name</label>
                  <input
                    type="text"
                    required
                    value={newFlowName}
                    onChange={(e) => setNewFlowName(e.target.value)}
                    placeholder="Enter flow title..."
                    className="w-full h-14 bg-gray-50 dark:bg-neutral-800 border-0 rounded-2xl px-6 text-sm font-bold text-gray-900 dark:text-white outline-none focus:bg-white dark:focus:bg-neutral-700 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-2 ml-1">Assign to Member</label>
                  <select
                    required
                    value={selectedFlowMember}
                    onChange={(e) => setSelectedFlowMember(e.target.value)}
                    className="w-full h-14 bg-gray-50 dark:bg-neutral-800 border-0 rounded-2xl px-6 text-sm font-bold text-gray-900 dark:text-white outline-none focus:bg-white dark:focus:bg-neutral-700 focus:ring-4 focus:ring-indigo-500/5 transition-all [&>option]:text-gray-900"
                  >
                    <option value="">Select a member...</option>
                    {selectedProjectMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name || m.username} ({m.role || "member"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-2 ml-1">Description (Optional)</label>
                  <textarea
                    value={newFlowDesc}
                    onChange={(e) => setNewFlowDesc(e.target.value)}
                    placeholder="Describe the objective of this flow..."
                    rows={3}
                    className="w-full bg-gray-50 dark:bg-neutral-800 border-0 rounded-2xl p-6 text-sm font-bold text-gray-900 dark:text-white outline-none focus:bg-white dark:focus:bg-neutral-700 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none"
                  />
                </div>

                {flowError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {flowError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={creatingFlow || !newFlowName.trim() || !selectedFlowMember}
                  className="w-full h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl hover:bg-black dark:hover:bg-gray-200 transition-all shadow-xl shadow-gray-200 dark:shadow-none disabled:opacity-20 flex items-center justify-center gap-2"
                >
                  {creatingFlow ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Confirm and Create Flow
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

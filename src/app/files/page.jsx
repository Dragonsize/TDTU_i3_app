
"use client";
import React, { useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import PageLoader from "@/components/PageLoader";
// FileImagePreview component for image/* files
function FileImagePreview({ file }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");
    setImgUrl(null);
    fetch(`/api/documents/${file.id}/download`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch file");
        const data = await res.json().catch(() => null);
        if (data && data.url) {
          return fetch(data.url).then((r) => r.blob());
        }
        throw new Error("No file URL");
      })
      .then((blob) => {
        if (isMounted) setImgUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        if (isMounted) setError("Could not preview image.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
      if (imgUrl) URL.revokeObjectURL(imgUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id]);

  if (loading) return <span className="text-gray-400">Loading image...</span>;
  if (error) return <span className="text-red-500">{error}</span>;
  if (!imgUrl) return <span className="text-gray-400">No image</span>;
  return (
    <img
      src={imgUrl}
      alt={file.filename || "Preview"}
      className="max-h-80 max-w-full rounded shadow border"
      style={{ objectFit: "contain" }}
    />
  );
}

// TextPreview component for .txt and text/* files
function TextPreview({ fileId }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");
    setContent("");
    fetch(`/api/documents/${fileId}/download`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch file");
        const data = await res.json().catch(() => null);
        if (data && data.url) {
          return fetch(data.url).then((r) => r.text());
        }
        throw new Error("No file URL");
      })
      .then((txt) => {
        if (isMounted) setContent(txt);
      })
      .catch(() => {
        if (isMounted) setError("Could not preview file.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [fileId]);

  if (loading) return <span className="text-gray-400">Loading...</span>;
  if (error) return <span className="text-red-500">{error}</span>;
  if (!content) return <span className="text-gray-400">No content</span>;
  // Limit preview to first 2000 chars
  return (
    <pre className="whitespace-pre-wrap break-words text-sm max-h-72 overflow-auto">
      {content.length > 2000 ? content.slice(0, 2000) + "\n... (truncated)" : content}
    </pre>
  );
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
  const [accessMenuOpen, setAccessMenuOpen] = useState(false);
  const [selectedAccessMenuOpen, setSelectedAccessMenuOpen] = useState(false);
  const [selectedAccessScope, setSelectedAccessScope] = useState("individual");
  const [selectedAccessProject, setSelectedAccessProject] = useState("");
  const [accessSaving, setAccessSaving] = useState(false);
  const [accessError, setAccessError] = useState("");
  const accessMenuRef = useRef(null);
  const selectedAccessMenuRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (typeof bytes !== "number" || Number.isNaN(bytes)) {
      return "Unknown size";
    }
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const canManageSelectedAccess = Boolean(
    selectedFile && currentUser && selectedFile.uploaded_by === currentUser.id
  );

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/documents", { credentials: "include" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to load files");
      }
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
        const response = await fetch("/api/projects", { credentials: "include" });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Failed to load projects:", err);
      }
    };

    const router = typeof window !== "undefined" ? require('next/navigation').useRouter() : null;
    useEffect(() => {
      fetchFiles();
      fetchProjects();
      // Fetch profile for header
      fetch("/api/profile", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          if (data.profile) {
            setCurrentUser(data.profile);
          } else {
            if (router) router.push("/login");
          }
        })
        .catch((err) => {
          if (router) router.push("/login");
        });
    }, []);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (accessMenuRef.current && !accessMenuRef.current.contains(event.target)) {
          setAccessMenuOpen(false);
        }
        if (selectedAccessMenuRef.current && !selectedAccessMenuRef.current.contains(event.target)) {
          setSelectedAccessMenuOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
      if (!selectedFile) {
        setSelectedAccessMenuOpen(false);
        setAccessError("");
        return;
      }
      if (!canManageSelectedAccess) {
        setSelectedAccessMenuOpen(false);
      }
      setSelectedAccessScope(selectedFile.project_id ? "project" : "individual");
      setSelectedAccessProject(selectedFile.project_id || "");
      setAccessError("");
    }, [selectedFile, canManageSelectedAccess]);

    const handleUpload = async (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      setUploading(true);
      setUploadError("");
      try {
        const formData = new FormData();
        formData.append("file", file);
        if (shareScope === "project" && !selectedProject) {
          throw new Error("Choose a project to share with all members.");
        }
        if (shareScope === "project" && selectedProject) {
          formData.append("project_id", selectedProject);
        }
        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.detail || "Upload failed");
        }
        await fetchFiles();
        event.target.value = "";
      } catch (err) {
        setUploadError(err.message || "Upload failed");
      } finally {
        setUploading(false);
      }
    };

    const handleDownload = async (documentId, filename) => {
      try {
        const response = await fetch(`/api/documents/${documentId}/download`, {
          credentials: "include",
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.detail || "Failed to download file");
        }
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
        const resp = await fetch(`/api/documents/${documentId}/delete`, {
          method: "POST",
          credentials: "include",
        });
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
      if (!selectedFile) {
        return;
      }

      const targetProjectId = selectedAccessScope === "project" ? selectedAccessProject : null;
      if (selectedAccessScope === "project" && !targetProjectId) {
        setAccessError("Choose a project to share this file with all members.");
        return;
      }

      if ((selectedFile.project_id || null) === targetProjectId) {
        setSelectedAccessMenuOpen(false);
        setAccessError("");
        return;
      }

      setAccessSaving(true);
      setAccessError("");
      try {
        const response = await fetch(`/api/documents/${selectedFile.id}/access`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ project_id: targetProjectId }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.detail || "Failed to update access");
        }

        const updated = await response.json();
        setFiles((prev) => prev.map((file) => (file.id === updated.id ? { ...file, ...updated } : file)));
        setSelectedFile((prev) => {
          if (!prev || prev.id !== updated.id) {
            return prev;
          }
          return { ...prev, ...updated };
        });
        setSelectedAccessMenuOpen(false);
      } catch (err) {
        setAccessError(err.message || "Failed to update access");
      } finally {
        setAccessSaving(false);
      }
    };

    // Drag-and-drop upload
    const handleDrop = async (event) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (!file) return;
      setUploading(true);
      setUploadError("");
      try {
        const formData = new FormData();
        formData.append("file", file);
        if (shareScope === "project" && !selectedProject) {
          throw new Error("Choose a project to share with all members.");
        }
        if (shareScope === "project" && selectedProject) {
          formData.append("project_id", selectedProject);
        }
        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
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
    const handleDragOver = (event) => {
      event.preventDefault();
    };

    if (loading) {
      return (
        <AppShell user={currentUser} activePath="/files" contentClassName="flex-1">
          <PageLoader label="Loading files..." />
        </AppShell>
      );
    }

    return (
      <AppShell user={currentUser} activePath="/files" contentClassName="flex-1">
        <main className="w-full flex flex-col items-center pt-8 sm:pt-12 pb-10 sm:pb-12 px-4 sm:px-6">
          <h1 className="text-center text-black text-3xl sm:text-4xl md:text-5xl font-normal font-['Instrument_Sans'] mb-2">Files</h1>
          <p className="text-sm sm:text-base text-stone-700 font-['Arimo'] mb-8 sm:mb-12 text-center">
            Keep your documents organized, private, or shared with your project team.
          </p>
          
          <div 
            className="w-full max-w-[1215px] min-h-[420px] sm:min-h-[560px] rounded-3xl p-4 sm:p-8 lg:p-10 relative bg-gradient-to-br from-zinc-400 via-zinc-300 to-stone-400 border border-stone-500/70 shadow-[0_20px_60px_rgba(0,0,0,0.16)]"
            onDrop={handleDrop} 
            onDragOver={handleDragOver}
          >
                <div className="mb-6 flex items-center justify-end" ref={accessMenuRef}>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setAccessMenuOpen((prev) => !prev)}
                      className="w-12 h-12 rounded-xl border border-stone-300 bg-white text-[#4a5565] flex items-center justify-center shadow-sm hover:bg-stone-50"
                      title="File access"
                      aria-label="File access"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 21a8 8 0 0 0-16 0" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </button>

                    {accessMenuOpen && (
                      <div className="absolute right-0 mt-2 w-[280px] rounded-xl border border-stone-300 bg-white p-3 shadow-xl z-20">
                        <div className="text-sm font-semibold text-stone-800 mb-2 font-['Arimo']">Upload settings</div>
                        <select
                          value={shareScope}
                          onChange={(e) => {
                            const next = e.target.value;
                            setShareScope(next);
                            if (next === "individual") {
                              setSelectedProject("");
                            }
                          }}
                          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
                        >
                          <option value="individual">Individual (only me)</option>
                          <option value="project">Project (all members)</option>
                        </select>

                        {shareScope === "project" && (
                          <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
                          >
                            <option value="">Choose project...</option>
                            {projects.map((project) => (
                              <option key={project.id} value={project.id}>
                                {project.title || project.name || "Untitled project"}
                              </option>
                            ))}
                          </select>
                        )}

                        <p className="mt-2 text-xs text-stone-600 font-['Arimo']">
                          Individual keeps file private. Project shares file with all project members.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 sm:gap-x-6 lg:gap-x-8 gap-y-6 sm:gap-y-8 lg:gap-y-10 items-start">
                  {/* File cards */}
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex flex-col items-center group cursor-pointer rounded-2xl p-2 transition-all hover:bg-white/50"
                      onClick={() => setSelectedFile(file)}
                    >
                      <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 mb-3 sm:mb-4 relative flex items-center justify-center bg-white rounded-2xl shadow-md border border-stone-200 overflow-hidden transition-transform group-hover:scale-105">
                        {/* Document icon for file */}
                        <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-gray-500">
                          <rect x="6" y="4" width="12" height="16" rx="2" strokeWidth="2.5"/>
                          <line x1="9" y1="8" x2="15" y2="8" strokeWidth="2.5"/>
                          <line x1="9" y1="12" x2="15" y2="12" strokeWidth="2.5"/>
                          <line x1="9" y1="16" x2="13" y2="16" strokeWidth="2.5"/>
                        </svg>
                      </div>
                      <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-white/85 border border-stone-300 rounded-lg"></div>
                        <span className="relative z-10 px-2 sm:px-3 py-1 text-black text-xs sm:text-sm lg:text-base font-normal font-['Instrument_Sans'] truncate max-w-[120px] sm:max-w-[140px]">
                          {file.filename || 'Untitled'}
                        </span>
                      </div>
                      <span className={`mt-2 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-['Arimo'] border ${file.project_id ? "text-blue-700 border-blue-200 bg-blue-50" : "text-stone-700 border-stone-300 bg-stone-100"}`}>
                        {file.project_id ? "Project shared" : "Private"}
                      </span>
                    </div>
                  ))}
                  {/* Upload button as a grid item */}
                  <label className="flex flex-col items-center cursor-pointer group rounded-2xl p-2 transition-all hover:bg-white/50">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-white border-2 border-dashed border-stone-400 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-colors group-hover:bg-stone-50 group-hover:border-stone-500">
                      <span className="text-black text-5xl sm:text-6xl lg:text-7xl font-normal font-['Instrument_Sans'] opacity-50 leading-none">+</span>
                    </div>
                    <span className="text-black text-sm sm:text-base lg:text-lg font-normal font-['Instrument_Sans'] text-center">Upload Files</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
                {uploadError ? (
                  <div className="absolute bottom-4 left-0 right-0 text-center text-red-600 font-['Arimo']">{uploadError}</div>
                ) : null}
                {/* Overlay preview for selected file */}
                {selectedFile && (
                  <div
                    className="absolute inset-0 z-50 flex bg-black/20 backdrop-blur-[1px] rounded-[20px] overflow-hidden p-2 sm:p-4"
                    style={{ minHeight: "320px" }}
                  >
                    <div className="bg-white rounded-2xl border border-stone-300 shadow-xl flex flex-col md:flex-row max-w-4xl w-full mx-auto" style={{ minHeight: "320px" }}>
                      {/* Left: Content preview */}
                      <div className="flex-1 flex items-center justify-center p-8">
                        {selectedFile.file_type && selectedFile.file_type.startsWith("image") ? (
                          <FileImagePreview file={selectedFile} />
                        ) : selectedFile.file_type && selectedFile.file_type.startsWith("text") ? (
                          <div className="text-black text-lg font-['Instrument_Sans'] p-4 overflow-auto max-h-80 w-full">
                            <TextPreview fileId={selectedFile.id} />
                          </div>
                        ) : (
                          <div className="text-gray-400 text-2xl font-['Instrument_Sans']">No preview</div>
                        )}
                      </div>

                      {/* Right: File info and actions */}
                      <div className="w-full md:w-[340px] flex flex-col justify-center p-4 sm:p-6 md:p-8 border-t md:border-t-0 md:border-l border-gray-200 bg-stone-50/70">
                        <div className="text-xl text-black font-bold font-['Instrument_Sans'] text-center rounded-xl bg-white border border-stone-200 px-4 py-2 mb-4 truncate">{selectedFile.filename || "Untitled"}</div>
                        <div className="flex flex-row gap-3 mb-6 justify-center">
                          {/* Download button (>>) */}
                          <button
                            className="flex flex-col items-center bg-white hover:bg-blue-50 rounded-lg px-3 py-2 shadow border border-gray-200"
                            title="Download file"
                            onClick={() => handleDownload(selectedFile.id, selectedFile.filename)}
                          >
                            <span className="text-xl text-black font-bold">&gt;&gt;</span>
                          </button>
                          <div className="relative" ref={selectedAccessMenuRef}>
                            <button
                              className={`flex flex-col items-center rounded-lg px-3 py-2 shadow border border-gray-200 ${canManageSelectedAccess ? "bg-white hover:bg-blue-50" : "bg-gray-100 opacity-60 cursor-not-allowed"}`}
                              title={canManageSelectedAccess ? "Share or manage access" : "Only the uploader can manage access"}
                              onClick={() => {
                                if (!canManageSelectedAccess) {
                                  return;
                                }
                                setSelectedAccessMenuOpen((prev) => !prev);
                              }}
                              disabled={accessSaving || !canManageSelectedAccess}
                            >
                              <svg width="20" height="20" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4"/></svg>
                            </button>
                            {selectedAccessMenuOpen && canManageSelectedAccess && (
                              <div className="absolute top-full right-0 mt-2 w-[260px] rounded-xl border border-stone-300 bg-white p-3 shadow-xl z-20">
                                <div className="text-sm font-semibold text-stone-800 mb-2 font-['Arimo']">File access</div>
                                <select
                                  value={selectedAccessScope}
                                  onChange={(e) => {
                                    const next = e.target.value;
                                    setSelectedAccessScope(next);
                                    if (next === "individual") {
                                      setSelectedAccessProject("");
                                    }
                                  }}
                                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
                                >
                                  <option value="individual">Individual (only me)</option>
                                  <option value="project">Project (all members)</option>
                                </select>
                                {selectedAccessScope === "project" && (
                                  <select
                                    value={selectedAccessProject}
                                    onChange={(e) => setSelectedAccessProject(e.target.value)}
                                    className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
                                  >
                                    <option value="">Choose project...</option>
                                    {projects.map((project) => (
                                      <option key={project.id} value={project.id}>
                                        {project.title || project.name || "Untitled project"}
                                      </option>
                                    ))}
                                  </select>
                                )}
                                <button
                                  type="button"
                                  className="mt-3 w-full rounded-md bg-blue-600 text-white text-sm px-3 py-2 hover:bg-blue-700 disabled:opacity-60"
                                  onClick={handleSelectedFileAccessSave}
                                  disabled={accessSaving}
                                >
                                  {accessSaving ? "Saving..." : "Save access"}
                                </button>
                                {accessError && <div className="mt-2 text-xs text-red-600">{accessError}</div>}
                              </div>
                            )}
                          </div>
                          {/* Delete button */}
                          <button
                            className={`flex flex-col items-center bg-white hover:bg-red-50 rounded-lg px-3 py-2 shadow border border-gray-200 ${deleting ? 'opacity-60 cursor-not-allowed' : ''}`}
                            title="Delete file"
                            onClick={() => !deleting && handleDelete(selectedFile.id)}
                            disabled={deleting}
                          >
                            {deleting ? (
                              <span className="text-xs text-red-600">Deleting...</span>
                            ) : (
                              <svg width="20" height="20" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24"><rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 9l6 6M15 9l-6 6"/></svg>
                            )}
                          </button>
                                                {deleteError && (
                                                  <div className="mt-2 text-xs text-red-600 text-center">{deleteError}</div>
                                                )}
                        </div>
                        <div className={`text-xs font-['Arimo'] mb-1 text-center ${selectedFile.project_id ? "text-blue-700" : "text-gray-700"}`}>
                          {selectedFile.project_id ? "Shared to project" : "Private"}
                        </div>
                        <div className="text-xs text-gray-500 font-['Arimo'] mb-1 text-center">{selectedFile.file_type || "Unknown type"} · {formatFileSize(selectedFile.file_size)}</div>
                        <div className="text-xs text-gray-500 font-['Arimo'] mb-1 text-center">Author: {selectedFile.profiles?.username || selectedFile.username || "Unknown"}</div>
                        <button
                          className="mt-8 text-xs text-blue-600 underline hover:text-blue-900"
                          onClick={() => setSelectedFile(null)}
                        >Back to files</button>
                      </div>
                    </div>
                  </div>
                )}
          </div>
        </main>
      </AppShell>
  );
}

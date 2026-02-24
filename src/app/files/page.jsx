
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

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

    useEffect(() => {
      fetchFiles();
      fetchProjects();
    }, []);

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
        if (selectedProject) {
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
      try {
        await fetch(`/api/documents/${documentId}/delete`, {
          method: "POST",
          credentials: "include",
        });
        await fetchFiles();
        setSelectedFile(null);
      } catch (err) {
        setError("Failed to delete file");
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
        if (selectedProject) {
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

    return (
      <div className="min-h-screen bg-white">
        <header className="w-full h-16 bg-white/60 border-b border-black/10 flex items-center">
          <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gray-950 rounded-lg"></div>
                <span className="text-xl font-bold text-neutral-950 font-['Arimo']">A+ Flow</span>
              </Link>
              <nav className="hidden md:flex items-center gap-5 text-base text-gray-500 font-['Arimo']">
                <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Project</Link>
                <Link href="/chatbot" className="hover:text-gray-900 transition-colors">ChatBot</Link>
                <Link href="/chat" className="hover:text-gray-900 transition-colors">Chat</Link>
                <Link href="/files" className="text-gray-900">File</Link>
              </nav>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="px-3.5 py-1.5 rounded-md flex items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                <div className="text-neutral-950 text-xs font-normal font-['Arimo']">User</div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center text-black text-5xl font-normal font-['Instrument_Sans']">Files</div>

          <section className="mt-10">
            <div className="bg-zinc-300 rounded-[20px] min-h-[520px] md:min-h-[620px] p-6 md:p-10 flex flex-col">
              {/* Files table/grid */}
              <div className="flex-1 relative" onDrop={handleDrop} onDragOver={handleDragOver}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 items-start">
                  {/* File cards */}
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex flex-col items-center justify-center bg-white/80 rounded-2xl p-6 shadow-sm border border-white cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => setSelectedFile(file)}
                    >
                      <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-xl mb-2">
                        {/* Document icon for file */}
                        <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <rect x="6" y="4" width="12" height="16" rx="2" strokeWidth="2.5"/>
                          <line x1="9" y1="8" x2="15" y2="8" strokeWidth="2.5"/>
                          <line x1="9" y1="12" x2="15" y2="12" strokeWidth="2.5"/>
                          <line x1="9" y1="16" x2="13" y2="16" strokeWidth="2.5"/>
                        </svg>
                      </div>
                      <div className="text-sm text-black font-normal font-['Instrument_Sans'] truncate w-full text-center">{file.filename || 'Untitled'}</div>
                    </div>
                  ))}
                  {/* Upload button as a grid item */}
                  <label className="flex flex-col items-center justify-center bg-white/80 rounded-2xl p-6 shadow-sm border border-white cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-xl mb-2">
                      {/* Plus icon for upload */}
                      <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="12" height="16" rx="2"/>
                        <line x1="12" y1="9" x2="12" y2="15"/>
                        <line x1="9" y1="12" x2="15" y2="12"/>
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700 font-['Arimo']">Upload Files</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
                {uploadError ? (
                  <div className="mt-4 text-lg text-red-600 font-['Arimo']">{uploadError}</div>
                ) : null}
                {/* Overlay preview for selected file */}
                {selectedFile && (
                  <div
                    className="absolute inset-0 z-50 flex flex-row bg-white/95 border-2 border-blue-400 rounded-[20px] overflow-hidden"
                    style={{ minHeight: "320px" }}
                  >
                    <div className="bg-white rounded-2xl shadow-xl flex flex-row max-w-3xl w-full mx-4" style={{ minHeight: "320px" }}>
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

                      // Preview image for file hub selection (download URL or blob)
                      function FileImagePreview({ file }) {
                        const [previewUrl, setPreviewUrl] = React.useState(file.url || "");

                        React.useEffect(() => {
                          let url = file.url;
                          // If no direct URL, fallback to API download endpoint
                          if (!url) {
                            url = `/api/documents/${file.id}/download`;
                          }
                          setPreviewUrl(url);
                          return () => {
                            // No need to revoke for remote URLs, only for blobs
                          };
                        }, [file]);

                        return (
                          <img
                            src={previewUrl}
                            alt={file.filename}
                            className="max-w-full max-h-80 rounded-lg"
                            style={{ objectFit: "contain" }}
                          />
                        );
                      }
                      </div>
                      {/* Right: File info and actions */}
                      <div className="w-[340px] flex flex-col justify-center p-8 border-l border-gray-200 bg-white">
                        <div className="text-xl text-black font-bold font-['Instrument_Sans'] mb-2 text-center rounded bg-gray-100 px-4 py-1 mb-4">{selectedFile.filename || "Untitled"}</div>
                        <div className="flex flex-row gap-3 mb-6 justify-center">
                          {/* Download button (>>) */}
                          <button
                            className="flex flex-col items-center bg-gray-100 hover:bg-blue-100 rounded-lg px-3 py-2 shadow border border-gray-200"
                            title="Download file"
                            onClick={() => handleDownload(selectedFile.id, selectedFile.filename)}
                          >
                            <span className="text-xl">&gt;&gt;</span>
                          </button>
                          {/* Share/user button (placeholder) */}
                          <button
                            className="flex flex-col items-center bg-gray-100 hover:bg-blue-100 rounded-lg px-3 py-2 shadow border border-gray-200"
                            title="Share or manage access"
                          >
                            <svg width="20" height="20" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4"/></svg>
                          </button>
                          {/* Delete button */}
                          <button
                            className="flex flex-col items-center bg-gray-100 hover:bg-red-100 rounded-lg px-3 py-2 shadow border border-gray-200"
                            title="Delete file"
                            onClick={() => handleDelete(selectedFile.id)}
                          >
                            <svg width="20" height="20" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24"><rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 9l6 6M15 9l-6 6"/></svg>
                          </button>
                        </div>
                        <div className="text-xs text-gray-600 font-['Arimo'] mb-1 text-center">{selectedFile.project_id ? "Shared to project" : "Private"}</div>
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
            </div>
          </section>
        </main>
      </div>
  );
}


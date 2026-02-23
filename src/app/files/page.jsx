'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function FilesPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const formatFileSize = (bytes) => {
    if (typeof bytes !== 'number' || Number.isNaN(bytes)) {
      return 'Unknown size';
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
      const response = await fetch('/api/documents', { credentials: 'include' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to load files');
      }
      const data = await response.json();
      setFiles(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', { credentials: 'include' });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load projects:', err);
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
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (selectedProject) {
        formData.append('project_id', selectedProject);
      }

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Upload failed');
      }

      await fetchFiles();
      event.target.value = '';
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleOpen = async (documentId) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to open file');
      }
      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setError(err.message || 'Failed to open file');
    }
  };


  const handlePreview = async (documentId) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to preview file');
      }
      const data = await response.json();
      if (data.url) {
        // Preview: open in new tab for viewing
        window.open(data.url, '_blank');
      }
    } catch (err) {
      setError(err.message || 'Failed to preview file');
    }
  };

  const handleDownload = async (documentId, filename) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to download file');
      }
      const data = await response.json();
      if (data.url) {
        // Download: create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = data.url;
        link.download = filename || '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      setError(err.message || 'Failed to download file');
    }
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
          <div className="bg-zinc-300 rounded-[20px] min-h-[520px] md:min-h-[620px] p-6 md:p-10">
            <div className="flex items-center justify-between mb-6">
              <div className="text-black text-2xl font-normal font-['Instrument_Sans']">Your Files</div>
              <div className="text-sm text-gray-600 font-['Arimo']">{files.length} items</div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-6">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-900 text-sm font-['Arimo'] cursor-pointer border border-white shadow-sm">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
                {uploading ? 'Uploading...' : 'Upload file'}
              </label>
              <select
                className="px-3 py-2 rounded-lg bg-white text-sm text-gray-700 font-['Arimo'] border border-white shadow-sm"
                value={selectedProject}
                onChange={(event) => setSelectedProject(event.target.value)}
                disabled={uploading}
              >
                <option value="">Private (just me)</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title || project.name || 'Untitled project'}
                  </option>
                ))}
              </select>
              {uploadError ? (
                <div className="text-sm text-red-600 font-['Arimo']">{uploadError}</div>
              ) : null}
            </div>

            {loading ? (
              <div className="text-center text-gray-700 font-['Arimo']">Loading files...</div>
            ) : error ? (
              <div className="text-center text-red-600 font-['Arimo']">{error}</div>
            ) : files.length === 0 ? (
              <div className="text-center text-gray-700 font-['Arimo']">No files yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="bg-white/80 rounded-2xl p-4 shadow-sm border border-white">
                    <div className="w-14 h-14 bg-gray-200 rounded-xl mb-3"></div>
                    <div className="text-base text-black font-normal font-['Instrument_Sans'] truncate">
                      {file.filename || 'Untitled'}
                    </div>
                    <div className="text-xs text-gray-600 font-['Arimo'] mt-1">
                      {file.project_id ? 'Shared to project' : 'Private'}
                    </div>
                    <div className="text-xs text-gray-500 font-['Arimo'] mt-1">
                      {file.file_type || 'Unknown type'} · {formatFileSize(file.file_size)}
                    </div>
                    {/* Removed Open button */}
                    <div className="flex flex-row gap-4 mt-2">
                      <a
                        href="#"
                        onClick={async (e) => {
                          e.preventDefault();
                          try {
                            const response = await fetch(`/api/documents/${file.id}/download`, { credentials: 'include' });
                            if (!response.ok) throw new Error('Failed to preview file');
                            const data = await response.json();
                            if (data.url) window.open(data.url, '_blank');
                          } catch (err) { setError('Failed to preview file'); }
                        }}
                        className="text-sm text-blue-700 font-['Arimo'] underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Preview
                      </a>
                      <a
                        href="#"
                        onClick={async (e) => {
                          e.preventDefault();
                          try {
                            const response = await fetch(`/api/documents/${file.id}/download`, { credentials: 'include' });
                            if (!response.ok) throw new Error('Failed to download file');
                            const data = await response.json();
                            if (data.url) {
                              // Download: create a temporary link and trigger download
                              const link = document.createElement('a');
                              link.href = data.url;
                              link.download = file.filename || '';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          } catch (err) { setError('Failed to download file'); }
                        }}
                        className="text-sm text-green-700 font-['Arimo'] underline"
                        rel="noopener noreferrer"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

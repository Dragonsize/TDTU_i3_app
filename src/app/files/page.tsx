'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface FileItem {
  id: string;
  filename: string;
  file_url: string;
  uploaded_by: string;
  created_at: string;
  project_id?: string;
  permissions?: string[];
}

export default function Files() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      setIsDark(savedTheme === 'true');
    }
    fetchProjects();
    fetchFiles();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/documents?project_id=all`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!fileToUpload || !selectedProjectId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('project_id', selectedProjectId);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        await fetchFiles();
        setShowUpload(false);
        setFileToUpload(null);
        setSelectedProjectId('');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/documents/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setFiles(files.filter(f => f.id !== fileId));
        setShowPreview(false);
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handlePreview = (file: FileItem) => {
    setSelectedFile(file);
    setShowPreview(true);
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '')) return 'image';
    if (['pdf'].includes(ext || '')) return 'picture_as_pdf';
    if (['doc', 'docx'].includes(ext || '')) return 'description';
    if (['xls', 'xlsx'].includes(ext || '')) return 'table_chart';
    return 'insert_drive_file';
  };

  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden">
      <div className="w-full max-w-[1440px] min-h-screen relative mx-auto">
        <div
          className={`font-display bg-white dark:bg-[#050505] text-slate-900 dark:text-white transition-all duration-300 min-h-screen relative ${isExpanded ? 'md:pr-64' : 'md:pr-20'} pr-0`}
        >
      <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>

      <nav
        className={`fixed right-0 top-0 h-screen py-8 z-50 flex flex-col items-center justify-between border-l border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#1a1025]/80 backdrop-blur-md shadow-2xl dark:shadow-none transition-all duration-300 ${isExpanded ? 'w-64' : 'w-0 md:w-20'} overflow-visible`}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`absolute top-1/2 -translate-y-1/2 -left-5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-110 transition-transform z-50`}
        >
          <span className="material-symbols-outlined text-sm">{isExpanded ? 'chevron_right' : 'chevron_left'}</span>
        </button>

        <div className={`flex flex-col items-center justify-between w-full h-full overflow-hidden ${isExpanded ? 'opacity-100 w-64' : 'opacity-0 md:opacity-100 md:w-20'} transition-opacity duration-200`}>
          <div className="flex flex-col items-center gap-2 w-full px-4">
            <div className="flex items-center gap-3 w-full justify-center">
              <img src="/avt.jpg" alt="ITZone" className="w-9 h-9 rounded-full object-cover" />
              {isExpanded && (
                <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden">ITZone</h2>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full px-4">
            <NavItem icon="dashboard" label="Dashboard" isExpanded={isExpanded} href="/dashboard" />
            <NavItem icon="smart_toy" label="AI Chatbot" isExpanded={isExpanded} href="/chatbot" />
            <NavItem icon="folder" label="Files" isExpanded={isExpanded} href="/files" active />
            <NavItem icon="calendar_month" label="Calendar" isExpanded={isExpanded} href="/calendar" />
            <NavItem icon="account_circle" label="Settings" isExpanded={isExpanded} href="/settings" />
          </div>

          <div className="flex flex-col items-center gap-6 w-full px-4" />
        </div>
      </nav>

      <main className="px-4 lg:px-40 py-12 relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl lg:text-6xl font-black mb-2 tracking-tight">
              <span className="text-gradient">Upload your file</span>
            </h1>
            <p className="text-slate-600 dark:text-white/60">Manage and share your documents</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
            Upload File
          </button>
        </div>

        {/* File Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-white/50 dark:bg-white/5 glass-effect border border-slate-200 dark:border-white/10 rounded-2xl p-6 hover:shadow-xl dark:hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => handlePreview(file)}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-4xl text-primary">{getFileIcon(file.filename)}</span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">{file.filename}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Uploaded by {file.uploaded_by}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(file.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}

          {files.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
              <span className="material-symbols-outlined text-6xl mb-4">folder_open</span>
              <p>No files uploaded yet</p>
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">Upload your file</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Project</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Choose a project...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Choose File</label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center hover:border-primary transition-colors">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="material-symbols-outlined text-5xl text-slate-400 mb-2 block">upload_file</span>
                      {fileToUpload ? (
                        <p className="text-sm text-slate-600 dark:text-slate-400">{fileToUpload.name}</p>
                      ) : (
                        <p className="text-sm text-slate-500">Click to select file</p>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowUpload(false)}
                  className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-800 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!fileToUpload || !selectedProjectId || uploading}
                  className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && selectedFile && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-primary">{getFileIcon(selectedFile.filename)}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedFile.filename}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Content File 1</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 mb-6 min-h-[300px] flex items-center justify-center">
                <span className="material-symbols-outlined text-8xl text-slate-300 dark:text-slate-600">{getFileIcon(selectedFile.filename)}</span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Uploaded by:</span>
                  <span className="font-medium">{selectedFile.uploaded_by}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Upload date:</span>
                  <span className="font-medium">{new Date(selectedFile.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Permissions:</span>
                  <span className="font-medium">Project members</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => window.open(selectedFile.file_url, '_blank')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 dark:bg-slate-800 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined">visibility</span>
                  Open
                </button>
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = selectedFile.file_url;
                    a.download = selectedFile.filename;
                    a.click();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 dark:bg-slate-800 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined">download</span>
                  Download
                </button>
                <button
                  onClick={() => handleDelete(selectedFile.id)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, isExpanded, href, active }: { icon: string; label: string; isExpanded: boolean; href: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center rounded-xl transition-colors ${
        active 
          ? 'bg-primary/10 dark:bg-primary/20' 
          : 'hover:bg-slate-100 dark:hover:bg-white/10'
      } ${isExpanded ? 'w-full px-4 py-3 gap-3 justify-start' : 'justify-center w-10 h-10 mx-auto'}`}
    >
      <span className={`material-symbols-outlined transition-colors shrink-0 ${
        active 
          ? 'text-primary' 
          : 'text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-white'
      }`}>
        {icon}
      </span>
      {isExpanded ? (
        <span className={`font-medium whitespace-nowrap overflow-hidden ${
          active 
            ? 'text-primary dark:text-primary' 
            : 'text-slate-600 dark:text-slate-300'
        }`}>{label}</span>
      ) : (
        <span className="absolute right-full mr-4 px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {label}
        </span>
      )}
    </Link>
  );
}

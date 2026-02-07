'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from '../../lib/useTranslations';
import { NotificationContainer, type NotificationProps } from '../../components/Notification';
import { registerServiceWorker, requestNotificationPermission, sendLocalNotification } from '../../lib/pushNotifications';

export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [backendNotifications, setBackendNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize service worker and check notification permission
    const initPushNotifications = async () => {
      await registerServiceWorker();
      
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission as NotificationPermission);
        const hasPushSupport = 'serviceWorker' in navigator && 'PushManager' in window;
        setIsPushEnabled(hasPushSupport && Notification.permission === 'granted');
      }
    };
    initPushNotifications();
  }, []);
  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      setIsDark(savedTheme === 'true');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark]);

  useEffect(() => {
    // Get profile from localStorage and then fetch from database
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      const parsed = JSON.parse(storedProfile);
      setProfile(parsed);
      
      // Fetch updated profile from database
      fetchProfileFromDatabase(parsed.username);
    } else {
      // Redirect to login if no profile
      router.push('/login');
    }
  }, [router]);

  const fetchProfileFromDatabase = async (username: string) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfile(data.profile);
          localStorage.setItem('userProfile', JSON.stringify(data.profile));
        }
      }
    } catch (error) {
      console.error('Error fetching profile from database:', error);
      // Use localStorage profile as fallback
    }
  };

  useEffect(() => {
    // Fetch user's projects
    if (profile?.username) {
      fetchProjects();
      fetchDeadlines();
    }
  }, [profile]);

  useEffect(() => {
    if (Array.isArray(projects) && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchDocuments(selectedProjectId);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (profile?.id) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [profile]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchDeadlines = async () => {
    try {
      const response = await fetch('/api/deadlines?days=7', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      setDeadlines(data || []);
    } catch (error) {
      console.error('Error fetching deadlines:', error);
    }
  };

  const fetchDocuments = async (projectId: string) => {
    try {
      const response = await fetch(`/api/documents?project_id=${projectId}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      setBackendNotifications(data || []);
      const unread = (data || []).filter((n: any) => !n.read).length;
      setUnreadCount(unread);

      // Show browser notification for new notifications
      if (data && data.length > 0) {
        const latestNotif = data[0];
        if (lastNotificationId !== latestNotif.id) {
          setLastNotificationId(latestNotif.id);
          
          // Only show browser notification if it's unread and permission is granted
          if (!latestNotif.read && Notification.permission === 'granted') {
            sendLocalNotification({
              title: latestNotif.title,
              body: latestNotif.message || '',
              icon: '/avt.jpg',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include',
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleCreateProject = async () => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: newProject.title,
          description: newProject.description,
        })
      });
      
      const data = await response.json();
      if (data) {
        setShowCreateModal(false);
        setNewProject({ title: '', description: '' });
        fetchProjects();
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedProjectId) {
      setUploadError('Select a project first');
      return;
    }
    if (!selectedFile) {
      setUploadError('Select a file to upload');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('project_id', selectedProjectId);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      setUploadMessage('Document uploaded successfully');
      setSelectedFile(null);
      fetchDocuments(selectedProjectId);
    } catch (error: any) {
      setUploadError(error?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('userProfile');
      router.push('/');
    }
  };

  const showDemoNotification = async () => {
    // First check if we need to request permission
    if (notificationPermission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotificationPermission('granted');
        setIsPushEnabled(true);
      } else {
        console.log('Notification permission denied');
        return;
      }
    }

    const demoPushNotifications = [
      {
        title: 'Assignment Due Soon',
        body: 'Advanced Database Systems project due in 2 hours',
        icon: 'assignment',
      },
      {
        title: 'Team Meeting Starts in 15 min',
        body: 'Project kickoff meeting in conference room A',
        icon: 'event',
      },
      {
        title: 'New Collaboration Invite',
        body: 'You\'ve been added to "Web Development" project',
        icon: 'person_add',
      }
    ];
    // Show push notifications with staggered timing
    demoPushNotifications.forEach((notif, index) => {
      setTimeout(() => {
        sendLocalNotification({
          title: notif.title,
          body: notif.body,
        });
      }, index * 800);
    });

    // Also show browser notifications for demo
    const demoNotifications: NotificationProps[] = [
      {
        id: 'demo-1',
        type: 'deadline',
        title: 'Assignment Due Soon',
        description: 'Advanced Database Systems project due in 2 hours',
        icon: 'assignment',
        duration: 6000
      },
      {
        id: 'demo-2',
        type: 'event',
        title: 'Team Meeting Starts in 15 min',
        description: 'Project kickoff meeting in conference room A',
        icon: 'event',
        duration: 6000
      },
      {
        id: 'demo-3',
        type: 'reminder',
        title: 'New Collaboration Invite',
        description: 'You\'ve been added to "Web Development" project',
        icon: 'person_add',
        duration: 6000
      }
    ];

    // Show in-browser notifications with staggered timing
    demoNotifications.forEach((notif, index) => {
      setTimeout(() => {
        setNotifications(prev => [...prev, notif]);
        
        // Remove notification after duration
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notif.id));
        }, notif.duration || 5000);
      }, index * 800);
    });
  };

  if (!profile) {
    return (
      <div className="w-full min-h-screen bg-white overflow-x-hidden">
        <div className="w-full max-w-[1440px] min-h-screen relative mx-auto">
          <div className="min-h-screen bg-[#f7f6f8] dark:bg-[#050505] flex items-center justify-center">
            <div className="animate-pulse text-slate-600 dark:text-slate-400">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden">
      <div className="w-full max-w-[1440px] min-h-screen relative mx-auto">
        <div className={`font-display bg-[#f7f6f8] dark:bg-[#050505] text-slate-900 dark:text-white min-h-screen relative ${isExpanded ? 'md:pr-64' : 'md:pr-20'} pr-0 transition-[padding-right] duration-300`}>
          <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>

        <NotificationContainer notifications={notifications} />

        <nav className={`fixed right-0 top-0 h-screen py-8 z-50 flex flex-col items-center justify-between border-l border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#1a1025]/80 backdrop-blur-md shadow-2xl dark:shadow-none transition-all duration-300 ${isExpanded ? 'w-64' : 'w-0 md:w-20'} overflow-visible`}>
          <button onClick={() => setIsExpanded(!isExpanded)} className={`absolute top-1/2 -translate-y-1/2 -left-5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-110 transition-transform z-50 ${isExpanded ? '' : 'md:flex'}`}>
            <span className="material-symbols-outlined text-sm">{isExpanded ? 'chevron_right' : 'chevron_left'}</span>
          </button>

          <div className={`flex flex-col items-center justify-between w-full h-full overflow-hidden ${isExpanded ? 'opacity-100 w-64' : 'opacity-0 md:opacity-100 md:w-20'} transition-opacity duration-200`}>
            <div className="flex flex-col items-center gap-2 w-full px-4">
              <div className="flex items-center gap-3 w-full justify-center">
                <div className="items-center justify-center">
                  <img src="/avt.jpg" alt="ITZone" className="w-9 h-9 rounded-full object-cover" />
                </div>
                {isExpanded && (
                  <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden animate-fade-in">
                    ITZone
                  </h2>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full px-4">
              <NavItem icon="dashboard" label={t('dashboard')} isExpanded={isExpanded} href="/dashboard" active />
              <NavItem icon="smart_toy" label={t('aiChatbot')} isExpanded={isExpanded} href="/chatbot" />
              <NavItem icon="calendar_month" label={t('calendar')} isExpanded={isExpanded} href="/calendar" />
              <NavItem icon="account_circle" label={t('settings')} isExpanded={isExpanded} href="/settings" />
            </div>

            <div className="flex flex-col items-center gap-6 w-full px-4" />
          </div>
        </nav>

        <main className="px-4 lg:px-40 py-12 relative">
          <div className="mb-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-4xl lg:text-6xl font-black mb-4 tracking-tight text-slate-900 dark:text-white break-words">
                {t('welcomeBack')}, <span className="text-gradient inline-block">{profile.fullname?.split(' ').pop() || 'Student'}</span>
              </h1>
              <p className="text-slate-600 dark:text-white/60 text-lg">
                {t('personalizedHub')}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={showDemoNotification} className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all hover:scale-105 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 px-5 py-3 font-bold whitespace-nowrap">
                <span className="material-symbols-outlined text-xl">notifications</span>
                <span>Demo Notification</span>
              </button>
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all hover:scale-105 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 px-5 py-3 font-bold whitespace-nowrap">
                <span className="material-symbols-outlined text-xl">logout</span>
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            <StatCard icon="folder" label="Active Projects" value={(Array.isArray(projects) ? projects.length : 0).toString()} color="primary" />
            <StatCard icon="event" label="Upcoming Deadlines" value={(Array.isArray(deadlines) ? deadlines.length : 0).toString()} color="secondary" />
            <StatCard icon="task" label="Workflows" value="0" color="primary" />
          </div>

        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Projects</h2>
            <button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary/80 text-white rounded-xl px-6 py-3 font-bold transition-all hover:scale-105 shadow-lg shadow-primary/20 flex items-center gap-2">
              <span className="material-symbols-outlined">add</span>
              <span>Create Project</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {!Array.isArray(projects) || projects.length === 0 ? (
              <div className="col-span-2 bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-2xl p-12 text-center">
                <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">folder_off</span>
                <p className="text-slate-500 dark:text-slate-400">No projects yet. Create your first project to get started!</p>
              </div>
            ) : (
              projects.map((project: any) => (
                <ProjectCard key={project.id} project={project} />
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">person</span>
                {t('profileInformation')}
              </h2>
              <div className="space-y-4">
                <ProfileField label={t('fullName')} value={profile.fullname} />
                <ProfileField label={t('email')} value={profile.email} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">notifications</span>
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-auto text-xs bg-primary text-white rounded-full px-2 py-1">
                    {unreadCount}
                  </span>
                )}
              </h2>
              {!Array.isArray(backendNotifications) || backendNotifications.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm">No notifications yet</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-auto">
                  {backendNotifications.slice(0, 6).map((notif) => (
                    <div key={notif.id} className="border-l-4 border-primary/60 pl-3 py-2">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{notif.title}</p>
                      {notif.message && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{notif.message}</p>
                      )}
                      {!notif.read && (
                        <button
                          onClick={() => markNotificationRead(notif.id)}
                          className="text-xs text-primary hover:underline mt-1"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">schedule</span>
                Upcoming Deadlines
              </h2>
              {!Array.isArray(deadlines) || deadlines.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm">No upcoming deadlines</p>
              ) : (
                <div className="space-y-3">
                  {deadlines.slice(0, 5).map((deadline: any) => (
                    <div key={deadline.id} className="border-l-4 border-primary pl-3 py-2">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{deadline.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(deadline.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">smart_toy</span>
                Quick Help
              </h2>
              <Link href="/chatbot" className="text-primary hover:underline text-sm">
                Ask the chatbot how to create a project →
              </Link>
            </div>

            <div className="bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">upload_file</span>
                Documents
              </h2>
              <div className="space-y-3">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {(!Array.isArray(projects) || projects.length === 0) && <option value="">No projects available</option>}
                  {Array.isArray(projects) && projects.map((project: any) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>

                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-500 dark:text-slate-400"
                />

                <button
                  onClick={handleUploadDocument}
                  disabled={uploading || !selectedProjectId || !selectedFile}
                  className="w-full bg-primary hover:bg-primary/80 text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>

                {uploadMessage && (
                  <p className="text-green-600 dark:text-green-400 text-xs">{uploadMessage}</p>
                )}
                {uploadError && (
                  <p className="text-red-600 dark:text-red-400 text-xs">{uploadError}</p>
                )}

                {Array.isArray(documents) && documents.length > 0 && (
                  <div className="pt-2 space-y-2">
                    {documents.slice(0, 5).map((doc: any) => (
                      <a
                        key={doc.id}
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-sm text-primary hover:underline truncate"
                      >
                        {doc.filename}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


        </main>

        {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create New Project</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Project Title
                </label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                  placeholder="Enter project title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                  placeholder="Enter project description"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProject.title}
                className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: any }) {
  return (
    <div className="bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{project.title}</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2">{project.description}</p>
        </div>
        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
          {project.status}
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">group</span>
          <span>Members</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">task</span>
          <span>Workflows</span>
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
        <span className={`font-medium whitespace-nowrap overflow-hidden animate-fade-in ${
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

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-2xl p-6 hover:scale-105 transition-transform">
      <div className="flex items-center justify-between mb-4">
        <div className={`size-12 rounded-xl bg-${color}/20 flex items-center justify-center text-${color}`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div className="text-3xl font-black text-slate-900 dark:text-white">{value}</div>
      </div>
      <p className="text-slate-600 dark:text-slate-400 font-medium">{label}</p>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 border-b border-slate-200 dark:border-white/5 last:border-0">
      <span className="text-slate-500 dark:text-slate-400 font-medium min-w-[140px]">{label}</span>
      <span className="text-slate-900 dark:text-white font-semibold">{value || 'N/A'}</span>
    </div>
  );
}

'use client';
import React, { useState, useEffect } from 'react';

export interface NotificationProps {
  id: string;
  type: 'event' | 'deadline' | 'reminder';
  title: string;
  description?: string;
  icon?: string;
  duration?: number;
}

export function Notification({ 
  id, 
  type, 
  title, 
  description,
  icon = 'notifications',
  duration = 5000
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!isVisible) return null;

  const typeColors = {
    event: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    deadline: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
    reminder: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'
  };

  const typeIconColors = {
    event: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900',
    deadline: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900',
    reminder: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900'
  };

  return (
    <div
      className={`fixed top-4 right-4 max-w-md w-full animate-fade-in-down z-[999] transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div
        className={`flex items-start gap-4 p-4 rounded-lg border shadow-lg dark:shadow-none backdrop-blur-sm ${typeColors[type]}`}
      >
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${typeIconColors[type]}`}>
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
            {title}
          </h3>
          {description && (
            <p className="text-slate-600 dark:text-slate-300 text-xs mt-1">
              {description}
            </p>
          )}
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  );
}

export function NotificationContainer({ 
  notifications 
}: { 
  notifications: NotificationProps[] 
}) {
  return (
    <div className="fixed top-4 right-4 space-y-2 z-[999]">
      {notifications.map((notification) => (
        <Notification key={notification.id} {...notification} />
      ))}
    </div>
  );
}

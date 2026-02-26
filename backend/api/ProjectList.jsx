import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ProjectList() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error("Failed to load projects", err));
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">My Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link 
            key={project.id} 
            to={`/projects/${project.id}`} // This matches the route in App.jsx
            className="block p-6 bg-white border rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: project.color || '#000' }}
              ></div>
              <h2 className="text-xl font-semibold">{project.title}</h2>
            </div>
            <p className="text-gray-600">{project.description || "No description"}</p>
            <div className="mt-4 text-sm text-gray-400">Status: {project.status}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
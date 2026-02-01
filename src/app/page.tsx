'use client';
import { useState } from 'react';

export default function ApiTestPage() {
  const [status, setStatus] = useState('Idle');
  const [response, setResponse] = useState<any>(null);

  const runTest = async () => {
    setStatus('Sending request...');
    try {
      const res = await fetch('/api/calendar_logic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_time: "2026-02-01T14:00:00",
          end_time: "2026-02-01T15:00:00",
          team_schedules: [
            { 
              user_id: "user_01", 
              username: "An", 
              start_time: "2026-02-01T14:30:00", 
              end_time: "2026-02-01T15:30:00", 
              title: "Học Taekwondo" 
            }
          ]
        })
      });
      const data = await res.json();
      setResponse(data);
      setStatus('Success!');
    } catch (err) {
      setStatus('Error connecting to backend');
      console.error(err);
    }
  };

  return (
    <div className="p-10 bg-slate-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4 text-purple-400">Local Integration Test</h1>
      <button 
        onClick={runTest}
        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded shadow-lg transition"
      >
        Check Conflict (An's Schedule)
      </button>
      
      <div className="mt-6 p-4 bg-slate-800 rounded border border-slate-700">
        <p className="mb-2"><strong>Status:</strong> {status}</p>
        <pre className="text-sm bg-black p-4 rounded overflow-auto">
          {response ? JSON.stringify(response, null, 2) : "No data yet..."}
        </pre>
      </div>
    </div>
  );
}
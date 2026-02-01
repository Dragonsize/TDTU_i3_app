import React from 'react';

export default function Home() {
  return (
    <div className="font-sans bg-[#0f0a19] text-white min-h-screen relative md:pr-20">
      <div className="fixed inset-0 grid-bg pointer-events-none"></div>

      {/* Sidebar Nav */}
      <nav className="fixed right-0 top-0 h-screen w-20 flex flex-col items-center justify-between py-8 border-l border-white/10 bg-[#1a1025]/80 backdrop-blur-md z-50">
        <div className="flex flex-col items-center gap-8">
          <img src="/avt.jpg" className="w-10 h-10 rounded-full border-2 border-purple-500" alt="Avatar" />
          <span className="material-symbols-outlined text-slate-400 hover:text-white cursor-pointer transition">manage_search</span>
          <span className="material-symbols-outlined text-slate-400 hover:text-white cursor-pointer transition">group_add</span>
          <span className="material-symbols-outlined text-slate-400 hover:text-white cursor-pointer transition">rocket_launch</span>
        </div>
        <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-purple-500">dark_mode</span>
            <a href="/login" className="bg-purple-600 p-2 rounded-lg"><span className="material-symbols-outlined">login</span></a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 px-6 lg:px-40 py-32">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="text-6xl lg:text-8xl font-black mb-6">Team <span className="text-gradient">3</span>.</h1>
            <p className="text-lg text-white/60 mb-8 max-w-lg">
              Tired of manually setting your uni schedule? No more with our service!
            </p>
            <div className="flex gap-4">
              <button className="bg-purple-600 hover:bg-purple-500 px-8 py-4 rounded-xl font-bold transition shadow-lg shadow-purple-500/20">
                Get Started
              </button>
            </div>
          </div>
          
          <div className="relative">
            <div className="rounded-3xl border border-white/10 overflow-hidden shadow-2xl rotate-2">
              <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b" alt="Tech" className="w-full h-full object-cover opacity-80" />
            </div>
          </div>
        </div>
      </main>

      {/* Floating Widget */}
      <div id="gcal-widget-container">
        <div className="gcal-header">
          <span className="text-xs font-bold">Hỗ Trợ Sinh Viên TDTU</span>
          <span className="material-symbols-outlined text-xs cursor-pointer">close</span>
        </div>
        <div className="gcal-body">
          <label className="text-[10px] text-gray-400 uppercase">Hoạt động mới</label>
          <input type="text" placeholder="VD: Tập Taekwondo..." className="gcal-input" />
          <div className="flex gap-2">
            <input type="datetime-local" className="gcal-input" />
          </div>
          <button className="gcal-submit">Lưu Lịch Bận</button>
        </div>
      </div>
    </div>
  );
}
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>

      <header className="relative z-10">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black">T3</div>
            <span className="text-lg font-black tracking-tight">Team <span className="text-gradient">3</span>.</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <Link href="#" className="hover:text-primary transition">Hackathons</Link>
            <Link href="#" className="hover:text-primary transition">Find Team</Link>
            <Link href="#" className="hover:text-primary transition">Projects</Link>
            <Link href="#" className="hover:text-primary transition">Mentors</Link>
          </nav>
          <Link href="/login" className="bg-primary text-white px-5 py-2 rounded-lg font-bold text-sm hover:shadow-[0_0_25px_rgba(127,19,236,0.4)] transition">
            Get Started
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-6 lg:px-10 pt-20 pb-16 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="uppercase tracking-[0.4em] text-xs text-slate-500 mb-4">Team 3</p>
            <h1 className="text-5xl lg:text-7xl font-black mb-6 tracking-tight">Connecting students to global hackathons and AI-powered teammate matching.</h1>
            <p className="text-lg text-slate-600 mb-8 max-w-xl leading-relaxed">
              Join the elite network of student innovators and turn ideas into reality.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/login" className="bg-primary text-white px-8 py-4 rounded-xl font-bold hover:shadow-[0_0_30px_rgba(127,19,236,0.45)] transition-all">
                Get Started
              </Link>
              <button className="px-6 py-4 rounded-xl border border-slate-200 text-slate-700 hover:border-primary hover:text-primary transition">Explore</button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-10 -right-10 h-56 w-56 rounded-full bg-primary/20 blur-3xl"></div>
            <div className="rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-2xl overflow-hidden">
              <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b" className="w-full h-full object-cover" alt="Tech Workspace" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 lg:px-10 py-16">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl lg:text-4xl font-black">Everything you need to win</h2>
            <button className="px-5 py-2 rounded-lg bg-primary/10 text-primary font-bold text-sm">explore</button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard icon="manage_search" title="Discover Events" description="Browse and join global hackathons seamlessly with one-click registration." />
            <FeatureCard icon="group_add" title="Dream Teams" description="AI-powered teammate matching based on complementary skill sets." />
            <FeatureCard icon="auto_awesome_motion" title="Winning Archives" description="Showcase your builds and explore winning projects from around the world." />
            <FeatureCard icon="psychology" title="Mentor Matching" description="Get industry expert guidance for your build from senior engineers." />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 lg:px-10 py-16">
          <div className="rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#1a1025] to-[#0f172a] text-white p-10 lg:p-14 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div>
              <p className="uppercase tracking-[0.4em] text-xs text-white/60 mb-3">TDTU</p>
              <h3 className="text-3xl lg:text-4xl font-black mb-4">Dự án cho cuộc thi phần mềm IT-ZONE Team 3.</h3>
              <p className="text-white/70 max-w-xl">Empowering TDTU students to build, connect, and showcase world-class projects.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">⚡</div>
              <span className="font-bold">Build with Team 3</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 py-12 grid md:grid-cols-3 gap-8 text-sm text-slate-600">
          <div>
            <div className="text-lg font-black text-slate-900 mb-2">Team 3.</div>
            <p>© 2026 IT-ZONE TEAM 3. All rights reserved.</p>
          </div>
          <div>
            <div className="font-bold text-slate-900 mb-2">Additional Links</div>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-primary">Hackathons</Link></li>
              <li><Link href="#" className="hover:text-primary">Find Team</Link></li>
              <li><Link href="#" className="hover:text-primary">Projects</Link></li>
              <li><Link href="#" className="hover:text-primary">Mentors</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-slate-900 mb-2">Legal</div>
            <ul className="space-y-2">
              <li><Link href="#" className="hover:text-primary">Điều khoản sử dụng</Link></li>
              <li><Link href="#" className="hover:text-primary">Chính sách bảo mật</Link></li>
              <li><Link href="#" className="hover:text-primary">Cookie dữ liệu</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl p-6 hover:shadow-xl transition">
      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}
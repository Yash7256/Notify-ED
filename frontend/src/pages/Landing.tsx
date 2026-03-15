import { ArrowRight, Check } from 'lucide-react'

export function Landing() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
          --ink: #0a0a08;
          --paper: #f5f0e8;
          --accent: #d4440c;
          --accent2: #1a472a;
          --muted: #7a7568;
          --rule: #d8d2c4;
          --card: #eee9df;
          --white: #fafaf7;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--paper);
          color: var(--ink);
          font-weight: 300;
          line-height: 1.65;
        }

        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 999;
          opacity: 0.5;
        }

        .font-display {
          font-family: 'Playfair Display', serif;
          font-weight: 700;
        }

        .font-mono {
          font-family: 'DM Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .font-body {
          font-family: 'DM Sans', sans-serif;
        }

        .section-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--accent);
        }

        .fade-up {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }

        .fade-up.visible {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes slideIn {
          from { transform: translateX(24px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .marquee {
          animation: scroll 18s linear infinite;
        }

        .channel-row {
          animation: slideIn 0.5s ease forwards;
          opacity: 0;
        }

        .channel-row:nth-child(1) { animation-delay: 0s; }
        .channel-row:nth-child(2) { animation-delay: 0.15s; }
        .channel-row:nth-child(3) { animation-delay: 0.3s; }

        .grid-gap-border {
          gap: 1px;
          background: var(--rule);
        }

        .nav-link {
          font-family: 'DM Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 0.75rem;
          color: var(--muted);
          transition: color 0.2s;
        }

        .nav-link:hover {
          color: var(--ink);
        }

        .stat-number {
          font-family: 'Playfair Display', serif;
          font-weight: 900;
        }

        .step-number {
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          color: var(--rule);
        }

        .pill-tag {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .feature-card {
          transition: background 0.2s;
        }

        .feature-card:hover {
          background: var(--card);
        }
      `}</style>

      {/* Sticky Nav */}
      <nav className="sticky top-0 z-50 bg-[var(--paper)] border-b border-[var(--rule)]">
        <div className="mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-mono text-xl tracking-[0.1em]">
            Notify<span className="text-[var(--accent)]">ED</span>
          </span>
          <div className="flex items-center gap-8">
            <a href="#stop-notifying" className="nav-link">How It Works</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#audience" className="nav-link">Audience</a>
            <a href="/login" className="nav-link">Login</a>
            <a href="/signup" className="bg-[var(--ink)] text-[var(--paper)] px-5 py-2 font-mono text-xs hover:bg-[var(--accent)] transition-colors">
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex min-h-[85vh]">
        <div className="p-8 md:p-16 flex flex-col justify-center items-center text-center max-w-4xl mx-auto">
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight mb-6">
            <em className="italic text-[var(--accent)]">We notify,</em> students know, that's the system
          </h1>
          <p className="text-[var(--muted)] mb-8 max-w-2xl font-body text-center text-lg leading-relaxed">
            Upload your student list, pick a semester, fill marks row by row the moment you press Enter, every student is notified on Email and WhatsApp. Zero manual work.
          </p>
          <div className="flex items-center gap-6">
            <a href="/signup" className="bg-[var(--accent)] text-white px-6 py-3 font-mono text-sm hover:brightness-110 transition-all">
              Start Notifying
            </a>
            <a href="/login" className="nav-link border-b border-[var(--muted)] pb-1 hover:border-[var(--accent)] hover:text-[var(--accent)]">
              Sign In
            </a>
          </div>
          <div className="mt-12">
            <span className="font-mono text-xs text-[var(--muted)]">Designed for</span>
            <div className="flex gap-3 mt-2 justify-center">
              <span className="pill-tag bg-[var(--card)] px-3 py-1">Faculty</span>
              <span className="pill-tag bg-[var(--card)] px-3 py-1">Admins</span>
              <span className="pill-tag bg-[var(--card)] px-3 py-1">Institutions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Strip */}
      <section className="bg-[var(--ink)] py-4 overflow-hidden">
        <div className="marquee whitespace-nowrap text-[var(--paper)] font-mono text-sm">
          <span className="mx-8">GRADE NOTIFICATIONS</span>
          ◆
          <span className="mx-8">EMAIL DELIVERY</span> ◆
          <span className="mx-8">WHATSAPP ALERTS</span> ◆
          <span className="mx-8">AUTOMATED WORKFLOW</span> ◆
          <span className="mx-8">INSTITUTION READY</span> ◆
          <span className="mx-8">BULK PROCESSING</span> ◆
          <span className="mx-8">REAL-TIME UPDATES</span> ◆
          <span className="mx-8">GRADE NOTIFICATIONS</span> ◆
          <span className="mx-8">EMAIL DELIVERY</span> ◆
          <span className="mx-8">WHATSAPP ALERTS</span> ◆
          <span className="mx-8">AUTOMATED WORKFLOW</span> ◆
          <span className="mx-8">INSTITUTION READY</span> ◆
          <span className="mx-8">BULK PROCESSING</span> ◆
          <span className="mx-8">REAL-TIME UPDATES</span> ◆
        </div>
      </section>

      {/* Problem Section */}
      <section id="stop-notifying" className="grid md:grid-cols-3 min-h-[80vh] border-t border-b border-[var(--rule)]">
        <div className="bg-[var(--ink)] text-[var(--paper)] p-8 md:p-16 flex flex-col justify-center">
          <h2 className="font-display text-4xl md:text-5xl leading-[0.95] mb-6">
            Stop notifying students<br />
            <em className="italic text-[var(--accent)]">one by one.</em>
          </h2>
          <p className="text-[var(--muted)] font-body mb-8">
            Three simple steps to automate your entire grade notification workflow.
          </p>
          <span className="font-mono text-xs text-[var(--muted)]">3 steps</span>
        </div>
        <div className="md:col-span-2 grid md:grid-cols-2 grid-gap-border border-t border-r border-[var(--rule)]">
          {[
            { num: '01', title: 'Upload List', desc: 'Import your student roster via Excel or CSV. We handle duplicates and validate emails automatically.', tag: 'INPUT' },
            { num: '02', title: 'Enter Marks', desc: 'Select semester, fill marks row by row. Real-time validation ensures data integrity.', tag: 'PROCESS' },
            { num: '03', title: 'Auto-Notify', desc: 'Press Enter. Every student receives instant notifications via Email and WhatsApp.', tag: 'OUTPUT' }
          ].map((step, i) => (
            <div key={i} className="bg-[var(--paper)] p-8 md:p-10 feature-card min-h-[280px] flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <span className="step-number text-6xl">{step.num}</span>
                <span className="pill-tag bg-[var(--ink)] text-[var(--paper)] px-2 py-1">{step.tag}</span>
              </div>
              <h3 className="font-display text-2xl mb-3">{step.title}</h3>
              <p className="text-[var(--muted)] font-body text-sm flex-1">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="grid md:grid-cols-3 min-h-[80vh]">
        <div className="bg-[var(--ink)] text-[var(--paper)] p-8 md:p-16 flex flex-col justify-center">
          <span className="section-label text-[var(--muted)] mb-2">Capabilities</span>
          <h2 className="font-display text-4xl md:text-5xl leading-[0.95] mb-6">
            Everything you need to<br />
            <em className="italic text-[var(--accent)]">notify</em> at scale.
          </h2>
          <p className="text-[var(--muted)] font-body mb-8">
            Built for institutions that care about transparency and efficiency.
          </p>
          <span className="font-mono text-xs text-[var(--muted)]">6 features</span>
        </div>
        <div className="md:col-span-2 grid grid-cols-2 grid-gap-border border-t border-r border-[var(--rule)]">
          {[
            { title: 'Email Notifications', desc: 'Professional HTML templates with delivery tracking' },
            { title: 'WhatsApp Alerts', desc: 'Instant delivery to student WhatsApp numbers' },
            { title: 'Analytics Dashboard', desc: 'Track open rates, delivery status, and engagement' },
            { title: 'Secure & Private', desc: 'FERPA-compliant data handling with encryption' },
            { title: 'Audit Logs', desc: 'Complete history of every notification sent' },
            { title: 'Reminder System', desc: 'Automatic reminders for deadlines and submissions' }
          ].map((feature, i) => (
            <div key={i} className="bg-[var(--paper)] p-6 md:p-8 feature-card">
              <h4 className="font-display text-xl mb-2">{feature.title}</h4>
              <p className="text-[var(--muted)] text-sm font-body">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Audience */}
      <section id="audience" className="grid md:grid-cols-2 border-t border-b border-[var(--rule)]">
        <div className="p-8 md:p-16 border-r border-[var(--rule)]">
          <span className="pill-tag border border-[var(--accent)] text-[var(--accent)] px-3 py-1 mb-6 inline-block">Faculty & Admins</span>
          <h3 className="font-display text-3xl md:text-4xl mb-6">
            For those who grade,<br />not who chase.
          </h3>
          <ul className="space-y-3 text-[var(--muted)] font-body">
            <li>→ Save 10+ hours per grading cycle</li>
            <li>→ Eliminate manual follow-ups</li>
            <li>→ Professional communication</li>
            <li>→ Zero technical setup</li>
          </ul>
        </div>
        <div className="p-8 md:p-16">
          <span className="pill-tag border border-[var(--accent2)] text-[var(--accent2)] px-3 py-1 mb-6 inline-block">Institutions</span>
          <h3 className="font-display text-3xl md:text-4xl mb-6">
            Centralized grade<br />communication.
          </h3>
          <ul className="space-y-3 text-[var(--muted)] font-body">
            <li>→ Standardized notifications</li>
            <li>→ Department-wide visibility</li>
            <li>→ Compliance & audit ready</li>
            <li>→ Scalable across semesters</li>
          </ul>
        </div>
      </section>

      {/* Tech Stack Bar */}
      <section className="bg-[var(--card)] py-12">
        <div className="px-8 md:px-16 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <span className="section-label block mb-2">Built With</span>
            <h3 className="font-display text-2xl">Modern stack, reliable delivery.</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {['React', 'Supabase', 'Twilio', 'PostgreSQL', 'TypeScript', 'Tailwind'].map(tech => (
              <span key={tech} className="pill-tag bg-[var(--paper)] border border-[var(--rule)] px-4 py-2 hover:bg-[var(--ink)] hover:text-[var(--paper)] transition-colors cursor-default">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[var(--ink)] text-[var(--paper)] py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 px-8 md:px-16">
          <div>
            <h2 className="font-display text-4xl md:text-6xl leading-[0.95] mb-6">
              Ready to<br />
              <em className="italic text-[var(--accent)]">transform</em><br />
              your workflow?
            </h2>
            <p className="text-[var(--muted)] font-body mb-8 max-w-md">
              Join institutions already using NotifyED to streamline grade communications.
            </p>
            <div className="flex gap-4">
              <button className="bg-[var(--paper)] text-[var(--ink)] px-6 py-3 font-mono text-sm hover:bg-[var(--accent)] hover:text-white transition-colors">
                Get Started Free
              </button>
              <button className="border border-[var(--muted)] text-[var(--paper)] px-6 py-3 font-mono text-sm hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
          <div className="flex flex-col">
            {[
              { num: '01', text: 'Sign up with your institutional email', done: true },
              { num: '02', text: 'Import your first student list', done: true },
              { num: '03', text: 'Configure notification templates', done: false },
              { num: '04', text: 'Go live and start notifying', done: false }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-[var(--muted)]/30">
                <span className="font-mono text-sm text-[var(--muted)]">{item.num}</span>
                <span className="font-body flex-1">{item.text}</span>
                {item.done ? <Check className="w-4 h-4 text-green-500" /> : <ArrowRight className="w-4 h-4 text-[var(--muted)]" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--ink)] text-[var(--muted)] py-12 px-8 md:px-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <span className="font-mono text-lg text-[var(--paper)] tracking-[0.1em]">
              Notify<span className="text-[var(--accent)]">ED</span>
            </span>
          </div>
          <div className="flex gap-8 font-mono text-xs">
            <a href="#" className="hover:text-[var(--paper)] transition-colors">Features</a>
            <a href="#" className="hover:text-[var(--paper)] transition-colors">Pricing</a>
            <a href="#" className="hover:text-[var(--paper)] transition-colors">Docs</a>
            <a href="#" className="hover:text-[var(--paper)] transition-colors">Privacy</a>
          </div>
          <div className="font-mono text-xs">
            © 2025 NotifyED. All rights reserved.
          </div>
        </div>
      </footer>

      <script>{`
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
            }
          });
        }, { threshold: 0.12 });

        document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
      `}</script>
    </>
  )
}

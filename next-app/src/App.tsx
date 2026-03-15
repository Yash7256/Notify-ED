import { Upload, FileSpreadsheet, Mail, Bell, Database, Rocket, RotateCcw, Github, Users, GraduationCap } from "lucide-react"

const steps = [
  { icon: Upload, title: "Upload Roster", desc: "Import student list via Excel/CSV with emails & phone numbers" },
  { icon: FileSpreadsheet, title: "Enter Marks", desc: "Input exam scores or grades for any subject" },
  { icon: Bell, title: "Students Notified", desc: "Instant delivery via Email, WhatsApp & in-app notifications" },
]

const features = [
  { icon: FileSpreadsheet, title: "Excel Upload", desc: "Simple CSV/Excel import with automatic validation" },
  { icon: Mail, title: "Multi-Channel", desc: "Reach students via Email, WhatsApp, or in-app notifications" },
  { icon: Bell, title: "Delivery Logs", desc: "Track every notification with detailed delivery status" },
  { icon: RotateCcw, title: "Retry Support", desc: "Failed deliveries automatically retried with fallback options" },
  { icon: Database, title: "Supabase Backend", desc: "Reliable cloud storage with real-time sync" },
  { icon: Rocket, title: "Easy Deploy", desc: "One-click Vercel deployment, no infrastructure needed" },
]

const audiences = [
  {
    title: "Faculty & Admins",
    icon: Users,
    benefits: [
      "Save hours on manual notifications",
      "Track delivery in real-time",
      "Bulk notify entire classes instantly",
      "Audit trail for all communications",
    ],
  },
  {
    title: "Students",
    icon: GraduationCap,
    benefits: [
      "Receive marks instantly on multiple channels",
      "Never miss an important update",
      "View notification history",
      "Better engagement with timely alerts",
    ],
  },
]

const techStack = [
  { name: "React", color: "#61DAFB" },
  { name: "Supabase", color: "#3ECF8E" },
  { name: "Node.js", color: "#339933" },
  { name: "Vercel", color: "#000000" },
]

export function App() {
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", backgroundColor: "var(--primary)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={20} color="var(--primary-foreground)" />
            </div>
            <span style={{ fontWeight: 700, fontSize: "20px" }}>NotifyED</span>
          </div>
          <nav style={{ display: "flex", gap: "24px", fontSize: "14px", color: "var(--muted-foreground)" }}>
            <a href="#how-it-works" style={{ textDecoration: "none", color: "inherit" }}>How it works</a>
            <a href="#features" style={{ textDecoration: "none", color: "inherit" }}>Features</a>
            <a href="#who-its-for" style={{ textDecoration: "none", color: "inherit" }}>Who it's for</a>
            <a href="#tech-stack" style={{ textDecoration: "none", color: "inherit" }}>Tech Stack</a>
          </nav>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ padding: "8px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Github size={20} />
          </a>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 12px", borderRadius: "9999px", backgroundColor: "var(--muted)", fontSize: "14px", marginBottom: "24px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--primary)", display: "inline-block" }}></span>
            Now with WhatsApp support
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 700, marginBottom: "24px", lineHeight: 1.1 }}>
            Notify Students of Their Marks <span style={{ color: "var(--primary)" }}>Instantly</span>
          </h1>
          <p style={{ fontSize: "18px", color: "var(--muted-foreground)", marginBottom: "32px", maxWidth: "600px", margin: "0 auto 32px" }}>
            Upload your roster, enter marks, and notify students via Email, WhatsApp, or in-app notifications — all in seconds.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", backgroundColor: "var(--primary)", color: "var(--primary-foreground)", borderRadius: "8px", fontWeight: 500, textDecoration: "none" }}>
              <Rocket size={20} />
              Deploy to Vercel
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", border: "1px solid var(--border)", backgroundColor: "var(--background)", borderRadius: "8px", fontWeight: 500, textDecoration: "none", color: "var(--foreground)" }}>
              <Github size={20} />
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: "80px 24px", backgroundColor: "var(--muted)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 700, textAlign: "center", marginBottom: "16px" }}>How It Works</h2>
          <p style={{ color: "var(--muted-foreground)", textAlign: "center", marginBottom: "48px", maxWidth: "500px", margin: "0 auto 48px" }}>
            Get started in 3 simple steps — no setup required.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "32px", maxWidth: "1000px", margin: "0 auto" }}>
            {steps.map((step, i) => (
              <div key={i} style={{ textAlign: "center", padding: "24px", position: "relative" }}>
                <div style={{ width: "64px", height: "64px", margin: "0 auto 16px", backgroundColor: "var(--background)", borderRadius: "16px", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <step.icon size={32} color="var(--primary)" />
                </div>
                <div style={{ position: "absolute", top: "-8px", left: "-8px", width: "32px", height: "32px", backgroundColor: "var(--primary)", color: "var(--primary-foreground)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px" }}>
                  {i + 1}
                </div>
                <h3 style={{ fontWeight: 600, fontSize: "18px", marginBottom: "8px" }}>{step.title}</h3>
                <p style={{ color: "var(--muted-foreground)", fontSize: "14px" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 700, textAlign: "center", marginBottom: "16px" }}>Features</h2>
          <p style={{ color: "var(--muted-foreground)", textAlign: "center", marginBottom: "48px", maxWidth: "500px", margin: "0 auto 48px" }}>
            Everything you need to notify students effectively.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", maxWidth: "1000px", margin: "0 auto" }}>
            {features.map((feature, i) => (
              <div key={i} style={{ padding: "24px", borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                <div style={{ width: "48px", height: "48px", backgroundColor: "var(--muted)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  <feature.icon size={24} />
                </div>
                <h3 style={{ fontWeight: 600, fontSize: "18px", marginBottom: "8px" }}>{feature.title}</h3>
                <p style={{ color: "var(--muted-foreground)", fontSize: "14px" }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section id="who-its-for" style={{ padding: "80px 24px", backgroundColor: "var(--muted)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 700, textAlign: "center", marginBottom: "16px" }}>Who It's For</h2>
          <p style={{ color: "var(--muted-foreground)", textAlign: "center", marginBottom: "48px", maxWidth: "500px", margin: "0 auto 48px" }}>
            Built for educators and students alike.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px", maxWidth: "900px", margin: "0 auto" }}>
            {audiences.map((audience, i) => (
              <div key={i} style={{ padding: "32px", borderRadius: "16px", border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                  <div style={{ width: "48px", height: "48px", backgroundColor: "rgba(0,0,0,0.1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <audience.icon size={24} color="var(--primary)" />
                  </div>
                  <h3 style={{ fontWeight: 600, fontSize: "20px" }}>{audience.title}</h3>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {audience.benefits.map((benefit, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: "12px", color: "var(--muted-foreground)", marginBottom: "12px" }}>
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--primary)" }}></div>
                      </div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech-stack" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 700, textAlign: "center", marginBottom: "16px" }}>Built With</h2>
          <p style={{ color: "var(--muted-foreground)", textAlign: "center", marginBottom: "48px", maxWidth: "500px", margin: "0 auto 48px" }}>
            Modern, reliable technologies you can trust.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "32px" }}>
            {techStack.map((tech, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", fontWeight: 500, color: "var(--muted-foreground)" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "4px", backgroundColor: tech.color }}></div>
                {tech.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px", backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 700, marginBottom: "16px" }}>Ready to Get Started?</h2>
          <p style={{ opacity: 0.9, marginBottom: "32px", maxWidth: "500px", margin: "0 auto 32px" }}>
            Deploy your own instance in minutes.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", backgroundColor: "var(--background)", color: "var(--foreground)", borderRadius: "8px", fontWeight: 500, textDecoration: "none" }}>
              <Rocket size={20} />
              Deploy Now
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", fontWeight: 500, textDecoration: "none", color: "var(--primary-foreground)" }}>
              <Github size={20} />
              Star on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px 24px", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", gap: "16px" }}>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--muted-foreground)", textDecoration: "none" }}>
              <Github size={16} />
              GitHub
            </a>
          </div>
          <p style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>
            Built by NotifyED Team
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App

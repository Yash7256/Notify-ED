import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'

export function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({ email, password })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        :root {
          --ink: #0a0a08;
          --paper: #f5f0e8;
          --accent: #d4440c;
          --muted: #7a7568;
          --rule: #d8d2c4;
          --card: #eee9df;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; background: var(--paper); color: var(--ink); }
        .font-display { font-family: 'Playfair Display', serif; }
        .font-mono { font-family: 'DM Mono', monospace; text-transform: uppercase; letter-spacing: 0.1em; }
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 999;
          opacity: 0.5;
        }
      `}</style>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/home" className="font-mono text-2xl tracking-[0.1em]">
            Notify<span className="text-[var(--accent)]">ED</span>
          </Link>
        </div>
        <div className="bg-[var(--card)] border border-[var(--rule)] p-8">
          {success ? (
            <>
              <h1 className="font-display text-3xl mb-4">Check your email</h1>
              <p className="text-[var(--muted)] mb-6">
                We've sent you a confirmation link. Please check your email to verify your account.
              </p>
              <Link to="/login" className="text-[var(--accent)] hover:underline">Back to Sign In</Link>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl mb-2">Create an account</h1>
              <p className="text-[var(--muted)] mb-8">Get started with NotifyED</p>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="font-mono text-xs block mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--paper)] border border-[var(--rule)] focus:outline-none focus:border-[var(--accent)]"
                    required
                  />
                </div>
                <div>
                  <label className="font-mono text-xs block mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--paper)] border border-[var(--rule)] focus:outline-none focus:border-[var(--accent)]"
                    required
                    minLength={6}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[var(--ink)] text-[var(--paper)] py-3 font-mono text-sm hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Sign Up'}
                </button>
              </form>
              
              <p className="text-center mt-6 text-[var(--muted)]">
                Already have an account?{' '}
                <Link to="/login" className="text-[var(--accent)] hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

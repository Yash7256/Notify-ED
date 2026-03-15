import { Outlet, Link, useLocation } from 'react-router-dom'
import { History as HistoryIcon, LayoutDashboard, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export function Layout() {
    const location = useLocation()
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Professor'
    const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    const avatarUrl = user?.user_metadata?.avatar_url

    const navItems = [
        { to: '/home', label: 'Home', icon: Sparkles },
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/history', label: 'History', icon: HistoryIcon },
    ]
    const isActive = (path: string) => path === '/home'
        ? location.pathname === '/home'
        : location.pathname.startsWith(path)

    return (
        <div style={{ minHeight: '100vh', background: '#f5f0e8', display: 'flex', flexDirection: 'column' }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');`}</style>
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 2.5rem',
                height: '56px',
                borderBottom: '1px solid #d8d2c4',
                background: '#f5f0e8',
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}>
                <Link to="/home" style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '0.88rem',
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    color: '#0a0a08',
                }}>
                    Notify<span style={{ color: '#d4440c' }}>-ED</span>
                </Link>

                <div style={{ display: 'flex', height: '100%' }}>
                    {navItems.map(({ to, label, icon: Icon }, index) => {
                        const isFirst = index === 0
                        const active = isActive(to)
                        return (
                            <Link
                                key={to}
                                to={to}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    padding: '0 1.4rem',
                                    fontFamily: "'DM Mono', monospace",
                                    fontSize: '0.7rem',
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    textDecoration: 'none',
                                    height: '100%',
                                    borderRight: '1px solid #d8d2c4',
                                    borderLeft: isFirst ? '1px solid #d8d2c4' : '1px solid transparent',
                                    borderBottom: active ? '2px solid #d4440c' : 'none',
                                    background: active ? '#eee9df' : 'transparent',
                                    color: active ? '#0a0a08' : '#7a7568',
                                    fontWeight: active ? 500 : 400,
                                    transition: 'color 0.2s, background 0.2s',
                                }}
                            >
                                <Icon size={14} />
                                <span>{label}</span>
                            </Link>
                        )
                    })}
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '0.7rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#7a7568',
                }}>
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={userName}
                            style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '28px',
                            height: '28px',
                            background: '#0a0a08',
                            color: '#f5f0e8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontFamily: "'DM Mono', monospace",
                        }}>{userInitials}</div>
                    )}
                    {userName}
                </div>
            </header>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Outlet />
            </main>
        </div>
    )
}
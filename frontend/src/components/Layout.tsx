import { Outlet, Link, useLocation } from 'react-router-dom'
import { History as HistoryIcon, LayoutDashboard, Sparkles, UserCircle } from 'lucide-react'

export function Layout() {
    const location = useLocation()
    const isHome = location.pathname === '/'
    const navItems = [
        { to: '/', label: 'Home', icon: Sparkles },
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/history', label: 'History', icon: HistoryIcon },
    ]
    const isActive = (path: string) => path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(path)

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <header className={`${isHome ? 'absolute inset-x-0 top-0 z-30 bg-transparent text-white' : 'border-b bg-card text-card-foreground'}`}>
                <div className={`${isHome ? 'mx-auto px-6 h-16 flex items-center justify-between' : 'container mx-auto px-4 h-16 flex items-center justify-between'}`}>
                    <div className="flex items-center space-x-6">
                        <Link to="/" className="flex items-center space-x-2">
                            <span className={`text-xl font-bold ${isHome ? 'text-white' : 'text-primary'}`}>NotifyED</span>
                        </Link>

                        <nav className="hidden md:flex items-center space-x-2">
                            {navItems.map(({ to, label, icon: Icon }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-xs font-semibold tracking-[0.12em] uppercase transition-colors ${isActive(to)
                                        ? isHome ? 'text-[#c8f542]' : 'bg-secondary text-secondary-foreground'
                                        : isHome ? 'text-white/80 hover:text-white' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{label}</span>
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className={`hidden sm:flex items-center space-x-2 text-xs font-semibold tracking-[0.14em] uppercase ${isHome ? 'text-white/80' : 'text-muted-foreground'}`}>
                            <UserCircle className="h-5 w-5" />
                            <span>Professor</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className={isHome ? "flex-1" : "flex-1 container mx-auto px-4 py-8"}>
                <Outlet />
            </main>
        </div>
    )
}

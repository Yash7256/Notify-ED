import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, History as HistoryIcon, UserCircle } from 'lucide-react'

export function Layout() {
    const location = useLocation()

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <header className="border-b bg-card text-card-foreground">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <Link to="/dashboard" className="flex items-center space-x-2">
                            <span className="text-xl font-bold text-primary">Notify ED</span>
                        </Link>

                        <nav className="hidden md:flex items-center space-x-2">
                            <Link
                                to="/dashboard"
                                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/dashboard'
                                    ? 'bg-secondary text-secondary-foreground'
                                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                    }`}
                            >
                                <Home className="h-4 w-4" />
                                <span>Dashboard</span>
                            </Link>
                            <Link
                                to="/history"
                                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === '/history'
                                    ? 'bg-secondary text-secondary-foreground'
                                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                    }`}
                            >
                                <HistoryIcon className="h-4 w-4" />
                                <span>History</span>
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                            <UserCircle className="h-5 w-5" />
                            <span>Professor</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8">
                <Outlet />
            </main>
        </div>
    )
}

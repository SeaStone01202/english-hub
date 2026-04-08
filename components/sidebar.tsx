'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { ThemeToggle } from '@/components/theme-toggle'
import { BookOpen, BarChart3, Home, Settings, LogOut, Award } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const isActive = (path: string) => pathname === path

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/practice', label: 'Practice', icon: BookOpen },
    { href: '/dashboard/progress', label: 'Progress', icon: BarChart3 },
    { href: '/dashboard/achievements', label: 'Achievements', icon: Award },
  ]

  return (
    <div className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-card flex flex-col">
      {/* Logo */}
      <div className="border-b border-border p-6">
        <Link href="/" className="flex items-center gap-3 font-bold text-lg">
          <BookOpen className="h-6 w-6 text-primary" />
          <span>EnglishHub</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-2 font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border p-4 space-y-3">
        <div className="px-4 py-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Logged in as</p>
          <p className="text-sm font-semibold truncate">{user?.name}</p>
        </div>

        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-lg px-4 py-2 font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>

        <div className="flex items-center justify-between px-4 py-2 rounded-lg hover:bg-muted transition-colors" suppressHydrationWarning>
          <span className="text-sm font-medium">Theme</span>
          <ThemeToggle />
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 rounded-lg px-4 py-2 font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

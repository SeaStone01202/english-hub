'use client'

import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-context'
import { ThemeToggle } from '@/components/theme-toggle'
import { useRouter } from 'next/navigation'
import { Bell, Lock, Globe, Trash2 } from 'lucide-react'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Clear user and their associated progress data
      if (user?.id) {
        localStorage.removeItem(`userProgress_${user.id}`)
      }
      logout()
      router.push('/')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Account Settings */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Account Information
        </h2>

        <div className="space-y-6">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full rounded-lg border border-input bg-muted px-4 py-2 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Full Name</label>
            <input
              type="text"
              value={user?.name || ''}
              disabled
              className="w-full rounded-lg border border-input bg-muted px-4 py-2 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Proficiency Level</label>
            <div className="rounded-lg border border-input bg-muted px-4 py-2 capitalize">
              {user?.level}
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Member Since</label>
            <div className="rounded-lg border border-input bg-muted px-4 py-2">
              {user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>

          <button 
            disabled
            title="Edit profile feature coming soon"
            className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Appearance
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-3 block">Theme</label>
            <div className="flex flex-wrap gap-2">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-4 py-2 rounded-lg border transition-all capitalize ${
                    theme === t
                      ? 'border-primary bg-primary/10 font-medium'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="font-medium">Quick Toggle</span>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Learning Reminders</p>
              <p className="text-sm text-muted-foreground">Get reminded to practice daily</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="font-medium">Achievement Notifications</p>
              <p className="text-sm text-muted-foreground">Notify when you unlock badges</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="font-medium">Progress Updates</p>
              <p className="text-sm text-muted-foreground">Weekly summary of your progress</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-xl font-bold mb-6 text-destructive flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Danger Zone
        </h2>

        <div className="space-y-4">
          <div>
            <p className="font-medium mb-2">Logout</p>
            <p className="text-sm text-muted-foreground mb-4">
              Sign out of your account on this device
            </p>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-destructive/20 text-destructive px-4 py-2 font-medium hover:bg-destructive/10 transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="border-t border-destructive/20 pt-4">
            <p className="font-medium mb-2">Delete Account</p>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete your account and all associated data
            </p>
            <button
              onClick={handleDeleteAccount}
              className="rounded-lg border border-destructive/20 text-destructive px-4 py-2 font-medium hover:bg-destructive/10 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="rounded-lg border border-border bg-muted/30 p-6">
        <h3 className="font-semibold mb-2">App Information</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Version: 1.0.0</p>
          <p>Platform: EnglishHub MVP</p>
          <p>Last Updated: April 2024</p>
        </div>
      </div>
    </div>
  )
}

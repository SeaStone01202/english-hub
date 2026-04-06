'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { BookOpen, Mail, ArrowRight } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">EnglishHub</span>
            </Link>
            <div suppressHydrationWarning>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-border bg-card p-8">
            {!submitted ? (
              <>
                <h1 className="mb-2 text-2xl font-bold">Reset Password</h1>
                <p className="mb-8 text-muted-foreground">
                  Enter your email address and we&apos;ll send you a link to reset your password
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                      className="w-full rounded-lg border border-input bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-primary text-primary-foreground py-2 font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    Send Reset Link <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="inline-block p-3 rounded-full bg-green-100/20 mb-4">
                    <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
                  <p className="text-muted-foreground mb-4">
                    We&apos;ve sent a password reset link to{' '}
                    <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>

                <div className="rounded-lg bg-muted/30 border border-border p-4 mb-6 text-sm text-muted-foreground">
                  <p className="mb-2 font-medium">Next steps:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Check your email for the reset link</li>
                    <li>• Click the link to create a new password</li>
                    <li>• Return to sign in with your new password</li>
                  </ul>
                </div>

                <button
                  onClick={() => setSubmitted(false)}
                  className="w-full rounded-lg border border-border px-4 py-2 font-medium hover:bg-muted transition-colors mb-2"
                >
                  Try Different Email
                </button>

                <Link
                  href="/login"
                  className="block w-full text-center rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium hover:opacity-90 transition-opacity"
                >
                  Back to Sign In
                </Link>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                  Didn&apos;t receive an email? Check your spam folder or contact support
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

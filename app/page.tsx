'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { ThemeToggle } from '@/components/theme-toggle'
import { BookOpen, Users, TrendingUp, Award, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold">EnglishHub</span>
            </Link>

            <div className="flex items-center gap-4">
              <div suppressHydrationWarning>
                <ThemeToggle />
              </div>
              {isAuthenticated ? (
                <div className="flex gap-2">
                  <Link
                    href="/dashboard"
                    className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium hover:opacity-90 transition-opacity"
                  >
                    Dashboard
                  </Link>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-muted transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium hover:opacity-90 transition-opacity"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div>
            <h1 className="text-5xl font-bold leading-tight text-balance mb-6">
              Master English with Interactive Practice
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Learn English through engaging exercises, quizzes, and real-time progress tracking. From beginner to advanced, we have the right content for you.
            </p>
            {!isAuthenticated && (
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
              >
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-6 bg-card">
              <BookOpen className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">5000+ Lessons</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive content covering all English levels
              </p>
            </div>

            <div className="rounded-lg border border-border p-6 bg-card">
              <Users className="h-8 w-8 text-secondary mb-3" />
              <h3 className="font-semibold mb-2">Community</h3>
              <p className="text-sm text-muted-foreground">
                Join 50,000+ learners worldwide
              </p>
            </div>

            <div className="rounded-lg border border-border p-6 bg-card">
              <TrendingUp className="h-8 w-8 text-accent mb-3" />
              <h3 className="font-semibold mb-2">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                Real-time analytics and performance metrics
              </p>
            </div>

            <div className="rounded-lg border border-border p-6 bg-card">
              <Award className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Certifications</h3>
              <p className="text-sm text-muted-foreground">
                Earn certificates upon completion
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold">Why Choose EnglishHub?</h2>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-border p-8 bg-card">
              <h3 className="mb-4 text-xl font-semibold">Diverse Content</h3>
              <p className="text-muted-foreground">
                Multiple choice, fill-in-the-blank, matching pairs, and listening comprehension exercises to keep learning engaging.
              </p>
            </div>

            <div className="rounded-lg border border-border p-8 bg-card">
              <h3 className="mb-4 text-xl font-semibold">Smart Learning</h3>
              <p className="text-muted-foreground">
                Randomized questions and adaptive difficulty levels ensure you're always challenged appropriately.
              </p>
            </div>

            <div className="rounded-lg border border-border p-8 bg-card">
              <h3 className="mb-4 text-xl font-semibold">Progress Tracking</h3>
              <p className="text-muted-foreground">
                Visualize your learning journey with detailed statistics, streaks, and personalized recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
        {!isAuthenticated && (
          <>
            <h2 className="mb-6 text-3xl font-bold">Ready to Start Learning?</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of students improving their English skills
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-8 py-3 text-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Create Account <ArrowRight className="h-5 w-5" />
            </Link>
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2024 EnglishHub. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

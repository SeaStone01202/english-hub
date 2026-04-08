'use client'

import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function QuizzesPage() {
  const router = useRouter()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Mock Test</h1>
        <p className="text-muted-foreground">
          Tinh nang nay dang tam dung de debug.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-yellow-600 mx-auto mb-3" />
        <p className="font-semibold mb-2">Mock test tam thoi khong kha dung</p>
        <p className="text-sm text-muted-foreground mb-5">
          Neu ban thay loi o day thi nguyen nhan den tu mock test, khong phai grammar/vocabulary.
        </p>
        <button
          onClick={() => router.push('/dashboard/practice')}
          className="rounded-lg bg-primary px-5 py-2.5 text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          Quay ve Practice
        </button>
      </div>
    </div>
  )
}

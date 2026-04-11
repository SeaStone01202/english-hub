import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ProfileData = {
  id: string
  email: string
  name: string | null
  level: 'beginner' | 'intermediate' | 'advanced' | null
  created_at: string
}

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle<ProfileData>()

    return NextResponse.json(
      {
        user: {
          id: authUser.id,
          email: profileData?.email || authUser.email || '',
          name:
            profileData?.name ||
            authUser.user_metadata?.name ||
            authUser.email?.split('@')[0] ||
            'User',
          level: profileData?.level || 'beginner',
          joinedAt:
            profileData?.created_at ||
            authUser.created_at ||
            new Date().toISOString(),
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('GET /api/auth/me failed:', error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}

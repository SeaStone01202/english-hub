import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_EVENT_TYPES = new Set([
  'login_success',
  'login_failed',
  'register_success',
  'register_failed',
  'logout',
] as const)

type IpEventType = 'login_success' | 'login_failed' | 'register_success' | 'register_failed' | 'logout'

function getClientIp(request: NextRequest): string | null {
  const xForwardedFor = request.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0]?.trim() || null
  }

  const xRealIp = request.headers.get('x-real-ip')
  if (xRealIp) {
    return xRealIp.trim()
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      eventType?: string
      metadata?: Record<string, unknown>
    }

    const eventType = body.eventType
    if (!eventType || !ALLOWED_EVENT_TYPES.has(eventType as IpEventType)) {
      return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 })
    }

    const ipAddress = getClientIp(request)
    if (!ipAddress) {
      return NextResponse.json({ error: 'IP address not found' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('ip_tracking_events').insert({
      user_id: user?.id ?? null,
      event_type: eventType,
      ip_address: ipAddress,
      user_agent: request.headers.get('user-agent'),
      path: request.nextUrl.pathname,
      metadata: body.metadata || {},
    })

    if (error) {
      console.error('ip_tracking_events insert error:', error)
      return NextResponse.json({ error: 'Failed to save ip tracking event' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('IP tracking route error:', error)
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
  }
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const revalidate = 30

export async function GET() {
  const supabase = await createClient()

  const [{ data: scenes }, { data: endings }] = await Promise.all([
    supabase.from('scenes').select('*').eq('visible', true).order('order'),
    supabase.from('endings').select('*').order('type'),
  ])

  return NextResponse.json(
    { scenes: scenes ?? [], endings: endings ?? [] },
    { headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } }
  )
}

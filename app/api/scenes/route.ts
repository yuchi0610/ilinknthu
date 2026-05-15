import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://uozojwiklovkckbygegp.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvem9qd2lrbG92a2NrYnlnZWdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY1Njk1OCwiZXhwIjoyMDk0MjMyOTU4fQ.SpNTXGkJxgFk5zM6DUK3OkwDLdPN5-5drqpH4csPbOc'

function db() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
}

// GET /api/scenes — list all scenes (admin, no RLS)
export async function GET() {
  const { data, error } = await db().from('scenes').select('*').order('order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ scenes: data ?? [] })
}

// POST /api/scenes — create scene
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { data, error } = await db()
    .from('scenes')
    .insert(body)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ scene: data })
}

// PATCH /api/scenes — update one scene OR batch-update order
// body: { id, ...fields } | { batch: [{ id, order }] }
export async function PATCH(request: NextRequest) {
  const body = await request.json()

  if (body.batch) {
    const updates = body.batch as { id: string; order: number }[]
    const results = await Promise.all(
      updates.map(({ id, order }) =>
        db().from('scenes').update({ order }).eq('id', id)
      )
    )
    const err = results.find(r => r.error)?.error
    if (err) return NextResponse.json({ error: err.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const { id, ...fields } = body
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })
  const { error } = await db().from('scenes').update(fields).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/scenes — delete scene
export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })
  const { error } = await db().from('scenes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

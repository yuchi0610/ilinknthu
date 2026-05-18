import { NextRequest, NextResponse } from 'next/server'
import { d1Query, d1Run } from '@/lib/d1'

export async function POST(req: NextRequest) {
  try {
    const id = crypto.randomUUID()
    const userAgent = req.headers.get('user-agent') ?? ''
    const now = new Date().toISOString()
    await d1Run(
      'INSERT INTO sessions (id, started_at, scores, total_score, user_agent) VALUES (?, ?, ?, ?, ?)',
      [id, now, '{}', 0, userAgent],
    )
    return NextResponse.json({ id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, scores, total_score, ending_type, signature_url } = body
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    const setClauses: string[] = []
    const params: unknown[] = []
    if (scores         !== undefined) { setClauses.push('scores = ?');        params.push(JSON.stringify(scores)) }
    if (total_score    !== undefined) { setClauses.push('total_score = ?');   params.push(total_score) }
    if (ending_type    !== undefined) {
      setClauses.push('ending_type = ?', 'ended_at = ?')
      params.push(ending_type, new Date().toISOString())
    }
    if (signature_url  !== undefined) { setClauses.push('signature_url = ?'); params.push(signature_url) }

    if (setClauses.length) {
      params.push(id)
      await d1Run(`UPDATE sessions SET ${setClauses.join(', ')} WHERE id = ?`, params)
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const rows = await d1Query('SELECT * FROM sessions ORDER BY started_at DESC LIMIT 200')
    return NextResponse.json({ sessions: rows })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

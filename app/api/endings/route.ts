import { NextRequest, NextResponse } from 'next/server'
import { d1Query, d1Run, parseJsonField } from '@/lib/d1'

export async function GET() {
  try {
    const rows = await d1Query<Record<string, unknown>>('SELECT * FROM endings ORDER BY type')
    const endings = rows.map(row => ({
      ...row,
      config: parseJsonField(row, 'config'),
    }))
    return NextResponse.json({ endings })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, label, score_min, score_max, config } = await req.json()
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })
    await d1Run(
      'UPDATE endings SET label = ?, score_min = ?, score_max = ?, config = ? WHERE id = ?',
      [label, score_min, score_max, JSON.stringify(config ?? {}), id],
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

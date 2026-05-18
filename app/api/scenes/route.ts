import { NextRequest, NextResponse } from 'next/server'
import { d1Query, d1Run, parseJsonField } from '@/lib/d1'

type SceneRow = {
  id: string; type: string; title: string; order: number
  config: unknown; visible: number
  created_at: string; updated_at: string
}

function formatScene(row: Record<string, unknown>) {
  return {
    ...row,
    config:  parseJsonField(row, 'config'),
    visible: row.visible === 1 || row.visible === true,
  }
}

// GET /api/scenes
export async function GET() {
  try {
    const rows = await d1Query<Record<string, unknown>>('SELECT * FROM scenes ORDER BY "order"')
    return NextResponse.json({ scenes: rows.map(formatScene) })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST /api/scenes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    await d1Run(
      'INSERT INTO scenes (id, type, title, "order", config, visible, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, body.type, body.title, body.order ?? 0, JSON.stringify(body.config ?? {}), body.visible ? 1 : 0, now, now],
    )
    const [scene] = await d1Query<Record<string, unknown>>('SELECT * FROM scenes WHERE id = ?', [id])
    return NextResponse.json({ scene: formatScene(scene) })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// PATCH /api/scenes — update one scene OR batch-update order
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.batch) {
      const updates = body.batch as { id: string; order: number }[]
      await Promise.all(
        updates.map(({ id, order }) => d1Run('UPDATE scenes SET "order" = ? WHERE id = ?', [order, id]))
      )
      return NextResponse.json({ ok: true })
    }

    const { id, ...fields } = body
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

    const setClauses: string[] = []
    const params: unknown[] = []
    if (fields.title     !== undefined) { setClauses.push('title = ?');     params.push(fields.title) }
    if (fields.visible   !== undefined) { setClauses.push('visible = ?');   params.push(fields.visible ? 1 : 0) }
    if (fields.config    !== undefined) { setClauses.push('config = ?');    params.push(JSON.stringify(fields.config)) }
    if (fields.order     !== undefined) { setClauses.push('"order" = ?');   params.push(fields.order) }
    if (fields.updated_at !== undefined) { setClauses.push('updated_at = ?'); params.push(fields.updated_at) }

    if (setClauses.length) {
      params.push(id)
      await d1Run(`UPDATE scenes SET ${setClauses.join(', ')} WHERE id = ?`, params)
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// DELETE /api/scenes
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })
    await d1Run('DELETE FROM scenes WHERE id = ?', [id])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

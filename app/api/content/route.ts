import { NextResponse } from 'next/server'
import { d1Query, parseJsonField } from '@/lib/d1'

export const revalidate = 30

export async function GET() {
  try {
    const [sceneRows, endingRows] = await Promise.all([
      d1Query<Record<string, unknown>>('SELECT * FROM scenes WHERE visible = 1 ORDER BY "order"'),
      d1Query<Record<string, unknown>>('SELECT * FROM endings ORDER BY type'),
    ])

    const scenes = sceneRows.map(row => ({
      ...row,
      config:  parseJsonField(row, 'config'),
      visible: true,
    }))

    const endings = endingRows.map(row => ({
      ...row,
      config: parseJsonField(row, 'config'),
    }))

    return NextResponse.json(
      { scenes, endings },
      { headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } },
    )
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

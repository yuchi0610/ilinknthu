export const dynamic = 'force-dynamic'

import { d1Query, parseJsonField } from '@/lib/d1'
import { notFound } from 'next/navigation'
import SceneEditor from '@/components/admin/SceneEditor'
import type { Scene } from '@/lib/types'

export default async function SceneEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await d1Query<Record<string, unknown>>('SELECT * FROM scenes WHERE id = ?', [id])
  if (!rows.length) notFound()

  const row = rows[0]
  const scene: Scene = {
    ...(row as unknown as Scene),
    config: parseJsonField(row, 'config'),
    visible: row.visible !== 0,
  }

  return (
    <div className="h-full flex flex-col">
      <SceneEditor scene={scene} />
    </div>
  )
}

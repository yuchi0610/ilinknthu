export const dynamic = 'force-dynamic'

import { d1Query, parseJsonField } from '@/lib/d1'
import SceneList from '@/components/admin/SceneList'
import type { Scene } from '@/lib/types'

export default async function ScenesPage() {
  const rows = await d1Query<Record<string, unknown>>('SELECT * FROM scenes ORDER BY "order"')
  const scenes: Scene[] = rows.map(row => ({
    ...(row as unknown as Scene),
    config: parseJsonField(row, 'config'),
    visible: row.visible !== 0,
  }))

  return (
    <div className="h-full">
      <SceneList initialScenes={scenes} />
    </div>
  )
}

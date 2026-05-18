export const dynamic = 'force-dynamic'

import { d1Query, parseJsonField } from '@/lib/d1'
import SceneRenderer from '@/components/scene/SceneRenderer'
import { notFound } from 'next/navigation'
import type { Scene, Ending } from '@/lib/types'

export default async function ScenePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [sceneRows, endingRows] = await Promise.all([
    d1Query<Record<string, unknown>>('SELECT * FROM scenes WHERE visible = 1 ORDER BY "order"'),
    d1Query<Record<string, unknown>>('SELECT * FROM endings ORDER BY type'),
  ])

  const sceneList: Scene[] = sceneRows.map(row => ({
    ...(row as unknown as Scene),
    config: parseJsonField(row, 'config'),
    visible: true,
  }))

  const endingList: Ending[] = endingRows.map(row => ({
    ...(row as unknown as Ending),
    config: parseJsonField(row, 'config'),
  }))

  const currentScene = id === 'start'
    ? sceneList[0]
    : sceneList.find(s => s.id === id)

  if (!currentScene) notFound()

  const currentIndex = sceneList.findIndex(s => s.id === currentScene.id)
  const nextScene = sceneList[currentIndex + 1] ?? null

  return (
    <SceneRenderer
      scene={currentScene}
      nextScene={nextScene}
      endings={endingList}
      onFinish={() => {}}
    />
  )
}

'use client'

import { useState, useEffect } from 'react'
import SceneRenderer from './SceneRenderer'
import type { Scene, Ending } from '@/lib/types'

interface Props {
  scenes: Scene[]
  endings: Ending[]
}

// Mobile: fixed inset-0 so layout doesn't reflow when viewport resizes (fullscreen entry)
// Desktop (sm+): centered 390px column
const SHELL = 'fixed inset-0 overflow-hidden sm:relative sm:inset-auto sm:overflow-visible sm:max-w-[390px] sm:mx-auto sm:min-h-dvh'

export default function ExperienceShell({ scenes, endings }: Props) {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [outgoing, setOutgoing] = useState<Scene | null>(null)

  const currentScene = scenes[sceneIndex]
  const nextScene = scenes[sceneIndex + 1] ?? null

  function handleFinish() {
    setOutgoing(scenes[sceneIndex] ?? null)
    setSceneIndex(i => i + 1)
  }

  // Remove outgoing scene after new scene has painted (no black frame)
  useEffect(() => {
    if (!outgoing) return
    const id = requestAnimationFrame(() => setOutgoing(null))
    return () => cancelAnimationFrame(id)
  }, [sceneIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentScene) {
    return (
      <div className={`${SHELL} bg-black text-white flex items-center justify-center`}>
        <p className="text-stone-500 text-sm">體驗已結束</p>
      </div>
    )
  }

  return (
    <div className={`${SHELL} bg-black`}>
      {/* Outgoing scene stays rendered underneath until new scene has painted */}
      {outgoing && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <SceneRenderer
            key={outgoing.id}
            scene={outgoing}
            nextScene={null}
            endings={endings}
            onFinish={() => {}}
          />
        </div>
      )}
      <div className="absolute inset-0 z-10">
        <SceneRenderer
          key={currentScene.id}
          scene={currentScene}
          nextScene={nextScene}
          endings={endings}
          onFinish={handleFinish}
        />
      </div>
    </div>
  )
}

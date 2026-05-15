'use client'

import { useState } from 'react'
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

  const currentScene = scenes[sceneIndex]
  const nextScene = scenes[sceneIndex + 1] ?? null

  function handleFinish() {
    setSceneIndex(i => i + 1)
  }

  if (!currentScene) {
    return (
      <div className={`${SHELL} bg-black text-white flex items-center justify-center`}>
        <p className="text-stone-500 text-sm">體驗已結束</p>
      </div>
    )
  }

  return (
    <div className={`${SHELL} bg-black`}>
      <SceneRenderer
        key={currentScene.id}
        scene={currentScene}
        nextScene={nextScene}
        endings={endings}
        onFinish={handleFinish}
      />
    </div>
  )
}

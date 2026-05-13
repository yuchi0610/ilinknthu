'use client'

import { useState, useEffect } from 'react'
import SceneRenderer from './SceneRenderer'
import type { Scene, Ending } from '@/lib/types'

interface Props {
  scenes: Scene[]
  endings: Ending[]
}

export default function ExperienceShell({ scenes, endings }: Props) {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  const currentScene = scenes[sceneIndex]
  const nextScene = scenes[sceneIndex + 1] ?? null

  function handleFinish() {
    setVisible(false)
    setTimeout(() => {
      setSceneIndex(i => i + 1)
      setVisible(true)
    }, 200)
  }

  if (!currentScene) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-stone-500 text-sm">體驗已結束</p>
      </div>
    )
  }

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
    >
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

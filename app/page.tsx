'use client'

import { useState } from 'react'
import ExperienceShell from '@/components/scene/ExperienceShell'
import type { Scene, Ending } from '@/lib/types'

const SHELL = 'fixed inset-0 overflow-hidden sm:relative sm:inset-auto sm:overflow-visible sm:max-w-[390px] sm:mx-auto sm:min-h-dvh'

export default function StartPage() {
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<{ scenes: Scene[]; endings: Ending[] } | null>(null)

  async function handleStart() {
    setLoading(true)

    // Request fullscreen while screen is still black — animation plays over loading state (invisible)
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: (o?: unknown) => Promise<void> }
    const req = el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el)
    req?.({ navigationUI: 'hide' } as FullscreenOptions).catch(() => {})

    // Brief pause so fullscreen settles before content renders
    await new Promise(r => setTimeout(r, 280))

    const [sessionRes, contentRes] = await Promise.all([
      fetch('/api/sessions', { method: 'POST' }),
      fetch('/api/content'),
    ])
    const { id } = await sessionRes.json()
    const { scenes, endings } = await contentRes.json()

    sessionStorage.setItem('session_id', id)
    sessionStorage.setItem('scores', JSON.stringify({}))

    setContent({ scenes, endings })
    setLoading(false)
  }

  if (content) {
    return <ExperienceShell scenes={content.scenes} endings={content.endings} />
  }

  return (
    <div className={`${SHELL} bg-black flex flex-col items-center justify-center p-8 text-white`}>
      <div className="text-center max-w-sm">
        <p className="text-xs tracking-widest text-zinc-500 mb-6">互動敘事體驗</p>
        <h1 className="text-2xl font-bold leading-relaxed mb-2">核去核從</h1>
        <p className="text-sm text-zinc-400 mb-12">核能背後的和平抉擇</p>
        <button
          onClick={handleStart}
          disabled={loading}
          className="border border-white/30 hover:border-white/60 disabled:opacity-50 text-white text-sm tracking-widest px-10 py-4 transition-colors"
        >
          {loading ? '載 入 中 …' : '開 始 體 驗'}
        </button>
      </div>
    </div>
  )
}

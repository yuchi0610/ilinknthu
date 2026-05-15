'use client'

import { useState } from 'react'
import ExperienceShell from '@/components/scene/ExperienceShell'
import type { Scene, Ending, NewspaperConfig, DialogConfig, TextConfig, SignatureConfig, AnimationConfig } from '@/lib/types'

const SHELL = 'fixed inset-0 overflow-hidden sm:relative sm:inset-auto sm:overflow-visible sm:max-w-[390px] sm:mx-auto sm:min-h-dvh'

function collectImageUrls(scenes: Scene[]): string[] {
  const urls: string[] = []
  for (const scene of scenes) {
    const c = scene.config as unknown
    if (scene.type === 'newspaper') {
      const cfg = c as NewspaperConfig
      for (const item of cfg.pages ?? []) {
        if (item.kind === 'auto') urls.push(...item.images)
        else if (item.image_url) urls.push(item.image_url)
      }
    } else if (scene.type === 'dialog') {
      const cfg = c as DialogConfig
      if (cfg.background_url) urls.push(cfg.background_url)
      for (const d of cfg.dialogs ?? []) if (d.character_image_url) urls.push(d.character_image_url)
    } else if (scene.type === 'text') {
      const cfg = c as TextConfig
      if (cfg.background_url) urls.push(cfg.background_url)
    } else if (scene.type === 'signature') {
      const cfg = c as SignatureConfig
      if (cfg.background_url) urls.push(cfg.background_url)
      if (cfg.document_url) urls.push(cfg.document_url)
    }
  }
  return urls.filter(Boolean)
}

function preloadImages(urls: string[], onProgress: (pct: number) => void): Promise<void> {
  if (!urls.length) { onProgress(100); return Promise.resolve() }
  return new Promise(resolve => {
    let done = 0
    urls.forEach(url => {
      const img = new window.Image()
      img.onload = img.onerror = () => {
        done++
        onProgress(Math.round((done / urls.length) * 100))
        if (done === urls.length) resolve()
      }
      img.src = url
    })
  })
}

export default function StartPage() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [content, setContent] = useState<{ scenes: Scene[]; endings: Ending[] } | null>(null)

  async function handleStart() {
    setLoading(true)
    setProgress(0)

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

    // Preload all images before starting
    const imageUrls = collectImageUrls(scenes as Scene[])
    await preloadImages(imageUrls, setProgress)

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
          className="border border-white/30 hover:border-white/60 disabled:opacity-50 text-white text-sm tracking-widest px-10 py-4 transition-colors relative overflow-hidden"
        >
          {loading && (
            <span
              className="absolute inset-0 bg-white/10 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          )}
          <span className="relative">
            {loading ? (progress > 0 ? `${progress}%` : '載 入 中 …') : '開 始 體 驗'}
          </span>
        </button>
      </div>
    </div>
  )
}

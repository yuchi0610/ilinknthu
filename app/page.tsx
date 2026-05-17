'use client'

import { useState } from 'react'
import ExperienceShell from '@/components/scene/ExperienceShell'
import { imageBlobUrls, videoBlobUrls } from '@/lib/assetCache'
import type { Scene, Ending, NewspaperConfig, DialogConfig, TextConfig, SignatureConfig, AnimationConfig } from '@/lib/types'

const SHELL = 'fixed inset-0 overflow-hidden sm:relative sm:inset-auto sm:overflow-visible sm:max-w-[390px] sm:mx-auto sm:min-h-dvh'

function collectAssets(scenes: Scene[]): { images: string[]; videos: string[] } {
  const images: string[] = []
  const videos: string[] = []
  for (const scene of scenes) {
    const c = scene.config as unknown
    if (scene.type === 'newspaper') {
      const cfg = c as NewspaperConfig
      for (const item of cfg.pages ?? []) {
        if (item.kind === 'auto') images.push(...item.images)
        else if (item.image_url) images.push(item.image_url)
      }
    } else if (scene.type === 'dialog') {
      const cfg = c as DialogConfig
      if (cfg.background_url) images.push(cfg.background_url)
      for (const d of cfg.dialogs ?? []) if (d.character_image_url) images.push(d.character_image_url)
    } else if (scene.type === 'text') {
      const cfg = c as TextConfig
      if (cfg.pages) {
        for (const p of cfg.pages) if (p.background_url) images.push(p.background_url)
      } else if (cfg.background_url) {
        images.push(cfg.background_url)
      }
    } else if (scene.type === 'signature') {
      const cfg = c as SignatureConfig
      if (cfg.background_url) images.push(cfg.background_url)
      if (cfg.document_url) images.push(cfg.document_url)
    } else if (scene.type === 'animation') {
      const cfg = c as AnimationConfig
      if (cfg.video_url) videos.push(cfg.video_url)
    }
  }
  return { images: images.filter(Boolean), videos: videos.filter(Boolean) }
}

async function toBlobUrl(url: string): Promise<string> {
  const r = await fetch(url)
  const blob = await r.blob()
  return URL.createObjectURL(blob)
}

function preloadAll(images: string[], videos: string[], onProgress: (pct: number) => void): Promise<void> {
  const total = images.length + videos.length
  if (!total) { onProgress(100); return Promise.resolve() }
  let done = 0
  const tick = () => { done++; onProgress(Math.round((done / total) * 100)) }

  // Images: fetch → blob URL → pre-decode into GPU memory
  const imagePromises = images.map(async url => {
    try {
      const blobUrl = await toBlobUrl(url)
      imageBlobUrls.set(url, blobUrl)
      const img = new window.Image()
      await new Promise<void>(res => { img.onload = img.onerror = () => res(); img.src = blobUrl })
      await img.decode?.().catch(() => {})
    } catch {}
    tick()
  })

  // Videos: fetch → blob URL; <video> plays from memory with zero buffering
  const videoPromises = videos.map(async url => {
    try {
      const blobUrl = await toBlobUrl(url)
      videoBlobUrls.set(url, blobUrl)
    } catch {}
    tick()
  })

  return Promise.all([...imagePromises, ...videoPromises]).then(() => {})
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

    // Preload all images and video first-frames before starting
    const { images, videos } = collectAssets(scenes as Scene[])
    await preloadAll(images, videos, setProgress)

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

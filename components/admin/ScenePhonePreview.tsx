'use client'

import { useState, useEffect, useRef } from 'react'
import type { Scene, DialogConfig, AnimationConfig, NewspaperConfig, TextConfig, SignatureConfig, GameConfig } from '@/lib/types'

interface Props {
  scene: Scene
  interactive?: boolean
}

export default function ScenePhonePreview({ scene, interactive }: Props) {
  return (
    <div className="relative mx-auto" style={{ width: 224 }}>
      <div className="relative bg-stone-800 rounded-[2.2rem] p-2.5 shadow-xl" style={{ aspectRatio: '9/19' }}>
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-stone-600 rounded-full z-10" />
        <div className="w-full h-full bg-black rounded-[1.6rem] overflow-hidden">
          <PreviewContent scene={scene} interactive={interactive} />
        </div>
      </div>
    </div>
  )
}

// ── 互動對話預覽 ──────────────────────────────────────────────────
function MiniDialogPreview({ config }: { config: DialogConfig }) {
  const dialogs = config.dialogs ?? []
  const [index, setIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const current = dialogs[index]
  const currentText = current?.text ?? ''

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    if (!currentText) { setDone(true); return }
    let i = 0
    function tick() {
      i++
      setDisplayed(currentText.slice(0, i))
      if (i < currentText.length) timerRef.current = setTimeout(tick, 20)
      else setDone(true)
    }
    tick()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [index, currentText])

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!done) {
      if (timerRef.current) clearTimeout(timerRef.current)
      setDisplayed(currentText)
      setDone(true)
      return
    }
    if (index < dialogs.length - 1) setIndex(i => i + 1)
    else setIndex(0) // loop for preview
  }

  const boxTheme = config.box_theme ?? 'dark'
  const boxHeightPct = config.box_height ?? 38
  const charHeightPct = 100 - boxHeightPct
  const nameSize = Math.round((config.name_font_size ?? 14) * 0.6)
  const textSize = Math.round((config.text_font_size ?? 14) * 0.6)
  const nameColor = config.name_color ?? '#ffffff'
  const textColor = config.text_color ?? (boxTheme === 'dark' ? 'rgba(255,255,255,0.85)' : '#1c1917')
  const boxBg = boxTheme === 'dark' ? '#0f172a' : '#ffffff'
  const nameBadgeBg = boxTheme === 'dark' ? 'rgba(30,27,75,0.9)' : 'rgba(255,255,255,0.92)'

  return (
    <div
      className="w-full h-full flex flex-col cursor-pointer select-none"
      style={config.background_url
        ? { backgroundImage: `url(${config.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: 'linear-gradient(160deg,#1e1b4b 0%,#312e81 60%,#1e1b4b 100%)' }
      }
      onClick={handleClick}
    >
      {current?.character_image_url ? (
        <>
          <div className="relative overflow-hidden flex-shrink-0" style={{ height: `${charHeightPct}%` }}>
            <img
              src={current.character_image_url}
              alt=""
              style={{
                position: 'absolute',
                bottom: 0,
                left: `${current.character_x ?? 50}%`,
                transform: `translateX(-50%) scale(${(current.character_scale ?? 100) / 100})`,
                transformOrigin: 'bottom center',
                height: '100%',
                width: 'auto',
                maxWidth: 'none',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            {/* progress dots */}
            {dialogs.length > 1 && (
              <div className="absolute top-2 left-0 right-0 flex justify-center gap-1">
                {dialogs.map((_, i) => (
                  <span key={i} className={`w-1 h-1 rounded-full transition-colors ${i <= index ? 'bg-white' : 'bg-white/30'}`} />
                ))}
              </div>
            )}
            {current.speaker && (
              <div className="absolute bottom-0 left-1.5 pb-1">
                <div className="inline-block px-2 py-0.5 rounded-t-lg" style={{ backgroundColor: nameBadgeBg }}>
                  <span style={{ fontSize: nameSize, color: nameColor }} className="font-semibold">{current.speaker}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 px-2 pt-1.5 pb-2 flex flex-col" style={{ backgroundColor: boxBg }}>
            <p style={{ fontSize: textSize, color: textColor, lineHeight: 1.6 }} className="flex-1 line-clamp-4">
              {displayed || <span style={{ opacity: 0.3 }}>尚未輸入…</span>}
              <span className={`inline-block w-0.5 h-3 bg-current ml-0.5 align-middle animate-pulse ${done ? 'opacity-0' : ''}`} />
            </p>
            {done && (
              <p className="text-right mt-1" style={{ fontSize: 7, opacity: 0.4, color: textColor }}>
                {index < dialogs.length - 1 ? '點擊繼續 ▼' : '點擊重播 ↺'}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col h-full justify-end" onClick={handleClick}>
          {dialogs.length > 1 && (
            <div className="flex justify-center gap-1 mb-2">
              {dialogs.map((_, i) => (
                <span key={i} className={`w-1 h-1 rounded-full ${i <= index ? 'bg-white' : 'bg-white/25'}`} />
              ))}
            </div>
          )}
          <div className="px-2 pt-2 pb-3 border-t border-white/10" style={{ backgroundColor: boxBg }}>
            {current?.speaker && (
              <p style={{ fontSize: nameSize, color: nameColor, marginBottom: 3 }} className="font-medium">{current.speaker}</p>
            )}
            <p style={{ fontSize: textSize, color: textColor, lineHeight: 1.6 }}>
              {displayed || <span style={{ opacity: 0.3 }}>尚未輸入…</span>}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 互動報紙預覽 ──────────────────────────────────────────────────
function MiniNewspaperPreview({ config }: { config: NewspaperConfig }) {
  const pages = config.pages ?? []
  const [index, setIndex] = useState(0)
  const page = pages[index]

  if (!pages.length) {
    return <div className="w-full h-full bg-stone-100 flex items-center justify-center"><p className="text-[8px] text-stone-400">尚未新增頁面</p></div>
  }

  return (
    <div className="w-full h-full bg-stone-100 text-stone-900 flex flex-col">
      {page?.fast_flip ? (
        <div className="flex-1 flex items-center justify-center bg-amber-50">
          <p className="text-[8px] text-stone-400">翻頁動畫</p>
        </div>
      ) : page?.image_url ? (
        <img src={page.image_url} className="w-full flex-1 object-cover" alt="" />
      ) : (
        <div className="flex-1 flex items-center justify-center"><p className="text-[8px] text-stone-400">未設定圖片</p></div>
      )}
      {pages.length > 1 && (
        <div className="flex items-center justify-between px-2 py-1.5 border-t border-stone-200 bg-white">
          <button onClick={e => { e.stopPropagation(); index > 0 && setIndex(i => i - 1) }}
            className="text-[8px] text-stone-400 disabled:opacity-30" disabled={index === 0}>←</button>
          <span className="text-[7px] text-stone-400">{index + 1}/{pages.length}</span>
          <button onClick={e => { e.stopPropagation(); index < pages.length - 1 && setIndex(i => i + 1) }}
            className="text-[8px] text-stone-400 disabled:opacity-30" disabled={index === pages.length - 1}>→</button>
        </div>
      )}
    </div>
  )
}

// ── 靜態內容 ──────────────────────────────────────────────────────
function PreviewContent({ scene, interactive }: { scene: Scene; interactive?: boolean }) {
  const config = scene.config as Record<string, unknown>

  switch (scene.type) {
    case 'dialog': {
      const c = config as unknown as DialogConfig
      if (interactive) return <MiniDialogPreview config={c} />
      const first = c.dialogs?.[0]
      return (
        <div className="w-full h-full flex flex-col text-white"
          style={c.background_url
            ? { backgroundImage: `url(${c.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: 'linear-gradient(160deg,#1c1917,#292524)' }
          }
        >
          {first?.character_image_url ? (
            <>
              <div className="flex-1 relative overflow-hidden">
                <img src={first.character_image_url} alt="" className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 via-transparent to-transparent" />
                {first.speaker && (
                  <div className="absolute bottom-0 left-0 right-0 bg-stone-900/85 py-1 px-2">
                    <span className="text-[8px] font-semibold text-white">{first.speaker}</span>
                  </div>
                )}
              </div>
              <div className="bg-stone-900/95 p-2 border-t border-white/10">
                <p className="text-[9px] leading-relaxed text-white/80 line-clamp-3">{first.text || <span className="text-white/25 italic">尚未輸入…</span>}</p>
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full justify-end">
              <div className="bg-black/75 p-2.5 border-t border-white/10">
                {first?.speaker && <p className="text-[7px] text-amber-400 mb-1">{first.speaker}</p>}
                <p className="text-[9px] text-white/80">{first?.text || <span className="text-white/25 italic">尚未輸入…</span>}</p>
              </div>
            </div>
          )}
        </div>
      )
    }

    case 'newspaper': {
      const c = config as unknown as NewspaperConfig
      if (interactive) return <MiniNewspaperPreview config={c} />
      const page = c.pages?.[0]
      return (
        <div className="w-full h-full bg-stone-100 flex flex-col">
          {page?.image_url
            ? <img src={page.image_url} className="w-full flex-1 object-cover" alt="" />
            : <div className="flex-1 flex items-center justify-center"><p className="text-[8px] text-stone-400">未設定圖片</p></div>
          }
        </div>
      )
    }

    case 'text': {
      const c = config as unknown as TextConfig
      const opacity = (c.overlay_opacity ?? 50) / 100
      return (
        <div className="w-full h-full relative flex items-center justify-center p-4"
          style={c.background_url
            ? { backgroundImage: `url(${c.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: '#1c1917' }
          }
        >
          {c.background_url && <div className="absolute inset-0 bg-black" style={{ opacity }} />}
          <p className="relative text-center text-white text-[10px] leading-relaxed">
            {c.text || <span className="text-white/25 italic">尚未輸入…</span>}
          </p>
        </div>
      )
    }

    case 'animation': {
      const c = config as unknown as AnimationConfig
      return (
        <div className="w-full h-full bg-black flex items-center justify-center">
          {c.video_url
            ? <video src={c.video_url} className="w-full h-full object-contain" muted />
            : <p className="text-white/25 text-[9px]">影片未設定</p>
          }
        </div>
      )
    }

    case 'signature': {
      const c = config as unknown as SignatureConfig
      return (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center p-3 gap-2">
          {c.document_url && <img src={c.document_url} className="w-full rounded" alt="" />}
          <p className="text-[8px] text-white/50 text-center">{c.instruction || '請在此簽署您的名字'}</p>
          <div className="border border-white/20 rounded bg-white w-full h-8" />
        </div>
      )
    }

    case 'game': {
      const c = config as unknown as GameConfig
      return (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-2 p-3">
          <p className="text-white text-[10px] font-bold text-center">{c.title || scene.title}</p>
          {c.description && <p className="text-white/40 text-[8px] text-center line-clamp-3">{c.description}</p>}
          <p className="text-white/20 text-[7px]">遊戲開發中</p>
        </div>
      )
    }

    default:
      return (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <p className="text-white/25 text-[9px]">結局場景</p>
        </div>
      )
  }
}

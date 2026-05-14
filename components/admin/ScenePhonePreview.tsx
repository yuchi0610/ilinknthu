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

// ── CSS ────────────────────────────────────────────────────────────
const MINI_NW_CSS = `
  @keyframes miniFlipFwd {
    0%   { transform: rotateY(0deg);    opacity: 1; }
    85%  { transform: rotateY(-170deg); opacity: 1; }
    100% { transform: rotateY(-180deg); opacity: 0; }
  }
  @keyframes miniFlipBack {
    0%   { transform: rotateY(0deg);   opacity: 1; }
    85%  { transform: rotateY(170deg); opacity: 1; }
    100% { transform: rotateY(180deg); opacity: 0; }
  }
`

// Phone frame constants (style={{ width: 224 }}, p-2.5=10px padding, aspectRatio:'9/19')
// Screen height = Math.round(224 * 19/9) - 20 = 453px
// Using explicit px instead of CSS % avoids the unreliable h-full→h-full→aspect-ratio chain.
const PHONE_SCREEN_H = 453

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
    else setIndex(0)
  }

  const boxTheme = config.box_theme ?? 'dark'
  // Explicit pixel heights derived from the phone frame constants — bypasses CSS cascade entirely
  const boxPx = Math.round(PHONE_SCREEN_H * (config.box_height ?? 38) / 100)
  const charPx = PHONE_SCREEN_H - boxPx
  const nameSize = Math.round((config.name_font_size ?? 14) * 0.6)
  const textSize = Math.round((config.text_font_size ?? 14) * 0.6)
  const nameColor = config.name_color ?? '#ffffff'
  const textColor = config.text_color ?? (boxTheme === 'dark' ? 'rgba(255,255,255,0.85)' : '#1c1917')
  const boxBg = boxTheme === 'dark' ? '#0f172a' : '#ffffff'
  const nameBadgeBg = boxTheme === 'dark' ? 'rgba(30,27,75,0.9)' : 'rgba(255,255,255,0.92)'

  const bgStyle = config.background_url
    ? { backgroundImage: `url(${config.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(160deg,#1e1b4b 0%,#312e81 60%,#1e1b4b 100%)' }

  return (
    <div className="w-full h-full relative cursor-pointer select-none overflow-hidden" style={bgStyle} onClick={handleClick}>
      {current?.character_image_url ? (
        <>
          <div className="absolute left-0 right-0 top-0 overflow-hidden" style={{ height: charPx }}>
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
            {dialogs.length > 1 && (
              <div className="absolute top-2 left-0 right-0 flex justify-center gap-1">
                {dialogs.map((_, i) => (
                  <span key={i} className={`w-1 h-1 rounded-full transition-colors ${i <= index ? 'bg-white' : 'bg-white/30'}`} />
                ))}
              </div>
            )}
            {current.speaker && (
              <div className="absolute bottom-0 left-1.5 pb-0.5">
                <div className="inline-block px-2 py-0.5 rounded-t-lg" style={{ backgroundColor: nameBadgeBg }}>
                  <span style={{ fontSize: nameSize, color: nameColor }} className="font-semibold">{current.speaker}</span>
                </div>
              </div>
            )}
          </div>

          <div
            className="absolute left-0 right-0 bottom-0 flex flex-col px-2 pt-1.5 pb-2 overflow-hidden"
            style={{ height: boxPx, backgroundColor: boxBg }}
          >
            <p style={{ fontSize: textSize, color: textColor, lineHeight: 1.55 }} className="flex-1 overflow-hidden">
              {displayed || <span style={{ opacity: 0.3 }}>尚未輸入…</span>}
              <span className={`inline-block w-0.5 h-3 bg-current ml-0.5 align-middle animate-pulse ${done ? 'opacity-0' : ''}`} />
            </p>
            {done && (
              <p className="text-right" style={{ fontSize: 6, opacity: 0.4, color: textColor }}>
                {index < dialogs.length - 1 ? '繼續 ▼' : '重播 ↺'}
              </p>
            )}
          </div>
        </>
      ) : (
        /* No character image — box is pinned to bottom with explicit px height */
        <div className="absolute left-0 right-0 bottom-0 flex flex-col px-2 pt-2 pb-3 overflow-hidden"
          style={{ height: boxPx, backgroundColor: boxBg }}>
          {dialogs.length > 1 && (
            <div className="flex justify-center gap-1 mb-1.5">
              {dialogs.map((_, i) => (
                <span key={i} className={`w-1 h-1 rounded-full ${i <= index ? 'bg-white' : 'bg-white/25'}`} />
              ))}
            </div>
          )}
          {current?.speaker && (
            <p style={{ fontSize: nameSize, color: nameColor, marginBottom: 3 }} className="font-medium">{current.speaker}</p>
          )}
          <p style={{ fontSize: textSize, color: textColor, lineHeight: 1.6 }}>
            {displayed || <span style={{ opacity: 0.3 }}>尚未輸入…</span>}
          </p>
        </div>
      )}
    </div>
  )
}

// ── 互動報紙預覽（滑動翻頁） ──────────────────────────────────────
function MiniNewspaperPreview({ config }: { config: NewspaperConfig }) {
  const pages = config.pages ?? []
  const [index, setIndex] = useState(0)
  const [flipAnim, setFlipAnim] = useState<{ fromIdx: number; dir: 'fwd' | 'back' } | null>(null)
  const dragStartX = useRef<number | null>(null)

  if (!pages.length) {
    return <div className="w-full h-full bg-stone-100 flex items-center justify-center"><p className="text-[8px] text-stone-400">尚未新增頁面</p></div>
  }

  function advance(dir: 'fwd' | 'back') {
    if (flipAnim) return
    const next = index + (dir === 'fwd' ? 1 : -1)
    if (next < 0 || next >= pages.length) return
    setFlipAnim({ fromIdx: index, dir })
    setIndex(next)
    setTimeout(() => setFlipAnim(null), 420)
  }

  function onDragStart(x: number) { dragStartX.current = x }
  function onDragEnd(e: React.MouseEvent | React.TouchEvent, x: number) {
    if (dragStartX.current === null) return
    const dx = x - dragStartX.current
    dragStartX.current = null
    if (Math.abs(dx) < 12) {
      // treat as click — right half forward, left half back
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      advance(x - rect.left > rect.width / 2 ? 'fwd' : 'back')
    } else {
      advance(dx < 0 ? 'fwd' : 'back')
    }
  }

  const page = pages[index]
  const fromPage = flipAnim ? pages[flipAnim.fromIdx] : null

  return (
    <div
      className="w-full h-full relative overflow-hidden select-none"
      style={{ perspective: '600px', backgroundColor: '#f4f2ed' }}
      onTouchStart={e => onDragStart(e.touches[0].clientX)}
      onTouchEnd={e => onDragEnd(e, e.changedTouches[0].clientX)}
      onMouseDown={e => onDragStart(e.clientX)}
      onMouseUp={e => onDragEnd(e, e.clientX)}
    >
      <style>{MINI_NW_CSS}</style>

      {/* Background: current page */}
      <div className="absolute inset-0">
        {page?.image_url
          ? <img src={page.image_url} className="w-full h-full object-cover" alt="" />
          : <div className="w-full h-full flex items-center justify-center"><p className="text-[8px] text-stone-400">未設定圖片</p></div>
        }
      </div>

      {/* Foreground: flipping-away page */}
      {flipAnim && fromPage && (
        <div
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: flipAnim.dir === 'fwd' ? 'left center' : 'right center',
            animation: `${flipAnim.dir === 'fwd' ? 'miniFlipFwd' : 'miniFlipBack'} 0.42s ease-in-out forwards`,
          }}
        >
          <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
            {fromPage.image_url
              ? <img src={fromPage.image_url} className="w-full h-full object-cover" alt="" />
              : <div className="w-full h-full bg-stone-200" />
            }
            <div
              className="absolute inset-y-0 w-1/4 pointer-events-none"
              style={{
                [flipAnim.dir === 'fwd' ? 'right' : 'left']: 0,
                background: flipAnim.dir === 'fwd'
                  ? 'linear-gradient(to left, rgba(0,0,0,0.18) 0%, transparent 100%)'
                  : 'linear-gradient(to right, rgba(0,0,0,0.18) 0%, transparent 100%)',
              }}
            />
          </div>
          <div className="absolute inset-0" style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', backgroundColor: '#f4f2ed' }} />
        </div>
      )}

      {pages.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 pointer-events-none">
          {pages.map((_, i) => (
            <span key={i} className={`w-1 h-1 rounded-full ${i === index ? 'bg-white shadow' : 'bg-white/40'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── 靜態 / 互動內容分派 ──────────────────────────────────────────
function PreviewContent({ scene, interactive }: { scene: Scene; interactive?: boolean }) {
  const config = scene.config as Record<string, unknown>

  switch (scene.type) {
    case 'dialog': {
      const c = config as unknown as DialogConfig
      if (interactive) return <MiniDialogPreview config={c} />
      const first = c.dialogs?.[0]
      const boxBg = (c.box_theme ?? 'dark') === 'dark' ? '#0f172a' : '#ffffff'
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
              </div>
              <div className="p-2 border-t border-white/10" style={{ backgroundColor: boxBg }}>
                {first.speaker && <p className="text-[7px] font-semibold mb-0.5" style={{ color: c.name_color ?? '#fff' }}>{first.speaker}</p>}
                <p className="text-[9px] leading-relaxed line-clamp-3" style={{ color: c.text_color ?? 'rgba(255,255,255,0.8)' }}>{first.text || <span style={{ opacity: 0.3 }}>尚未輸入…</span>}</p>
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full justify-end">
              <div className="p-2.5 border-t border-white/10" style={{ backgroundColor: boxBg }}>
                {first?.speaker && <p className="text-[7px] mb-1" style={{ color: c.name_color ?? '#ffbf00' }}>{first.speaker}</p>}
                <p className="text-[9px]" style={{ color: c.text_color ?? 'rgba(255,255,255,0.8)' }}>{first?.text || <span style={{ opacity: 0.3 }}>尚未輸入…</span>}</p>
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
          <p className="relative text-center leading-relaxed"
            style={{ fontSize: Math.round((c.font_size ?? 16) * 0.55), color: c.text_color ?? '#ffffff' }}>
            {c.text || <span style={{ opacity: 0.3 }}>尚未輸入…</span>}
          </p>
        </div>
      )
    }

    case 'animation': {
      const c = config as unknown as AnimationConfig
      return (
        <div className="w-full h-full bg-black flex items-center justify-center">
          {c.video_url
            ? <video src={c.video_url} className="w-full h-full object-contain" autoPlay muted loop playsInline />
            : <p className="text-white/25 text-[9px]">影片未設定</p>
          }
        </div>
      )
    }

    case 'signature': {
      const c = config as unknown as SignatureConfig
      return (
        <div className="w-full h-full relative flex flex-col items-center justify-center gap-2"
          style={c.background_url
            ? { backgroundImage: `url(${c.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { backgroundColor: '#f5f0e8' }
          }
        >
          <p className="text-[8px] text-black/40 text-center absolute top-3 left-0 right-0">{c.instruction || '在畫面上簽署您的名字'}</p>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
            <div className="text-[7px] text-stone-500 px-2 py-1 rounded border border-stone-300 bg-white/70">重寫</div>
            <div className="text-[7px] text-white px-3 py-1 rounded bg-stone-800">確認</div>
          </div>
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
      return <div className="w-full h-full bg-black flex items-center justify-center"><p className="text-white/25 text-[9px]">結局場景</p></div>
  }
}

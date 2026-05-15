'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { Scene, DialogConfig, AnimationConfig, NewspaperConfig, TextConfig, SignatureConfig, GameConfig } from '@/lib/types'

function bgCss(url: string, x = 50, y = 50, zoom = 100): React.CSSProperties {
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: zoom === 100 ? 'cover' : `${zoom}%`,
    backgroundPosition: `${x}% ${y}%`,
  }
}

const OysterGame = dynamic(() => import('@/components/games/OysterGame'), { ssr: false })

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

  const typewriter = config.typewriter ?? true
  const speed = Math.round((config.typewriter_speed ?? 35) * 0.6) // scale to mini preview pace

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    if (!typewriter || !currentText) { setDisplayed(currentText); setDone(true); return }
    let i = 0
    function tick() {
      i++
      setDisplayed(currentText.slice(0, i))
      if (i < currentText.length) timerRef.current = setTimeout(tick, speed)
      else setDone(true)
    }
    tick()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [index, currentText, typewriter, speed])

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!done) return
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
    ? bgCss(config.background_url, config.background_x, config.background_y, config.background_zoom)
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
                bottom: `${current.character_y ?? 0}%`,
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
            <p style={{ fontSize: textSize, color: textColor, lineHeight: 1.55, whiteSpace: 'pre-wrap' }} className="flex-1 overflow-hidden">
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
  const allPages = config.pages ?? []
  const autoFlip = !!config.auto_flip
  const interval = config.auto_flip_interval ?? 1800
  const selectedIndices = config.auto_flip_pages
  const pages = (autoFlip && selectedIndices?.length)
    ? allPages.filter((_, i) => selectedIndices.includes(i))
    : allPages

  const [index, setIndex] = useState(0)
  const [flipAnim, setFlipAnim] = useState<{ fromIdx: number; dir: 'fwd' | 'back' } | null>(null)
  const dragStartX = useRef<number | null>(null)

  // Auto-flip in preview
  useEffect(() => {
    if (!autoFlip || !pages.length) return
    const timer = setInterval(() => {
      setIndex(prev => {
        const next = prev + 1
        if (next >= pages.length) { clearInterval(timer); return prev }
        setFlipAnim({ fromIdx: prev, dir: 'fwd' })
        setTimeout(() => setFlipAnim(null), 780)
        return next
      })
    }, interval)
    return () => clearInterval(timer)
  }, [autoFlip, interval, pages.length])

  if (!allPages.length) {
    return <div className="w-full h-full bg-stone-100 flex items-center justify-center"><p className="text-[8px] text-stone-400">尚未新增頁面</p></div>
  }

  function advance(dir: 'fwd' | 'back') {
    if (flipAnim || autoFlip) return
    const next = index + (dir === 'fwd' ? 1 : -1)
    if (next < 0 || next >= pages.length) return
    setFlipAnim({ fromIdx: index, dir })
    setIndex(next)
    setTimeout(() => setFlipAnim(null), 780)
  }

  function onDragStart(x: number) { dragStartX.current = x }
  function onDragEnd(e: React.MouseEvent | React.TouchEvent, x: number) {
    if (dragStartX.current === null) return
    const dx = x - dragStartX.current
    dragStartX.current = null
    if (Math.abs(dx) < 12) {
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
          ? <div className="w-full h-full" style={bgCss(page.image_url, page.image_x, page.image_y, page.image_zoom)} />
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
            animation: `${flipAnim.dir === 'fwd' ? 'miniFlipFwd' : 'miniFlipBack'} 0.75s ease-in-out forwards`,
          }}
        >
          <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
            {fromPage.image_url
              ? <div className="w-full h-full" style={bgCss(fromPage.image_url, fromPage.image_x, fromPage.image_y, fromPage.image_zoom)} />
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

      {autoFlip && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-[8px] px-1.5 py-0.5 rounded pointer-events-none tracking-wide">
          自動翻頁
        </div>
      )}
    </div>
  )
}

// ── 互動純文字預覽 ────────────────────────────────────────────────
// Renders at the real phone design width (375px) then CSS-scales to preview
// width (204px) so line breaks are pixel-identical to the actual site.
const SCREEN_W = 204    // 224px frame - 2×10px padding
const TEXT_REAL_W = 375
const TEXT_SCALE = SCREEN_W / TEXT_REAL_W          // ≈ 0.544
const TEXT_DESIGN_H = Math.round(PHONE_SCREEN_H / TEXT_SCALE)

function MiniTextPreview({ config }: { config: TextConfig }) {
  const text = config.text ?? ''
  const typewriter = config.typewriter ?? true
  const speed = config.typewriter_speed ?? 45
  const opacity = (config.overlay_opacity ?? 50) / 100
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const [replay, setReplay] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    if (!typewriter || !text) { setDisplayed(text); setDone(true); return }
    let i = 0
    function tick() {
      i++
      setDisplayed(text.slice(0, i))
      if (i < text.length) timerRef.current = setTimeout(tick, speed)
      else setDone(true)
    }
    tick()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [text, typewriter, speed, replay])

  function handleTap() {
    if (!done) return
    setReplay(r => r + 1)
  }

  const color = config.text_color ?? '#ffffff'
  const bgStyle = config.background_url
    ? bgCss(config.background_url, config.background_x, config.background_y, config.background_zoom)
    : { background: '#1c1917' }

  return (
    <div
      className="cursor-pointer select-none"
      style={{ width: SCREEN_W, height: PHONE_SCREEN_H, overflow: 'hidden', position: 'relative' }}
      onClick={handleTap}
    >
      {/* Scaled inner — mirrors TextScene layout exactly */}
      <div style={{
        transform: `scale(${TEXT_SCALE})`,
        transformOrigin: 'top left',
        width: TEXT_REAL_W,
        height: TEXT_DESIGN_H,
        position: 'absolute',
        top: 0,
        left: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...bgStyle,
      }}>
        {config.background_url && <div className="absolute inset-0 bg-black" style={{ opacity }} />}
        <div className="relative z-10 max-w-xs px-8 text-center">
          <p className="leading-loose tracking-wide" style={{ fontSize: config.font_size ?? 16, color, whiteSpace: 'pre-wrap' }}>
            {displayed || <span style={{ opacity: 0.3 }}>尚未輸入…</span>}
            {!done && displayed && (
              <span className="inline-block w-0.5 h-5 ml-0.5 align-middle animate-pulse" style={{ backgroundColor: color, opacity: 0.6 }} />
            )}
          </p>
          {done && text && <p className="text-xs mt-8 tracking-widest" style={{ color, opacity: 0.3 }}>點擊重播 ↺</p>}
        </div>
      </div>
    </div>
  )
}

// ── 互動簽名預覽 ──────────────────────────────────────────────────
function MiniSignaturePreview({ config }: { config: SignatureConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [signed, setSigned] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
  }, [])

  const bgStyle: React.CSSProperties = config.background_url
    ? bgCss(config.background_url, config.background_x, config.background_y, config.background_zoom)
    : { backgroundColor: '#f5f0e8' }

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const src = 'touches' in e ? e.touches[0] : e
    return { x: src.clientX - rect.left, y: src.clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault(); e.stopPropagation()
    drawing.current = true
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.beginPath(); ctx.moveTo(x, y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault(); e.stopPropagation()
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.stroke()
    setSigned(true)
  }

  function endDraw() { drawing.current = false }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    setSigned(false); setDone(false)
  }

  if (done) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={bgStyle}>
        <p className="text-[9px] text-stone-500">簽名完成 ✓</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative select-none" style={bgStyle}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none"
        style={{ cursor: 'crosshair' }}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
      />
      <p className="absolute top-2 left-0 right-0 text-center text-[7px] text-black/30 pointer-events-none">
        {config.instruction || '在畫面上簽署'}
      </p>
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
        <button onClick={clearCanvas} className="text-[7px] text-stone-500 px-2 py-1 rounded border border-stone-300 bg-white/70">重寫</button>
        {signed && (
          <button onClick={() => setDone(true)} className="text-[7px] text-white px-2 py-1 rounded bg-stone-800">確認</button>
        )}
      </div>
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
            ? bgCss(c.background_url, c.background_x, c.background_y, c.background_zoom)
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
      if (interactive) return <MiniTextPreview config={c} />
      // Static thumbnail — same CSS scale so line breaks match the real site
      const opacity = (c.overlay_opacity ?? 50) / 100
      const color = c.text_color ?? '#ffffff'
      const bgStyle = c.background_url
        ? bgCss(c.background_url, c.background_x, c.background_y, c.background_zoom)
        : { background: '#1c1917' }
      return (
        <div style={{ width: SCREEN_W, height: PHONE_SCREEN_H, overflow: 'hidden', position: 'relative' }}>
          <div style={{
            transform: `scale(${TEXT_SCALE})`,
            transformOrigin: 'top left',
            width: TEXT_REAL_W,
            height: TEXT_DESIGN_H,
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...bgStyle,
          }}>
            {c.background_url && <div className="absolute inset-0 bg-black" style={{ opacity }} />}
            <div className="relative z-10 max-w-xs px-8 text-center">
              <p className="leading-loose tracking-wide" style={{ fontSize: c.font_size ?? 16, color, whiteSpace: 'pre-wrap' }}>
                {c.text || <span style={{ opacity: 0.3 }}>尚未輸入…</span>}
              </p>
            </div>
          </div>
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
      if (interactive) return <MiniSignaturePreview config={c} />
      return (
        <div className="w-full h-full relative flex flex-col items-center justify-center gap-2"
          style={c.background_url
            ? bgCss(c.background_url, c.background_x, c.background_y, c.background_zoom)
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
      if (interactive && c.game_id === 'oyster') {
        // Scale the full-screen game (designed for 390px wide) down to the phone preview width (204px).
        // CSS transform scale keeps all interactions working — getBoundingClientRect returns visual px.
        const SCREEN_W = 204 // 224px frame - 2×10px padding
        const DESIGN_W = 390
        const scale = SCREEN_W / DESIGN_W
        const designH = Math.round(PHONE_SCREEN_H / scale)
        return (
          <div style={{ width: SCREEN_W, height: PHONE_SCREEN_H, overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: DESIGN_W, height: designH }}>
              <OysterGame onFinish={() => {}} style={{ height: designH }} />
            </div>
          </div>
        )
      }
      return (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-2 p-3">
          <p className="text-white text-[10px] font-bold text-center">{c.title || scene.title}</p>
          {c.description && <p className="text-white/40 text-[8px] text-center line-clamp-3">{c.description}</p>}
          <p className="text-white/20 text-[7px]">{c.game_id ? `遊戲 [${c.game_id}]` : '遊戲開發中'}</p>
        </div>
      )
    }

    default:
      return <div className="w-full h-full bg-black flex items-center justify-center"><p className="text-white/25 text-[9px]">結局場景</p></div>
  }
}

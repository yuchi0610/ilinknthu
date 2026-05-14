'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Scene, Ending, DialogConfig, AnimationConfig, NewspaperConfig, TextConfig, SignatureConfig, GameConfig } from '@/lib/types'
import OysterGame from '@/components/games/OysterGame'

interface Props {
  scene: Scene
  nextScene: Scene | null
  endings: Ending[]
  onFinish: () => void
}

export default function SceneRenderer({ scene, nextScene, endings, onFinish }: Props) {
  const router = useRouter()

  function goNext() {
    if (nextScene?.type === 'ending') {
      const scores = JSON.parse(sessionStorage.getItem('scores') ?? '{}') as Record<string, number>
      const total = Object.values(scores).reduce((a, b) => a + b, 0)
      const matched = endings.find(e => total >= e.score_min && total <= e.score_max) ?? endings[0]

      const sessionId = sessionStorage.getItem('session_id')
      if (sessionId) {
        fetch('/api/sessions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: sessionId, scores, total_score: total, ending_type: matched?.type }),
        })
      }
      router.push(`/ending/${matched?.type ?? 'C'}`)
    } else {
      onFinish()
    }
  }

  function addScore(key: string, value: number) {
    const scores = JSON.parse(sessionStorage.getItem('scores') ?? '{}') as Record<string, number>
    scores[key] = value
    sessionStorage.setItem('scores', JSON.stringify(scores))
  }

  switch (scene.type) {
    case 'dialog':    return <DialogScene scene={scene} onFinish={goNext} />
    case 'text':      return <TextScene scene={scene} onFinish={goNext} />
    case 'animation': return <AnimationScene scene={scene} onFinish={goNext} />
    case 'newspaper': return <NewspaperScene scene={scene} onFinish={goNext} />
    case 'signature': return <SignatureScene scene={scene} onFinish={goNext} />
    case 'game':      return <GameScene scene={scene} onFinish={(score) => { addScore(scene.id, score); goNext() }} />
    default:
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
          <p className="text-zinc-500 text-sm mb-8">{scene.title}</p>
          <button onClick={goNext} className={btnCls}>繼 續 →</button>
        </div>
      )
  }
}

const btnCls = 'border border-white/30 hover:border-white/60 text-white text-sm tracking-widest px-10 py-4 transition-colors'

// ── 對話場景 ─────────────────────────────────────────────────────
function DialogScene({ scene, onFinish }: { scene: Scene; onFinish: () => void }) {
  const config = scene.config as DialogConfig
  const dialogs = config.dialogs ?? []
  const [index, setIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const current = dialogs[index]
  const currentText = current?.text ?? ''
  const typewriter = config.typewriter ?? true
  const speed = config.typewriter_speed ?? 35

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    if (!typewriter || !currentText) {
      setDisplayed(currentText)
      setDone(true)
      return
    }
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

  function handleTap() {
    if (!done) return
    if (index < dialogs.length - 1) setIndex(i => i + 1)
    else onFinish()
  }

  const boxTheme = config.box_theme ?? 'dark'
  const boxHeight = config.box_height ?? 38
  const charHeight = 100 - boxHeight
  const nameSize = config.name_font_size ?? 14
  const nameColor = config.name_color ?? '#ffffff'
  const textSize = config.text_font_size ?? 14
  const textColor = config.text_color ?? (boxTheme === 'dark' ? 'rgba(255,255,255,0.9)' : '#1c1917')
  const boxBg = boxTheme === 'dark' ? '#0f172a' : '#ffffff'
  const nameBadgeBg = boxTheme === 'dark' ? 'rgba(30,27,75,0.9)' : 'rgba(255,255,255,0.92)'
  const nameBadgeTextColor = boxTheme === 'dark' ? nameColor : (config.name_color ?? '#1c1917')

  return (
    <div
      className="min-h-screen text-white flex flex-col cursor-pointer select-none relative overflow-hidden"
      style={{
        ...(config.background_url
          ? { backgroundImage: `url(${config.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 60%, #1e1b4b 100%)' }),
      }}
      onClick={handleTap}
    >
      {current?.character_image_url ? (
        <>
          {/* 角色立繪區 */}
          <div className="relative overflow-hidden flex-shrink-0" style={{ height: `${charHeight}vh` }}>
            <img
              src={current.character_image_url}
              alt={current.speaker}
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

            {/* 進度點 */}
            {dialogs.length > 1 && (
              <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5">
                {dialogs.map((_, i) => (
                  <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i <= index ? 'bg-white' : 'bg-white/30'}`} />
                ))}
              </div>
            )}

            {/* 姓名牌 */}
            {current.speaker && (
              <div className="absolute bottom-0 left-0 right-0 flex justify-start px-5 pb-0">
                <div className="px-4 py-1.5 rounded-t-xl backdrop-blur-sm" style={{ backgroundColor: nameBadgeBg }}>
                  <span style={{ fontSize: nameSize, color: nameBadgeTextColor }} className="font-semibold tracking-wide">{current.speaker}</span>
                </div>
              </div>
            )}
          </div>

          {/* 對話框 */}
          <div className="px-5 pt-4 pb-10 flex flex-col justify-between" style={{ minHeight: `${boxHeight}vh`, backgroundColor: boxBg }}>
            <p style={{ fontSize: textSize, color: textColor, lineHeight: 1.8 }} className="flex-1">
              {displayed}
              <span className={`inline-block w-0.5 h-4 bg-current ml-0.5 align-middle animate-pulse ${done ? 'opacity-0' : ''}`} />
            </p>
            {done && (
              <p className="text-xs text-right mt-3" style={{ color: textColor, opacity: 0.3 }}>
                {index < dialogs.length - 1 ? '點擊繼續 ▼' : '點擊結束 ▼'}
              </p>
            )}
          </div>
        </>
      ) : (
        /* 無立繪：底部對話框 */
        <div className="flex flex-col min-h-screen justify-end">
          {dialogs.length > 1 && (
            <div className="flex justify-center gap-1.5 mb-3">
              {dialogs.map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i <= index ? 'bg-white' : 'bg-white/20'}`} />
              ))}
            </div>
          )}
          <div className="backdrop-blur border-t px-6 pb-10 pt-4"
            style={{
              backgroundColor: boxBg,
              borderColor: boxTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            }}
          >
            {current?.speaker && (
              <p style={{ fontSize: nameSize, color: nameColor, marginBottom: 8 }} className="font-semibold tracking-wider">{current.speaker}</p>
            )}
            <p style={{ fontSize: textSize, color: textColor, lineHeight: 1.8 }} className="min-h-[3rem]">
              {displayed}
              <span className={`inline-block w-0.5 h-4 bg-current ml-0.5 align-middle animate-pulse ${done ? 'opacity-0' : ''}`} />
            </p>
            {done && (
              <p className="text-xs text-right mt-3" style={{ color: textColor, opacity: 0.3 }}>
                {index < dialogs.length - 1 ? '點擊繼續' : '點擊結束'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 純文字場景 ───────────────────────────────────────────────────
function TextScene({ scene, onFinish }: { scene: Scene; onFinish: () => void }) {
  const config = scene.config as TextConfig
  const text = config.text ?? ''
  const opacity = (config.overlay_opacity ?? 50) / 100
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const typewriter = config.typewriter ?? true
  const speed = config.typewriter_speed ?? 45

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    if (!typewriter || !text) {
      setDisplayed(text)
      setDone(true)
      return
    }
    let i = 0
    function tick() {
      i++
      setDisplayed(text.slice(0, i))
      if (i < text.length) timerRef.current = setTimeout(tick, speed)
      else setDone(true)
    }
    tick()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [text, typewriter, speed])

  function handleTap() {
    if (!done) return
    onFinish()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center cursor-pointer select-none relative overflow-hidden"
      style={config.background_url
        ? { backgroundImage: `url(${config.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: '#1c1917' }
      }
      onClick={handleTap}
    >
      {config.background_url && <div className="absolute inset-0 bg-black" style={{ opacity }} />}
      <div className="relative z-10 max-w-xs px-8 text-center">
        <p className="leading-loose tracking-wide" style={{ fontSize: config.font_size ?? 16, color: config.text_color ?? '#ffffff' }}>
          {displayed}
          <span className={`inline-block w-0.5 h-5 ml-0.5 align-middle animate-pulse ${done ? 'opacity-0' : ''}`} style={{ backgroundColor: config.text_color ?? '#ffffff', opacity: 0.6 }} />
        </p>
        {done && <p className="text-xs mt-8 tracking-widest" style={{ color: config.text_color ?? '#ffffff', opacity: 0.3 }}>點擊繼續</p>}
      </div>
    </div>
  )
}

// ── 影片場景 ─────────────────────────────────────────────────────
function AnimationScene({ scene, onFinish }: { scene: Scene; onFinish: () => void }) {
  const config = scene.config as AnimationConfig
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ended, setEnded] = useState(false)

  useEffect(() => {
    if (config.auto_advance && videoRef.current) {
      videoRef.current.onended = () => {
        if (config.auto_advance) onFinish()
        else setEnded(true)
      }
    }
  }, [config.auto_advance, onFinish])

  if (!config.video_url) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
        <p className="text-zinc-500 text-sm">影片未設定</p>
        <button onClick={onFinish} className={btnCls}>繼 續 →</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
      <video
        ref={videoRef}
        src={config.video_url}
        autoPlay={config.autoplay ?? true}
        loop={config.loop ?? false}
        playsInline
        className="w-full max-h-screen object-contain"
        onEnded={() => { if (!config.auto_advance) setEnded(true) }}
      />
      {(ended || !config.auto_advance) && (
        <div className="absolute bottom-10 w-full flex justify-center">
          <button onClick={onFinish} className={btnCls}>繼 續 →</button>
        </div>
      )}
    </div>
  )
}

// ── 報紙：書頁翻頁 CSS ────────────────────────────────────────────
const NW_CSS = `
  @keyframes nwFlipFwd {
    0%   { transform: rotateY(0deg);    opacity: 1; }
    86%  { transform: rotateY(-170deg); opacity: 1; }
    100% { transform: rotateY(-180deg); opacity: 0; }
  }
  @keyframes nwFlipBack {
    0%   { transform: rotateY(0deg);   opacity: 1; }
    86%  { transform: rotateY(170deg); opacity: 1; }
    100% { transform: rotateY(180deg); opacity: 0; }
  }
`

// ── 報紙場景 ─────────────────────────────────────────────────────
function NewspaperPageView({ page }: { page: NewspaperConfig['pages'][number] | undefined }) {
  if (!page?.image_url) {
    return <div className="w-full h-full bg-stone-200 flex items-center justify-center"><p className="text-stone-400 text-sm">未設定圖片</p></div>
  }
  return <img src={page.image_url} alt="" className="w-full h-full object-cover" />
}

function NewspaperScene({ scene, onFinish }: { scene: Scene; onFinish: () => void }) {
  const config = scene.config as NewspaperConfig
  const pages = config.pages ?? []
  const [index, setIndex] = useState(0)
  const [flipAnim, setFlipAnim] = useState<{ fromIdx: number; dir: 'fwd' | 'back' } | null>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  function advance(dir: 'fwd' | 'back') {
    if (flipAnim) return
    const next = index + (dir === 'fwd' ? 1 : -1)
    if (next < 0) return
    if (next >= pages.length) { onFinish(); return }
    setFlipAnim({ fromIdx: index, dir })
    setIndex(next)
    setTimeout(() => setFlipAnim(null), 520)
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
    if (Math.abs(dx) < 40 || dy > Math.abs(dx)) return
    advance(dx < 0 ? 'fwd' : 'back')
  }

  if (!pages.length) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
        <p className="text-zinc-500 text-sm">尚未設定頁面</p>
        <button onClick={onFinish} className={btnCls}>繼 續 →</button>
      </div>
    )
  }

  const page = pages[index]
  const fromPage = flipAnim ? pages[flipAnim.fromIdx] : null

  return (
    <div
      className="min-h-screen flex flex-col bg-zinc-100 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{NW_CSS}</style>

      <div className="flex-1 relative overflow-hidden" style={{ perspective: '2000px' }}>
        <div className="absolute inset-0">
          <NewspaperPageView page={page} />
        </div>

        {flipAnim && fromPage && (
          <div
            className="absolute inset-0"
            style={{
              transformStyle: 'preserve-3d',
              transformOrigin: flipAnim.dir === 'fwd' ? 'left center' : 'right center',
              animation: `${flipAnim.dir === 'fwd' ? 'nwFlipFwd' : 'nwFlipBack'} 0.5s ease-in-out forwards`,
            }}
          >
            <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
              <NewspaperPageView page={fromPage} />
              <div
                className="absolute inset-y-0 w-1/4 pointer-events-none"
                style={{
                  [flipAnim.dir === 'fwd' ? 'right' : 'left']: 0,
                  background: flipAnim.dir === 'fwd'
                    ? 'linear-gradient(to left, rgba(0,0,0,0.22) 0%, transparent 100%)'
                    : 'linear-gradient(to right, rgba(0,0,0,0.22) 0%, transparent 100%)',
                }}
              />
            </div>
            <div className="absolute inset-0" style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', backgroundColor: '#f4f2ed' }} />
          </div>
        )}

        {pages.length > 1 && (
          <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
            {pages.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-white shadow' : 'bg-white/40'}`} />
            ))}
          </div>
        )}

        {index === pages.length - 1 && pages.length > 0 && (
          <div className="absolute bottom-12 right-5 text-xs text-white/50 pointer-events-none tracking-wide">左滑結束</div>
        )}
      </div>
    </div>
  )
}

// ── 簽名場景 ─────────────────────────────────────────────────────
function SignatureScene({ scene, onFinish }: { scene: Scene; onFinish: () => void }) {
  const config = scene.config as SignatureConfig
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [signed, setSigned] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
  }, [])

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const source = 'touches' in e ? e.touches[0] : e
    return { x: source.clientX - rect.left, y: source.clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    drawing.current = true
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.beginPath(); ctx.moveTo(x, y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.stroke()
    setSigned(true)
  }

  function endDraw() { drawing.current = false }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    setSigned(false)
  }

  async function handleSubmit() {
    if (!signed) return
    setUploading(true)
    const sessionId = sessionStorage.getItem('session_id') ?? 'unknown'
    await fetch('/api/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sessionId, signature_url: `signatures/${sessionId}.png` }),
    })
    setUploading(false)
    onFinish()
  }

  const hasBg = !!config.background_url

  return (
    <div
      className="min-h-screen relative overflow-hidden select-none"
      style={hasBg
        ? { backgroundImage: `url(${config.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { backgroundColor: '#f5f0e8' }
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none"
        style={{ cursor: 'crosshair' }}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
      />
      <p className="absolute top-10 left-0 right-0 text-center text-black/40 text-sm pointer-events-none tracking-wide">
        {config.instruction || '在畫面上簽署您的名字'}
      </p>
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4">
        <button onClick={clearCanvas} className="text-sm text-stone-500 hover:text-stone-900 px-5 py-2.5 border border-stone-300 hover:border-stone-600 rounded-lg bg-white/70 backdrop-blur-sm transition-colors">重寫</button>
        <button onClick={handleSubmit} disabled={!signed || uploading}
          className="text-sm bg-stone-900 text-white px-8 py-2.5 rounded-lg disabled:opacity-30 hover:bg-black transition-colors font-medium">
          {uploading ? '提交中…' : '確認簽名'}
        </button>
      </div>
    </div>
  )
}

// ── 遊戲場景 ────────────────────────────────────────────────────
function GameScene({ scene, onFinish }: { scene: Scene; onFinish: (score: number) => void }) {
  const config = scene.config as GameConfig

  if (config.game_id === 'oyster') {
    return <OysterGame onFinish={onFinish} />
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 gap-6">
      <h2 className="text-lg font-bold">{config.title || scene.title}</h2>
      {config.description && <p className="text-sm text-zinc-400 max-w-xs text-center">{config.description}</p>}
      <p className="text-xs text-zinc-600">遊戲元件 [{config.game_id}] 開發中</p>
      <button onClick={() => onFinish(0)} className={btnCls}>跳 過 →</button>
    </div>
  )
}

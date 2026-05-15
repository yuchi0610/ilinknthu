'use client'

import { useRef, useState, useEffect, useMemo, forwardRef } from 'react'
import HTMLFlipBook from 'react-pageflip'
import { imageBlobUrls } from '@/lib/assetCache'
import type { NewspaperItem } from '@/lib/types'

function bgCss(url: string, x = 50, y = 50, zoom = 100): React.CSSProperties {
  return {
    backgroundColor: '#000',
    backgroundImage: `url(${imageBlobUrls.get(url) ?? url})`,
    backgroundSize: zoom === 100 ? 'cover' : `${zoom}%`,
    backgroundPosition: `${x}% ${y}%`,
  }
}

interface FlatPage {
  image_url: string
  image_x?: number
  image_y?: number
  image_zoom?: number
}

interface AutoRange {
  start: number
  end: number
  interval: number
}

function flattenItems(items: NewspaperItem[]): { flatPages: FlatPage[]; autoRanges: AutoRange[] } {
  const flatPages: FlatPage[] = []
  const autoRanges: AutoRange[] = []

  for (const item of items) {
    if (item.kind === 'auto') {
      const start = flatPages.length
      for (const url of item.images) flatPages.push({ image_url: url })
      if (item.images.length > 0) autoRanges.push({ start, end: flatPages.length - 1, interval: item.interval ?? 1800 })
    } else {
      flatPages.push({ image_url: item.image_url, image_x: item.image_x, image_y: item.image_y, image_zoom: item.image_zoom })
    }
  }

  return { flatPages, autoRanges }
}

const Page = forwardRef<HTMLDivElement, { page: FlatPage }>(
  function Page({ page }, ref) {
    return (
      <div ref={ref} className="w-full h-full overflow-hidden">
        {page?.image_url
          ? <div className="w-full h-full" style={bgCss(page.image_url, page.image_x, page.image_y, page.image_zoom)} />
          : <div className="w-full h-full bg-stone-200 flex items-center justify-center"><p className="text-stone-400 text-sm">未設定圖片</p></div>
        }
      </div>
    )
  }
)

interface Props {
  items: NewspaperItem[]
  onFinish: () => void
}

export default function NewspaperFlip({ items, onFinish }: Props) {
  const { flatPages, autoRanges } = useMemo(() => flattenItems(items), [items])

  const bookRef = useRef<{ pageFlip: () => { flipNext: (c?: string) => void; flipPrev: (c?: string) => void; getCurrentPageIndex: () => number } }>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [ready, setReady] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [flashing, setFlashing] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isFlippingRef = useRef(false)
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onFinishRef = useRef(onFinish)
  useEffect(() => { onFinishRef.current = onFinish }, [onFinish])

  // Preload all images before showing the flipbook to prevent black-screen during flip
  useEffect(() => {
    const urls = flatPages.map(p => p.image_url).filter(Boolean)
    if (!urls.length) { setImagesLoaded(true); return }
    let done = 0
    urls.forEach(url => {
      const img = new window.Image()
      img.onload = img.onerror = () => { done++; if (done === urls.length) setImagesLoaded(true) }
      img.src = url
    })
  }, [flatPages])

  const currentAutoRange = autoRanges.find(r => currentIdx >= r.start && currentIdx <= r.end) ?? null
  const isAuto = !!currentAutoRange
  const isLast = currentIdx >= flatPages.length - 1

  function triggerFlashFinish() {
    setFlashing(true)
    setTimeout(() => onFinishRef.current(), 700)
  }

  // Fixed-interval auto-flip (no acceleration)
  useEffect(() => {
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null }
    if (!ready || !currentAutoRange) return

    let cancelled = false
    const range = currentAutoRange

    function scheduleTick() {
      autoTimerRef.current = setTimeout(() => {
        if (cancelled) return
        const pf = bookRef.current?.pageFlip()
        if (!pf) return
        const idx = pf.getCurrentPageIndex()

        if (idx >= range.end) {
          if (idx >= flatPages.length - 1) {
            setIsFinished(true)  // last page — wait for tap
          } else {
            // flip into the next manual page
            setTimeout(() => { if (!cancelled) bookRef.current?.pageFlip()?.flipNext('bottom') }, 300)
          }
          return
        }

        pf.flipNext('bottom')
        scheduleTick()
      }, range.interval ?? 1800)
    }

    scheduleTick()

    return () => {
      cancelled = true
      if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, currentAutoRange?.start])

  // Show tap prompt on last manual page
  useEffect(() => {
    if (!ready || !isLast || isAuto) return
    setIsFinished(true)
  }, [ready, isLast, isAuto])

  // Manual swipe — StPageFlip mouse events always off; we handle touch ourselves
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (isFinished) { triggerFlashFinish(); return }
    if (isAuto || isFlippingRef.current) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
    if (Math.abs(dx) < 70 || dy > Math.abs(dx) * 0.6) return
    const pf = bookRef.current?.pageFlip()
    if (!pf) return
    isFlippingRef.current = true
    if (dx < 0) pf.flipNext('bottom')
    else pf.flipPrev('bottom')
  }

  function handleClick() {
    if (isFinished) triggerFlashFinish()
  }

  if (!flatPages.length) {
    return (
      <div className="min-h-dvh bg-black text-white flex flex-col items-center justify-center gap-6">
        <p className="text-zinc-500 text-sm">尚未設定頁面</p>
      </div>
    )
  }

  if (!imagesLoaded) {
    return (
      <div className="min-h-dvh bg-zinc-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="min-h-dvh bg-zinc-900 flex flex-col items-center justify-center select-none overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <HTMLFlipBook
        ref={bookRef}
        className=""
        style={{}}
        width={390}
        height={700}
        size="stretch"
        minWidth={280}
        maxWidth={600}
        minHeight={400}
        maxHeight={900}
        startPage={0}
        drawShadow={true}
        flippingTime={400}
        usePortrait={true}
        startZIndex={10}
        autoSize={true}
        maxShadowOpacity={0.25}
        showCover={false}
        mobileScrollSupport={false}
        clickEventForward={false}
        useMouseEvents={false}
        swipeDistance={999}
        showPageCorners={!isAuto}
        disableFlipByClick={true}
        onFlip={(e: { data: number }) => { isFlippingRef.current = false; setCurrentIdx(e.data) }}
        onInit={() => setReady(true)}
        renderOnlyPageLengthChange={false}
      >
        {flatPages.map((page, i) => (
          <Page key={i} page={page} />
        ))}
      </HTMLFlipBook>

      {isFinished && (
        <div className="absolute inset-0 flex items-end justify-center pb-16 pointer-events-none z-10">
          <p className="text-white/50 text-sm tracking-widest animate-pulse">點擊繼續</p>
        </div>
      )}
      {flashing && (
        <div
          className="fixed inset-0 bg-white pointer-events-none z-[9999]"
          style={{ animation: 'flashAnim 1.2s cubic-bezier(0.23,1,0.32,1) forwards' }}
        />
      )}
    </div>
  )
}

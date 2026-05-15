'use client'

import { useRef, useState, useEffect, forwardRef } from 'react'
import HTMLFlipBook from 'react-pageflip'
import type { NewspaperConfig, NewspaperPage } from '@/lib/types'

function bgCss(url: string, x = 50, y = 50, zoom = 100): React.CSSProperties {
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: zoom === 100 ? 'cover' : `${zoom}%`,
    backgroundPosition: `${x}% ${y}%`,
  }
}

const Page = forwardRef<HTMLDivElement, { page: NewspaperPage }>(
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
  pages: NewspaperPage[]
  onFinish: () => void
  autoFlip?: boolean
  autoFlipInterval?: number
}

export default function NewspaperFlip({ pages, onFinish, autoFlip = false, autoFlipInterval = 1800 }: Props) {
  const bookRef = useRef<{ pageFlip: () => { flipNext: (c?: string) => void; getCurrentPageIndex: () => number } }>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [ready, setReady] = useState(false)
  const isLast = currentPage >= pages.length - 1

  // Auto-flip: after init, schedule repeated flipNext calls
  useEffect(() => {
    if (!autoFlip || !ready) return
    const timer = setInterval(() => {
      const pf = bookRef.current?.pageFlip()
      if (!pf) return
      const idx = pf.getCurrentPageIndex()
      if (idx >= pages.length - 1) {
        clearInterval(timer)
        setTimeout(onFinish, autoFlipInterval * 0.4)
      } else {
        pf.flipNext('bottom')
      }
    }, autoFlipInterval)
    return () => clearInterval(timer)
  }, [autoFlip, ready, autoFlipInterval, pages.length, onFinish])

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center select-none overflow-hidden">
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
        flippingTime={1100}
        usePortrait={true}
        startZIndex={10}
        autoSize={true}
        maxShadowOpacity={0.6}
        showCover={false}
        mobileScrollSupport={false}
        clickEventForward={false}
        useMouseEvents={!autoFlip}
        swipeDistance={30}
        showPageCorners={!autoFlip}
        disableFlipByClick={autoFlip}
        onFlip={(e: { data: number }) => setCurrentPage(e.data)}
        onInit={() => setReady(true)}
        renderOnlyPageLengthChange={false}
      >
        {pages.map((page, i) => (
          <Page key={i} page={page} />
        ))}
      </HTMLFlipBook>

      {pages.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {pages.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentPage ? 'bg-white' : 'bg-white/30'}`}
            />
          ))}
        </div>
      )}

      {/* Manual mode: show button on last page */}
      {!autoFlip && isLast && (
        <button
          onClick={onFinish}
          className="mt-5 border border-white/30 hover:border-white/60 text-white text-sm tracking-widest px-10 py-4 transition-colors"
        >
          繼 續 →
        </button>
      )}
    </div>
  )
}

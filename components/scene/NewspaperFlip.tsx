'use client'

import { useRef, useState, forwardRef } from 'react'
import HTMLFlipBook from 'react-pageflip'
import type { NewspaperConfig } from '@/lib/types'

function bgCss(url: string, x = 50, y = 50, zoom = 100): React.CSSProperties {
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: zoom === 100 ? 'cover' : `${zoom}%`,
    backgroundPosition: `${x}% ${y}%`,
  }
}

// react-pageflip requires children to be forwardRef components
const Page = forwardRef<HTMLDivElement, { page: NewspaperConfig['pages'][number] }>(
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
  pages: NewspaperConfig['pages']
  onFinish: () => void
}

export default function NewspaperFlip({ pages, onFinish }: Props) {
  const bookRef = useRef<{ pageFlip: () => { getCurrentPageIndex: () => number; getPageCount: () => number } }>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const isLast = currentPage >= pages.length - 1

  function handleFlip(e: { data: number }) {
    setCurrentPage(e.data)
  }

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
        useMouseEvents={true}
        swipeDistance={30}
        showPageCorners={true}
        disableFlipByClick={false}
        onFlip={handleFlip}
        renderOnlyPageLengthChange={false}
      >
        {pages.map((page, i) => (
          <Page key={i} page={page} />
        ))}
      </HTMLFlipBook>

      {/* Progress dots */}
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

      {/* Finish button shown on last page */}
      {isLast && (
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

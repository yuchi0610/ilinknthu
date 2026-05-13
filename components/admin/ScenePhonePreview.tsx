'use client'

import type { Scene, DialogConfig, AnimationConfig, NewspaperConfig, TextConfig, SignatureConfig, GameConfig } from '@/lib/types'

export default function ScenePhonePreview({ scene }: { scene: Scene }) {
  return (
    <div className="relative mx-auto" style={{ width: 224 }}>
      <div className="relative bg-stone-800 rounded-[2.2rem] p-2.5 shadow-xl" style={{ aspectRatio: '9/19' }}>
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-stone-600 rounded-full z-10" />
        <div className="w-full h-full bg-black rounded-[1.6rem] overflow-hidden">
          <PreviewContent scene={scene} />
        </div>
      </div>
    </div>
  )
}

function PreviewContent({ scene }: { scene: Scene }) {
  const config = scene.config as Record<string, unknown>

  switch (scene.type) {
    case 'dialog': {
      const c = config as unknown as DialogConfig
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
            : <p className="text-white/25 text-[9px]">影片 URL 未設定</p>
          }
        </div>
      )
    }
    case 'newspaper': {
      const c = config as unknown as NewspaperConfig
      const page = c.pages?.[0]
      return (
        <div className="w-full h-full bg-stone-100 text-stone-900 flex flex-col">
          <div className="border-b border-stone-300 text-center py-1">
            <p className="text-[7px] tracking-widest text-stone-400">{page?.year ?? 'XXXX'} 年</p>
          </div>
          {page?.image_url && <img src={page.image_url} className="w-full h-16 object-cover" alt="" />}
          <div className="p-2 flex-1">
            <p className="text-[9px] font-bold leading-tight">{page?.headline || <span className="text-stone-300">標題未設定</span>}</p>
            {page?.subtext && <p className="text-[8px] text-stone-500 mt-1 leading-relaxed line-clamp-3">{page.subtext}</p>}
          </div>
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

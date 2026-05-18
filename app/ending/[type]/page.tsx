export const dynamic = 'force-dynamic'

import { d1Query, parseJsonField } from '@/lib/d1'
import type { Ending } from '@/lib/types'

const ENDING_STYLE: Record<string, { from: string; to: string; badge: string; accent: string }> = {
  A: { from: 'from-amber-50',  to: 'to-amber-100/60',  badge: 'border-amber-200 text-amber-700',  accent: 'text-amber-600' },
  B: { from: 'from-sky-50',    to: 'to-sky-100/60',    badge: 'border-sky-200 text-sky-700',      accent: 'text-sky-600' },
  C: { from: 'from-stone-50',  to: 'to-stone-100/60',  badge: 'border-stone-200 text-stone-600',  accent: 'text-stone-500' },
}

export default async function EndingPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const key = type.toUpperCase()
  const rows = await d1Query<Record<string, unknown>>('SELECT * FROM endings WHERE type = ?', [key])
  const row = rows[0] ?? null
  const ending: Ending | null = row
    ? { ...(row as unknown as Ending), config: parseJsonField(row, 'config') }
    : null
  const s = ENDING_STYLE[key] ?? ENDING_STYLE['C']

  return (
    <div className={`fixed inset-0 overflow-auto sm:relative sm:inset-auto sm:max-w-[390px] sm:mx-auto sm:min-h-dvh bg-gradient-to-b ${s.from} ${s.to} flex flex-col items-center justify-center p-8`}>
      <div className="text-center max-w-sm w-full">
        <span className={`inline-block text-[10px] font-medium px-3 py-1 rounded-full border tracking-[0.2em] uppercase mb-8 ${s.badge}`}>
          結局 {key}
        </span>

        <h2 className="text-2xl font-semibold text-stone-800 mb-8 leading-snug">
          {ending?.label ?? '—'}
        </h2>

        {ending?.config.video_url && (
          <div className="rounded-2xl overflow-hidden shadow-md mb-8 border border-stone-200">
            <video src={ending.config.video_url} autoPlay playsInline className="w-full" />
          </div>
        )}

        {ending?.config.image_url && !ending.config.video_url && (
          <div className="rounded-2xl overflow-hidden shadow-md mb-8 border border-stone-200">
            <img src={ending.config.image_url} alt={ending.label} className="w-full" />
          </div>
        )}

        {ending?.config.description && (
          <p className="text-stone-500 text-sm leading-relaxed mb-10 text-left whitespace-pre-line">
            {ending.config.description}
          </p>
        )}

        <a href="/" className="inline-block text-xs text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-8 py-3 rounded-full tracking-widest transition-colors">
          重新開始體驗
        </a>
      </div>
    </div>
  )
}

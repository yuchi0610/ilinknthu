'use client'

import { useState, useEffect } from 'react'
import MediaPickerModal from '@/components/admin/MediaPickerModal'
import type { Ending } from '@/lib/types'

const ENDING_TYPES: Array<{ type: Ending['type']; label: string; dot: string }> = [
  { type: 'A', label: '結局 A（最佳）', dot: 'bg-amber-400' },
  { type: 'B', label: '結局 B（中間）', dot: 'bg-sky-400' },
  { type: 'C', label: '結局 C（最差）', dot: 'bg-stone-400' },
]

const inputCls = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 bg-white'
const labelCls = 'block text-xs font-medium text-stone-600 mb-1.5'

function UrlInput({ value, onChange, placeholder, onPick }: { value: string; onChange: (v: string) => void; placeholder?: string; onPick: () => void }) {
  return (
    <div className="flex gap-1.5">
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? 'https://...'} className={`${inputCls} flex-1`} />
      <button type="button" onClick={onPick} className="flex-shrink-0 border border-stone-200 rounded-lg px-2.5 text-xs text-stone-400 hover:text-stone-700 hover:border-stone-400 hover:bg-stone-50 transition-colors whitespace-nowrap">
        媒體庫
      </button>
    </div>
  )
}

export default function EndingsPage() {
  const [endings, setEndings] = useState<Ending[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pickerCb, setPickerCb] = useState<((url: string) => void) | null>(null)

  useEffect(() => {
    fetch('/api/endings').then(r => r.json()).then(({ endings: data }) => {
      if (data) setEndings(data as Ending[])
    })
  }, [])

  function updateEnding(type: Ending['type'], key: string, val: string | number) {
    setEndings(endings.map(e => e.type === type ? { ...e, [key]: val } : e))
  }

  function updateConfig(type: Ending['type'], key: string, val: string) {
    setEndings(endings.map(e => e.type === type ? { ...e, config: { ...e.config, [key]: val } } : e))
  }

  async function handleSave() {
    setSaving(true)
    await Promise.all(endings.map(e =>
      fetch('/api/endings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: e.id, label: e.label, score_min: e.score_min, score_max: e.score_max, config: e.config }),
      })
    ))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      {pickerCb && (
        <MediaPickerModal
          onSelect={url => { pickerCb(url); setPickerCb(null) }}
          onClose={() => setPickerCb(null)}
        />
      )}

      <div className="p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-stone-800">結局設定</h2>
            <p className="text-xs text-stone-400 mt-0.5">設定各結局的積分門檻與對應內容</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors">
            {saving ? '儲存中…' : saved ? '✓ 已儲存' : '儲存所有設定'}
          </button>
        </div>

        <div className="space-y-4">
          {ENDING_TYPES.map(({ type, label, dot }) => {
            const ending = endings.find(e => e.type === type)
            if (!ending) return null
            return (
              <div key={type} className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                  <h3 className="text-sm font-semibold text-stone-700">{label}</h3>
                </div>
                <div>
                  <label className={labelCls}>標題文字</label>
                  <input value={ending.label} onChange={e => updateEnding(type, 'label', e.target.value)} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>最低積分</label>
                    <input type="number" value={ending.score_min} onChange={e => updateEnding(type, 'score_min', Number(e.target.value))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>最高積分</label>
                    <input type="number" value={ending.score_max} onChange={e => updateEnding(type, 'score_max', Number(e.target.value))} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>結局影片 URL</label>
                  <UrlInput value={ending.config.video_url ?? ''} onChange={v => updateConfig(type, 'video_url', v)} onPick={() => setPickerCb(() => (v: string) => updateConfig(type, 'video_url', v))} />
                </div>
                <div>
                  <label className={labelCls}>結局圖片 URL</label>
                  <UrlInput value={ending.config.image_url ?? ''} onChange={v => updateConfig(type, 'image_url', v)} onPick={() => setPickerCb(() => (v: string) => updateConfig(type, 'image_url', v))} />
                </div>
                <div>
                  <label className={labelCls}>結局說明文字</label>
                  <textarea value={ending.config.description ?? ''} onChange={e => updateConfig(type, 'description', e.target.value)} className={`${inputCls} resize-none`} rows={3} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

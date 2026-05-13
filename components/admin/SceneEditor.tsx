'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MediaPickerModal from './MediaPickerModal'
import ScenePhonePreview from './ScenePhonePreview'
import type { Scene, SceneType, DialogConfig, AnimationConfig, NewspaperConfig, TextConfig, SignatureConfig, GameConfig } from '@/lib/types'

const TYPE_LABEL: Record<SceneType, string> = {
  animation: '動畫影片',
  newspaper: '報紙翻頁',
  dialog:    '對話文字',
  text:      '純文字',
  signature: '簽名互動',
  game:      '小遊戲',
  ending:    '結局',
}

// (PhonePreview moved to ScenePhonePreview.tsx)
function _unused({ scene, config }: { scene: Scene; config: Record<string, unknown> }) {
  return (
    <div className="relative mx-auto" style={{ width: 232 }}>
      <div className="relative bg-stone-800 rounded-[2.2rem] p-2.5 shadow-2xl" style={{ aspectRatio: '9/19' }}>
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-stone-600 rounded-full z-10" />
        <div className="w-full h-full bg-black rounded-[1.6rem] overflow-hidden relative">
          <PreviewContent scene={scene} config={config} />
        </div>
      </div>
    </div>
  )
}

function PreviewContent({ scene, config }: { scene: Scene; config: Record<string, unknown> }) {
  switch (scene.type) {
    case 'dialog': {
      const c = config as unknown as DialogConfig
      const first = c.dialogs?.[0]
      const hasChar = !!first?.character_image_url
      return (
        <div
          className="w-full h-full flex flex-col text-white"
          style={c.background_url
            ? { backgroundImage: `url(${c.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: 'linear-gradient(160deg,#1c1917,#292524)' }
          }
        >
          {hasChar ? (
            <>
              <div className="flex-1 relative overflow-hidden">
                <img src={first!.character_image_url!} alt="" className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 via-transparent to-transparent" />
                {first?.speaker && (
                  <div className="absolute bottom-0 left-0 right-0 bg-stone-900/85 py-1 px-2">
                    <span className="text-[8px] font-semibold text-white">{first.speaker}</span>
                  </div>
                )}
              </div>
              <div className="bg-stone-900/95 p-2 border-t border-white/10">
                <p className="text-[9px] leading-relaxed text-white/80 line-clamp-3">{first?.text || <span className="text-white/25 italic">尚未新增對話…</span>}</p>
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full justify-end">
              <div className="bg-black/75 p-2.5 border-t border-white/10">
                {first?.speaker && <p className="text-[7px] text-amber-400 mb-1">{first.speaker}</p>}
                <p className="text-[9px] text-white/80">{first?.text || <span className="text-white/25 italic">尚未新增對話…</span>}</p>
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
        <div className="w-full h-full relative flex items-center justify-center p-3"
          style={c.background_url
            ? { backgroundImage: `url(${c.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: '#1c1917' }
          }
        >
          {c.background_url && <div className="absolute inset-0 bg-black" style={{ opacity }} />}
          <p className="relative text-center text-white text-[10px] leading-relaxed">
            {c.text || <span className="text-white/30 italic">尚未輸入文字…</span>}
          </p>
        </div>
      )
    }
    case 'animation': {
      const c = config as unknown as AnimationConfig
      return (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-2">
          {c.video_url
            ? <video src={c.video_url} className="w-full h-full object-contain" />
            : <p className="text-white/30 text-[9px]">影片 URL 未設定</p>
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
          </div>
        </div>
      )
    }
    case 'signature':
      return (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center p-3 gap-2">
          <p className="text-[8px] text-white/50">{(config as unknown as SignatureConfig).instruction || '請在此簽署您的名字'}</p>
          <div className="border border-white/20 rounded bg-white w-full h-10" />
        </div>
      )
    case 'game': {
      const c = config as unknown as GameConfig
      return (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-2 p-3">
          <p className="text-white text-[10px] font-bold">{c.title || scene.title}</p>
          <p className="text-white/20 text-[7px]">遊戲開發中</p>
        </div>
      )
    }
    default:
      return <div className="w-full h-full bg-black flex items-center justify-center"><p className="text-white/30 text-[9px]">結局場景</p></div>
  }
}

// ── 共用 UI ───────────────────────────────────────────────────────
const inputCls = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 bg-white'
const labelCls = 'block text-xs font-medium text-stone-600 mb-1.5'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}{hint && <span className="ml-1.5 font-normal text-stone-400">{hint}</span>}</label>
      {children}
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <div onClick={() => onChange(!value)} className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${value ? 'bg-stone-800' : 'bg-stone-200'}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-sm text-stone-600">{label}</span>
    </label>
  )
}

function UrlInput({ value, onChange, placeholder, onPickMedia }: {
  value: string; onChange: (v: string) => void; placeholder?: string; onPickMedia: () => void
}) {
  return (
    <div className="flex gap-1.5">
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? 'https://...'} className={`${inputCls} flex-1`} />
      <button type="button" onClick={onPickMedia} className="flex-shrink-0 border border-stone-200 rounded-lg px-2.5 text-xs text-stone-400 hover:text-stone-700 hover:border-stone-400 hover:bg-stone-50 transition-colors whitespace-nowrap">
        媒體庫
      </button>
    </div>
  )
}

type FormProps = {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
  onPickMedia: (cb: (url: string) => void) => void
}

// ── 各類型表單 ────────────────────────────────────────────────────
function TextForm({ config, onChange, onPickMedia }: FormProps) {
  const c = config as unknown as TextConfig
  return (
    <div className="space-y-4">
      <Field label="文字內容">
        <textarea
          value={c.text ?? ''}
          onChange={e => onChange({ ...config, text: e.target.value })}
          className={`${inputCls} resize-none`}
          rows={5}
          placeholder="輸入要顯示的文字內容…"
        />
      </Field>
      <Field label="背景圖片 URL" hint="選填">
        <UrlInput
          value={c.background_url ?? ''}
          onChange={v => onChange({ ...config, background_url: v })}
          onPickMedia={() => onPickMedia(v => onChange({ ...config, background_url: v }))}
        />
      </Field>
      {c.background_url && (
        <Field label={`圖片暗化程度：${c.overlay_opacity ?? 50}%`}>
          <input
            type="range" min={0} max={90} step={5}
            value={c.overlay_opacity ?? 50}
            onChange={e => onChange({ ...config, overlay_opacity: Number(e.target.value) })}
            className="w-full accent-stone-700"
          />
          <div className="flex justify-between text-xs text-stone-400 mt-1">
            <span>原圖</span><span>全黑</span>
          </div>
        </Field>
      )}
    </div>
  )
}

function DialogForm({ config, onChange, onPickMedia }: FormProps) {
  const dialogs = (config.dialogs as Array<Record<string, unknown>>) ?? []

  function updateDialog(i: number, key: string, val: string) {
    const next = dialogs.map((d, idx) => idx === i ? { ...d, [key]: val } : d)
    onChange({ ...config, dialogs: next })
  }

  function addDialog() {
    onChange({ ...config, dialogs: [...dialogs, { speaker: '', text: '', avatar_url: '', character_image_url: '' }] })
  }

  return (
    <div className="space-y-4">
      <Field label="背景圖片 URL" hint="選填">
        <UrlInput
          value={(config.background_url as string) ?? ''}
          onChange={v => onChange({ ...config, background_url: v })}
          onPickMedia={() => onPickMedia(v => onChange({ ...config, background_url: v }))}
        />
      </Field>
      <div className="space-y-3">
        {dialogs.map((d, i) => (
          <div key={i} className="border border-stone-100 rounded-xl p-3 bg-stone-50 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-stone-500">對話 {i + 1}</span>
              <button onClick={() => onChange({ ...config, dialogs: dialogs.filter((_, idx) => idx !== i) })} className="text-xs text-stone-300 hover:text-red-400 transition-colors">刪除</button>
            </div>
            <Field label="角色立繪 URL" hint="全身圖，顯示在畫面上方">
              <UrlInput value={(d.character_image_url as string) ?? ''} onChange={v => updateDialog(i, 'character_image_url', v)} onPickMedia={() => onPickMedia(v => updateDialog(i, 'character_image_url', v))} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="角色名稱">
                <input value={(d.speaker as string) ?? ''} onChange={e => updateDialog(i, 'speaker', e.target.value)} className={inputCls} placeholder="例：茅以升" />
              </Field>
              <Field label="頭像 URL" hint="選填">
                <UrlInput value={(d.avatar_url as string) ?? ''} onChange={v => updateDialog(i, 'avatar_url', v)} onPickMedia={() => onPickMedia(v => updateDialog(i, 'avatar_url', v))} />
              </Field>
            </div>
            <Field label="台詞">
              <textarea value={(d.text as string) ?? ''} onChange={e => updateDialog(i, 'text', e.target.value)} className={`${inputCls} resize-none`} rows={2} placeholder="輸入台詞內容…" />
            </Field>
          </div>
        ))}
      </div>
      <button onClick={addDialog} className="w-full border border-dashed border-stone-300 hover:border-stone-500 text-stone-400 hover:text-stone-600 text-sm py-2.5 rounded-xl transition-colors">
        + 新增對話
      </button>
    </div>
  )
}

function AnimationForm({ config, onChange, onPickMedia }: FormProps) {
  return (
    <div className="space-y-4">
      <Field label="影片 URL">
        <UrlInput value={(config.video_url as string) ?? ''} onChange={v => onChange({ ...config, video_url: v })} onPickMedia={() => onPickMedia(v => onChange({ ...config, video_url: v }))} />
      </Field>
      <div className="space-y-2">
        <Toggle label="自動播放" value={!!(config.autoplay ?? true)} onChange={v => onChange({ ...config, autoplay: v })} />
        <Toggle label="播完自動跳下一場景" value={!!(config.auto_advance ?? true)} onChange={v => onChange({ ...config, auto_advance: v })} />
        <Toggle label="循環播放" value={!!(config.loop)} onChange={v => onChange({ ...config, loop: v })} />
      </div>
    </div>
  )
}

function NewspaperForm({ config, onChange, onPickMedia }: FormProps) {
  const pages = (config.pages as Array<Record<string, unknown>>) ?? []

  function updatePage(i: number, key: string, val: string | number) {
    const next = pages.map((p, idx) => idx === i ? { ...p, [key]: val } : p)
    onChange({ ...config, pages: next })
  }

  return (
    <div className="space-y-3">
      {pages.map((page, i) => (
        <div key={i} className="border border-stone-100 rounded-xl p-3 bg-stone-50 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-stone-500">第 {i + 1} 頁</span>
            <button onClick={() => onChange({ ...config, pages: pages.filter((_, idx) => idx !== i) })} className="text-xs text-stone-300 hover:text-red-400">刪除</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="年份"><input type="number" value={(page.year as number) ?? ''} onChange={e => updatePage(i, 'year', Number(e.target.value))} className={inputCls} /></Field>
            <Field label="圖片 URL">
              <UrlInput value={(page.image_url as string) ?? ''} onChange={v => updatePage(i, 'image_url', v)} onPickMedia={() => onPickMedia(v => updatePage(i, 'image_url', v))} />
            </Field>
          </div>
          <Field label="標題"><input value={(page.headline as string) ?? ''} onChange={e => updatePage(i, 'headline', e.target.value)} className={inputCls} /></Field>
          <Field label="副文字" hint="選填"><input value={(page.subtext as string) ?? ''} onChange={e => updatePage(i, 'subtext', e.target.value)} className={inputCls} /></Field>
        </div>
      ))}
      <button onClick={() => onChange({ ...config, pages: [...pages, { year: 2000, image_url: '', headline: '', subtext: '' }] })} className="w-full border border-dashed border-stone-300 hover:border-stone-500 text-stone-400 hover:text-stone-600 text-sm py-2.5 rounded-xl transition-colors">
        + 新增頁面
      </button>
    </div>
  )
}

function SignatureForm({ config, onChange, onPickMedia }: FormProps) {
  return (
    <div className="space-y-4">
      <Field label="協議文件圖片 URL">
        <UrlInput value={(config.document_url as string) ?? ''} onChange={v => onChange({ ...config, document_url: v })} onPickMedia={() => onPickMedia(v => onChange({ ...config, document_url: v }))} />
      </Field>
      <Field label="說明文字">
        <input value={(config.instruction as string) ?? ''} onChange={e => onChange({ ...config, instruction: e.target.value })} className={inputCls} placeholder="請在此簽署您的名字" />
      </Field>
    </div>
  )
}

function GameForm({ config, onChange, onPickMedia: _onPickMedia }: FormProps) {
  return (
    <div className="space-y-4">
      <Field label="遊戲 ID"><input value={(config.game_id as string) ?? ''} onChange={e => onChange({ ...config, game_id: e.target.value })} className={inputCls} placeholder="game-01" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="最高分數"><input type="number" value={(config.max_score as number) ?? 100} onChange={e => onChange({ ...config, max_score: Number(e.target.value) })} className={inputCls} /></Field>
        <Field label="時間限制（秒）"><input type="number" value={(config.time_limit as number) ?? 60} onChange={e => onChange({ ...config, time_limit: Number(e.target.value) })} className={inputCls} /></Field>
      </div>
      <Field label="遊戲說明">
        <textarea value={(config.description as string) ?? ''} onChange={e => onChange({ ...config, description: e.target.value })} className={`${inputCls} resize-none`} rows={3} />
      </Field>
    </div>
  )
}

const CONFIG_FORM: Record<SceneType, React.FC<FormProps>> = {
  animation: AnimationForm,
  newspaper: NewspaperForm,
  dialog:    DialogForm,
  text:      TextForm,
  signature: SignatureForm,
  game:      GameForm,
  ending:    (_: FormProps) => <p className="text-sm text-stone-400">此場景會依積分跳轉結局，請至「結局設定」配置分數門檻。</p>,
}

// ── 主元件 ────────────────────────────────────────────────────────
export default function SceneEditor({ scene }: { scene: Scene }) {
  const router = useRouter()
  const [title, setTitle] = useState(scene.title)
  const [visible, setVisible] = useState(scene.visible)
  const [config, setConfig] = useState<Record<string, unknown>>(scene.config as Record<string, unknown>)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pickerCb, setPickerCb] = useState<((url: string) => void) | null>(null)

  const ConfigForm = CONFIG_FORM[scene.type]

  function openMediaPicker(cb: (url: string) => void) {
    setPickerCb(() => cb)
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('scenes').update({ title, visible, config, updated_at: new Date().toISOString() }).eq('id', scene.id)
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

      <div className="flex h-full">
        {/* 左側：手機預覽 */}
        <div className="w-68 flex-shrink-0 bg-stone-100 border-r border-stone-200 flex flex-col items-center justify-center p-6 gap-3" style={{ width: 272 }}>
          <p className="text-[11px] text-stone-400 font-medium tracking-widest uppercase">預覽</p>
          <ScenePhonePreview scene={{ ...scene, title, config, visible }} />
          <p className="text-[10px] text-stone-300">即時反映</p>
        </div>

        {/* 右側：編輯面板 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin/scenes')} className="text-stone-400 hover:text-stone-700 text-sm transition-colors">← 返回</button>
              <span className="text-stone-200">/</span>
              <span className="text-sm font-medium text-stone-700">{title}</span>
              <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">{TYPE_LABEL[scene.type]}</span>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
            >
              {saving ? '儲存中…' : saved ? '✓ 已儲存' : '儲存'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest">基本設定</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="場景名稱">
                  <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
                </Field>
                <Field label="類型">
                  <div className="border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-400 bg-stone-50">{TYPE_LABEL[scene.type]}（不可修改）</div>
                </Field>
              </div>
              <Toggle label="在體驗中顯示此場景" value={visible} onChange={setVisible} />
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest">內容設定</h3>
              <ConfigForm config={config} onChange={setConfig} onPickMedia={openMediaPicker} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

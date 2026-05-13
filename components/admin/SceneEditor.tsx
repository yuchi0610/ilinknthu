'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Scene, SceneType, DialogConfig, AnimationConfig, NewspaperConfig, SignatureConfig, GameConfig } from '@/lib/types'

const TYPE_LABEL: Record<SceneType, string> = {
  animation: '動畫影片',
  newspaper: '報紙翻頁',
  dialog:    '對話文字',
  signature: '簽名互動',
  game:      '小遊戲',
  ending:    '結局',
}

// ── 手機預覽 ──────────────────────────────────────────────────────
function PhonePreview({ scene, config }: { scene: Scene; config: Record<string, unknown> }) {
  return (
    <div className="relative mx-auto" style={{ width: 260 }}>
      {/* 手機外框 */}
      <div className="relative bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl" style={{ aspectRatio: '9/19' }}>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-slate-700 rounded-full z-10" />
        <div className="w-full h-full bg-black rounded-[1.8rem] overflow-hidden relative">
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
      return (
        <div
          className="w-full h-full flex flex-col justify-end text-white"
          style={c.background_url
            ? { backgroundImage: `url(${c.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: 'linear-gradient(to bottom, #1e1b4b, #312e81)' }
          }
        >
          <div className="bg-black/75 backdrop-blur p-3 border-t border-white/10">
            {first?.speaker && (
              <div className="flex items-center gap-1.5 mb-1.5">
                {first.avatar_url && <img src={first.avatar_url} className="w-5 h-5 rounded-full object-cover" alt="" />}
                <span className="text-[9px] text-yellow-400 font-medium">{first.speaker}</span>
              </div>
            )}
            <p className="text-[10px] leading-relaxed text-white/90">
              {first?.text || <span className="text-white/30 italic">尚未新增對話…</span>}
            </p>
            <p className="text-[8px] text-white/25 mt-2 text-right">點擊繼續</p>
          </div>
        </div>
      )
    }
    case 'animation': {
      const c = config as unknown as AnimationConfig
      return (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-2">
          {c.video_url
            ? <video src={c.video_url} className="w-full h-full object-contain" />
            : <>
                <span className="text-3xl">▶</span>
                <p className="text-white/40 text-[10px]">影片 URL 未設定</p>
              </>
          }
        </div>
      )
    }
    case 'newspaper': {
      const c = config as unknown as NewspaperConfig
      const page = c.pages?.[0]
      return (
        <div className="w-full h-full bg-zinc-100 text-zinc-900 flex flex-col">
          <div className="border-b border-zinc-300 text-center py-1.5">
            <p className="text-[8px] tracking-widest text-zinc-400">{page?.year ?? 'XXXX'} 年</p>
          </div>
          {page?.image_url && <img src={page.image_url} className="w-full h-20 object-cover" alt="" />}
          <div className="p-2 flex-1">
            <p className="text-[10px] font-bold leading-tight">{page?.headline || <span className="text-zinc-300">標題未設定</span>}</p>
            {page?.subtext && <p className="text-[8px] text-zinc-500 mt-1 leading-relaxed">{page.subtext}</p>}
          </div>
        </div>
      )
    }
    case 'signature': {
      const c = config as unknown as SignatureConfig
      return (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center p-3 gap-2">
          {c.document_url && <img src={c.document_url} className="w-full rounded" alt="" />}
          <p className="text-[9px] text-white/50">{c.instruction || '請在此簽署您的名字'}</p>
          <div className="border border-white/20 rounded bg-white w-full h-10" />
        </div>
      )
    }
    case 'game': {
      const c = config as unknown as GameConfig
      return (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-2 p-3">
          <p className="text-white text-[11px] font-bold">{c.title || scene.title}</p>
          {c.description && <p className="text-white/50 text-[9px] text-center">{c.description}</p>}
          <p className="text-white/20 text-[8px]">遊戲開發中</p>
        </div>
      )
    }
    default:
      return (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <p className="text-white/30 text-[10px]">結局場景</p>
        </div>
      )
  }
}

// ── 共用 UI ───────────────────────────────────────────────────────
const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white'
const labelCls = 'block text-xs font-medium text-slate-600 mb-1.5'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {hint && <span className="ml-1.5 font-normal text-slate-400">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <div
        onClick={() => onChange(!value)}
        className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${value ? 'bg-indigo-500' : 'bg-slate-200'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-sm text-slate-600">{label}</span>
    </label>
  )
}

// ── 各類型表單 ────────────────────────────────────────────────────
function DialogForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const dialogs = (config.dialogs as Array<Record<string, unknown>>) ?? []

  function updateDialog(i: number, key: string, val: string) {
    const next = dialogs.map((d, idx) => idx === i ? { ...d, [key]: val } : d)
    onChange({ ...config, dialogs: next })
  }

  function addDialog() {
    onChange({ ...config, dialogs: [...dialogs, { speaker: '', text: '', avatar_url: '' }] })
  }

  function removeDialog(i: number) {
    onChange({ ...config, dialogs: dialogs.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      <Field label="背景圖片 URL" hint="選填">
        <input value={(config.background_url as string) ?? ''} onChange={e => onChange({ ...config, background_url: e.target.value })} className={inputCls} placeholder="https://..." />
      </Field>
      <div className="space-y-3">
        {dialogs.map((d, i) => (
          <div key={i} className="border border-slate-100 rounded-xl p-3 bg-slate-50 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500">對話 {i + 1}</span>
              <button onClick={() => removeDialog(i)} className="text-xs text-slate-300 hover:text-red-400 transition-colors">刪除</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="說話者">
                <input value={(d.speaker as string) ?? ''} onChange={e => updateDialog(i, 'speaker', e.target.value)} className={inputCls} placeholder="角色名稱" />
              </Field>
              <Field label="頭像 URL" hint="選填">
                <input value={(d.avatar_url as string) ?? ''} onChange={e => updateDialog(i, 'avatar_url', e.target.value)} className={inputCls} placeholder="https://..." />
              </Field>
            </div>
            <Field label="台詞">
              <textarea
                value={(d.text as string) ?? ''}
                onChange={e => updateDialog(i, 'text', e.target.value)}
                className={`${inputCls} resize-none`}
                rows={2}
                placeholder="輸入台詞內容…"
              />
            </Field>
          </div>
        ))}
      </div>
      <button
        onClick={addDialog}
        className="w-full border border-dashed border-slate-300 hover:border-indigo-400 text-slate-400 hover:text-indigo-500 text-sm py-2.5 rounded-xl transition-colors"
      >
        + 新增對話
      </button>
    </div>
  )
}

function AnimationForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="影片 URL" hint="Supabase Storage 或外部連結">
        <input value={(config.video_url as string) ?? ''} onChange={e => onChange({ ...config, video_url: e.target.value })} className={inputCls} placeholder="https://..." />
      </Field>
      <div className="space-y-2">
        <Toggle label="自動播放" value={!!(config.autoplay ?? true)} onChange={v => onChange({ ...config, autoplay: v })} />
        <Toggle label="播完自動跳下一場景" value={!!(config.auto_advance ?? true)} onChange={v => onChange({ ...config, auto_advance: v })} />
        <Toggle label="循環播放" value={!!(config.loop)} onChange={v => onChange({ ...config, loop: v })} />
      </div>
    </div>
  )
}

function NewspaperForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const pages = (config.pages as Array<Record<string, unknown>>) ?? []

  function updatePage(i: number, key: string, val: string | number) {
    const next = pages.map((p, idx) => idx === i ? { ...p, [key]: val } : p)
    onChange({ ...config, pages: next })
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">使用者往前滑時從第一頁翻到最後一頁</p>
      {pages.map((page, i) => (
        <div key={i} className="border border-slate-100 rounded-xl p-3 bg-slate-50 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500">第 {i + 1} 頁</span>
            <button
              onClick={() => onChange({ ...config, pages: pages.filter((_, idx) => idx !== i) })}
              className="text-xs text-slate-300 hover:text-red-400"
            >刪除</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="年份"><input type="number" value={(page.year as number) ?? ''} onChange={e => updatePage(i, 'year', Number(e.target.value))} className={inputCls} /></Field>
            <Field label="圖片 URL"><input value={(page.image_url as string) ?? ''} onChange={e => updatePage(i, 'image_url', e.target.value)} className={inputCls} placeholder="https://..." /></Field>
          </div>
          <Field label="標題"><input value={(page.headline as string) ?? ''} onChange={e => updatePage(i, 'headline', e.target.value)} className={inputCls} /></Field>
          <Field label="副文字" hint="選填"><input value={(page.subtext as string) ?? ''} onChange={e => updatePage(i, 'subtext', e.target.value)} className={inputCls} /></Field>
        </div>
      ))}
      <button
        onClick={() => onChange({ ...config, pages: [...pages, { year: 2000, image_url: '', headline: '', subtext: '' }] })}
        className="w-full border border-dashed border-slate-300 hover:border-indigo-400 text-slate-400 hover:text-indigo-500 text-sm py-2.5 rounded-xl transition-colors"
      >
        + 新增頁面
      </button>
    </div>
  )
}

function SignatureForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="協議文件圖片 URL">
        <input value={(config.document_url as string) ?? ''} onChange={e => onChange({ ...config, document_url: e.target.value })} className={inputCls} placeholder="https://..." />
      </Field>
      <Field label="說明文字">
        <input value={(config.instruction as string) ?? ''} onChange={e => onChange({ ...config, instruction: e.target.value })} className={inputCls} placeholder="請在此簽署您的名字" />
      </Field>
    </div>
  )
}

function GameForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
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

const CONFIG_FORM: Record<SceneType, React.FC<{ config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }>> = {
  animation: AnimationForm,
  newspaper: NewspaperForm,
  dialog:    DialogForm,
  signature: SignatureForm,
  game:      GameForm,
  ending:    () => <p className="text-sm text-slate-400">此場景會依積分跳轉結局，請至「結局設定」配置分數門檻。</p>,
}

// ── 主元件 ────────────────────────────────────────────────────────
export default function SceneEditor({ scene }: { scene: Scene }) {
  const router = useRouter()
  const [title, setTitle] = useState(scene.title)
  const [visible, setVisible] = useState(scene.visible)
  const [config, setConfig] = useState<Record<string, unknown>>(scene.config as Record<string, unknown>)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const ConfigForm = CONFIG_FORM[scene.type]

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('scenes').update({ title, visible, config, updated_at: new Date().toISOString() }).eq('id', scene.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex h-full">
      {/* 左側：手機預覽 */}
      <div className="w-80 flex-shrink-0 bg-slate-100 border-r border-slate-200 flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-xs text-slate-400 font-medium tracking-wide">即時預覽</p>
        <PhonePreview scene={{ ...scene, title, config, visible }} config={config} />
        <p className="text-xs text-slate-300 text-center">內容即時更新</p>
      </div>

      {/* 右側：編輯面板 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 頂部 Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/scenes')}
              className="text-slate-400 hover:text-slate-700 text-sm transition-colors"
            >
              ← 返回
            </button>
            <span className="text-slate-200">/</span>
            <span className="text-sm font-medium text-slate-700">{title}</span>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{TYPE_LABEL[scene.type]}</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
          >
            {saving ? '儲存中…' : saved ? '✓ 已儲存' : '儲存'}
          </button>
        </div>

        {/* 內容區域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 基本設定 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">基本設定</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="場景名稱">
                <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
              </Field>
              <Field label="類型">
                <div className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-400 bg-slate-50">
                  {TYPE_LABEL[scene.type]}（不可修改）
                </div>
              </Field>
            </div>
            <Toggle label="在體驗中顯示此場景" value={visible} onChange={setVisible} />
          </div>

          {/* 內容設定 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">內容設定</h3>
            <ConfigForm config={config} onChange={setConfig} />
          </div>
        </div>
      </div>
    </div>
  )
}

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

function MediaButton({ value, onChange, onPickMedia }: {
  value: string; onChange: (v: string) => void; onPickMedia: () => void
}) {
  const isVideo = /\.(mp4|webm|mov|avi)(\?|$)/i.test(value)
  if (!value) {
    return (
      <button
        type="button"
        onClick={onPickMedia}
        className="w-full border border-dashed border-stone-300 hover:border-stone-500 text-stone-400 hover:text-stone-600 text-sm py-3 rounded-lg transition-colors"
      >
        選擇媒體庫
      </button>
    )
  }
  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden">
      <div className="relative h-24 bg-stone-100">
        {isVideo
          ? <video src={value} className="w-full h-full object-cover" muted />
          : <img src={value} className="w-full h-full object-cover" alt="" />
        }
      </div>
      <div className="flex gap-3 px-3 py-1.5 bg-stone-50 border-t border-stone-100">
        <button type="button" onClick={onPickMedia} className="text-xs text-stone-500 hover:text-stone-800 transition-colors">更換</button>
        <span className="text-stone-200 text-xs">|</span>
        <button type="button" onClick={() => onChange('')} className="text-xs text-stone-400 hover:text-red-500 transition-colors">清除</button>
      </div>
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

      <div className="grid grid-cols-2 gap-3">
        <Field label="字體大小（px）">
          <input type="number" min={10} max={48} value={c.font_size ?? 16}
            onChange={e => onChange({ ...config, font_size: Number(e.target.value) })}
            className={inputCls} />
        </Field>
        <Field label="文字顏色">
          <div className="flex items-center gap-2">
            <input type="color" value={c.text_color ?? '#ffffff'}
              onChange={e => onChange({ ...config, text_color: e.target.value })}
              className="w-10 h-9 rounded border border-stone-200 cursor-pointer flex-shrink-0" />
            <span className="text-xs text-stone-400 font-mono">{c.text_color ?? '#ffffff'}</span>
          </div>
        </Field>
      </div>

      <Field label="背景圖片" hint="選填">
        <MediaButton value={c.background_url ?? ''} onChange={v => onChange({ ...config, background_url: v })} onPickMedia={() => onPickMedia(v => onChange({ ...config, background_url: v }))} />
      </Field>
      {c.background_url && (
        <Field label={`圖片暗化程度：${c.overlay_opacity ?? 50}%`}>
          <input
            type="range" min={0} max={90} step={5}
            value={c.overlay_opacity ?? 50}
            onChange={e => onChange({ ...config, overlay_opacity: Number(e.target.value) })}
            className="w-full accent-stone-700"
          />
          <div className="flex justify-between text-xs text-stone-400 mt-1"><span>原圖</span><span>全黑</span></div>
        </Field>
      )}
    </div>
  )
}

function DialogForm({ config, onChange, onPickMedia }: FormProps) {
  const c = config as unknown as DialogConfig
  const dialogs = c.dialogs ?? []

  function updateDialog(i: number, key: string, val: unknown) {
    const next = dialogs.map((d, idx) => idx === i ? { ...d, [key]: val } : d)
    onChange({ ...config, dialogs: next })
  }

  function addDialog() {
    onChange({ ...config, dialogs: [...dialogs, { speaker: '', text: '', character_image_url: '' }] })
  }

  const boxTheme = c.box_theme ?? 'dark'

  return (
    <div className="space-y-4">
      <Field label="背景圖片" hint="選填">
        <MediaButton value={c.background_url ?? ''} onChange={v => onChange({ ...config, background_url: v })} onPickMedia={() => onPickMedia(v => onChange({ ...config, background_url: v }))} />
      </Field>

      {/* 對話框樣式 */}
      <div className="border border-stone-100 rounded-xl p-4 bg-stone-50 space-y-3">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">對話框樣式</p>

        <div className="flex gap-2">
          <button onClick={() => onChange({ ...config, box_theme: 'dark' })}
            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${boxTheme === 'dark' ? 'bg-stone-800 text-white border-stone-800' : 'border-stone-200 text-stone-500 hover:border-stone-400'}`}>
            黑底
          </button>
          <button onClick={() => onChange({ ...config, box_theme: 'light' })}
            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${boxTheme === 'light' ? 'bg-white text-stone-800 border-stone-800 shadow-sm' : 'border-stone-200 text-stone-500 hover:border-stone-400'}`}>
            白底
          </button>
        </div>

        <Field label={`對話框高度：${c.box_height ?? 38}%`}>
          <input type="range" min={25} max={60} step={1} value={c.box_height ?? 38}
            onChange={e => onChange({ ...config, box_height: Number(e.target.value) })}
            className="w-full accent-stone-700" />
          <div className="flex justify-between text-xs text-stone-400 mt-1"><span>小</span><span>大</span></div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="名稱大小（px）">
            <input type="number" min={10} max={28} value={c.name_font_size ?? 14}
              onChange={e => onChange({ ...config, name_font_size: Number(e.target.value) })}
              className={inputCls} />
          </Field>
          <Field label="名稱顏色">
            <div className="flex items-center gap-2">
              <input type="color" value={c.name_color ?? '#ffffff'}
                onChange={e => onChange({ ...config, name_color: e.target.value })}
                className="w-10 h-9 rounded border border-stone-200 cursor-pointer flex-shrink-0" />
              <span className="text-xs text-stone-400 font-mono">{c.name_color ?? '#ffffff'}</span>
            </div>
          </Field>
          <Field label="台詞大小（px）">
            <input type="number" min={10} max={28} value={c.text_font_size ?? 14}
              onChange={e => onChange({ ...config, text_font_size: Number(e.target.value) })}
              className={inputCls} />
          </Field>
          <Field label="台詞顏色">
            <div className="flex items-center gap-2">
              <input type="color" value={c.text_color ?? (boxTheme === 'light' ? '#1c1917' : '#ffffff')}
                onChange={e => onChange({ ...config, text_color: e.target.value })}
                className="w-10 h-9 rounded border border-stone-200 cursor-pointer flex-shrink-0" />
              <span className="text-xs text-stone-400 font-mono">{c.text_color ?? (boxTheme === 'light' ? '#1c1917' : '#ffffff')}</span>
            </div>
          </Field>
        </div>
      </div>

      {/* 對話列表 */}
      <div className="space-y-3">
        {dialogs.map((d, i) => (
          <div key={i} className="border border-stone-100 rounded-xl p-3 bg-stone-50 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-stone-500">對話 {i + 1}</span>
              <button onClick={() => onChange({ ...config, dialogs: dialogs.filter((_, idx) => idx !== i) })}
                className="text-xs text-stone-300 hover:text-red-400 transition-colors">刪除</button>
            </div>

            <Field label="角色立繪" hint="選填">
              <MediaButton
                value={(d.character_image_url as string) ?? ''}
                onChange={v => updateDialog(i, 'character_image_url', v)}
                onPickMedia={() => onPickMedia(v => updateDialog(i, 'character_image_url', v))}
              />
            </Field>

            {d.character_image_url && (
              <div className="space-y-2 pt-1">
                <Field label={`水平位置：${d.character_x ?? 50}%`}>
                  <input type="range" min={0} max={100} step={1}
                    value={(d.character_x as number) ?? 50}
                    onChange={e => updateDialog(i, 'character_x', Number(e.target.value))}
                    className="w-full accent-stone-700" />
                  <div className="flex justify-between text-xs text-stone-400 mt-0.5"><span>靠左</span><span>置中</span><span>靠右</span></div>
                </Field>
                <Field label={`縮放大小：${d.character_scale ?? 100}%`}>
                  <input type="range" min={50} max={200} step={5}
                    value={(d.character_scale as number) ?? 100}
                    onChange={e => updateDialog(i, 'character_scale', Number(e.target.value))}
                    className="w-full accent-stone-700" />
                  <div className="flex justify-between text-xs text-stone-400 mt-0.5"><span>縮小</span><span>原尺寸</span><span>放大</span></div>
                </Field>
              </div>
            )}

            <Field label="角色名稱">
              <input value={(d.speaker as string) ?? ''} onChange={e => updateDialog(i, 'speaker', e.target.value)} className={inputCls} placeholder="例：茅以升" />
            </Field>
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
      <Field label="影片">
        <MediaButton value={(config.video_url as string) ?? ''} onChange={v => onChange({ ...config, video_url: v })} onPickMedia={() => onPickMedia(v => onChange({ ...config, video_url: v }))} />
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

  function updatePage(i: number, key: string, val: unknown) {
    const next = pages.map((p, idx) => idx === i ? { ...p, [key]: val } : p)
    onChange({ ...config, pages: next })
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-stone-400">每頁放一張圖片，左滑翻頁。</p>
      {pages.map((page, i) => (
        <div key={i} className="border border-stone-100 rounded-xl p-3 bg-stone-50 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-stone-500">第 {i + 1} 頁</span>
            <button onClick={() => onChange({ ...config, pages: pages.filter((_, idx) => idx !== i) })} className="text-xs text-stone-300 hover:text-red-400">刪除</button>
          </div>
          <Field label="圖片">
            <MediaButton value={(page.image_url as string) ?? ''} onChange={v => updatePage(i, 'image_url', v)} onPickMedia={() => onPickMedia(v => updatePage(i, 'image_url', v))} />
          </Field>
        </div>
      ))}
      <button
        onClick={() => onChange({ ...config, pages: [...pages, { image_url: '' }] })}
        className="w-full border border-dashed border-stone-300 hover:border-stone-500 text-stone-400 hover:text-stone-600 text-sm py-2.5 rounded-xl transition-colors"
      >
        + 新增頁面
      </button>
    </div>
  )
}

function SignatureForm({ config, onChange, onPickMedia }: FormProps) {
  return (
    <div className="space-y-4">
      <Field label="背景圖片" hint="選填">
        <MediaButton value={(config.background_url as string) ?? ''} onChange={v => onChange({ ...config, background_url: v })} onPickMedia={() => onPickMedia(v => onChange({ ...config, background_url: v }))} />
      </Field>
      <Field label="說明文字">
        <input value={(config.instruction as string) ?? ''} onChange={e => onChange({ ...config, instruction: e.target.value })} className={inputCls} placeholder="請在畫面上簽署您的名字" />
      </Field>
    </div>
  )
}

function GameForm({ config, onChange }: FormProps) {
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
  ending:    () => <p className="text-sm text-stone-400">此場景會依積分跳轉結局，請至「結局設定」配置分數門檻。</p>,
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
        <div className="flex-shrink-0 bg-stone-100 border-r border-stone-200 flex flex-col items-center justify-center p-6 gap-3" style={{ width: 272 }}>
          <p className="text-[11px] text-stone-400 font-medium tracking-widest uppercase">預覽</p>
          <ScenePhonePreview scene={{ ...scene, title, config, visible }} interactive />
          <p className="text-[10px] text-stone-300">即時反映・可互動</p>
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

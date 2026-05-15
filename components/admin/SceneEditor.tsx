'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MediaPickerModal from './MediaPickerModal'
import ScenePhonePreview from './ScenePhonePreview'
import type { Scene, SceneType, DialogConfig, AnimationConfig, NewspaperConfig, TextConfig, SignatureConfig, GameConfig } from '@/lib/types'

const TYPE_LABEL: Record<SceneType, string> = {
  animation: '影片',
  newspaper: '翻頁',
  dialog:    '對話',
  text:      '文字/圖片',
  signature: '簽名',
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

function ImageAdjust({ config, onChange, prefix = 'background' }: {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
  prefix?: 'background' | 'image'
}) {
  const x    = (config[`${prefix}_x`]    as number) ?? 50
  const y    = (config[`${prefix}_y`]    as number) ?? 50
  const zoom = (config[`${prefix}_zoom`] as number) ?? 100
  return (
    <div className="border border-stone-100 rounded-xl p-3 bg-stone-50 space-y-2">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">圖片調整</p>
      <Field label={`水平位置：${x}%`}>
        <input type="range" min={0} max={100} step={1} value={x}
          onChange={e => onChange({ ...config, [`${prefix}_x`]: Number(e.target.value) })}
          className="w-full accent-stone-700" />
        <div className="flex justify-between text-xs text-stone-400 mt-0.5"><span>靠左</span><span>靠右</span></div>
      </Field>
      <Field label={`垂直位置：${y}%`}>
        <input type="range" min={0} max={100} step={1} value={y}
          onChange={e => onChange({ ...config, [`${prefix}_y`]: Number(e.target.value) })}
          className="w-full accent-stone-700" />
        <div className="flex justify-between text-xs text-stone-400 mt-0.5"><span>靠上</span><span>靠下</span></div>
      </Field>
      <Field label={`縮放：${zoom}%`}>
        <input type="range" min={80} max={200} step={5} value={zoom}
          onChange={e => onChange({ ...config, [`${prefix}_zoom`]: Number(e.target.value) })}
          className="w-full accent-stone-700" />
        <div className="flex justify-between text-xs text-stone-400 mt-0.5"><span>縮小</span><span>放大</span></div>
      </Field>
    </div>
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
  onPickMedia: (cb: (url: string) => void, multi?: boolean, multiCb?: (urls: string[]) => void) => void
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
        <ImageAdjust config={config} onChange={onChange} />
      )}
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

      {/* 打字機效果 */}
      <div className="border border-stone-100 rounded-xl p-4 bg-stone-50 space-y-3">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">打字機效果</p>
        <Toggle label="啟用打字機效果" value={c.typewriter ?? true} onChange={v => onChange({ ...config, typewriter: v })} />
        {(c.typewriter ?? true) && (
          <Field label="打字速度">
            <select value={c.typewriter_speed ?? 45} onChange={e => onChange({ ...config, typewriter_speed: Number(e.target.value) })} className={inputCls}>
              <option value={120}>很慢</option>
              <option value={60}>慢</option>
              <option value={45}>中（預設）</option>
              <option value={18}>快</option>
              <option value={8}>很快</option>
            </select>
          </Field>
        )}
      </div>
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
      {c.background_url && (
        <ImageAdjust config={config} onChange={onChange} />
      )}

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

      {/* 打字機效果 */}
      <div className="border border-stone-100 rounded-xl p-4 bg-stone-50 space-y-3">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">打字機效果</p>
        <Toggle label="啟用打字機效果" value={c.typewriter ?? true} onChange={v => onChange({ ...config, typewriter: v })} />
        {(c.typewriter ?? true) && (
          <Field label="打字速度">
            <select value={c.typewriter_speed ?? 35} onChange={e => onChange({ ...config, typewriter_speed: Number(e.target.value) })} className={inputCls}>
              <option value={120}>很慢</option>
              <option value={60}>慢</option>
              <option value={35}>中（預設）</option>
              <option value={18}>快</option>
              <option value={8}>很快</option>
            </select>
          </Field>
        )}
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
                <Field label={`垂直位置：${d.character_y ?? 0}%`}>
                  <input type="range" min={-100} max={60} step={1}
                    value={(d.character_y as number) ?? 0}
                    onChange={e => updateDialog(i, 'character_y', Number(e.target.value))}
                    className="w-full accent-stone-700" />
                  <div className="flex justify-between text-xs text-stone-400 mt-0.5"><span>下移</span><span>預設</span><span>上移</span></div>
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
        <Toggle label="塞滿螢幕（裁切橫式影片）" value={(config.video_fit as string) === 'cover'} onChange={v => onChange({ ...config, video_fit: v ? 'cover' : 'contain' })} />
      </div>
    </div>
  )
}

type NItem = Record<string, unknown>

function NewspaperForm({ config, onChange, onPickMedia }: FormProps) {
  const items = (config.pages as NItem[]) ?? []

  function setItems(next: NItem[]) { onChange({ ...config, pages: next }) }
  function replaceItem(i: number, item: NItem) { setItems(items.map((x, idx) => idx === i ? item : x)) }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)) }
  function insertAt(i: number, newItems: NItem[]) {
    const next = [...items]; next.splice(i, 0, ...newItems); setItems(next)
  }

  // Insert single manual pages
  function insertPages(atIndex: number) {
    onPickMedia(
      url => insertAt(atIndex, [{ image_url: url }]),
      true,
      urls => insertAt(atIndex, urls.map(url => ({ image_url: url })))
    )
  }

  // Insert an auto-flip group
  function insertAutoGroup(atIndex: number) {
    onPickMedia(
      url => insertAt(atIndex, [{ kind: 'auto', images: [url], interval: 1800 }]),
      true,
      urls => insertAt(atIndex, [{ kind: 'auto', images: urls, interval: 1800 }])
    )
  }

  // Add more images to existing auto group
  function addImagesToAuto(i: number, item: NItem) {
    onPickMedia(
      url => replaceItem(i, { ...item, images: [...(item.images as string[]), url] }),
      true,
      urls => replaceItem(i, { ...item, images: [...(item.images as string[]), ...urls] })
    )
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-stone-400 mb-3">手動翻頁為主，可在任意位置插入自動翻頁片段。</p>

      <InsertBar onInsertPage={() => insertPages(0)} onInsertAuto={() => insertAutoGroup(0)} />

      {items.map((item, i) => (
        <div key={i}>
          {item.kind === 'auto' ? (
            // ── 自動翻頁片段 ──
            <div className="border border-amber-200 rounded-xl p-3 bg-amber-50 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-amber-700">⚡ 自動翻頁片段（{(item.images as string[]).length} 張）</span>
                <button onClick={() => removeItem(i)} className="text-xs text-stone-300 hover:text-red-400">刪除</button>
              </div>

              {/* Image strip */}
              <div className="flex gap-1.5 flex-wrap">
                {(item.images as string[]).map((url, j) => (
                  <div key={j} className="relative group w-12 h-12 rounded-lg overflow-hidden border border-amber-200">
                    <img src={url} className="w-full h-full object-cover" alt="" />
                    <button
                      onClick={() => replaceItem(i, { ...item, images: (item.images as string[]).filter((_, k) => k !== j) })}
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center text-white opacity-0 group-hover:opacity-100 text-xs"
                    >✕</button>
                  </div>
                ))}
                <button
                  onClick={() => addImagesToAuto(i, item)}
                  className="w-12 h-12 rounded-lg border border-dashed border-amber-300 hover:border-amber-500 text-amber-400 hover:text-amber-600 text-lg flex items-center justify-center transition-colors"
                >+</button>
              </div>

              <Field label={`翻頁間隔：${((item.interval as number ?? 1800) / 1000).toFixed(1)} 秒`}>
                <input
                  type="range" min={400} max={5000} step={200}
                  value={(item.interval as number) ?? 1800}
                  onChange={e => replaceItem(i, { ...item, interval: Number(e.target.value) })}
                  className="w-full accent-amber-600"
                />
              </Field>
            </div>
          ) : (
            // ── 手動翻頁 ──
            <div className="border border-stone-100 rounded-xl p-3 bg-stone-50 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-stone-500">第 {i + 1} 頁</span>
                <button onClick={() => removeItem(i)} className="text-xs text-stone-300 hover:text-red-400">刪除</button>
              </div>
              <Field label="圖片">
                <MediaButton
                  value={(item.image_url as string) ?? ''}
                  onChange={v => replaceItem(i, { ...item, image_url: v })}
                  onPickMedia={() => onPickMedia(v => replaceItem(i, { ...item, image_url: v }))}
                />
              </Field>
              {!!(item.image_url as string) && (
                <ImageAdjust config={item} onChange={p => replaceItem(i, p)} prefix="image" />
              )}
            </div>
          )}

          <InsertBar onInsertPage={() => insertPages(i + 1)} onInsertAuto={() => insertAutoGroup(i + 1)} />
        </div>
      ))}

      {items.length === 0 && (
        <div className="text-center py-8 text-stone-400 text-xs">點下方按鈕新增頁面</div>
      )}
    </div>
  )
}

function InsertBar({ onInsertPage, onInsertAuto }: { onInsertPage: () => void; onInsertAuto: () => void }) {
  return (
    <div className="flex items-center gap-1.5 py-1">
      <div className="flex-1 h-px bg-stone-100" />
      <button
        onClick={onInsertPage}
        className="text-[10px] text-stone-400 hover:text-stone-700 border border-dashed border-stone-200 hover:border-stone-400 px-2 py-0.5 rounded-full transition-colors flex-shrink-0"
      >
        + 頁面
      </button>
      <button
        onClick={onInsertAuto}
        className="text-[10px] text-amber-500 hover:text-amber-700 border border-dashed border-amber-200 hover:border-amber-400 px-2 py-0.5 rounded-full transition-colors flex-shrink-0"
      >
        ⚡ 自動翻頁
      </button>
      <div className="flex-1 h-px bg-stone-100" />
    </div>
  )
}

function SignatureForm({ config, onChange, onPickMedia }: FormProps) {
  return (
    <div className="space-y-4">
      <Field label="背景圖片" hint="選填">
        <MediaButton value={(config.background_url as string) ?? ''} onChange={v => onChange({ ...config, background_url: v })} onPickMedia={() => onPickMedia(v => onChange({ ...config, background_url: v }))} />
      </Field>
      {!!(config.background_url as string) && (
        <ImageAdjust config={config} onChange={onChange} />
      )}
      <Field label="說明文字">
        <input value={(config.instruction as string) ?? ''} onChange={e => onChange({ ...config, instruction: e.target.value })} className={inputCls} placeholder="請在畫面上簽署您的名字" />
      </Field>
    </div>
  )
}

const AVAILABLE_GAMES = [
  { id: 'oyster', label: '採收牡蠣大作戰', description: '60 秒接物遊戲，接正常牡蠣得分，避開綠牡蠣' },
]

function GameForm({ config, onChange }: FormProps) {
  const gameId = (config.game_id as string) ?? ''
  return (
    <div className="space-y-4">
      <Field label="選擇遊戲">
        <div className="space-y-2">
          {AVAILABLE_GAMES.map(g => (
            <button
              key={g.id}
              type="button"
              onClick={() => onChange({ ...config, game_id: g.id })}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                gameId === g.id
                  ? 'border-stone-800 bg-stone-50 shadow-sm'
                  : 'border-stone-200 hover:border-stone-400'
              }`}
            >
              <p className="text-sm font-semibold text-stone-800">{g.label}</p>
              <p className="text-xs text-stone-400 mt-0.5">{g.description}</p>
            </button>
          ))}
        </div>
      </Field>
      {!gameId && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">請先選擇一個遊戲</p>
      )}
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
  const [pickerMultiCb, setPickerMultiCb] = useState<((urls: string[]) => void) | null>(null)

  const ConfigForm = CONFIG_FORM[scene.type]

  function openMediaPicker(cb: (url: string) => void, multi?: boolean, multiCb?: (urls: string[]) => void) {
    setPickerCb(() => cb)
    setPickerMultiCb(multi && multiCb ? () => multiCb : null)
  }

  async function handleSave() {
    setSaving(true)
    await fetch('/api/scenes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: scene.id, title, visible, config, updated_at: new Date().toISOString() }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      {pickerCb && (
        <MediaPickerModal
          onSelect={url => { pickerCb(url); setPickerCb(null); setPickerMultiCb(null) }}
          onSelectMultiple={pickerMultiCb ? urls => { pickerMultiCb(urls); setPickerCb(null); setPickerMultiCb(null) } : undefined}
          onClose={() => { setPickerCb(null); setPickerMultiCb(null) }}
          multiSelect={!!pickerMultiCb}
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

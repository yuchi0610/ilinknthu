'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import ScenePhonePreview from './ScenePhonePreview'
import type { Scene, SceneType } from '@/lib/types'

const TYPE_LABEL: Record<SceneType, string> = {
  animation: '動畫影片',
  newspaper: '報紙翻頁',
  dialog:    '對話文字',
  text:      '純文字',
  signature: '簽名互動',
  game:      '小遊戲',
  ending:    '結局',
}

const TYPE_DOT: Record<SceneType, string> = {
  animation: 'bg-amber-400',
  newspaper: 'bg-stone-400',
  dialog:    'bg-indigo-400',
  text:      'bg-teal-400',
  signature: 'bg-emerald-400',
  game:      'bg-rose-400',
  ending:    'bg-red-400',
}

function SortableRow({ scene, selected, onSelect, onDelete }: {
  scene: Scene
  selected: boolean
  onSelect: () => void
  onDelete: (id: string) => void
}) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id })

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`border rounded-xl px-4 py-3 flex items-center gap-3 group cursor-pointer transition-all ${
        selected
          ? 'bg-stone-100 border-stone-400 shadow-sm'
          : 'bg-white border-stone-200 hover:border-stone-400 hover:shadow-sm'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        onClick={e => e.stopPropagation()}
        className={`cursor-grab active:cursor-grabbing touch-none text-base ${selected ? 'text-stone-400' : 'text-stone-300 hover:text-stone-500'}`}
      >
        ⠿
      </button>

      <span className={`w-5 text-center text-xs font-mono ${selected ? 'text-stone-500' : 'text-stone-300'}`}>{scene.order}</span>

      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${TYPE_DOT[scene.type]}`} />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${selected ? 'text-stone-900' : 'text-stone-800'}`}>{scene.title}</p>
        <p className="text-xs text-stone-400">{TYPE_LABEL[scene.type]}</p>
      </div>

      <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
        scene.visible
          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
          : 'bg-stone-50 text-stone-400 border-stone-200'
      }`}>
        {scene.visible ? '顯示' : '隱藏'}
      </span>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => router.push(`/admin/scenes/${scene.id}`)}
          className="text-xs px-3 py-1.5 rounded-lg border transition-colors text-stone-500 hover:text-stone-900 bg-white hover:bg-stone-100 border-stone-200"
        >
          編輯
        </button>
        <button
          onClick={() => onDelete(scene.id)}
          className="text-xs px-2 py-1.5 rounded-lg border transition-colors text-stone-300 hover:text-red-500 bg-white hover:bg-red-50 border-stone-200"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default function SceneList({ initialScenes }: { initialScenes: Scene[] }) {
  const [scenes, setScenes] = useState(initialScenes)
  const [selectedId, setSelectedId] = useState<string | null>(initialScenes[0]?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<SceneType>('dialog')
  const [addError, setAddError] = useState('')

  const sensors = useSensors(useSensor(PointerSensor))
  const supabase = createClient()
  const router = useRouter()

  const selectedScene = scenes.find(s => s.id === selectedId) ?? null

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = scenes.findIndex(s => s.id === active.id)
    const newIndex = scenes.findIndex(s => s.id === over.id)
    const reordered = arrayMove(scenes, oldIndex, newIndex).map((s, i) => ({ ...s, order: i + 1 }))
    setScenes(reordered)
    setSaving(true)
    await Promise.all(reordered.map(s => supabase.from('scenes').update({ order: s.order }).eq('id', s.id)))
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('確定要刪除這個場景嗎？')) return
    await supabase.from('scenes').delete().eq('id', id)
    const next = scenes.filter(s => s.id !== id)
    setScenes(next)
    if (selectedId === id) setSelectedId(next[0]?.id ?? null)
  }

  async function handleAdd() {
    if (!newTitle.trim()) return
    setAddError('')
    const order = scenes.length + 1
    const { data, error } = await supabase
      .from('scenes')
      .insert({ type: newType, title: newTitle.trim(), order, config: {}, visible: true })
      .select()
      .single()
    if (error) { setAddError(`建立失敗：${error.message}`); return }
    if (data) router.push(`/admin/scenes/${data.id}`)
  }

  return (
    <div className="flex h-full">
      {/* 左側：場景列表 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-stone-800">場景列表</h2>
            <p className="text-xs text-stone-400 mt-0.5">拖拉可調整順序，點選場景可預覽</p>
          </div>
          <div className="flex items-center gap-2">
            {saving && <span className="text-xs text-amber-600">儲存中…</span>}
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="bg-stone-800 hover:bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              新增場景
            </button>
          </div>
        </div>

        {showAdd && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-stone-500 mb-1 block font-medium">場景名稱</label>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  placeholder="例：開場動畫"
                  autoFocus
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-stone-400"
                />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block font-medium">類型</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as SceneType)}
                  className="border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-stone-400 bg-white"
                >
                  {(Object.keys(TYPE_LABEL) as SceneType[]).map(t => (
                    <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleAdd} className="bg-stone-800 hover:bg-stone-900 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors">建立</button>
              <button onClick={() => { setShowAdd(false); setAddError('') }} className="text-stone-400 hover:text-stone-600 text-sm px-3 py-2">取消</button>
            </div>
            {addError && <p className="text-xs text-red-500 mt-2">{addError}</p>}
          </div>
        )}

        {scenes.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-stone-200 rounded-xl">
            <p className="text-sm text-stone-500 font-medium">尚未建立任何場景</p>
            <p className="text-xs text-stone-400 mt-1">點「新增場景」開始建立體驗流程</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={scenes.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {scenes.map(scene => (
                  <SortableRow
                    key={scene.id}
                    scene={scene}
                    selected={scene.id === selectedId}
                    onSelect={() => setSelectedId(scene.id)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* 右側：手機預覽面板 */}
      <div className="w-72 flex-shrink-0 border-l border-stone-200 bg-stone-100 flex flex-col items-center justify-center gap-4 p-6">
        {selectedScene ? (
          <>
            <p className="text-[11px] text-stone-400 font-medium tracking-widest uppercase">預覽</p>
            <ScenePhonePreview scene={selectedScene} />
            <p className="text-xs text-stone-500 font-medium text-center">{selectedScene.title}</p>
            <button
              onClick={() => router.push(`/admin/scenes/${selectedScene.id}`)}
              className="border border-stone-300 hover:border-stone-600 text-stone-600 hover:text-stone-900 text-xs px-5 py-2 rounded-lg transition-colors"
            >
              編輯此場景
            </button>
          </>
        ) : (
          <p className="text-xs text-stone-400 text-center">點選左側場景<br/>查看預覽</p>
        )}
      </div>
    </div>
  )
}

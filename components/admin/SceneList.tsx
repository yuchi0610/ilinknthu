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
import type { Scene, SceneType } from '@/lib/types'

const TYPE_LABEL: Record<SceneType, string> = {
  animation: '動畫影片',
  newspaper: '報紙翻頁',
  dialog:    '對話文字',
  signature: '簽名互動',
  game:      '小遊戲',
  ending:    '結局',
}

const TYPE_COLOR: Record<SceneType, string> = {
  animation: 'bg-blue-100 text-blue-600',
  newspaper: 'bg-amber-100 text-amber-700',
  dialog:    'bg-violet-100 text-violet-600',
  signature: 'bg-emerald-100 text-emerald-600',
  game:      'bg-pink-100 text-pink-600',
  ending:    'bg-red-100 text-red-500',
}

const TYPE_ICON: Record<SceneType, string> = {
  animation: '▶',
  newspaper: '📰',
  dialog:    '💬',
  signature: '✍️',
  game:      '🎮',
  ending:    '🏁',
}

function SortableCard({ scene, onDelete }: { scene: Scene; onDelete: (id: string) => void }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 group hover:border-indigo-300 hover:shadow-sm transition-all"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none text-lg leading-none flex-shrink-0"
      >
        ⠿
      </button>

      <span className="w-6 text-center text-xs text-slate-300 font-mono flex-shrink-0">{scene.order}</span>

      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${TYPE_COLOR[scene.type]}`}>
        {TYPE_ICON[scene.type]}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{scene.title}</p>
        <p className="text-xs text-slate-400">{TYPE_LABEL[scene.type]}</p>
      </div>

      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${scene.visible ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
        {scene.visible ? '顯示' : '隱藏'}
      </span>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => router.push(`/admin/scenes/${scene.id}`)}
          className="text-xs text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          編輯
        </button>
        <button
          onClick={() => onDelete(scene.id)}
          className="text-xs text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default function SceneList({ initialScenes }: { initialScenes: Scene[] }) {
  const [scenes, setScenes] = useState(initialScenes)
  const [saving, setSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<SceneType>('dialog')

  const sensors = useSensors(useSensor(PointerSensor))
  const supabase = createClient()
  const router = useRouter()

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
    setScenes(scenes.filter(s => s.id !== id))
  }

  async function handleAdd() {
    if (!newTitle.trim()) return
    const order = scenes.length + 1
    const { data, error } = await supabase
      .from('scenes')
      .insert({ type: newType, title: newTitle.trim(), order, config: {}, visible: true })
      .select()
      .single()

    if (!error && data) router.push(`/admin/scenes/${data.id}`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-800">場景列表</h2>
          <p className="text-xs text-slate-400 mt-0.5">拖拉可調整順序，點「編輯」設定場景內容</p>
        </div>
        <div className="flex items-center gap-2">
          {saving && <span className="text-xs text-amber-500">儲存中…</span>}
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + 新增場景
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 flex gap-3 items-end shadow-sm">
          <div className="flex-1">
            <label className="text-xs text-slate-500 mb-1 block font-medium">場景名稱</label>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="例：開場動畫"
              autoFocus
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block font-medium">類型</label>
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as SceneType)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 bg-white"
            >
              {(Object.keys(TYPE_LABEL) as SceneType[]).map(t => (
                <option key={t} value={t}>{TYPE_LABEL[t]}</option>
              ))}
            </select>
          </div>
          <button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors">建立</button>
          <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 text-sm px-3 py-2">取消</button>
        </div>
      )}

      {scenes.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-xl">
          <p className="text-3xl mb-3">🎬</p>
          <p className="text-sm text-slate-500 font-medium">尚未建立任何場景</p>
          <p className="text-xs text-slate-400 mt-1">點「新增場景」開始建立體驗流程</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={scenes.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {scenes.map(scene => (
                <SortableCard key={scene.id} scene={scene} onDelete={handleDelete} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

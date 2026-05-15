'use client'

import { useState, useEffect, useRef } from 'react'

interface MediaFile {
  name: string
  url: string
  type: 'image' | 'video' | 'other'
}

function fileType(name: string): MediaFile['type'] {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video'
  return 'other'
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://uozojwiklovkckbygegp.supabase.co'
function publicUrl(name: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/media/${name}`
}

interface Props {
  onSelect: (url: string) => void
  onSelectMultiple?: (urls: string[]) => void
  onClose: () => void
  multiSelect?: boolean
}

export default function MediaPickerModal({ onSelect, onSelectMultiple, onClose, multiSelect = false }: Props) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/upload').then(r => r.json()).then(({ files: raw }) => {
      const list: MediaFile[] = (raw ?? [])
        .filter((f: { name: string }) => f.name !== '.emptyFolderPlaceholder')
        .map((f: { name: string }) => ({ name: f.name, url: publicUrl(f.name), type: fileType(f.name) }))
      setFiles(list)
      setLoading(false)
    })
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const filename = `${Date.now()}.${ext}`

    const signRes = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`)
    const { signedUrl } = await signRes.json()
    if (!signedUrl) { setUploadError('取得上傳連結失敗'); setUploading(false); return }

    const uploadRes = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
    if (!uploadRes.ok) { setUploadError('上傳失敗'); setUploading(false); return }

    const url = publicUrl(filename)
    setFiles(prev => [{ name: filename, url, type: fileType(filename) }, ...prev])
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function toggleSelect(url: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(url) ? next.delete(url) : next.add(url)
      return next
    })
  }

  function handleConfirmMultiple() {
    if (selected.size === 0) return
    onSelectMultiple?.(Array.from(selected))
    onClose()
  }

  function handleSingleClick(url: string) {
    if (multiSelect) {
      toggleSelect(url)
    } else {
      onSelect(url)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-[620px] max-h-[80vh] flex flex-col overflow-hidden border border-stone-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h3 className="text-sm font-semibold text-stone-700">
            {multiSelect ? `從媒體庫選取（已選 ${selected.size} 張）` : '從媒體庫選取'}
          </h3>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-xs border border-stone-200 hover:border-stone-400 text-stone-500 hover:text-stone-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {uploading ? '上傳中…' : '上傳檔案'}
            </button>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors">✕</button>
          </div>
        </div>

        {uploadError && (
          <div className="px-5 py-2 bg-red-50 border-b border-red-100">
            <p className="text-xs text-red-500">{uploadError}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12 text-stone-400 text-sm">載入中…</div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm">媒體庫是空的，請點「上傳檔案」新增</div>
          ) : (
            <div className="grid grid-cols-4 gap-2.5">
              {files.map(file => {
                const isSelected = selected.has(file.url)
                return (
                  <button
                    key={file.name}
                    onClick={() => handleSingleClick(file.url)}
                    className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected ? 'border-stone-800 ring-2 ring-stone-400' : 'border-stone-100 hover:border-stone-500'
                    }`}
                  >
                    {file.type === 'image' ? (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    ) : file.type === 'video' ? (
                      <video src={file.url} className="w-full h-full object-cover" muted />
                    ) : (
                      <div className="w-full h-full bg-stone-50 flex items-center justify-center text-stone-400 text-xs">檔案</div>
                    )}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-stone-800 rounded-full flex items-center justify-center text-white text-[10px] font-bold">✓</div>
                    )}
                    <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors" />
                    <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {file.name}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {multiSelect && (
          <div className="px-5 py-3 border-t border-stone-100 flex justify-end gap-2">
            <button onClick={onClose} className="text-sm text-stone-500 hover:text-stone-700 px-4 py-2 rounded-lg transition-colors">取消</button>
            <button
              onClick={handleConfirmMultiple}
              disabled={selected.size === 0}
              className="text-sm bg-stone-800 hover:bg-stone-900 disabled:opacity-40 text-white px-5 py-2 rounded-lg transition-colors font-medium"
            >
              新增 {selected.size > 0 ? `${selected.size} 張` : '圖片'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

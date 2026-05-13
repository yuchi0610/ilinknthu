'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

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

interface Props {
  onSelect: (url: string) => void
  onClose: () => void
}

export default function MediaPickerModal({ onSelect, onClose }: Props) {
  const supabase = createClient()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.storage.from('media').list('', { sortBy: { column: 'created_at', order: 'desc' } }).then(({ data }) => {
      if (!data) { setLoading(false); return }
      const withUrls = data
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => {
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(f.name)
          return { name: f.name, url: urlData.publicUrl, type: fileType(f.name) }
        })
      setFiles(withUrls)
      setLoading(false)
    })
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    const ext = file.name.split('.').pop() ?? 'bin'
    const filename = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('media').upload(filename, file)
    if (error) {
      setUploadError(`上傳失敗：${error.message}`)
    } else {
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filename)
      const newFile: MediaFile = { name: filename, url: urlData.publicUrl, type: fileType(filename) }
      setFiles(prev => [newFile, ...prev])
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-[620px] max-h-[80vh] flex flex-col overflow-hidden border border-stone-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h3 className="text-sm font-semibold text-stone-700">從媒體庫選取</h3>
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
              {files.map(file => (
                <button
                  key={file.name}
                  onClick={() => { onSelect(file.url); onClose() }}
                  className="group relative aspect-square rounded-lg overflow-hidden border-2 border-stone-100 hover:border-stone-700 transition-all"
                >
                  {file.type === 'image' ? (
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                  ) : file.type === 'video' ? (
                    <video src={file.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <div className="w-full h-full bg-stone-50 flex items-center justify-center text-stone-400 text-xs">檔案</div>
                  )}
                  <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors" />
                  <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {file.name}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

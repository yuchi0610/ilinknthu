'use client'

import { useState, useRef, useEffect } from 'react'

interface MediaFile {
  name: string; url: string; size: number; created_at: string; type: 'image' | 'video' | 'other'
}

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ''

function publicUrl(name: string) {
  return `${R2_PUBLIC_URL}/${name}`
}

function fileType(name: string): MediaFile['type'] {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video'
  return 'other'
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [copied, setCopied] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function loadFiles() {
    setLoading(true)
    setListError('')
    const res = await fetch('/api/upload')
    if (!res.ok) {
      const { error } = await res.json()
      setListError(error ?? '無法讀取媒體庫')
      setLoading(false)
      return
    }
    const { files: raw } = await res.json()
    const withUrls: MediaFile[] = (raw ?? [])
      .filter((f: { name: string }) => f.name !== '.emptyFolderPlaceholder')
      .map((f: { name: string; size?: number; created_at?: string }) => ({
        name: f.name,
        url: publicUrl(f.name),
        size: f.size ?? 0,
        created_at: f.created_at ?? '',
        type: fileType(f.name),
      }))
    setFiles(withUrls)
    setLoading(false)
  }

  useEffect(() => { loadFiles() }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const filename = `${Date.now()}.${ext}`

    const signRes = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`)
    const signJson = await signRes.json()
    if (!signRes.ok) {
      setUploadError(`上傳失敗：${signJson.error}`)
      setUploading(false)
      e.target.value = ''
      return
    }

    const uploadRes = await fetch(signJson.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!uploadRes.ok) {
      setUploadError(`上傳失敗：${uploadRes.statusText}`)
      setUploading(false)
      e.target.value = ''
      return
    }

    const newFile: MediaFile = {
      name: filename,
      url: signJson.publicUrl ?? publicUrl(filename),
      size: file.size,
      created_at: new Date().toISOString(),
      type: fileType(filename),
    }
    setFiles(prev => [newFile, ...prev])
    setUploading(false)
    e.target.value = ''
  }

  async function handleDelete(name: string) {
    if (!confirm(`確定刪除 ${name}？`)) return
    await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: name }),
    })
    setFiles(files.filter(f => f.name !== name))
  }

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-stone-800">媒體庫</h2>
          <p className="text-xs text-stone-400 mt-0.5">上傳圖片和影片，可在場景編輯時直接選取</p>
        </div>
        <div className="flex items-center gap-3">
          {uploading && <span className="text-xs text-stone-500">上傳中…</span>}
          <input ref={inputRef} type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" />
          <button onClick={() => inputRef.current?.click()} disabled={uploading} className="bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors">
            上傳檔案
          </button>
        </div>
      </div>

      {listError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          <p>{listError}</p>
        </div>
      )}

      {uploadError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          <p>{uploadError}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-stone-400 text-sm">載入中…</div>
      ) : files.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed border-stone-200 rounded-xl">
          <p className="text-sm text-stone-500 font-medium">媒體庫是空的</p>
          <p className="text-xs text-stone-400 mt-1">點「上傳檔案」開始新增圖片或影片</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {files.map(file => (
            <div key={file.name} className="bg-white border border-stone-200 rounded-xl overflow-hidden group hover:border-stone-400 hover:shadow-sm transition-all">
              <div className="aspect-square bg-stone-50 flex items-center justify-center overflow-hidden">
                {file.type === 'image' ? (
                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                ) : file.type === 'video' ? (
                  <video src={file.url} className="w-full h-full object-cover" muted />
                ) : (
                  <span className="text-stone-300 text-xs">檔案</span>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-xs text-stone-700 truncate mb-0.5">{file.name}</p>
                <p className="text-xs text-stone-400 mb-2">{formatSize(file.size)}</p>
                <div className="flex gap-1.5">
                  <button onClick={() => handleCopy(file.url)} className="flex-1 text-xs py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-500 hover:text-stone-800 border border-stone-200 transition-colors">
                    {copied === file.url ? '✓ 已複製' : '複製連結'}
                  </button>
                  <button onClick={() => handleDelete(file.name)} className="text-xs px-2 py-1.5 rounded-lg bg-stone-50 hover:bg-red-50 text-stone-300 hover:text-red-500 border border-stone-200 transition-colors">
                    刪
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { r2PresignedPut, r2List, r2Delete, r2PublicUrl } from '@/lib/r2'

// GET /api/upload?filename=xxx  → { signedUrl, publicUrl }
// GET /api/upload               → { files }
export async function GET(req: NextRequest) {
  try {
    const filename = req.nextUrl.searchParams.get('filename')

    if (filename) {
      const ext = filename.split('.').pop()?.toLowerCase() ?? 'bin'
      const contentTypeMap: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
        gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
        mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
      }
      const contentType = contentTypeMap[ext] ?? 'application/octet-stream'
      const signedUrl = await r2PresignedPut(filename, contentType)
      return NextResponse.json({ signedUrl, publicUrl: r2PublicUrl(filename) })
    }

    const files = await r2List()
    return NextResponse.json({ files })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { filename } = await req.json()
    if (!filename) return NextResponse.json({ error: '缺少檔名' }, { status: 400 })
    await r2Delete(filename)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SceneEditor from '@/components/admin/SceneEditor'
import type { Scene } from '@/lib/types'

export default async function SceneEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: scene } = await supabase.from('scenes').select('*').eq('id', id).single()
  if (!scene) notFound()

  return (
    <div className="h-full flex flex-col">
      <SceneEditor scene={scene as Scene} />
    </div>
  )
}

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import SceneList from '@/components/admin/SceneList'
import type { Scene } from '@/lib/types'

export default async function ScenesPage() {
  const supabase = await createClient()
  const { data: scenes } = await supabase
    .from('scenes')
    .select('*')
    .order('order', { ascending: true })

  return (
    <div className="h-full">
      <SceneList initialScenes={(scenes ?? []) as Scene[]} />
    </div>
  )
}

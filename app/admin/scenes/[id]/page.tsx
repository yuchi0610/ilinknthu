export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import SceneEditor from '@/components/admin/SceneEditor'
import type { Scene } from '@/lib/types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://uozojwiklovkckbygegp.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvem9qd2lrbG92a2NrYnlnZWdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY1Njk1OCwiZXhwIjoyMDk0MjMyOTU4fQ.SpNTXGkJxgFk5zM6DUK3OkwDLdPN5-5drqpH4csPbOc'

export default async function SceneEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const { data: scene } = await supabase.from('scenes').select('*').eq('id', id).single()
  if (!scene) notFound()

  return (
    <div className="h-full flex flex-col">
      <SceneEditor scene={scene as Scene} />
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/admin/scenes',   label: '場景管理', icon: '🎬' },
  { href: '/admin/media',    label: '媒體庫',   icon: '🖼️' },
  { href: '/admin/endings',  label: '結局設定', icon: '🏁' },
  { href: '/admin/sessions', label: '遊玩紀錄', icon: '📊' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <aside className="w-52 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
      <div className="px-5 py-5 border-b border-slate-100">
        <p className="text-[10px] text-slate-400 tracking-widest uppercase mb-1">後台管理</p>
        <h1 className="text-slate-800 font-bold text-sm leading-snug">核去核從</h1>
      </div>

      <nav className="flex-1 py-3 px-2">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 ${
                active
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span className="text-base">{icon}</span>
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors mb-1"
        >
          <span>↗</span> 預覽網站
        </Link>
        <button
          onClick={handleLogout}
          className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <span>→</span> 登出
        </button>
      </div>
    </aside>
  )
}

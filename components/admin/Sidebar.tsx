'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const NAV = [
  { href: '/admin/scenes',  label: '場景管理' },
  { href: '/admin/media',   label: '媒體庫'   },
  { href: '/admin/endings', label: '結局設定' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [showQR, setShowQR] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  return (
    <>
      <aside className="w-48 flex-shrink-0 bg-white border-r border-stone-200 flex flex-col">
        <div className="px-5 py-6 border-b border-stone-100">
          <p className="text-[10px] text-stone-400 tracking-[0.2em] uppercase mb-1.5">後台管理</p>
          <h1 className="text-stone-800 font-semibold text-sm leading-snug tracking-wide">核去核從</h1>
        </div>

        <nav className="flex-1 py-4 px-3">
          {NAV.map(({ href, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`block px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 ${
                  active
                    ? 'bg-stone-900 text-white font-medium'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-stone-100 space-y-0.5">
          <button
            onClick={() => setShowQR(true)}
            className="w-full text-left block px-3 py-2 text-xs text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-50 transition-colors"
          >
            手機掃碼預覽 ▦
          </button>
        </div>
      </aside>

      {showQR && origin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-medium text-stone-700">用手機掃描以預覽網站</p>
            <QRCodeSVG value={origin} size={200} bgColor="#ffffff" fgColor="#1c1917" level="M" />
            <p className="text-xs text-stone-400 break-all max-w-[200px] text-center">{origin}</p>
            <button
              onClick={() => setShowQR(false)}
              className="text-xs text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-400 px-5 py-1.5 rounded-lg transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </>
  )
}

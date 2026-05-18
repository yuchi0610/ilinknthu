export const dynamic = 'force-dynamic'

import { d1Query, parseJsonField } from '@/lib/d1'
import type { Session } from '@/lib/types'

function formatDate(str: string) {
  return new Date(str).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
}

export default async function SessionsPage() {
  const rows = await d1Query<Record<string, unknown>>(
    'SELECT * FROM sessions ORDER BY started_at DESC LIMIT 100'
  )
  const list: Session[] = rows.map(row => ({
    ...(row as unknown as Session),
    scores: parseJsonField<Record<string, number>>(row, 'scores'),
  }))

  const stats = {
    total: list.length,
    completed: list.filter(s => s.ended_at).length,
    avgScore: list.length
      ? Math.round(list.reduce((a, s) => a + (s.total_score ?? 0), 0) / list.length)
      : 0,
    endingCounts: { A: 0, B: 0, C: 0 } as Record<string, number>,
  }
  list.forEach(s => { if (s.ending_type) stats.endingCounts[s.ending_type] = (stats.endingCounts[s.ending_type] ?? 0) + 1 })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">遊玩紀錄</h2>
        <p className="text-xs text-zinc-500 mt-0.5">最近 100 筆觀眾紀錄</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: '總次數', value: stats.total },
          { label: '完成體驗', value: stats.completed },
          { label: '平均積分', value: stats.avgScore },
          { label: '結局分布', value: `A:${stats.endingCounts.A ?? 0} B:${stats.endingCounts.B ?? 0} C:${stats.endingCounts.C ?? 0}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-sm">尚無遊玩紀錄</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
                <th className="pb-3 pr-4">開始時間</th>
                <th className="pb-3 pr-4">完成</th>
                <th className="pb-3 pr-4">總積分</th>
                <th className="pb-3 pr-4">結局</th>
                <th className="pb-3">各遊戲積分</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {list.map(session => (
                <tr key={session.id} className="text-zinc-300">
                  <td className="py-3 pr-4 text-xs">{formatDate(session.started_at)}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs ${session.ended_at ? 'text-green-400' : 'text-zinc-600'}`}>
                      {session.ended_at ? '✓' : '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-medium">{session.total_score ?? 0}</td>
                  <td className="py-3 pr-4">
                    {session.ending_type ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        session.ending_type === 'A' ? 'bg-yellow-400/20 text-yellow-400' :
                        session.ending_type === 'B' ? 'bg-blue-400/20 text-blue-400' :
                        'bg-red-400/20 text-red-400'
                      }`}>{session.ending_type}</span>
                    ) : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="py-3 text-xs text-zinc-500">
                    {Object.entries(session.scores ?? {}).map(([k, v]) => `${k}: ${v}`).join('  ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

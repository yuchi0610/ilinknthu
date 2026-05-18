const ACCOUNT_ID = process.env.CF_ACCOUNT_ID!
const DB_ID      = process.env.CF_D1_DB_ID!
const API_TOKEN  = process.env.CF_API_TOKEN!

type D1Result<T> = {
  result: [{ results: T[]; success: boolean }]
  success: boolean
  errors: { message: string }[]
}

export async function d1Query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const r = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, params }),
      cache: 'no-store',
    },
  )
  const data = (await r.json()) as D1Result<T>
  if (!data.success) throw new Error(data.errors?.[0]?.message ?? 'D1 query failed')
  return data.result[0]?.results ?? []
}

export async function d1Run(sql: string, params: unknown[] = []): Promise<void> {
  await d1Query(sql, params)
}

// D1 stores JSON fields as TEXT — parse them back to objects
export function parseJsonField<T>(row: Record<string, unknown>, field: string): T {
  const v = row[field]
  if (typeof v === 'string') {
    try { return JSON.parse(v) as T } catch { return {} as T }
  }
  return (v ?? {}) as T
}

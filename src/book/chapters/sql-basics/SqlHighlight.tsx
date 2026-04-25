import { cn } from '@/lib/utils'

export function SqlHighlight({ sql, activeClause }: { sql: string; activeClause?: string }) {
  const keywords = [
    'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN',
    'INNER JOIN', 'CROSS JOIN',
    'ORDER BY', 'GROUP BY',
    'CASE WHEN', 'CASE',
    'SELECT', 'FROM', 'WHERE', 'UPDATE', 'SET', 'DELETE', 'HAVING',
    'JOIN', 'ON',
    'WHEN', 'THEN', 'ELSE', 'END',
    'ASC', 'DESC',
    'COUNT', 'SUM', 'AVG', 'MAX', 'MIN',
    'MONTHS_BETWEEN', 'ADD_MONTHS', 'TO_DATE', 'TO_CHAR', 'TRUNC', 'SYSTIMESTAMP', 'SYSDATE',
    'SYS_EXTRACT_UTC', 'FROM_TZ', 'AT TIME ZONE', 'INTERVAL', 'CAST',
    'NVL2', 'NVL', 'DECODE',
    'AND', 'OR', 'LIKE', 'IN', 'IS', 'NULL', 'NOT', 'BETWEEN',
  ]

  const pattern = new RegExp(
    '\\b(' + keywords.map((k) => k.replace(/\s+/g, '\\s+')).join('|') + ')\\b',
    'gi',
  )

  const parts: Array<{ text: string; isKw: boolean; kw?: string }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(sql)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: sql.slice(lastIndex, match.index), isKw: false })
    }
    const matched = match[0]
    const upper = matched.replace(/\s+/g, ' ').toUpperCase()
    parts.push({ text: matched, isKw: true, kw: upper })
    lastIndex = match.index + matched.length
  }
  if (lastIndex < sql.length) {
    parts.push({ text: sql.slice(lastIndex), isKw: false })
  }

  return (
    <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-foreground/80">
      {parts.map((p, i) => {
        if (!p.isKw) return <span key={i}>{p.text}</span>
        const isActive = activeClause && p.kw === activeClause
        return (
          <span
            key={i}
            className={cn(
              'rounded px-0.5 font-bold transition-all duration-200',
              isActive
                ? 'bg-orange-300 text-orange-900'
                : 'text-blue-600',
            )}
          >
            {p.text}
          </span>
        )
      })}
    </pre>
  )
}

import { cn } from '@/lib/utils'

// keyword → color category
type KwCategory = 'ddl' | 'dml' | 'dcl' | 'tcl' | 'clause' | 'func' | 'logic'

interface KwDef {
  words: string[]
  category: KwCategory
}

const KW_GROUPS: KwDef[] = [
  {
    category: 'ddl',
    words: [
      'CREATE TABLE', 'CREATE INDEX', 'CREATE VIEW', 'CREATE SEQUENCE', 'CREATE',
      'ALTER TABLE', 'ALTER',
      'DROP TABLE', 'DROP INDEX', 'DROP VIEW', 'DROP',
      'TRUNCATE TABLE', 'TRUNCATE',
      'RENAME',
    ],
  },
  {
    category: 'dml',
    words: [
      'SELECT', 'INSERT INTO', 'INSERT', 'INTO', 'VALUES',
      'UPDATE', 'SET', 'DELETE FROM', 'DELETE',
      'MERGE INTO', 'MERGE', 'USING',
      'WHEN MATCHED THEN', 'WHEN NOT MATCHED THEN',
    ],
  },
  {
    category: 'dcl',
    words: ['GRANT', 'REVOKE', 'TO', 'FROM'],
  },
  {
    category: 'tcl',
    words: ['COMMIT', 'ROLLBACK TO', 'ROLLBACK', 'SAVEPOINT'],
  },
  {
    category: 'clause',
    words: [
      'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN',
      'INNER JOIN', 'CROSS JOIN',
      'ORDER BY', 'GROUP BY',
      'FROM', 'WHERE', 'HAVING',
      'JOIN', 'ON',
      'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'LIKE', 'BETWEEN', 'EXISTS',
      'ASC', 'DESC',
      'CASE WHEN', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
      'DISTINCT', 'ALL', 'AS',
      'PRIMARY KEY', 'NOT NULL', 'UNIQUE', 'REFERENCES', 'CONSTRAINT',
      'CHECK', 'DEFAULT',
      'CASCADE', 'CASCADE CONSTRAINTS',
      'WITH',
    ],
  },
  {
    category: 'func',
    words: [
      'COUNT', 'SUM', 'AVG', 'MAX', 'MIN',
      'MONTHS_BETWEEN', 'ADD_MONTHS', 'TO_DATE', 'TO_CHAR', 'TRUNC',
      'SYSTIMESTAMP', 'SYSDATE',
      'SYS_EXTRACT_UTC', 'FROM_TZ', 'AT TIME ZONE', 'INTERVAL', 'CAST',
      'NVL2', 'NVL', 'DECODE', 'COALESCE', 'NULLIF',
      'RANK', 'DENSE_RANK', 'ROW_NUMBER', 'OVER', 'PARTITION BY',
      'LISTAGG', 'WITHIN GROUP',
    ],
  },
]

const CATEGORY_CLASS: Record<KwCategory, string> = {
  ddl:    'text-violet-600 dark:text-violet-400',
  dml:    'text-ios-blue dark:text-ios-blue',
  dcl:    'text-emerald-600 dark:text-emerald-400',
  tcl:    'text-orange-500 dark:text-orange-400',
  clause: 'text-ios-blue dark:text-ios-blue',
  func:   'text-cyan-600 dark:text-cyan-400',
  logic:  'text-ios-blue dark:text-ios-blue',
}

const ACTIVE_CLASS = 'bg-ios-orange-light text-ios-orange-dark ring-1 ring-ios-orange/40'

// flatten to [{word, category}] sorted longest-first so multi-word keywords match first
const ALL_KEYWORDS = KW_GROUPS.flatMap(({ words, category }) =>
  words.map((w) => ({ word: w, category }))
).sort((a, b) => b.word.length - a.word.length)

const PATTERN = new RegExp(
  '\\b(' +
    ALL_KEYWORDS.map((k) => k.word.replace(/\s+/g, '\\s+')).join('|') +
  ')\\b',
  'gi',
)

const KW_MAP = new Map(ALL_KEYWORDS.map((k) => [k.word.toUpperCase(), k.category]))

// Split a line into [before-comment, comment] parts
function splitLineComment(line: string): [string, string] {
  const idx = line.indexOf('--')
  if (idx === -1) return [line, '']
  return [line.slice(0, idx), line.slice(idx)]
}

export function SqlHighlight({ sql, activeClause }: { sql: string; activeClause?: string }) {
  const lines = sql.split('\n')

  function highlightCode(code: string): Array<{ text: string; isKw: boolean; category?: KwCategory }> {
    const parts: Array<{ text: string; isKw: boolean; category?: KwCategory }> = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    const re = new RegExp(PATTERN.source, 'gi')

    while ((match = re.exec(code)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: code.slice(lastIndex, match.index), isKw: false })
      }
      const matched = match[0]
      const upper = matched.replace(/\s+/g, ' ').toUpperCase()
      parts.push({ text: matched, isKw: true, category: KW_MAP.get(upper) })
      lastIndex = match.index + matched.length
    }
    if (lastIndex < code.length) {
      parts.push({ text: code.slice(lastIndex), isKw: false })
    }
    return parts
  }

  return (
    <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-foreground/80">
      {lines.map((line, li) => {
        const [code, comment] = splitLineComment(line)
        const parts = highlightCode(code)
        return (
          <span key={li}>
            {parts.map((p, i) => {
              if (!p.isKw) return <span key={i}>{p.text}</span>
              const upper = p.text.replace(/\s+/g, ' ').toUpperCase()
              const isActive = activeClause && upper === activeClause
              return (
                <span
                  key={i}
                  className={cn(
                    'rounded px-0.5 font-bold transition-all duration-200',
                    isActive ? ACTIVE_CLASS : CATEGORY_CLASS[p.category ?? 'clause'],
                  )}
                >
                  {p.text}
                </span>
              )
            })}
            {comment && <span className="text-muted-foreground/60 italic">{comment}</span>}
            {li < lines.length - 1 && '\n'}
          </span>
        )
      })}
    </pre>
  )
}

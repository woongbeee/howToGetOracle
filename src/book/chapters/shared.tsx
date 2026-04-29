// Shared UI primitives for book chapter pages
import { type ReactNode, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useSimulationStore } from '@/store/simulationStore'

export function WipBanner() {
  const lang = useSimulationStore((s) => s.lang)
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-950/20">
      <span className="mt-0.5 text-lg leading-none">🚧</span>
      <div>
        <p className="font-mono text-[11px] font-bold text-amber-700 dark:text-amber-400">
          {lang === 'ko' ? 'Work In Progress' : 'Work In Progress'}
        </p>
        <p className="mt-0.5 font-mono text-[11px] leading-relaxed text-amber-600/80 dark:text-amber-500/70">
          {lang === 'ko'
            ? '이 챕터는 아직 작성 중이에요. 내용이 불완전하거나 변경될 수 있습니다. 🐣'
            : "This chapter is still being written. Content may be incomplete or change. 🐣"}
        </p>
      </div>
    </div>
  )
}

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-4xl px-8 pt-6 pb-10', className)}>
      {children}
    </div>
  )
}

export function ChapterTitle({ title, subtitle }: { icon?: string; num?: number; title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-3xl font-bold tracking-tight leading-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-8 mb-4 text-xl font-bold tracking-tight">{children}</h2>
  )
}

export function SubTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 text-sm font-bold text-foreground/90">{children}</h3>
  )
}

export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('mb-4 text-sm leading-relaxed text-muted-foreground', className)}>{children}</p>
  )
}

type InfoVariant = 'tip' | 'note' | 'warning' | 'usage' | 'summary' | 'danger'
type InfoColor   = 'info' | 'tip' | 'warning' | 'danger'

interface VariantDef {
  color: string
  icon:  string
  ko:    string
  en:    string
}

const VARIANT_DEFS: Record<InfoVariant, VariantDef> = {
  tip:     { color: 'bg-ios-teal-light   border-ios-teal/20   text-ios-teal-dark',   icon: '💡', ko: '더 알아보기',        en: 'Advanced' },
  note:    { color: 'bg-ios-blue-light   border-ios-blue/20   text-ios-blue-dark',   icon: '📌', ko: '참고',              en: 'Note' },
  warning: { color: 'bg-ios-orange-light border-ios-orange/25 text-ios-orange-dark', icon: '⚠️', ko: '주의',              en: 'Caution' },
  usage:   { color: 'bg-ios-green-light  border-ios-green/20  text-ios-green-dark',  icon: '🛠️', ko: '어디서 사용할까?',   en: 'When to Use' },
  summary: { color: 'bg-ios-blue-light   border-ios-blue/20   text-ios-blue-dark',   icon: '📐', ko: '핵심 정리',          en: 'Summary' },
  danger:  { color: 'bg-ios-red-light    border-ios-red/20    text-ios-red-dark',    icon: '🚨', ko: '위험',              en: 'Danger' },
}

const LEGACY_COLOR: Record<InfoColor, string> = {
  info:    'bg-ios-blue-light border-ios-blue/20 text-ios-blue-dark',
  tip:     'bg-ios-teal-light border-ios-teal/20 text-ios-teal-dark',
  warning: 'bg-ios-orange-light border-ios-orange/25 text-ios-orange-dark',
  danger:  'bg-ios-red-light border-ios-red/20 text-ios-red-dark',
}

export function InfoBox({ variant, lang, color, icon, title, children }: {
  variant?: InfoVariant
  lang?: 'ko' | 'en'
  color?: InfoColor
  icon?: string
  title?: string
  children: ReactNode
}) {
  if (variant) {
    const def = VARIANT_DEFS[variant]
    const l   = lang ?? 'ko'
    return (
      <div className={cn('mt-4 mb-4 rounded-lg border p-4', def.color)}>
        <div className="mb-1.5 flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider">
          <span>{def.icon}</span>
          {def[l]}
        </div>
        <div className="text-xs leading-relaxed">{children}</div>
      </div>
    )
  }

  const colorClass = LEGACY_COLOR[color ?? 'tip']
  return (
    <div className={cn('mt-4 mb-4 rounded-lg border p-4', colorClass)}>
      {title && (
        <div className="mb-1.5 flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider">
          {icon && <span>{icon}</span>}
          {title}
        </div>
      )}
      <div className="text-xs leading-relaxed">{children}</div>
    </div>
  )
}

export function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="mb-6 overflow-hidden rounded-lg border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/60">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-mono font-bold text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={cn('border-b last:border-0', ri % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2 font-mono text-[11px] text-foreground/80">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ConceptGrid({ items }: { items: Array<{ icon: string; title: string; desc: string; color?: string }> }) {
  const colorMap: Record<string, string> = {
    info:    'border-ios-blue/20 bg-ios-blue-light/60',
    tip:     'border-ios-teal/20 bg-ios-teal-light/60',
    warning: 'border-ios-orange/25 bg-ios-orange-light/60',
    danger:  'border-ios-red/20 bg-ios-red-light/60',
    /* legacy aliases kept for backward compat */
    blue:    'border-ios-blue/20 bg-ios-blue-light/60',
    orange:  'border-ios-orange/25 bg-ios-orange-light/60',
    teal:    'border-ios-teal/20 bg-ios-teal-light/60',
    rose:    'border-ios-red/20 bg-ios-red-light/60',
  }

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item, i) => (
        <div key={i} className={cn('flex gap-3 rounded-lg border p-4', colorMap[item.color ?? 'blue'])}>
          <span className="text-xl shrink-0">{item.icon}</span>
          <div>
            <div className="mb-0.5 text-xs font-bold">{item.title}</div>
            <div className="text-xs leading-relaxed text-muted-foreground">{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SimulatorPlaceholder({ label, color = 'blue' }: { label: string; color?: string }) {
  const colorMap: Record<string, string> = {
    blue:    'border-ios-blue/30 bg-ios-blue-light text-ios-blue-dark',
    teal:    'border-ios-teal/30 bg-ios-teal-light text-ios-teal-dark',
    orange:  'border-ios-orange/30 bg-ios-orange-light text-ios-orange-dark',
    red:     'border-ios-red/30 bg-ios-red-light text-ios-red-dark',
  }
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12', colorMap[color])}>
      <span className="text-4xl">🚧</span>
      <span className="font-mono text-sm font-bold">{label}</span>
      <span className="font-mono text-xs text-current/60">Coming soon</span>
    </div>
  )
}

export function Divider() {
  return <div className="my-8 border-t" />
}

// ── TermPopup ────────────────────────────────────────────────────────────────
// 인라인 용어 버튼 + 클릭 시 말풍선 팝업. 배경은 그대로 유지됨.
// 사용:
//   const [open, setOpen] = useState(false)
//   <TermPopup label="타임존이란?" title="타임존" icon="🌏"
//              open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)}>
//     ...내용...
//   </TermPopup>

interface TermPopupProps {
  label: string
  title: string
  icon?: string
  color?: 'info' | 'tip' | 'warning' | 'danger'
  open: boolean
  onOpen: () => void
  onClose: () => void
  children: ReactNode
}

export function TermPopup({ label, title, icon, color = 'tip', open, onOpen, onClose, children }: TermPopupProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onOutside)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onOutside)
    }
  }, [open, onClose])

  const headerStyles: Record<string, string> = {
    info:    'bg-ios-blue-light border-ios-blue/20 text-ios-blue-dark',
    tip:     'bg-ios-teal-light border-ios-teal/20 text-ios-teal-dark',
    warning: 'bg-ios-orange-light border-ios-orange/25 text-ios-orange-dark',
    danger:  'bg-ios-red-light border-ios-red/20 text-ios-red-dark',
  }

  const tailStyles: Record<string, string> = {
    info:    'border-r-ios-blue/20',
    tip:     'border-r-ios-teal/20',
    warning: 'border-r-ios-orange/25',
    danger:  'border-r-ios-red/20',
  }

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        onClick={() => open ? onClose() : onOpen()}
        className={cn(
          'inline-flex items-center gap-1 rounded border border-dashed px-1.5 py-0.5 font-mono text-[11px] font-bold transition-colors',
          open
            ? 'border-ios-teal/40 bg-ios-teal-light text-ios-teal-dark'
            : 'border-ios-teal/30 text-ios-teal-dark hover:bg-ios-teal-light',
        )}
      >
        {icon && <span>{icon}</span>}
        {label}
        <span className="opacity-50">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute left-full top-1/2 z-40 ml-2.5 w-96 -translate-y-1/2">
          {/* 말풍선 꼬리 */}
          <div
            className={cn(
              'absolute -left-2 top-1/2 -translate-y-1/2 border-8 border-transparent',
              tailStyles[color],
            )}
          />
          <div className="overflow-hidden rounded-xl border bg-white shadow-xl">
            <div className={cn('flex items-center gap-2 border-b px-4 py-3', headerStyles[color])}>
              {icon && <span className="text-sm">{icon}</span>}
              <span className="font-mono text-xs font-bold">{title}</span>
              <button
                onClick={onClose}
                className="ml-auto text-[11px] opacity-50 hover:opacity-100"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <div className="px-4 py-3.5 text-xs leading-relaxed text-gray-700">
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

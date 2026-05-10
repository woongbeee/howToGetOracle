// Shared UI primitives for book chapter pages
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useSimulationStore } from '@/store/simulationStore'
import { SqlHighlight } from './sql-basics/dml-more/SqlHighlight'
import {
  IconBulb,
  IconPin,
  IconAlertTriangle,
  IconTool,
  IconRuler2,
  IconAlertCircle,
  IconHammer,
  IconChevronDown,
  IconX,
} from '@tabler/icons-react'

export function WipBanner() {
  const lang = useSimulationStore((s) => s.lang)
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-950/20">
      <IconHammer size={18} className="mt-0.5 shrink-0 text-amber-600" />
      <div>
        <p className="font-mono text-[11px] font-bold text-amber-700 dark:text-amber-400">
          Work In Progress
        </p>
        <p className="mt-0.5 font-mono text-[11px] leading-relaxed text-amber-600/80 dark:text-amber-500/70">
          {lang === 'ko'
            ? '이 챕터는 아직 작성 중이에요. 내용이 불완전하거나 변경될 수 있습니다.'
            : 'This chapter is still being written. Content may be incomplete or change.'}
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

export function ChapterTitle({ icon, title, subtitle }: { icon?: ReactNode; num?: number; title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        {icon && <span className="shrink-0">{icon}</span>}
        <h1 className="text-3xl font-bold tracking-tight leading-tight">{title}</h1>
      </div>
      {subtitle && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}
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
    <p className={cn('mb-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line', className)}>{children}</p>
  )
}

type InfoVariant = 'tip' | 'note' | 'warning' | 'usage' | 'summary' | 'danger'
type InfoColor   = 'info' | 'tip' | 'warning' | 'danger'

interface VariantDef {
  color: string
  ko:    string
  en:    string
}

const VARIANT_ICON: Record<InfoVariant, ReactNode> = {
  tip:     <IconBulb          size={13} color="#e11d48" stroke={2} />,
  note:    <IconPin           size={13} color="#ea580c" stroke={2} />,
  warning: <IconAlertTriangle size={13} color="#1d4ed8" stroke={2} />,
  usage:   <IconTool          size={13} color="#7c3aed" stroke={2} />,
  summary: <IconRuler2        size={13} color="#ea580c" stroke={2} />,
  danger:  <IconAlertCircle   size={13} color="#0891b2" stroke={2} />,
}

const VARIANT_DEFS: Record<InfoVariant, VariantDef> = {
  tip:     { color: 'bg-ios-teal-light   border-ios-teal/20   text-ios-teal-dark',   ko: '더 알아보기',        en: 'Advanced' },
  note:    { color: 'bg-ios-blue-light   border-ios-blue/20   text-ios-blue-dark',   ko: '참고',              en: 'Note' },
  warning: { color: 'bg-ios-orange-light border-ios-orange/25 text-ios-orange-dark', ko: '주의',              en: 'Caution' },
  usage:   { color: 'bg-ios-green-light  border-ios-green/20  text-ios-green-dark',  ko: '어디서 사용할까?',   en: 'When to Use' },
  summary: { color: 'bg-ios-blue-light   border-ios-blue/20   text-ios-blue-dark',   ko: '핵심 정리',          en: 'Summary' },
  danger:  { color: 'bg-ios-red-light    border-ios-red/20    text-ios-red-dark',    ko: '위험',              en: 'Danger' },
}

const LEGACY_COLOR: Record<InfoColor, string> = {
  info:    'bg-ios-blue-light border-ios-blue/20 text-ios-blue-dark',
  tip:     'bg-ios-teal-light border-ios-teal/20 text-ios-teal-dark',
  warning: 'bg-ios-orange-light border-ios-orange/25 text-ios-orange-dark',
  danger:  'bg-ios-red-light border-ios-red/20 text-ios-red-dark',
}

export function InfoBox({ variant, color, icon, title, children }: {
  variant?: InfoVariant
  color?: InfoColor
  icon?: string
  title?: string
  children: ReactNode
}) {
  const lang = useSimulationStore((s) => s.lang)
  if (variant) {
    const def = VARIANT_DEFS[variant]
    const l   = lang
    return (
      <div className={cn('mt-4 mb-4 rounded-lg border p-4', def.color)}>
        <div className="mb-1.5 flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider">
          {VARIANT_ICON[variant]}
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

export function ConceptGrid({ items }: { items: Array<{ icon: ReactNode; title: string; desc: string; color?: string }> }) {
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

// ── AccordionSection ──────────────────────────────────────────────────────────
// 클릭하면 열리고 닫히는 섹션. title 아래 항상 border-b 표시.
export function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [hovered, setHovered] = useState(false)
  return (
    <div className="bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ backgroundColor: hovered ? 'rgba(255,243,224,0.4)' : '' }}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors duration-150"
      >
        <span className="text-base font-bold tracking-tight">{title}</span>
        <IconChevronDown
          size={16}
          className={cn('shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      <div className="border-b" />
      {open && <div className="px-5 py-5">{children}</div>}
    </div>
  )
}

// ── SqlBlock ─────────────────────────────────────────────────────────────────
// SQL 코드 블록. header/badge/desc가 있으면 카드 형태, 없으면 단순 코드 영역.
const SQL_BADGE: Record<string, string> = {
  violet:  'bg-violet-100 text-violet-700 border-violet-200',
  blue:    'bg-blue-100 text-blue-700 border-blue-200',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  orange:  'bg-orange-100 text-orange-700 border-orange-200',
  cyan:    'bg-cyan-100 text-cyan-700 border-cyan-200',
  rose:    'bg-rose-100 text-rose-700 border-rose-200',
}

export function SqlBlock({
  sql,
  activeClause,
  badge,
  badgeColor = 'blue',
  desc,
  className,
}: {
  sql: string
  activeClause?: string
  badge?: string
  badgeColor?: string
  desc?: string
  className?: string
}) {
  if (!badge && !desc) {
    return (
      <div className={cn('overflow-x-auto rounded-xl border bg-muted/30 px-4 py-3', className)}>
        <SqlHighlight sql={sql} activeClause={activeClause} />
      </div>
    )
  }
  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      <div className="flex items-start gap-3 border-b px-4 py-3">
        {badge && (
          <span className={cn('rounded border px-2 py-0.5 font-mono text-xs font-bold', SQL_BADGE[badgeColor] ?? SQL_BADGE.blue)}>
            {badge}
          </span>
        )}
        {desc && <p className="mb-0 text-sm font-bold text-foreground/90">{desc}</p>}
      </div>
      <div className="overflow-x-auto rounded-b-xl bg-muted/30 px-4 py-3">
        <SqlHighlight sql={sql} activeClause={activeClause} />
      </div>
    </div>
  )
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
  open: boolean
  onOpen: () => void
  onClose: () => void
  children: ReactNode
}

export function TermPopup({ label, title, open, onOpen, onClose, children }: TermPopupProps) {
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

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        onClick={() => open ? onClose() : onOpen()}
        className="cursor-pointer font-bold underline decoration-dotted underline-offset-2 hover:opacity-70 transition-opacity"
      >
        {label}
      </button>

      {open && (
        <div className="absolute left-full top-1/2 z-40 ml-2.5 w-96 -translate-y-1/2">
          {/* 말풍선 꼬리 */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-200" />
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <span className="font-mono text-xs font-bold text-slate-700">{title}</span>
              <button
                onClick={onClose}
                className="ml-auto opacity-40 hover:opacity-80 transition-opacity"
                aria-label="닫기"
              >
                <IconX size={13} />
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

// Shared UI primitives for book chapter pages
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto max-w-4xl px-8 py-10', className)}>
      {children}
    </div>
  )
}

export function ChapterTitle({ icon, num, title, subtitle }: { icon: string; num: number; title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <span className="font-mono text-2xl">{icon}</span>
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Chapter {String(num).padStart(2, '0')}
        </span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight leading-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 text-xl font-bold tracking-tight">{children}</h2>
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

export function InfoBox({ color = 'blue', icon, title, children }: {
  color?: 'blue' | 'orange' | 'violet' | 'emerald' | 'amber' | 'rose'
  icon?: string
  title?: string
  children: ReactNode
}) {
  const styles = {
    blue:    'bg-blue-50 border-blue-200 text-blue-800',
    orange:  'bg-orange-50 border-orange-200 text-orange-800',
    violet:  'bg-violet-50 border-violet-200 text-violet-800',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    amber:   'bg-amber-50 border-amber-200 text-amber-800',
    rose:    'bg-rose-50 border-rose-200 text-rose-800',
  }
  return (
    <div className={cn('mb-4 rounded-lg border p-4', styles[color])}>
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
    blue:    'border-blue-200 bg-blue-50/50',
    orange:  'border-orange-200 bg-orange-50/50',
    violet:  'border-violet-200 bg-violet-50/50',
    emerald: 'border-emerald-200 bg-emerald-50/50',
    amber:   'border-amber-200 bg-amber-50/50',
    rose:    'border-rose-200 bg-rose-50/50',
    cyan:    'border-cyan-200 bg-cyan-50/50',
    teal:    'border-teal-200 bg-teal-50/50',
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
    blue:    'border-blue-300 bg-blue-50 text-blue-700',
    violet:  'border-violet-300 bg-violet-50 text-violet-700',
    emerald: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    orange:  'border-orange-300 bg-orange-50 text-orange-700',
    cyan:    'border-cyan-300 bg-cyan-50 text-cyan-700',
    rose:    'border-rose-300 bg-rose-50 text-rose-700',
    amber:   'border-amber-300 bg-amber-50 text-amber-700',
    teal:    'border-teal-300 bg-teal-50 text-teal-700',
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

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Employee } from './shared'

export function EmpRow({
  row,
  highlighted,
  deleted,
  columns,
  original,
}: {
  row: Employee
  highlighted: boolean
  deleted: boolean
  columns: string[]
  original?: Employee
}) {
  const cols: Array<keyof Employee> =
    columns.length === 0
      ? ['emp_id', 'first_name', 'last_name', 'dept_id', 'salary', 'job_title', 'manager_id']
      : (columns as Array<keyof Employee>)

  return (
    <motion.tr
      layout
      animate={
        deleted
          ? { opacity: 0.25, scale: 0.97 }
          : highlighted
          ? { opacity: 1, scale: 1 }
          : { opacity: 0.4, scale: 1 }
      }
      transition={{ duration: 0.3 }}
      className={cn(
        'border-b last:border-0 transition-colors',
        highlighted && !deleted && 'bg-orange-50',
        deleted && 'bg-rose-50 line-through',
      )}
    >
      {cols.map((c) => {
        const val = row[c]
        const origVal = original?.[c]
        const changed = origVal !== undefined && origVal !== val
        return (
          <td key={c} className="px-3 py-1.5 font-mono text-[11px]">
            {changed ? (
              <span>
                <span className="text-rose-500 line-through mr-1">{String(origVal)}</span>
                <span className="text-emerald-600 font-bold">{String(val)}</span>
              </span>
            ) : (
              String(val ?? 'NULL')
            )}
          </td>
        )
      })}
    </motion.tr>
  )
}

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Employee } from './shared'

export function EmpRow({
  row,
  highlighted,
  deleted,
  columns,
  original,
  lang,
}: {
  row: Employee
  highlighted: boolean
  deleted: boolean
  columns: string[]
  original?: Employee
  lang?: 'ko' | 'en'
}) {
  const cols: Array<keyof Employee> =
    columns.length === 0
      ? ['emp_id', 'first_name', 'last_name', 'dept_id', 'salary', 'job_title', 'manager_id']
      : (columns as Array<keyof Employee>)

  function displayVal(emp: Employee, col: keyof Employee): string {
    if (lang === 'ko') {
      if (col === 'first_name') return emp.first_name_ko
      if (col === 'last_name') return emp.last_name_ko
    }
    return String(emp[col] ?? 'NULL')
  }

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
        highlighted && !deleted && 'bg-ios-blue-light',
        deleted && 'bg-ios-red-light line-through',
      )}
    >
      {cols.map((c) => {
        const val = displayVal(row, c)
        const origVal = original ? displayVal(original, c) : undefined
        const changed = origVal !== undefined && origVal !== val
        return (
          <td key={c} className="px-3 py-1.5 font-mono text-[11px]">
            {changed ? (
              <span>
                <span className="text-ios-red line-through mr-1">{origVal}</span>
                <span className="text-ios-teal-dark font-bold">{val}</span>
              </span>
            ) : (
              val
            )}
          </td>
        )
      })}
    </motion.tr>
  )
}

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  PageContainer, ChapterTitle, SectionTitle, SubTitle, Prose, InfoBox, Divider,
} from '../shared'
import { SqlHighlight } from './SqlHighlight'

const T = {
  ko: {
    chapterTitle: 'MERGE INTO',
    chapterSubtitle: 'MERGE INTO는 조건에 따라 INSERT와 UPDATE를 한 번에 처리하는 구문입니다. "있으면 업데이트, 없으면 삽입" 로직을 단 하나의 SQL로 표현할 수 있습니다.',
    whatTitle: 'MERGE INTO란?',
    whatDesc: 'MERGE INTO는 원본(source) 데이터를 대상(target) 테이블에 병합(merge)합니다. 대상 테이블에 이미 해당 행이 있으면 UPDATE, 없으면 INSERT를 수행합니다. 두 작업을 별도의 SQL로 나누지 않아도 됩니다.',
    structureTitle: '기본 구조',
    matchedTitle: 'WHEN MATCHED — 일치하는 행이 있을 때',
    matchedDesc: 'ON 조건에 맞는 행이 대상 테이블에 이미 존재하면 이 절이 실행됩니다. 보통 UPDATE로 기존 값을 갱신합니다.',
    notMatchedTitle: 'WHEN NOT MATCHED — 일치하는 행이 없을 때',
    notMatchedDesc: 'ON 조건에 맞는 행이 대상 테이블에 없으면 이 절이 실행됩니다. 보통 INSERT로 새 행을 추가합니다.',
    deleteTitle: 'WHEN MATCHED THEN DELETE',
    deleteDesc: 'UPDATE 후 추가 조건을 만족하면 해당 행을 삭제할 수도 있습니다. DELETE는 항상 WHEN MATCHED 안에서만 사용합니다.',
    simulatorTitle: '인터랙티브 시뮬레이터',
    simulatorDesc: '원본 데이터 행을 선택하면 대상 테이블에 어떤 변화가 생기는지 확인할 수 있습니다.',
    sourceTable: '원본 테이블 (SOURCE)',
    targetTable: '대상 테이블 (TARGET)',
    resultTable: 'MERGE 결과',
    selectRow: '원본 행 선택',
    matched: '일치 → UPDATE',
    notMatched: '불일치 → INSERT',
    unchanged: '변경 없음',
    runMerge: '전체 MERGE 실행',
    reset: '초기화',
    usecaseTitle: '언제 쓰나요?',
    usecases: [
      { icon: '🔄', title: '동기화', desc: '외부 시스템에서 받아온 데이터를 내부 테이블에 반영할 때' },
      { icon: '📥', title: 'Upsert', desc: '있으면 업데이트, 없으면 삽입 — 중복 체크 없이 한 번에' },
      { icon: '🧹', title: '조건부 삭제', desc: '특정 조건을 만족하는 행을 업데이트 후 삭제할 때' },
    ],
    onColumnTitle: 'ON 절 컬럼은 UPDATE/DELETE 할 수 없습니다',
    onColumnDesc: 'ON 절에서 두 테이블을 연결하는 데 쓰인 컬럼은 WHEN MATCHED THEN UPDATE나 DELETE의 대상이 될 수 없습니다. Oracle이 행을 식별하는 기준 자체를 바꾸는 것이기 때문입니다.',
    onColumnWhy: '왜 그럴까요? ON 절은 "이 행이 원본과 같은 행인지" 판별하는 키입니다. 이 값을 UPDATE로 바꾸면 Oracle이 같은 행을 다시 찾을 수 없게 되므로 허용하지 않습니다.',
    onColumnBadLabel: '오류 — ON 절 컬럼(emp_id)을 UPDATE 시도',
    onColumnGoodLabel: '올바른 방법 — ON 절 컬럼이 아닌 컬럼만 UPDATE',
    noteTitle: '주의사항',
    noteItems: [
      'WHEN MATCHED와 WHEN NOT MATCHED는 둘 다 써도 되고 하나만 써도 됩니다.',
      'Oracle 9i 이상에서 지원합니다.',
    ],
  },
  en: {
    chapterTitle: 'MERGE INTO',
    chapterSubtitle: 'MERGE INTO lets you INSERT and UPDATE in a single statement based on a condition — "update if exists, insert if not."',
    whatTitle: 'What is MERGE INTO?',
    whatDesc: 'MERGE INTO merges source data into a target table. If a matching row already exists in the target, it runs UPDATE; otherwise it runs INSERT. No need to split the logic into two separate SQL statements.',
    structureTitle: 'Basic Structure',
    matchedTitle: 'WHEN MATCHED — Row found in target',
    matchedDesc: 'When the ON condition finds a matching row in the target table, this clause executes. Typically used to UPDATE the existing row.',
    notMatchedTitle: 'WHEN NOT MATCHED — No matching row',
    notMatchedDesc: 'When the ON condition finds no match in the target table, this clause executes. Typically used to INSERT a new row.',
    deleteTitle: 'WHEN MATCHED THEN DELETE',
    deleteDesc: 'After an UPDATE, you can optionally DELETE the row if an additional condition is met. DELETE is only allowed inside WHEN MATCHED.',
    simulatorTitle: 'Interactive Simulator',
    simulatorDesc: 'Select a source row to see what happens to the target table.',
    sourceTable: 'Source Table (SOURCE)',
    targetTable: 'Target Table (TARGET)',
    resultTable: 'MERGE Result',
    selectRow: 'Select source row',
    matched: 'Matched → UPDATE',
    notMatched: 'Not matched → INSERT',
    unchanged: 'No change',
    runMerge: 'Run full MERGE',
    reset: 'Reset',
    usecaseTitle: 'When to use it?',
    usecases: [
      { icon: '🔄', title: 'Sync', desc: 'Apply incoming data from an external system to an internal table' },
      { icon: '📥', title: 'Upsert', desc: 'Update if exists, insert if not — no duplicate checks needed' },
      { icon: '🧹', title: 'Conditional delete', desc: 'Delete rows that meet a condition after an update' },
    ],
    onColumnTitle: 'ON clause columns cannot be UPDATE-d or DELETE-d',
    onColumnDesc: 'Columns used in the ON clause to join the two tables cannot be the target of WHEN MATCHED THEN UPDATE or DELETE. They are the key Oracle uses to identify the row.',
    onColumnWhy: 'Why? The ON clause is how Oracle decides "is this the same row as the source?" If you update that key, Oracle can no longer find the row again — so it simply disallows it.',
    onColumnBadLabel: 'Error — trying to UPDATE the ON clause column (emp_id)',
    onColumnGoodLabel: 'Correct — only UPDATE columns not used in ON',
    noteTitle: 'Important notes',
    noteItems: [
      'You can use both WHEN MATCHED and WHEN NOT MATCHED, or just one of them.',
      'Supported in Oracle 9i and above.',
    ],
  },
}

export { T as MergeT }

// ── Data ──────────────────────────────────────────────────────────────────────

interface SourceRow { emp_id: number; first_name: string; dept_id: number; salary: number }
interface TargetRow { emp_id: number; first_name: string; dept_id: number; salary: number; status?: string }

const SOURCE_ROWS: SourceRow[] = [
  { emp_id: 101, first_name: 'Alice',  dept_id: 10, salary: 8000 },
  { emp_id: 102, first_name: 'Bob',    dept_id: 20, salary: 5600 },
  { emp_id: 110, first_name: 'Iris',   dept_id: 30, salary: 4200 },
  { emp_id: 111, first_name: 'Jake',   dept_id: 10, salary: 7100 },
]

const INITIAL_TARGET: TargetRow[] = [
  { emp_id: 101, first_name: 'Alice',  dept_id: 10, salary: 7200 },
  { emp_id: 102, first_name: 'Bob',    dept_id: 20, salary: 5400 },
  { emp_id: 103, first_name: 'Carol',  dept_id: 10, salary: 8100 },
  { emp_id: 104, first_name: 'David',  dept_id: 30, salary: 4900 },
]

const MERGE_SQL = `MERGE INTO employees t
USING new_salaries s
  ON (t.emp_id = s.emp_id)
WHEN MATCHED THEN
  UPDATE SET t.salary = s.salary
WHEN NOT MATCHED THEN
  INSERT (emp_id, first_name, dept_id, salary)
  VALUES (s.emp_id, s.first_name,
          s.dept_id, s.salary)`

const STRUCTURE_SQL = `MERGE INTO target_table t
USING source_table s
  ON (t.join_key = s.join_key)
WHEN MATCHED THEN
  UPDATE SET t.col1 = s.col1,
             t.col2 = s.col2
WHEN NOT MATCHED THEN
  INSERT (col1, col2, col3)
  VALUES (s.col1, s.col2, s.col3)`

const DELETE_SQL = `MERGE INTO employees t
USING former_employees s
  ON (t.emp_id = s.emp_id)
WHEN MATCHED THEN
  UPDATE SET t.salary = s.salary
  DELETE WHERE t.dept_id = 99`

const ON_COLUMN_BAD_SQL = `-- ❌ ORA-38104: ON 절에서 참조된 컬럼은 업데이트할 수 없습니다
MERGE INTO employees t
USING new_data s
  ON (t.emp_id = s.emp_id)   -- emp_id 가 ON 절 컬럼
WHEN MATCHED THEN
  UPDATE SET t.emp_id = s.emp_id,  -- ❌ 오류: ON 절 컬럼 수정 불가
             t.salary = s.salary`

const ON_COLUMN_GOOD_SQL = `-- ✅ ON 절 컬럼(emp_id)은 건드리지 않고
--    나머지 컬럼만 UPDATE
MERGE INTO employees t
USING new_data s
  ON (t.emp_id = s.emp_id)
WHEN MATCHED THEN
  UPDATE SET t.salary  = s.salary,
             t.dept_id = s.dept_id`

// ── Simulator ─────────────────────────────────────────────────────────────────

type RowState = 'updated' | 'inserted' | 'unchanged'

function MergeSimulator({ t }: { t: typeof T['ko'] }) {
  const [target, setTarget] = useState<TargetRow[]>(INITIAL_TARGET)
  const [rowStates, setRowStates] = useState<Record<number, RowState>>({})
  const [selectedSrc, setSelectedSrc] = useState<number | null>(null)

  function applyRow(src: SourceRow) {
    setSelectedSrc(src.emp_id)
    const exists = target.some((r) => r.emp_id === src.emp_id)
    if (exists) {
      setTarget((prev) => prev.map((r) => r.emp_id === src.emp_id ? { ...r, salary: src.salary } : r))
      setRowStates((prev) => ({ ...prev, [src.emp_id]: 'updated' }))
    } else {
      setTarget((prev) => [...prev, { ...src }])
      setRowStates((prev) => ({ ...prev, [src.emp_id]: 'inserted' }))
    }
  }

  function runAll() {
    let next = [...INITIAL_TARGET]
    const states: Record<number, RowState> = {}
    for (const src of SOURCE_ROWS) {
      const exists = next.some((r) => r.emp_id === src.emp_id)
      if (exists) {
        next = next.map((r) => r.emp_id === src.emp_id ? { ...r, salary: src.salary } : r)
        states[src.emp_id] = 'updated'
      } else {
        next = [...next, { ...src }]
        states[src.emp_id] = 'inserted'
      }
    }
    setTarget(next)
    setRowStates(states)
    setSelectedSrc(null)
  }

  function reset() {
    setTarget(INITIAL_TARGET)
    setRowStates({})
    setSelectedSrc(null)
  }

  const stateStyle: Record<RowState, string> = {
    updated:   'bg-amber-50 border-amber-300',
    inserted:  'bg-emerald-50 border-emerald-300',
    unchanged: '',
  }
  const stateBadge: Record<RowState, string> = {
    updated:  'bg-amber-100 text-amber-700',
    inserted: 'bg-emerald-100 text-emerald-700',
    unchanged: '',
  }
  const stateLabelKo: Record<RowState, string> = {
    updated:  '→ UPDATE',
    inserted: '→ INSERT',
    unchanged: '',
  }

  return (
    <div className="rounded-xl border bg-muted/20 p-5">
      <div className="flex flex-wrap gap-6 items-start">

        {/* Source */}
        <div className="min-w-[220px]">
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t.sourceTable}
          </div>
          <div className="flex flex-col gap-1.5">
            {SOURCE_ROWS.map((src) => {
              const state = rowStates[src.emp_id]
              const isSelected = selectedSrc === src.emp_id
              return (
                <button
                  key={src.emp_id}
                  onClick={() => applyRow(src)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left transition-all font-mono text-xs',
                    isSelected
                      ? 'border-blue-400 bg-blue-50 shadow-sm'
                      : 'border-border bg-background hover:bg-muted/50',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-foreground/80">#{src.emp_id} {src.first_name}</span>
                    {state && (
                      <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', stateBadge[state])}>
                        {stateLabelKo[state]}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    dept:{src.dept_id} / salary:{src.salary.toLocaleString()}
                  </div>
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={runAll}
              className="rounded-md bg-blue-600 px-3 py-1.5 font-mono text-[11px] font-bold text-white hover:bg-blue-700 transition-colors"
            >
              {t.runMerge}
            </button>
            <button
              onClick={reset}
              className="rounded-md border px-3 py-1.5 font-mono text-[11px] text-muted-foreground hover:bg-muted transition-colors"
            >
              {t.reset}
            </button>
          </div>
        </div>

        {/* Target / Result */}
        <div className="flex-1 min-w-[280px]">
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {Object.keys(rowStates).length > 0 ? t.resultTable : t.targetTable}
          </div>
          <div className="inline-block rounded-lg border overflow-hidden">
            <table className="text-xs">
              <thead>
                <tr className="border-b bg-muted/60">
                  {['emp_id', 'first_name', 'dept_id', 'salary'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                  <th className="px-3 py-2 text-left font-mono font-bold text-muted-foreground whitespace-nowrap">status</th>
                </tr>
              </thead>
              <tbody>
                {target.map((row, i) => {
                  const state = rowStates[row.emp_id]
                  const orig = INITIAL_TARGET.find((r) => r.emp_id === row.emp_id)
                  return (
                    <tr
                      key={row.emp_id}
                      className={cn(
                        'border-b last:border-0 transition-colors',
                        state ? stateStyle[state] : (i % 2 === 0 ? 'bg-background' : 'bg-muted/20'),
                      )}
                    >
                      <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.emp_id}</td>
                      <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.first_name}</td>
                      <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.dept_id}</td>
                      <td className={cn(
                        'px-3 py-1.5 font-mono text-[11px] whitespace-nowrap font-bold',
                        state === 'updated' && orig?.salary !== row.salary ? 'text-amber-700' : 'text-foreground/80',
                      )}>
                        {row.salary.toLocaleString()}
                        {state === 'updated' && orig && orig.salary !== row.salary && (
                          <span className="ml-1.5 font-normal text-muted-foreground line-through text-[10px]">
                            {orig.salary.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap">
                        {state === 'updated' && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">UPDATED</span>}
                        {state === 'inserted' && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">INSERTED</span>}
                        {!state && <span className="text-muted-foreground/40">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function MergeSection({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle icon="🔀" num={1} title={t.chapterTitle} subtitle={t.chapterSubtitle} />

      {/* What is MERGE */}
      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <InfoBox color="blue" icon="💡" title={t.usecaseTitle}>
        <div className="flex flex-col gap-2 mt-1">
          {t.usecases.map((u, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-base shrink-0">{u.icon}</span>
              <div>
                <span className="font-bold">{u.title}</span>
                <span className="ml-1 text-current/80">— {u.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </InfoBox>

      <Divider />

      {/* Basic structure */}
      <SectionTitle>{t.structureTitle}</SectionTitle>
      <div className="mb-6 rounded-xl border overflow-hidden">
        <div className="border-b px-4 py-2">
          <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">SQL</span>
        </div>
        <div className="p-4">
          <SqlHighlight sql={STRUCTURE_SQL} />
        </div>
      </div>

      {/* WHEN MATCHED */}
      <SubTitle>{t.matchedTitle}</SubTitle>
      <Prose>{t.matchedDesc}</Prose>

      {/* WHEN NOT MATCHED */}
      <SubTitle>{t.notMatchedTitle}</SubTitle>
      <Prose>{t.notMatchedDesc}</Prose>

      <Divider />

      {/* DELETE variant */}
      <SectionTitle>{t.deleteTitle}</SectionTitle>
      <Prose>{t.deleteDesc}</Prose>
      <div className="mb-6 rounded-xl border overflow-hidden">
        <div className="border-b px-4 py-2">
          <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">SQL</span>
        </div>
        <div className="p-4">
          <SqlHighlight sql={DELETE_SQL} />
        </div>
      </div>

      <Divider />

      {/* ON column restriction */}
      <SectionTitle>{t.onColumnTitle}</SectionTitle>
      <Prose>{t.onColumnDesc}</Prose>
      <InfoBox color="violet" icon="🔍">
        <span>{t.onColumnWhy}</span>
      </InfoBox>

      <div className="mb-3 text-[11px] font-mono font-bold text-rose-600 flex items-center gap-1.5">
        <span className="rounded bg-rose-100 px-2 py-0.5">{t.onColumnBadLabel}</span>
      </div>
      <div className="mb-5 rounded-xl border border-rose-200 overflow-hidden">
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-2">
          <span className="font-mono text-[10px] text-rose-400 uppercase tracking-widest">SQL — Error</span>
        </div>
        <div className="p-4">
          <SqlHighlight sql={ON_COLUMN_BAD_SQL} />
        </div>
      </div>

      <div className="mb-3 text-[11px] font-mono font-bold text-emerald-600 flex items-center gap-1.5">
        <span className="rounded bg-emerald-100 px-2 py-0.5">{t.onColumnGoodLabel}</span>
      </div>
      <div className="mb-6 rounded-xl border border-emerald-200 overflow-hidden">
        <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-2">
          <span className="font-mono text-[10px] text-emerald-500 uppercase tracking-widest">SQL — Correct</span>
        </div>
        <div className="p-4">
          <SqlHighlight sql={ON_COLUMN_GOOD_SQL} />
        </div>
      </div>

      <Divider />

      {/* Simulator */}
      <SectionTitle>{t.simulatorTitle}</SectionTitle>
      <Prose>{t.simulatorDesc}</Prose>
      <div className="mb-6 rounded-xl border overflow-hidden">
        <div className="border-b px-4 py-2">
          <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">SQL — MERGE 예시</span>
        </div>
        <div className="p-4">
          <SqlHighlight sql={MERGE_SQL} />
        </div>
      </div>
      <MergeSimulator t={t} />

      <Divider />

      {/* Notes */}
      <InfoBox color="amber" icon="⚠️" title={t.noteTitle}>
        <ul className="flex flex-col gap-1 mt-1 list-disc list-inside">
          {t.noteItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </InfoBox>
    </PageContainer>
  )
}

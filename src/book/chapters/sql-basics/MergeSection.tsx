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
    exampleTitle: '예시 쿼리',
    sourceTable: '원본 테이블 (SOURCE)',
    targetTable: '대상 테이블 (TARGET)',
    resultTable: 'MERGE 결과',
    matched: '일치 → UPDATE',
    notMatched: '불일치 → INSERT',
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
    exampleTitle: 'Example Query',
    sourceTable: 'Source Table (SOURCE)',
    targetTable: 'Target Table (TARGET)',
    resultTable: 'MERGE Result',
    matched: 'Matched → UPDATE',
    notMatched: 'Not matched → INSERT',
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

// ── Static merge table ────────────────────────────────────────────────────────

const MERGE_TABLE_COLS = ['emp_id', 'first_name', 'dept_id', 'salary'] as const

function MergeTableHeader() {
  return (
    <thead>
      <tr className="border-b bg-muted/60">
        {MERGE_TABLE_COLS.map((h) => (
          <th key={h} className="px-3 py-2 text-left font-mono text-[10px] font-bold text-muted-foreground whitespace-nowrap">{h}</th>
        ))}
      </tr>
    </thead>
  )
}

type RowState = 'updated' | 'inserted'

const MERGE_ROW_STATES: Record<number, RowState> = Object.fromEntries([
  ...SOURCE_ROWS.map((s) => [
    s.emp_id,
    INITIAL_TARGET.some((r) => r.emp_id === s.emp_id) ? 'updated' : 'inserted',
  ]),
]) as Record<number, RowState>

const RESULT_ROWS: TargetRow[] = [
  ...INITIAL_TARGET.map((r) => {
    const src = SOURCE_ROWS.find((s) => s.emp_id === r.emp_id)
    if (src) return { ...r, salary: src.salary }
    return { ...r }
  }),
  ...SOURCE_ROWS.filter((s) => !INITIAL_TARGET.some((r) => r.emp_id === s.emp_id)),
]

function MergeTables({ t }: { t: typeof T['ko'] }) {
  return (
    <div className="rounded-xl border bg-muted/20 overflow-hidden">
      {/* Legend */}
      <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-2.5">
        <span className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-ios-orange-light border border-ios-orange/30" />
          <span className="text-ios-orange-dark font-bold">{t.matched}</span>
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-ios-teal-light border border-ios-teal/30" />
          <span className="text-ios-teal-dark font-bold">{t.notMatched}</span>
        </span>
      </div>

      {/* 3-panel layout */}
      <div className="grid grid-cols-1 gap-0 lg:grid-cols-3 lg:divide-x">

        {/* SOURCE */}
        <div className="p-4">
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t.sourceTable}
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs">
              <MergeTableHeader />
              <tbody>
                {SOURCE_ROWS.map((src) => {
                  const state = MERGE_ROW_STATES[src.emp_id]
                  return (
                    <tr
                      key={src.emp_id}
                      className={cn(
                        'border-b last:border-0',
                        state === 'updated'  ? 'bg-ios-orange-light' : 'bg-ios-teal-light',
                      )}
                    >
                      <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{src.emp_id}</td>
                      <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{src.first_name}</td>
                      <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{src.dept_id}</td>
                      <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{src.salary.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* TARGET */}
        <div className="p-4 border-t lg:border-t-0">
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t.targetTable}
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs">
              <MergeTableHeader />
              <tbody>
                {INITIAL_TARGET.map((row, i) => (
                  <tr key={row.emp_id} className={cn('border-b last:border-0', i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
                    <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.emp_id}</td>
                    <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.first_name}</td>
                    <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.dept_id}</td>
                    <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.salary.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RESULT */}
        <div className="p-4 border-t lg:border-t-0">
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t.resultTable}
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/60">
                  {MERGE_TABLE_COLS.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-mono text-[10px] font-bold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                  <th className="px-3 py-2 text-left font-mono text-[10px] font-bold text-muted-foreground whitespace-nowrap">status</th>
                </tr>
              </thead>
              <tbody>
                {RESULT_ROWS.map((row) => {
                  const state = MERGE_ROW_STATES[row.emp_id]
                  const orig = INITIAL_TARGET.find((r) => r.emp_id === row.emp_id)
                  return (
                    <tr
                      key={row.emp_id}
                      className={cn(
                        'border-b last:border-0',
                        state === 'updated'  ? 'bg-ios-orange-light' :
                        state === 'inserted' ? 'bg-ios-teal-light'   : '',
                      )}
                    >
                      <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.emp_id}</td>
                      <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.first_name}</td>
                      <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground/80">{row.dept_id}</td>
                      <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap">
                        {state === 'updated' && orig && orig.salary !== row.salary ? (
                          <span>
                            <span className="text-ios-red line-through mr-1 text-[10px]">{orig.salary.toLocaleString()}</span>
                            <span className="font-bold text-ios-orange-dark">{row.salary.toLocaleString()}</span>
                          </span>
                        ) : (
                          <span className="text-foreground/80">{row.salary.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap">
                        {state === 'updated'  && <span className="rounded bg-ios-orange/20 px-1.5 py-0.5 text-[10px] font-bold text-ios-orange-dark">UPDATED</span>}
                        {state === 'inserted' && <span className="rounded bg-ios-teal/20 px-1.5 py-0.5 text-[10px] font-bold text-ios-teal-dark">INSERTED</span>}
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
    <PageContainer className="max-w-5xl">
      <ChapterTitle icon="🔀" num={1} title={t.chapterTitle} subtitle={t.chapterSubtitle} />

      {/* What is MERGE */}
      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <InfoBox variant="usage" lang={lang}>
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

      {/* Example query */}
      <SectionTitle>{t.exampleTitle}</SectionTitle>
      <div className="mb-6 rounded-xl border overflow-hidden">
        <div className="border-b px-4 py-2">
          <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">SQL</span>
        </div>
        <div className="p-4">
          <SqlHighlight sql={MERGE_SQL} />
        </div>
      </div>
      <MergeTables t={t} />

      <Divider />

      {/* ON column restriction */}
      <SectionTitle>{t.onColumnTitle}</SectionTitle>
      <Prose>{t.onColumnDesc}</Prose>
      <InfoBox variant="note" lang={lang}>
        <span>{t.onColumnWhy}</span>
      </InfoBox>

      <div className="mb-3 text-[11px] font-mono font-bold text-ios-red-dark flex items-center gap-1.5">
        <span className="rounded bg-ios-red-light px-2 py-0.5">{t.onColumnBadLabel}</span>
      </div>
      <div className="mb-5 rounded-xl border border-ios-red/30 overflow-hidden">
        <div className="border-b border-ios-red/30 bg-ios-red-light px-4 py-2">
          <span className="font-mono text-[10px] text-ios-red-dark uppercase tracking-widest">SQL — Error</span>
        </div>
        <div className="p-4">
          <SqlHighlight sql={ON_COLUMN_BAD_SQL} />
        </div>
      </div>

      <div className="mb-3 text-[11px] font-mono font-bold text-ios-teal-dark flex items-center gap-1.5">
        <span className="rounded bg-ios-teal-light px-2 py-0.5">{t.onColumnGoodLabel}</span>
      </div>
      <div className="mb-6 rounded-xl border border-ios-teal/30 overflow-hidden">
        <div className="border-b border-ios-teal/30 bg-ios-teal-light px-4 py-2">
          <span className="font-mono text-[10px] text-ios-teal-dark uppercase tracking-widest">SQL — Correct</span>
        </div>
        <div className="p-4">
          <SqlHighlight sql={ON_COLUMN_GOOD_SQL} />
        </div>
      </div>

      <Divider />

      {/* Notes */}
      <InfoBox variant="warning" lang={lang}>
        <ul className="flex flex-col gap-1 mt-1 list-disc list-inside">
          {t.noteItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </InfoBox>
    </PageContainer>
  )
}

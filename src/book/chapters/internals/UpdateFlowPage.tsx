import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { ChapterTitle, Prose } from '../shared'
import type { Lang } from '../shared'
import { OracleInstanceMap } from './OracleInstanceMap'
import type { InstanceComponentId } from './OracleInstanceMap'
import { cn } from '@/lib/utils'

type FlowStep = {
  stepKo: string
  stepEn: string
  titleKo: string
  titleEn: string
  descKo: string
  descEn: string
  highlightIds: InstanceComponentId[]
  badgeCls: string
}

const FLOW_STEPS: FlowStep[] = [
  {
    stepKo: '① 파싱',
    stepEn: '① Parse',
    titleKo: 'SQL의 의미를 분석하고 실행 계획을 세웁니다',
    titleEn: 'Understand the SQL and decide how to run it',
    descKo: '클라이언트가 UPDATE 문을 보내는 순간, Oracle은 이 요청만을 전담할 Server Process를 새로 만들고 PGA 메모리를 배정합니다. 마치 식당에서 주문이 들어오면 웨이터 한 명이 배정되는 것처럼요.\n\nServer Process는 가장 먼저 Library Cache를 들여다봅니다. 이전에 똑같은 SQL을 누군가 실행한 적이 있으면 분석 결과(커서)가 저장돼 있고, 이를 그대로 재사용합니다. 이것을 Soft Parse라고 합니다.\n\n처음 보는 SQL이라면 Hard Parse가 시작됩니다. Dictionary Cache에서 EMPLOYEES 테이블이 실제로 존재하는지, SALARY 컬럼의 타입은 무엇인지, 이 사용자에게 UPDATE 권한이 있는지 확인합니다. 그런 다음 옵티마이저가 "어느 인덱스를 쓸지", "어떤 순서로 실행할지"를 결정하고, 그 결과를 Library Cache에 저장해 둡니다.',
    descEn: 'The moment the client sends an UPDATE, Oracle creates a brand-new Server Process dedicated to this request and gives it a slice of PGA memory — like a waiter assigned the moment an order arrives.\n\nThe Server Process immediately checks the Library Cache. If someone has run the exact same SQL before, the analysis result (cursor) is already stored there and gets reused as-is. This is called a Soft Parse.\n\nIf the SQL is new, a Hard Parse begins. Oracle checks the Dictionary Cache to confirm that the EMPLOYEES table exists, what type SALARY is, and whether this user has UPDATE privilege. Then the Optimizer decides which index to use and in what order to execute things, and stores that plan in the Library Cache for next time.',
    highlightIds: ['server-process', 'pga', 'shared-pool', 'library-cache', 'dict-cache'],
    badgeCls: 'bg-teal-500',
  },
  {
    stepKo: '② 블록 읽기',
    stepEn: '② Read Block',
    titleKo: '변경할 행이 담긴 데이터 블록을 메모리로 가져옵니다',
    titleEn: 'Bring the target data block into memory',
    descKo: '실행 계획이 정해지면 Server Process는 UPDATE할 행이 담긴 데이터 블록을 찾아 Buffer Cache로 가져옵니다. Oracle은 데이터를 행 단위가 아니라 블록(기본 8KB) 단위로 읽습니다. 마치 책의 한 페이지를 통째로 펼쳐 놓는 것과 같습니다.\n\n운이 좋으면 그 블록이 이미 Buffer Cache에 있습니다(Buffer Hit). 이전에 누군가 같은 블록을 읽은 적이 있다면 Oracle이 메모리에 계속 들고 있기 때문입니다. 이 경우 디스크 접근 없이 바로 다음 단계로 넘어갑니다.\n\n블록이 없다면(Buffer Miss) 디스크의 데이터 파일(.dbf)에서 직접 읽어와 Buffer Cache에 올립니다. 아직 이 단계에서는 어떤 값도 바뀌지 않았습니다. 단지 필요한 재료를 작업대 위에 올려놓은 것입니다.',
    descEn: 'Once the execution plan is set, the Server Process finds the data block containing the row to UPDATE and brings it into the Buffer Cache. Oracle works in blocks (8 KB by default), not individual rows — like opening a whole page of a book at once.\n\nIf the block is already in the Buffer Cache (Buffer Hit), it was left there by a previous reader. Oracle skips the disk entirely and moves straight to the next step.\n\nIf not (Buffer Miss), Oracle reads the block from the on-disk data file (.dbf) and loads it into the Buffer Cache. Nothing has been changed yet at this point — the data is just on the workbench, ready to be modified.',
    highlightIds: ['server-process', 'buffer-cache', 'disk'],
    badgeCls: 'bg-blue-500',
  },
  {
    stepKo: '③ Undo 기록',
    stepEn: '③ Write Undo',
    titleKo: '변경 전 값을 Undo에 보관합니다 — 되돌리기 보험',
    titleEn: 'Save the before-image to Undo — your rollback insurance',
    descKo: '행을 실제로 바꾸기 전에 Oracle은 현재 값을 Undo Segment에 먼저 적어 둡니다. 마치 편집 전 원본 파일을 복사해 두는 것처럼요.\n\nUndo는 두 가지 상황에서 꺼내 씁니다. 첫 번째는 ROLLBACK입니다. 트랜잭션을 취소하면 Oracle이 이 원본 값으로 행을 되돌립니다. 두 번째는 읽기 일관성(Read Consistency)입니다. 내가 UPDATE 중일 때 다른 세션이 같은 행을 SELECT한다면, Oracle은 그 세션에게 Undo에서 꺼낸 "변경 이전의 깨끗한 값"을 보여줍니다. 덕분에 읽는 쪽이 쓰는 쪽을 기다릴 필요가 없습니다.\n\nUndo 기록이 끝나면 비로소 Buffer Cache의 블록 안에 있는 행의 값이 바뀝니다.',
    descEn: "Before touching the row, Oracle writes the current value to the Undo Segment — like making a copy of the original file before editing it.\n\nUndo is pulled out in two situations. First, on ROLLBACK: if the transaction is cancelled, Oracle uses this original value to restore the row. Second, for Read Consistency: if another session SELECTs the same row while you're updating it, Oracle shows that session the clean before-image from Undo, so readers never have to wait for a writer to finish.\n\nOnly after Undo is safely written does Oracle actually change the value of the row inside the Buffer Cache block.",
    highlightIds: ['server-process', 'undo', 'buffer-cache'],
    badgeCls: 'bg-amber-500',
  },
  {
    stepKo: '④ Redo 기록',
    stepEn: '④ Write Redo',
    titleKo: '무슨 일이 있었는지 Redo에 기록합니다 — 복구 일지',
    titleEn: 'Write what happened to Redo — the recovery journal',
    descKo: '행의 값이 바뀌면 Oracle은 그 변경 내용(Undo 기록 포함)을 Redo Log Buffer에 씁니다. Redo는 일종의 항공기 블랙박스 같은 것입니다. "이 테이블의 이 블록에서 이 값을 저 값으로 바꿨다"는 기록이 순서대로 쌓입니다.\n\n만약 서버가 지금 갑자기 꺼진다면 어떻게 될까요? Buffer Cache에만 있던 변경 내용은 사라지지만, Redo Log Buffer의 내용이 디스크에 남아 있으면 다음 시작 때 SMON이 이 기록을 읽어 변경을 다시 재현합니다(Instance Recovery). 이것이 Oracle이 데이터를 잃지 않는 핵심 원리입니다.\n\nRedo Log Buffer는 메모리에 있어 쓰기가 빠릅니다. 디스크까지 내려쓰는 것은 COMMIT 때 LGWR이 담당합니다.',
    descEn: "Once the row's value changes, Oracle writes that change (including the Undo entry) to the Redo Log Buffer. Think of Redo as the database's flight recorder: it logs in sequence — 'in this table, in this block, this value was changed to that value'.\n\nWhat if the server crashes right now? The changes in the Buffer Cache would be lost, but as long as the Redo Log Buffer's contents reach disk, SMON will re-apply them on the next startup (Instance Recovery). This is the core principle behind Oracle's durability.\n\nThe Redo Log Buffer lives in memory, so writing to it is fast. Flushing it all the way to disk is LGWR's job, which happens at COMMIT.",
    highlightIds: ['server-process', 'redo-buffer', 'buffer-cache'],
    badgeCls: 'bg-orange-500',
  },
  {
    stepKo: '⑤ COMMIT',
    stepEn: '⑤ COMMIT',
    titleKo: 'LGWR가 Redo를 디스크에 씁니다 — 그 순간 COMMIT 완료',
    titleEn: 'LGWR writes Redo to disk — that moment is COMMIT',
    descKo: '클라이언트가 COMMIT을 실행하면 Oracle은 LGWR(Log Writer)에게 "지금 Redo Log Buffer에 쌓인 모든 내용을 당장 디스크 Redo Log File에 써라"고 지시합니다. LGWR이 디스크에 다 쓴 것을 확인해야만 비로소 COMMIT 성공 응답이 클라이언트에게 돌아갑니다.\n\n흥미로운 점이 있습니다. 이 시점에 Buffer Cache의 변경된 블록은 아직 디스크 데이터 파일에 안 써도 됩니다. Redo가 디스크에 있으면 크래시가 나도 복구할 수 있으니까요. 데이터 파일에 실제로 쓰는 것은 DBWn이 나중에 여유 있을 때 처리합니다. 이렇게 하면 COMMIT 시 매번 느린 디스크 데이터 쓰기를 기다리지 않아도 됩니다.\n\nCKPT는 주기적으로 "여기까지의 변경은 모두 데이터 파일에 반영됐다"는 시점(SCN)을 컨트롤 파일에 기록합니다. 다음 복구 때 Redo를 어디서부터 읽으면 되는지 알 수 있습니다.',
    descEn: "When the client issues COMMIT, Oracle tells LGWR (Log Writer): 'Write everything in the Redo Log Buffer to the on-disk Redo Log File, right now.' Only after LGWR confirms that write is done does Oracle send the success response back to the client.\n\nHere's the interesting part: at this moment, the modified blocks in the Buffer Cache still don't need to be written to the data files on disk. As long as Redo is on disk, a crash is survivable. DBWn handles writing to the data files later, in the background, at a convenient time. This way COMMIT doesn't have to wait for slow data-file writes every single time.\n\nCKPT periodically records a checkpoint — the SCN up to which all changes have been flushed to data files — into the control file. This tells Oracle exactly where to start replaying Redo on the next recovery.",
    highlightIds: ['lgwr', 'redo-buffer', 'redo-log-file', 'ckpt', 'control-file'],
    badgeCls: 'bg-rose-500',
  },
  {
    stepKo: '⑥ DBWn 기록',
    stepEn: '⑥ DBWn Write',
    titleKo: 'DBWn이 변경된 블록을 데이터 파일에 영구 저장합니다',
    titleEn: 'DBWn permanently saves the changed blocks to data files',
    descKo: 'COMMIT이 끝나도 Buffer Cache의 변경된 블록(Dirty 블록)은 아직 메모리 안에 있습니다. 이 블록들을 실제 디스크 데이터 파일(.dbf)에 써서 영구히 저장하는 일은 DBWn(Database Writer)이 합니다.\n\nDBWn은 사용자 요청마다 즉시 쓰지 않습니다. Buffer Cache가 꽉 차서 새 블록을 올릴 공간이 필요할 때, 또는 CKPT가 체크포인트를 발생시킬 때 등 적절한 시점을 골라 여러 블록을 한꺼번에 씁니다. 이렇게 묶어서 쓰면 디스크 I/O 횟수가 크게 줄어듭니다.\n\nDBWn이 쓰기를 마친 블록은 더 이상 Dirty가 아니고, 필요하다면 Buffer Cache에서 밀려날 수 있습니다.\n\n이것으로 UPDATE 하나의 여행이 끝납니다. 앞으로 오라클의 다양한 기능들을 배우면서 이 과정을 머릿속으로 떠올려보세요',
    descEn: "Even after COMMIT, the modified (dirty) blocks are still sitting in the Buffer Cache — in memory. Writing them permanently to the on-disk data files (.dbf) is DBWn's (Database Writer's) job.\n\nDBWn doesn't write immediately for every COMMIT. Instead it picks the right moment: when the Buffer Cache is nearly full and space is needed for new blocks, or when CKPT triggers a checkpoint. It writes many blocks at once in a batch, dramatically reducing the number of disk I/O operations.\n\nOnce DBWn finishes writing a block, it's no longer dirty and can be evicted from the Buffer Cache when needed.\n\nWith that, a single UPDATE's journey is complete. Server Process → PGA → Library Cache → Dict Cache → Buffer Cache → Undo → Redo Buffer → Redo Log File → Data File. It has passed through nearly every core structure inside Oracle.",
    highlightIds: ['dbwr', 'buffer-cache', 'disk'],
    badgeCls: 'bg-slate-500',
  },
]

function SelectFlow({ lang }: { lang: Lang }) {
  const [stepIdx, setStepIdx] = useState(0)
  const step = FLOW_STEPS[stepIdx]

  const headerKo = 'UPDATE 쿼리문을 실행하면 오라클이 내부에서 어떻게 처리하는 지 봅니다.'
  const headerEn = 'How Does a Single UPDATE + COMMIT Travel Through Oracle?'
  const sqlLabel = 'UPDATE employees SET salary = salary * 1.1 WHERE id = :1;  COMMIT;'

  return (
    <div className="mt-12 border-t border-border pt-10">
      {/* 섹션 헤더 */}
      <div className="mb-6">
        <h2 className="mt-0 mb-5 text-xl font-bold tracking-tight">
          {lang === 'ko' ? headerKo : headerEn}
        </h2>
        <div className="inline-block overflow-x-auto rounded-xl border bg-muted/30 px-4 py-3 font-mono text-sm text-foreground/80">
          {sqlLabel}
        </div>
      </div>

      <div className="flex items-start gap-8">
        {/* 다이어그램 — 현재 단계 하이라이트 */}
        <div className="shrink-0 w-[340px]">
          <OracleInstanceMap highlightIds={step.highlightIds} />
        </div>

        {/* 오른쪽: 스텝 버튼 + 설명 */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* 스텝 탭 */}
          <div className="flex gap-2">
            {FLOW_STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => setStepIdx(i)}
                className={cn(
                  'rounded-lg border px-4 py-2 font-mono text-xs font-bold transition-all',
                  stepIdx === i
                    ? `${s.badgeCls} border-transparent text-white shadow-sm`
                    : 'border-border bg-card text-muted-foreground hover:border-slate-400 hover:text-foreground',
                )}
              >
                {lang === 'ko' ? s.stepKo : s.stepEn}
              </button>
            ))}
          </div>

          {/* 단계 설명 카드 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              {/* 카드 헤더 */}
              <div className="flex items-center gap-2.5 border-b border-border bg-muted/40 px-5 py-3">
                <span className={cn('rounded px-2.5 py-0.5 font-mono text-xs font-bold text-white', step.badgeCls)}>
                  {lang === 'ko' ? step.stepKo : step.stepEn}
                </span>
                <span className="font-mono text-sm font-bold text-slate-700">
                  {lang === 'ko' ? step.titleKo : step.titleEn}
                </span>
              </div>
              {/* 설명 */}
              <div className="px-5 py-4">
                <Prose>{lang === 'ko' ? step.descKo : step.descEn}</Prose>
              </div>
              {/* 스텝 인디케이터 */}
              <div className="flex items-center justify-between border-t border-border px-5 py-2.5">
                <div className="flex gap-1.5">
                  {FLOW_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        stepIdx === i ? `w-5 ${step.badgeCls}` : 'w-1.5 bg-border',
                      )}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStepIdx((p) => Math.max(0, p - 1))}
                    disabled={stepIdx === 0}
                    className="rounded border border-border px-3 py-1 font-mono text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setStepIdx((p) => Math.min(FLOW_STEPS.length - 1, p + 1))}
                    disabled={stepIdx === FLOW_STEPS.length - 1}
                    className="rounded border border-border px-3 py-1 font-mono text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export function UpdateFlowPage() {
  const lang = useSimulationStore((s) => s.lang)
  return (
    <div className="mx-auto max-w-screen-2xl px-10 py-10">
      <ChapterTitle
        title={lang === 'ko' ? 'UPDATE 실행 흐름' : 'UPDATE Execution Flow'}
        subtitle={lang === 'ko'
          ? 'UPDATE 하나가 Oracle 내부를 어떻게 통과하는지 단계별로 따라가 봅니다. Server Process → PGA → Library Cache → Buffer Cache → Undo → Redo → COMMIT → DBWn 순서로 각 구조가 어떤 역할을 하는지 확인합니다.'
          : 'Follow a single UPDATE as it travels through every major Oracle internal structure — from parsing to the final write to disk.'}
      />
      <SelectFlow lang={lang} />
    </div>
  )
}

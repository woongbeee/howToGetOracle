import { useSimulationStore } from '@/store/simulationStore'
import { SyntaxSection, SyntaxT } from './SyntaxSection'
import { ClausesSection, ClausesT } from './ClausesSection'
import { JoinSection, JoinT } from './JoinSection'
import { NullSection } from './NullSection'
import { DateSection } from './DateSection'
import { WindowFuncSection } from './WindowFuncSection'
import { MergeSection } from './MergeSection'
import { RollupSection } from './RollupSection'
import { ExecutionSimulator, ExecutionT } from './ExecutionSection'

interface Props {
  sectionId: string
}

export function SqlBasicsPage({ sectionId }: Props) {
  const lang = useSimulationStore((s) => s.lang)

  if (sectionId === 'sql-basics-syntax')     return <SyntaxSection lang={lang} t={SyntaxT[lang]} />
  if (sectionId === 'sql-basics-clauses')    return <ClausesSection lang={lang} t={ClausesT[lang]} />
  if (sectionId === 'sql-basics-join')       return <JoinSection lang={lang} t={JoinT[lang]} />
  if (sectionId === 'sql-basics-null')       return <NullSection lang={lang} />
  if (sectionId === 'sql-basics-date')       return <DateSection lang={lang} />
  if (sectionId === 'sql-basics-windowFunc') return <WindowFuncSection lang={lang} />
  if (sectionId === 'sql-basics-merge')      return <MergeSection lang={lang} />
  if (sectionId === 'sql-basics-rollup')     return <RollupSection lang={lang} />
  if (sectionId === 'sql-basics-execution')  return <ExecutionSimulator lang={lang} t={ExecutionT[lang]} />
  return null
}

import { useSimulationStore } from '@/store/simulationStore'
import { SyntaxSection, SyntaxT } from './SyntaxSection'
import { ClausesSection, ClausesT } from './ClausesSection'
import { JoinSection, JoinT } from './JoinSection'
import { FunctionsSection } from './FunctionsSection'
import { ExecutionSimulator, ExecutionT } from './ExecutionSection'

interface Props {
  sectionId: string
}

export function SqlBasicsPage({ sectionId }: Props) {
  const lang = useSimulationStore((s) => s.lang)

  if (sectionId === 'sql-basics-syntax')    return <SyntaxSection lang={lang} t={SyntaxT[lang]} />
  if (sectionId === 'sql-basics-clauses')   return <ClausesSection lang={lang} t={ClausesT[lang]} />
  if (sectionId === 'sql-basics-join')      return <JoinSection lang={lang} t={JoinT[lang]} />
  if (sectionId === 'sql-basics-functions') return <FunctionsSection lang={lang} />
  if (sectionId === 'sql-basics-execution') return <ExecutionSimulator lang={lang} t={ExecutionT[lang]} />
  return null
}

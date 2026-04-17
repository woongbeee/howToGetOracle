import { StorageSection } from './StorageSection'
import { OverviewSection } from './OverviewSection'
import { SgaSection } from './SgaSection'
import { PgaSection } from './PgaSection'
import { ProcessesSection } from './ProcessesSection'
import { InternalsSimulatorSection } from './SimulatorSection'

export function InternalsPage({ sectionId }: { sectionId: string }) {
  if (sectionId === 'internals-simulator') return <InternalsSimulatorSection />

  return (
    <>
      {sectionId === 'internals-storage'   && <StorageSection />}
      {sectionId === 'internals-overview'  && <OverviewSection />}
      {sectionId === 'internals-sga'       && <SgaSection />}
      {sectionId === 'internals-pga'       && <PgaSection />}
      {sectionId === 'internals-processes' && <ProcessesSection />}
    </>
  )
}

import { StorageSection } from './StorageSection'
import { OverviewSection } from './OverviewSection'
import { SgaSection } from './SgaSection'
import { PgaSection } from './PgaSection'
import { ProcessesSection } from './ProcessesSection'
import { InternalsSimulatorSection } from './SimulatorSection'
import { WipBanner } from '../shared'

export function InternalsPage({ sectionId }: { sectionId: string }) {
  if (sectionId === 'internals-simulator') return <InternalsSimulatorSection />

  return (
    <div className="max-w-4xl px-8 pt-6 pb-10">
      <WipBanner />
      {sectionId === 'internals-storage'   && <StorageSection />}
      {sectionId === 'internals-overview'  && <OverviewSection />}
      {sectionId === 'internals-sga'       && <SgaSection />}
      {sectionId === 'internals-pga'       && <PgaSection />}
      {sectionId === 'internals-processes' && <ProcessesSection />}
    </div>
  )
}

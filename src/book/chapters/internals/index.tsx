import { StorageSection } from './StorageSection'
import { OverviewSection } from './OverviewSection'
import { SgaSection } from './SgaSection'
import { PgaSection } from './PgaSection'
import { ProcessesSection } from './ProcessesSection'

export function InternalsPage({ sectionId }: { sectionId: string }) {
  if (sectionId === 'internals-storage')   return <StorageSection />
  if (sectionId === 'internals-overview')  return <OverviewSection />
  if (sectionId === 'internals-sga')       return <SgaSection />
  if (sectionId === 'internals-pga')       return <PgaSection />
  if (sectionId === 'internals-processes') return <ProcessesSection />
  return null
}

import { StorageSection } from './StorageSection'
import { OverviewSection, BufferCachePage, UpdateFlowPage } from './OverviewSection'

export function InternalsPage({ sectionId }: { sectionId: string }) {
  if (sectionId === 'internals-storage')         return <StorageSection />
  if (sectionId === 'internals-overview')        return <OverviewSection />
  if (sectionId === 'internals-overview-buffer') return <BufferCachePage />
  if (sectionId === 'internals-overview-flow')   return <UpdateFlowPage />
  return null
}

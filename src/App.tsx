import { useState, useEffect } from 'react'
import { LandingPage } from '@/components/LandingPage'
import { BookLayout } from '@/book/BookLayout'
import { InternalsSimulatorSection } from '@/book/chapters/internals/SimulatorSection'

type AppView = 'landing' | 'book'

export function App() {
  const [appView, setAppView] = useState<AppView>('landing')
  const isSimulatorWindow = window.location.hash === '#simulator'

  useEffect(() => {
    if (isSimulatorWindow) {
      document.title = 'Internals Simulator — Oracle DB'
      return
    }
    const root = document.getElementById('root')
    if (!root) return
    if (appView === 'landing') {
      root.classList.add('landing')
    } else {
      root.classList.remove('landing')
    }
  }, [appView, isSimulatorWindow])

  if (isSimulatorWindow) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
        <InternalsSimulatorSection />
      </div>
    )
  }

  if (appView === 'landing') {
    return <LandingPage onEnter={() => setAppView('book')} />
  }

  return <BookLayout onHome={() => setAppView('landing')} />
}

export default App

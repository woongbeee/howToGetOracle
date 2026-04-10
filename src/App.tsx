import { useState, useEffect } from 'react'
import { LandingPage } from '@/components/LandingPage'
import { BookLayout } from '@/book/BookLayout'

type AppView = 'landing' | 'book'

export function App() {
  const [appView, setAppView] = useState<AppView>('landing')

  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return
    if (appView === 'landing') {
      root.classList.add('landing')
    } else {
      root.classList.remove('landing')
    }
  }, [appView])

  if (appView === 'landing') {
    return <LandingPage onEnter={() => setAppView('book')} />
  }

  return <BookLayout onHome={() => setAppView('landing')} />
}

export default App

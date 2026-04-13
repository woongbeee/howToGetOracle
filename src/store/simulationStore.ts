import { create } from 'zustand'

export type Lang = 'ko' | 'en'

interface LangState {
  lang: Lang
  setLang: (lang: Lang) => void
}

export const useLangStore = create<LangState>((set) => ({
  lang: 'ko',
  setLang: (lang) => set({ lang }),
}))

// Legacy alias — keeps existing `useSimulationStore(s => s.lang)` and
// `useSimulationStore(s => s.setLang)` call sites working without change.
export const useSimulationStore = useLangStore

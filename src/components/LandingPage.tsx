import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    title1: 'Oracle Database',
    title2: '완전 학습 가이드',
    desc: '애니메이션과 시뮬레이터로 Oracle 내부 동작 원리를 직접 보며 학습합니다.',
    cta: '학습 시작하기',
    footer: '© 2026 Oracle DB Interactive Learning Book — 교육 목적으로 제작되었습니다.',
    langToggle: 'EN',
  },
  en: {
    title1: 'Oracle Database',
    title2: 'Dynamic Learning Book',
    desc: 'Skip the static docs — watch Oracle internals come alive through animations and hands-on simulators.',
    cta: 'Start Learning',
    footer: '© 2026 Oracle DB Interactive Learning Book — Built for educational purposes.',
    langToggle: '한국어',
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
}

interface Props {
  onEnter: () => void
}

export function LandingPage({ onEnter }: Props) {
  const lang = useSimulationStore((s) => s.lang)
  const setLang = useSimulationStore((s) => s.setLang)
  const t = T[lang]

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-x-hidden bg-background text-foreground">

      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Ambient blobs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[700px] -translate-x-1/2 rounded-full bg-blue-100/50 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full bg-orange-100/40 blur-[100px]" />

      {/* Nav */}
      <nav className="relative z-10 flex h-14 w-full items-center justify-between border-b bg-background/80 px-6 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold tracking-tight">Oracle</span>
          <span className="font-mono text-sm text-muted-foreground">DB Internals</span>
        </div>
        <button
          onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
          className={cn(
            'flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1 font-mono text-xs font-medium',
            'transition-colors hover:bg-accent hover:text-foreground'
          )}
        >
          <span className="text-[10px]">🌐</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={lang}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
            >
              {t.langToggle}
            </motion.span>
          </AnimatePresence>
        </button>
      </nav>

      {/* Hero — vertically centered */}
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">


        {/* Title */}
        <motion.h1
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-2 max-w-xl text-5xl font-bold leading-[1.15] tracking-tight sm:text-6xl"
        >
          <AnimatePresence mode="wait">
            <motion.span key={`${lang}-t1`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="block">
              {t.title1}
            </motion.span>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.span key={`${lang}-t2`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, delay: 0.04 }} className="block text-[hsl(var(--active-border))]">
              {t.title2}
            </motion.span>
          </AnimatePresence>
        </motion.h1>

        {/* Description */}
        <motion.p
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground"
        >
          <AnimatePresence mode="wait">
            <motion.span key={`${lang}-desc`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {t.desc}
            </motion.span>
          </AnimatePresence>
        </motion.p>


        {/* CTA */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="mt-10">
          {/* Rotating gradient border wrapper */}
          <div className="relative p-[2px] rounded-xl overflow-hidden">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="pointer-events-none absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_60%,hsl(217,91%,60%)_75%,hsl(38,92%,60%)_85%,transparent_100%)] opacity-80"
            />
            <Button
              size="lg"
              onClick={onEnter}
              className="relative h-13 gap-3 rounded-[10px] px-10 font-mono text-base font-bold transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97]"
            >
              <span>📖</span>
              <AnimatePresence mode="wait">
                <motion.span key={`${lang}-cta`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                  {t.cta}
                </motion.span>
              </AnimatePresence>
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                →
              </motion.span>
            </Button>
          </div>
        </motion.div>

        {/* SQL preview card */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-16 w-full max-w-md overflow-hidden rounded-xl border bg-card shadow-sm"
        >
          <div className="flex items-center gap-1.5 border-b bg-muted/50 px-4 py-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            <span className="ml-2 font-mono text-[10px] text-muted-foreground">oracle_simulator.sql</span>
          </div>
          <SqlTyper />
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t py-5 text-center">
        <p className="text-[11px] text-muted-foreground">
          <AnimatePresence mode="wait">
            <motion.span key={`${lang}-footer`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {t.footer}
            </motion.span>
          </AnimatePresence>
        </p>
        <a
          href="https://woongbee.notion.site"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground/40 transition-colors hover:text-muted-foreground"
        >
          developed by <span className="font-semibold">Woongbee</span>
          <span className="text-[10px]">↗</span>
        </a>
      </footer>
    </div>
  )
}

/* SQL Typer */
const SQL_LINES = [
  { text: 'SELECT e.first_name, d.department_name', color: 'text-blue-500' },
  { text: 'FROM   employees e', color: 'text-foreground' },
  { text: 'JOIN   departments d ON e.department_id = d.department_id', color: 'text-foreground' },
  { text: 'WHERE  e.salary > 8000', color: 'text-orange-500' },
  { text: 'ORDER BY e.salary DESC;', color: 'text-foreground' },
]

function SqlTyper() {
  return (
    <div className="space-y-1 p-4">
      {SQL_LINES.map((line, li) => (
        <motion.div
          key={li}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 + li * 0.16, duration: 0.3, ease: 'easeOut' }}
          className={cn('font-mono text-xs leading-relaxed', line.color)}
        >
          <span className="mr-3 select-none text-muted-foreground/30">{String(li + 1).padStart(2, ' ')}</span>
          <TypedText text={line.text} delay={0.9 + li * 0.16 + 0.08} />
        </motion.div>
      ))}
    </div>
  )
}

function TypedText({ text, delay }: { text: string; delay: number }) {
  return (
    <>
      {text.split('').map((ch, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + i * 0.016, duration: 0 }}
        >
          {ch}
        </motion.span>
      ))}
    </>
  )
}

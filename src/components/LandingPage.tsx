import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    badge: '인터랙티브 교육서',
    heroTitle1: 'Oracle Database',
    heroTitle2: '완전 학습 가이드',
    heroDesc:
      'SQL 내부 동작부터 인덱스, 옵티마이저, 조인, 파티셔닝까지 — 애니메이션과 시뮬레이터가 내장된 동적 교육서로 Oracle을 마스터하세요.',
    ctaPrimary: '학습 시작하기',
    howTitle: '이렇게 학습합니다',
    howSteps: [
      { num: '01', label: '목차 탐색', desc: '8개 챕터로 구성된 체계적인 커리큘럼을 목차에서 탐색합니다.' },
      { num: '02', label: '개념 학습', desc: '각 섹션에서 핵심 개념을 설명과 인터랙티브 애니메이션으로 학습합니다.' },
      { num: '03', label: '시뮬레이터 실습', desc: '각 챕터 마지막의 시뮬레이터에서 직접 쿼리를 입력해 확인합니다.' },
    ],
    featTitle: '학습 목차',
    features: [
      {
        icon: '⚙',
        title: '내부 구조와 프로세스',
        desc: 'SGA, PGA, Buffer Cache, Library Cache, 백그라운드 프로세스의 동작 원리와 Internals Simulator.',
        tags: ['SGA', 'PGA', 'Buffer Cache'],
        color: 'sapphire',
      },
      {
        icon: '🔍',
        title: '인덱스 원리와 스캔 방식',
        desc: 'B-Tree / Bitmap / 복합 인덱스 구조와 스캔 애니메이션. Index Simulator 포함.',
        tags: ['B-Tree', 'Bitmap', 'Skip Scan'],
        color: 'violet',
      },
      {
        icon: '🔗',
        title: '조인 원리와 활용',
        desc: 'Nested Loop, Hash, Sort-Merge Join 알고리즘과 스텝별 인터랙티브 시뮬레이션.',
        tags: ['NL Join', 'Hash Join', 'Sort-Merge'],
        color: 'tangerine',
      },
      {
        icon: '⚡',
        title: '옵티마이저 + 쿼리 변환',
        desc: 'CBO 3단계 파이프라인, 선택도, 액세스 패스, 서브쿼리 Unnesting, 뷰 Merging.',
        tags: ['CBO', 'Selectivity', 'Unnesting'],
        color: 'gold',
      },
    ],
    footer: '© 2026 Oracle DB Internals — 교육 목적으로 제작되었습니다.',
    langToggle: 'EN',
  },
  en: {
    badge: 'Interactive Learning Book',
    heroTitle1: 'Oracle Database',
    heroTitle2: 'Complete Learning Guide',
    heroDesc:
      'From SQL internals to indexes, optimizer, joins, and partitioning — master Oracle with a dynamic book featuring built-in animations and simulators.',
    ctaPrimary: 'Start Learning',
    howTitle: 'How to learn',
    howSteps: [
      { num: '01', label: 'Browse the TOC', desc: 'Navigate a structured curriculum of 8 chapters from the sidebar table of contents.' },
      { num: '02', label: 'Learn Concepts', desc: 'Each section combines clear explanations with interactive animations.' },
      { num: '03', label: 'Use Simulators', desc: 'Run queries in the chapter-end simulators to see concepts in action.' },
    ],
    featTitle: 'Curriculum',
    features: [
      {
        icon: '⚙',
        title: 'Internals & Processes',
        desc: 'SGA, PGA, Buffer Cache, Library Cache, background processes, and the Internals Simulator.',
        tags: ['SGA', 'PGA', 'Buffer Cache'],
        color: 'sapphire',
      },
      {
        icon: '🔍',
        title: 'Index Internals & Scans',
        desc: 'B-Tree / Bitmap / Composite index structure with scan animations. Includes Index Simulator.',
        tags: ['B-Tree', 'Bitmap', 'Skip Scan'],
        color: 'violet',
      },
      {
        icon: '🔗',
        title: 'Join Principles & Usage',
        desc: 'Nested Loop, Hash, and Sort-Merge join algorithms with step-by-step interactive simulations.',
        tags: ['NL Join', 'Hash Join', 'Sort-Merge'],
        color: 'tangerine',
      },
      {
        icon: '⚡',
        title: 'Optimizer + Query Transform',
        desc: 'CBO 3-stage pipeline, selectivity, access paths, subquery unnesting, view merging.',
        tags: ['CBO', 'Selectivity', 'Unnesting'],
        color: 'gold',
      },
    ],
    footer: '© 2025 Oracle DB Internals — Built for educational purposes.',
    langToggle: '한국어',
  },
}

const colorMap = {
  sapphire: {
    border: 'border-blue-200',
    iconBg: 'bg-blue-50',
    tag: 'bg-blue-50 text-blue-700 border-blue-200',
    glow: 'from-blue-50/80 to-transparent',
    num: 'text-blue-500',
    dot: 'bg-blue-400',
  },
  tangerine: {
    border: 'border-orange-200',
    iconBg: 'bg-orange-50',
    tag: 'bg-orange-50 text-orange-700 border-orange-200',
    glow: 'from-orange-50/80 to-transparent',
    num: 'text-orange-500',
    dot: 'bg-orange-400',
  },
  gold: {
    border: 'border-yellow-200',
    iconBg: 'bg-yellow-50',
    tag: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    glow: 'from-yellow-50/80 to-transparent',
    num: 'text-yellow-500',
    dot: 'bg-yellow-400',
  },
  violet: {
    border: 'border-violet-200',
    iconBg: 'bg-violet-50',
    tag: 'bg-violet-50 text-violet-700 border-violet-200',
    glow: 'from-violet-50/80 to-transparent',
    num: 'text-violet-500',
    dot: 'bg-violet-400',
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

interface Props {
  onEnter: () => void
}

export function LandingPage({ onEnter }: Props) {
  const lang = useSimulationStore((s) => s.lang)
  const setLang = useSimulationStore((s) => s.setLang)
  const t = T[lang]

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">

      {/* ── Background grid ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Ambient blobs ── */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[640px] -translate-x-1/2 rounded-full bg-blue-100/60 blur-[120px]" />
      <div className="pointer-events-none absolute top-[60vh] -right-24 h-[320px] w-[400px] rounded-full bg-orange-100/50 blur-[100px]" />

      {/* ── Nav ── */}
      <nav className="relative z-10 flex h-14 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold tracking-tight">Oracle</span>
          <span className="font-mono text-sm text-muted-foreground">DB Internals</span>
        </div>

        {/* Language toggle */}
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
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
            >
              {t.langToggle}
            </motion.span>
          </AnimatePresence>
        </button>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center px-6 pt-24 pb-20 text-center">
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <Badge variant="outline" className="mb-6 font-mono text-[11px] tracking-wide">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
            {t.badge}
          </Badge>
        </motion.div>

        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="max-w-2xl text-5xl font-bold leading-[1.2] tracking-tight"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={`${lang}-t1`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="block"
            >
              {t.heroTitle1}
            </motion.span>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.span
              key={`${lang}-t2`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="block text-[hsl(var(--active-border))]"
            >
              {t.heroTitle2}
            </motion.span>
          </AnimatePresence>
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={`${lang}-desc`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {t.heroDesc}
            </motion.span>
          </AnimatePresence>
        </motion.p>

        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <div className="relative">
            {/* Pulsing glow ring */}
            <motion.div
              animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.15, 0.5] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-0 rounded-xl bg-blue-500 blur-xl"
            />
            <Button
              size="lg"
              onClick={() => onEnter()}
              className="relative h-14 gap-3 px-10 font-mono text-base font-bold shadow-lg shadow-blue-500/30 transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]"
            >
              <span className="text-lg">📖</span>
              {t.ctaPrimary}
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="ml-1"
              >
                →
              </motion.span>
            </Button>
          </div>
        </motion.div>

        {/* Mini SQL preview */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-14 w-full max-w-lg overflow-hidden rounded-xl border bg-card shadow-sm"
        >
          <div className="flex items-center gap-1.5 border-b bg-muted/60 px-4 py-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            <span className="ml-2 font-mono text-[10px] text-muted-foreground">oracle_simulator.sql</span>
          </div>
          <SqlTyper />
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section className="relative z-10 px-6 pb-20">
        <motion.h2
          variants={fadeUp}
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mb-10 text-center text-xl font-bold tracking-tight"
        >
          <AnimatePresence mode="wait">
            <motion.span key={`${lang}-how`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {t.howTitle}
            </motion.span>
          </AnimatePresence>
        </motion.h2>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto grid max-w-3xl gap-4 md:grid-cols-3"
        >
          {t.howSteps.map((step, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              custom={i}
              className="relative flex flex-col gap-3 rounded-xl border bg-card p-6"
            >
              <span className="font-mono text-3xl font-bold text-muted-foreground/30">{step.num}</span>
              <span className="text-sm font-bold">{step.label}</span>
              <p className="text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
              {i < 2 && (
                <div className="absolute top-1/2 -right-2 z-10 hidden -translate-y-1/2 md:block">
                  <span className="font-mono text-xs text-muted-foreground/40">→</span>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 px-6 pb-24">
        <motion.h2
          variants={fadeUp}
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mb-10 text-center text-xl font-bold tracking-tight"
        >
          <AnimatePresence mode="wait">
            <motion.span key={`${lang}-feat`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {t.featTitle}
            </motion.span>
          </AnimatePresence>
        </motion.h2>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="mx-auto grid max-w-4xl gap-5 md:grid-cols-3"
        >
          {t.features.map((feat, i) => {
            const c = colorMap[feat.color as keyof typeof colorMap]
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                onClick={() => onEnter()}
                className={cn(
                  'relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-xl border bg-card p-6 shadow-xs',
                  c.border
                )}
              >
                {/* Glow top */}
                <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b opacity-60', c.glow)} />

                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg border text-xl', c.iconBg, c.border)}>
                  {feat.icon}
                </div>

                <div className="flex flex-col gap-1.5">
                  <h3 className="text-sm font-bold">{feat.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{feat.desc}</p>
                </div>

                <div className="mt-auto flex flex-wrap gap-1.5">
                  {feat.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn('rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium', c.tag)}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* ── CTA Bottom ── */}
      <section className="relative z-10 flex flex-col items-center gap-4 px-6 pb-20">
        <motion.div
          variants={fadeUp}
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.15, 0.5] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-0 rounded-xl bg-blue-500 blur-xl"
            />
            <Button
              size="lg"
              onClick={() => onEnter()}
              className="relative h-14 gap-3 px-10 font-mono text-base font-bold shadow-lg shadow-blue-500/30 transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]"
            >
              <span className="text-lg">📖</span>
              {t.ctaPrimary}
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="ml-1"
              >
                →
              </motion.span>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t py-6 text-center">
        <p className="text-[11px] text-muted-foreground">
          <AnimatePresence mode="wait">
            <motion.span
              key={`${lang}-footer`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {t.footer}
            </motion.span>
          </AnimatePresence>
        </p>
        <a
          href="https://woongbee.notion.site"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground/50 transition-colors hover:text-muted-foreground"
        >
          developed by <span className="font-semibold">Woongbee</span>
          <span className="text-[10px]">↗</span>
        </a>
      </footer>
    </div>
  )
}

/* ── SQL Typer animation ── */
const SQL_LINES = [
  { text: 'SELECT e.first_name, d.department_name', color: 'text-blue-600' },
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
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 + li * 0.18, duration: 0.35, ease: 'easeOut' }}
          className={cn('font-mono text-xs leading-relaxed', line.color)}
        >
          <span className="select-none text-muted-foreground/40 mr-3">{String(li + 1).padStart(2, ' ')}</span>
          <TypedText text={line.text} delay={0.8 + li * 0.18 + 0.1} />
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
          transition={{ delay: delay + i * 0.018, duration: 0 }}
        >
          {ch}
        </motion.span>
      ))}
    </>
  )
}

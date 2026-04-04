import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    badge: '교육용 시뮬레이터',
    heroTitle1: 'Oracle Database',
    heroTitle2: '내부 동작 시뮬레이터',
    heroDesc:
      'SQL 쿼리를 입력하면 Oracle 인스턴스 내부의 실행 과정을 단계별로 시각화합니다. SGA, PGA, CBO Optimizer까지 — 눈으로 직접 확인하세요.',
    ctaPrimary: '시뮬레이터 시작하기',
    ctaSecondary: 'Schema ERD 보기',
    howTitle: '이렇게 작동합니다',
    howSteps: [
      { num: '01', label: 'SQL 입력', desc: 'SELECT 쿼리를 직접 입력하거나 샘플 쿼리를 선택합니다.' },
      { num: '02', label: '실행 시뮬레이션', desc: 'Oracle 인스턴스 컴포넌트가 순서대로 활성화되며 처리 흐름을 보여줍니다.' },
      { num: '03', label: '결과 분석', desc: 'CBO 실행 계획, Cache Hit/Miss 여부, 각 단계별 상세 로그를 확인합니다.' },
    ],
    featTitle: '주요 기능',
    features: [
      {
        icon: '⚡',
        title: 'CBO Optimizer 시각화',
        desc: 'Cost-Based Optimizer의 3단계 최적화 과정 — Query Transformer, Estimator, Plan Generator — 를 실시간으로 확인합니다.',
        tags: ['액세스 패스', '조인 방법', '실행 계획 트리'],
        color: 'sapphire',
      },
      {
        icon: '🗃',
        title: 'Buffer & Library Cache',
        desc: 'Library Cache Hit/Miss, Buffer Cache Hit/Miss 시나리오를 직접 실험하고, DBWn 플러시 동작까지 시뮬레이션합니다.',
        tags: ['Library Cache', 'Buffer Cache', 'DBWn·CKPT'],
        color: 'tangerine',
      },
      {
        icon: '⬡',
        title: 'Schema ERD',
        desc: 'HR 스키마와 CO 스키마의 테이블 관계를 React Flow 기반 인터랙티브 다이어그램으로 탐색합니다.',
        tags: ['HR Schema', 'CO Schema', 'FK 관계'],
        color: 'gold',
      },
    ],
    footer: '© 2025 Oracle DB Internals Simulator — 교육 목적으로 제작되었습니다.',
    langToggle: 'EN',
  },
  en: {
    badge: 'Educational Simulator',
    heroTitle1: 'Oracle Database',
    heroTitle2: 'Internals Simulator',
    heroDesc:
      'Visualize what happens inside an Oracle instance step by step when you run a SQL query. SGA, PGA, CBO Optimizer — see it with your own eyes.',
    ctaPrimary: 'Launch Simulator',
    ctaSecondary: 'View Schema ERD',
    howTitle: 'How it works',
    howSteps: [
      { num: '01', label: 'Enter SQL', desc: 'Type a SELECT query or pick one of the built-in sample queries.' },
      { num: '02', label: 'Run Simulation', desc: 'Oracle instance components activate in sequence, showing the full processing flow.' },
      { num: '03', label: 'Analyze Results', desc: 'Inspect the CBO execution plan, Cache Hit/Miss outcomes, and per-step detail logs.' },
    ],
    featTitle: 'Key Features',
    features: [
      {
        icon: '⚡',
        title: 'CBO Optimizer Visualization',
        desc: "Watch the Cost-Based Optimizer's three-stage pipeline — Query Transformer, Estimator, Plan Generator — in real time.",
        tags: ['Access Paths', 'Join Methods', 'Plan Tree'],
        color: 'sapphire',
      },
      {
        icon: '🗃',
        title: 'Buffer & Library Cache',
        desc: 'Experiment with Library Cache Hit/Miss and Buffer Cache Hit/Miss scenarios. Trigger a DBWn flush and watch what changes.',
        tags: ['Library Cache', 'Buffer Cache', 'DBWn·CKPT'],
        color: 'tangerine',
      },
      {
        icon: '⬡',
        title: 'Schema ERD',
        desc: 'Explore HR and CO schema table relationships through an interactive React Flow diagram with FK edges.',
        tags: ['HR Schema', 'CO Schema', 'FK Relations'],
        color: 'gold',
      },
    ],
    footer: '© 2025 Oracle DB Internals Simulator — Built for educational purposes.',
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
  onEnter: (view: 'simulator' | 'erd') => void
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
          <Button
            size="lg"
            onClick={() => onEnter('simulator')}
            className="h-11 gap-2 px-6 font-mono text-sm"
          >
            ⚙ {t.ctaPrimary}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onEnter('erd')}
            className="h-11 gap-2 px-6 font-mono text-sm"
          >
            ⬡ {t.ctaSecondary}
          </Button>
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
                className={cn(
                  'relative flex flex-col gap-4 overflow-hidden rounded-xl border bg-card p-6 shadow-xs',
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
          <Button size="lg" onClick={() => onEnter('simulator')} className="h-12 gap-2 px-8 font-mono text-sm">
            ⚙ {t.ctaPrimary}
          </Button>
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

import { useSimulationStore } from '@/store/simulationStore'
import { PageContainer } from '../shared'
import { cn } from '@/lib/utils'
import {
  IconBolt, IconLock, IconTrendingUp, IconPuzzle, IconShield, IconCloud,
  IconBriefcase, IconCoin, IconBrain, IconCertificate, IconPin,
} from '@tabler/icons-react'

const T = {
  ko: {
    hero: '오라클이란?',
    heroSub: '세계에서 가장 널리 쓰이는 관계형 데이터베이스, Oracle을 소개합니다.',

    whatIsDbTitle: '데이터베이스란 무엇인가?',
    whatIsDb:
      '데이터베이스(Database)는 정보를 체계적으로 저장하고 빠르게 찾아볼 수 있게 해주는 소프트웨어입니다.\n\n' +
      '쇼핑몰의 상품 목록, 은행의 계좌 잔액, 병원의 환자 기록 — 이 모든 정보가 데이터베이스에 저장됩니다. 단순히 파일에 저장하는 것과 다르게, 데이터베이스는 수백만 건의 정보를 동시에 수천 명이 안전하게 읽고 쓸 수 있도록 설계되어 있습니다.\n\n' +
      '관계형 데이터베이스(RDBMS)는 그 중에서도 데이터를 표(Table) 형태로 저장하고, SQL이라는 표준 언어로 다루는 방식입니다. Oracle, MySQL, PostgreSQL, SQL Server 모두 RDBMS입니다.',
    whatIsDbNote: 'RDBMS(Relational Database Management System)는 데이터를 행(Row)과 열(Column)로 이루어진 표(Table) 형태로 저장하고, 테이블 간의 관계(Relation)를 정의해 데이터를 연결·관리하는 시스템입니다. DB라고 부르는 것들 중 많은 수가 사실 RDBMS이며, 이 교재에서 "데이터베이스"라고 하면 관계형 데이터베이스(RDBMS)를 의미합니다.',

    nameTitle: '"오라클"이라는 이름의 뜻',
    nameSub: '신탁(神託) — 신이 내리는 답',
    nameBody:
      '1977년 래리 앨리슨(Larry Ellison), 밥 마이너(Bob Miner), 에드 오츠(Ed Oates) 세 명이 회사를 창업했을 때, 첫 번째 고객은 CIA였습니다. 그 프로젝트의 코드명이 바로 "Oracle"이었습니다.\n\n' +
      '"Oracle"은 고대 그리스·로마에서 신의 뜻을 전달하는 신탁(oracle)에서 따왔습니다. 어떤 질문이든 정확한 답을 내려주는 존재 — "당신이 어떤 데이터를 물어봐도 Oracle이 정확하게 답해준다"는 뜻을 담고 있습니다.\n\n' +
      '그 이름처럼, Oracle은 수십 년간 기업이 가진 가장 복잡한 질문들에 답해왔습니다.',

    historyTitle: '오라클의 역사',
    historyItems: [
      { year: '1977', text: '래리 앨리슨이 관계형 DB 논문(IBM Edgar Codd)을 읽고 창업. CIA 프로젝트 "Oracle" 수주' },
      { year: '1979', text: 'Oracle Version 2 출시 — 세계 최초의 상용 SQL 관계형 데이터베이스' },
      { year: '1992', text: 'Oracle 7 출시. 스토어드 프로시저, 트리거 등 엔터프라이즈 기능 완성' },
      { year: '2001', text: 'Oracle 9i — 인터넷(i) 시대를 위한 XML, Java 통합' },
      { year: '2013', text: 'Oracle 12c — 멀티테넌트(클라우드) 아키텍처 도입' },
      { year: '2018', text: 'Oracle 18c부터 연 1회 정기 릴리즈 정책으로 전환' },
      { year: '2023', text: 'Oracle 23ai — AI Vector Search 등 AI 기능 전면 통합. 46년의 역사' },
    ],

    strengthTitle: '다른 DB와 무엇이 다른가?',
    strengthSub: '왜 수많은 대기업은 Oracle을 선택했을까요?',
    strengths: [
      {
        icon: <IconBolt size={20} color="#d97706" stroke={1.5} />,
        title: '압도적인 성능',
        desc: '수억 건의 레코드를 실시간으로 처리하는 비용 기반 옵티마이저(CBO)가 있어서, 복잡한 쿼리를 자동으로 최적화합니다.',
        color: 'orange',
      },
      {
        icon: <IconLock size={20} color="#2563eb" stroke={1.5} />,
        title: '엔터프라이즈급 신뢰성',
        desc: 'MVCC 읽기 일관성, Undo 로그 기반 ROLLBACK, RAC 클러스터. 은행·거래소가 신뢰하는 수준의 데이터 안전성.',
        color: 'blue',
      },
      {
        icon: <IconTrendingUp size={20} color="#059669" stroke={1.5} />,
        title: '무한 확장성',
        desc: 'Real Application Clusters(RAC)로 수십 대 서버를 하나처럼 운영. 파티셔닝으로 테라바이트 데이터를 분산 관리.',
        color: 'emerald',
      },
      {
        icon: <IconPuzzle size={20} color="#7c3aed" stroke={1.5} />,
        title: '풍부한 내장 기능',
        desc: '윈도우 함수·분석 함수·PIVOT·MERGE·계층 쿼리(CONNECT BY) 등 Oracle만의 강력한 SQL 확장 기능.',
        color: 'violet',
      },
      {
        icon: <IconShield size={20} color="#e11d48" stroke={1.5} />,
        title: '보안·감사',
        desc: '세분화된 접근 제어, Virtual Private Database(VPD), 감사 로그. 금융·의료·공공기관 컴플라이언스 요구사항 충족.',
        color: 'rose',
      },
      {
        icon: <IconCloud size={20} color="#06b6d4" stroke={1.5} />,
        title: '클라우드 통합',
        desc: 'Oracle Cloud Infrastructure(OCI) + Autonomous Database — 자가 튜닝·자가 보안·자가 패치 완전 자동화.',
        color: 'cyan',
      },
    ],

    whyLearnTitle: '왜 Oracle을 배워야 할까?',
    whyLearnItems: [
      { icon: <IconBriefcase size={20} color="#2563eb" stroke={1.5} />, text: '국내 대기업·금융사·공공기관의 핵심 시스템 대부분이 Oracle 기반입니다.' },
      { icon: <IconCoin size={20} color="#d97706" stroke={1.5} />, text: 'Oracle DBA·개발자는 높은 연봉과 시장 수요를 유지하고 있습니다.' },
      { icon: <IconBrain size={20} color="#7c3aed" stroke={1.5} />, text: 'Oracle 내부 원리(옵티마이저, 인덱스, 트랜잭션)를 이해하면 다른 DB도 쉽게 배울 수 있습니다.' },
      { icon: <IconCertificate size={20} color="#059669" stroke={1.5} />, text: 'OCA·OCP 자격증은 취업과 커리어 전환에 실질적으로 도움이 됩니다.' },
    ],

    usersTitle: '어떤 회사들이 Oracle을 쓰고 있을까?',
    usersSub: '글로벌 Fortune 500 기업의 98%가 Oracle 제품을 사용합니다.',
    userCards: [
      {
        org: '삼성·현대·LG',
        category: '제조·대기업',
        reason: 'ERP(SAP, Oracle E-Business Suite) 백엔드로 Oracle DB. 수천만 건의 거래·재고·인사 데이터를 실시간 처리.',
        color: 'blue',
      },
      {
        org: '국민은행·우리은행·하나은행',
        category: '금융·은행',
        reason: '계좌이체·결제·대출 등 금융 트랜잭션의 무결성과 24/7 무중단 운영을 위해 Oracle RAC 클러스터 운영.',
        color: 'emerald',
      },
      {
        org: 'Amazon',
        category: '글로벌 IT',
        reason: '오라클에서 자체 DB로 대규모 마이그레이션 진행 중임에도, 수년간 Oracle을 핵심 DB로 운영한 대표 사례.',
        color: 'orange',
      },
      {
        org: '건강보험심사평가원·국세청',
        category: '공공·의료',
        reason: '국민 전체의 의료기록·세금 데이터를 안전하게 보관하고 정확하게 처리하기 위한 엔터프라이즈 신뢰성 필요.',
        color: 'violet',
      },
    ],

    closingTitle: '이 책으로 무엇을 배우게 될까?',
    closing:
      '이 교재는 Oracle의 표면(SQL 문법)에서 시작해 내부 구조(인스턴스·SGA·PGA)와 성능 최적화(옵티마이저·인덱스·파티셔닝)까지 단계적으로 안내합니다.\n\n' +
      '단순히 SQL을 외우는 것이 아니라, Oracle이 쿼리를 어떻게 처리하는지 — 그 원리를 이해하는 것이 목표입니다. 원리를 알면 느린 쿼리의 이유를 찾을 수 있고, 더 나은 설계를 할 수 있습니다.\n\n' +
      '자, 이제 시작해봅시다.',
  },

  en: {
    hero: 'What is Oracle?',
    heroSub: 'Introducing Oracle — the world\'s most widely used relational database.',

    whatIsDbTitle: 'What is a Database?',
    whatIsDb:
      'A database is software that stores information in an organized way and lets you retrieve it quickly.\n\n' +
      "Product catalogs, bank account balances, hospital patient records — all of it lives in a database. Unlike a simple file, a database is designed so that millions of records can be read and written safely by thousands of users at the same time.\n\n" +
      'A relational database (RDBMS) stores data in tables and uses a standard language called SQL to work with it. Oracle, MySQL, PostgreSQL, and SQL Server are all RDBMS.',
    whatIsDbNote: 'RDBMS (Relational Database Management System) stores data in tables made of rows and columns, and manages relationships between those tables to connect and organize data. Most things people simply call a "DB" are in fact an RDBMS — and throughout this book, "database" means a relational database (RDBMS).',

    nameTitle: 'What does "Oracle" mean?',
    nameSub: 'An oracle — a divine answer to any question',
    nameBody:
      'In 1977, Larry Ellison, Bob Miner, and Ed Oates founded the company and landed their first client: the CIA. The project\'s codename was "Oracle."\n\n' +
      '"Oracle" comes from ancient Greek and Roman tradition — an oracle was a source of divine wisdom that could answer any question. The name carries the promise: "Whatever data you ask for, Oracle will give you the exact answer."\n\n' +
      'True to its name, Oracle has been answering the most complex questions businesses can throw at a database for nearly 50 years.',

    historyTitle: 'A Brief History of Oracle',
    historyItems: [
      { year: '1977', text: 'Larry Ellison reads IBM\'s Edgar Codd relational DB paper and founds the company. Wins CIA project "Oracle"' },
      { year: '1979', text: 'Oracle Version 2 ships — the world\'s first commercially available SQL relational database' },
      { year: '1992', text: 'Oracle 7: stored procedures, triggers, and full enterprise feature set' },
      { year: '2001', text: 'Oracle 9i — XML and Java integration for the internet age' },
      { year: '2013', text: 'Oracle 12c — multitenant (cloud) architecture introduced' },
      { year: '2018', text: 'Oracle 18c begins annual release cadence' },
      { year: '2023', text: 'Oracle 23ai — AI Vector Search and deep AI integration across the platform' },
    ],

    strengthTitle: 'How is Oracle different?',
    strengthSub: 'Why do so many enterprises choose Oracle?',
    strengths: [
      {
        icon: <IconBolt size={20} color="#d97706" stroke={1.5} />,
        title: 'Unmatched Performance',
        desc: 'The Cost-Based Optimizer (CBO) automatically rewrites and optimizes complex queries, handling hundreds of millions of records in real time.',
        color: 'orange',
      },
      {
        icon: <IconLock size={20} color="#2563eb" stroke={1.5} />,
        title: 'Enterprise-Grade Reliability',
        desc: 'MVCC read consistency, Undo-log-based ROLLBACK, and RAC clustering deliver the data safety that banks and stock exchanges depend on.',
        color: 'blue',
      },
      {
        icon: <IconTrendingUp size={20} color="#059669" stroke={1.5} />,
        title: 'Limitless Scalability',
        desc: 'Real Application Clusters (RAC) lets dozens of servers act as one. Partitioning distributes terabyte-scale data across nodes seamlessly.',
        color: 'emerald',
      },
      {
        icon: <IconPuzzle size={20} color="#7c3aed" stroke={1.5} />,
        title: 'Rich Built-in Features',
        desc: 'Window functions, analytic functions, PIVOT, MERGE, hierarchical queries (CONNECT BY) — powerful SQL extensions found nowhere else.',
        color: 'violet',
      },
      {
        icon: <IconShield size={20} color="#e11d48" stroke={1.5} />,
        title: 'Security & Auditing',
        desc: 'Granular access control, Virtual Private Database (VPD), and audit logs satisfy finance, healthcare, and government compliance requirements.',
        color: 'rose',
      },
      {
        icon: <IconCloud size={20} color="#06b6d4" stroke={1.5} />,
        title: 'Cloud Integration',
        desc: 'Oracle Cloud + Autonomous Database — self-tuning, self-securing, and self-patching, fully automated.',
        color: 'cyan',
      },
    ],

    whyLearnTitle: 'Why learn Oracle?',
    whyLearnItems: [
      { icon: <IconBriefcase size={20} color="#2563eb" stroke={1.5} />, text: 'Core systems at most major Korean corporations, financial institutions, and government agencies run on Oracle.' },
      { icon: <IconCoin size={20} color="#d97706" stroke={1.5} />, text: 'Oracle DBAs and developers command strong salaries and enjoy sustained market demand.' },
      { icon: <IconBrain size={20} color="#7c3aed" stroke={1.5} />, text: 'Once you understand Oracle internals — optimizer, indexes, transactions — applying that knowledge to other databases becomes straightforward.' },
      { icon: <IconCertificate size={20} color="#059669" stroke={1.5} />, text: 'OCA / OCP certifications provide real career leverage for job seekers and career changers.' },
    ],

    usersTitle: 'Who uses Oracle?',
    usersSub: '98% of Fortune 500 companies use Oracle products.',
    userCards: [
      {
        org: 'Samsung · Hyundai · LG',
        category: 'Manufacturing',
        reason: 'Oracle DB powers the ERP backend (SAP, Oracle E-Business Suite), processing tens of millions of transactions, inventory, and HR records in real time.',
        color: 'blue',
      },
      {
        org: 'KB · Woori · Hana Bank',
        category: 'Banking & Finance',
        reason: 'Oracle RAC clusters ensure 24/7 uptime and transaction integrity for transfers, payments, and loans.',
        color: 'emerald',
      },
      {
        org: 'Amazon',
        category: 'Global Tech',
        reason: 'A landmark example: Amazon ran Oracle as its core DB for years before launching a large-scale migration to its own database services.',
        color: 'orange',
      },
      {
        org: 'HIRA · NTS (Korea)',
        category: 'Public & Healthcare',
        reason: 'National health records and tax data for the entire population require the enterprise reliability and precision that Oracle delivers.',
        color: 'violet',
      },
    ],

    closingTitle: 'What will you learn in this book?',
    closing:
      'This book starts at the surface — SQL syntax — and walks step-by-step into Oracle internals: the instance, SGA, PGA, and then performance optimization with the optimizer, indexes, and partitioning.\n\n' +
      "The goal isn't to memorize SQL. It's to understand why Oracle works the way it does. Once you understand the principles, you can diagnose slow queries, design better schemas, and write SQL that the optimizer loves.\n\n" +
      "Let's get started.",
  },
}

const COLOR_CARD: Record<string, { bg: string; border: string; badge: string }> = {
  blue:    { bg: 'bg-blue-50/60',    border: 'border-blue-200',    badge: 'bg-blue-100 text-blue-700' },
  emerald: { bg: 'bg-emerald-50/60', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  orange:  { bg: 'bg-orange-50/60',  border: 'border-orange-200',  badge: 'bg-orange-100 text-orange-700' },
  violet:  { bg: 'bg-violet-50/60',  border: 'border-violet-200',  badge: 'bg-violet-100 text-violet-700' },
  rose:    { bg: 'bg-rose-50/60',    border: 'border-rose-200',    badge: 'bg-rose-100 text-rose-700' },
  cyan:    { bg: 'bg-cyan-50/60',    border: 'border-cyan-200',    badge: 'bg-cyan-100 text-cyan-700' },
}

export function IntroductionPage() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer className="max-w-4xl">

      {/* ── Hero ── */}
      <div className="mb-10 rounded-2xl border bg-gradient-to-br from-slate-50 to-blue-50/40 px-8 py-10">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-red-600 border border-red-200">
            Oracle
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">Introduction</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight leading-tight">{t.hero}</h1>
        <p className="mt-3 text-base text-muted-foreground leading-relaxed">{t.heroSub}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {['#RDBMS', '#SQL', '#Enterprise', '#OCI', '#23ai'].map((tag) => (
            <span key={tag} className="rounded-full border bg-white/80 px-3 py-0.5 font-mono text-[11px] text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ── What is a DB ── */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-bold tracking-tight">{t.whatIsDbTitle}</h2>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{t.whatIsDb}</p>
        <div className="rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 text-xs leading-relaxed text-blue-800">
          <span className="mr-1.5 inline-flex align-middle"><IconPin size={14} color="#ea580c" stroke={1.5} /></span>{t.whatIsDbNote}
        </div>
      </section>

      {/* ── Name origin ── */}
      <section className="mb-10">
        <h2 className="mb-1 text-xl font-bold tracking-tight">{t.nameTitle}</h2>
        <p className="mb-3 font-mono text-sm text-muted-foreground">{t.nameSub}</p>
        <div className="rounded-xl border bg-card px-6 py-5">
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{t.nameBody}</p>
        </div>
      </section>

      {/* ── History timeline ── */}
      <section className="mb-10">
        <h2 className="mb-5 text-xl font-bold tracking-tight">{t.historyTitle}</h2>
        <div className="relative ml-3 border-l-2 border-dashed border-muted-foreground/20 pl-6 space-y-0">
          {t.historyItems.map((item, i) => (
            <div key={i} className="relative pb-6 last:pb-0">
              <div className="absolute -left-6 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border-2 border-muted-foreground/20 bg-background">
                <div className="h-2 w-2 rounded-full bg-brand-navy" />
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 font-mono text-xs font-bold text-muted-foreground w-10">{item.year}</span>
                <span className="text-sm leading-relaxed text-muted-foreground">{item.text}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Strengths ── */}
      <section className="mb-10">
        <h2 className="mb-1 text-xl font-bold tracking-tight">{t.strengthTitle}</h2>
        <p className="mb-5 text-sm text-muted-foreground">{t.strengthSub}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.strengths.map((s) => {
            const c = COLOR_CARD[s.color]
            return (
              <div key={s.title} className={cn('rounded-xl border p-4', c.bg, c.border)}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="shrink-0">{s.icon}</span>
                  <span className="text-sm font-bold">{s.title}</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Why learn ── */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold tracking-tight">{t.whyLearnTitle}</h2>
        <div className="space-y-3">
          {t.whyLearnItems.map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3">
              <span className="shrink-0 mt-0.5">{item.icon}</span>
              <span className="text-sm leading-relaxed text-muted-foreground">{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who uses Oracle ── */}
      <section className="mb-10">
        <h2 className="mb-1 text-xl font-bold tracking-tight">{t.usersTitle}</h2>
        <p className="mb-5 text-sm text-muted-foreground">{t.usersSub}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {t.userCards.map((card) => {
            const c = COLOR_CARD[card.color]
            return (
              <div key={card.org} className={cn('rounded-xl border p-4', c.bg, c.border)}>
                <div className="mb-2 flex items-center gap-2">
                  <span className={cn('rounded-md px-2 py-0.5 font-mono text-[11px] font-bold', c.badge)}>
                    {card.category}
                  </span>
                </div>
                <div className="mb-1.5 text-sm font-bold">{card.org}</div>
                <p className="text-xs leading-relaxed text-muted-foreground">{card.reason}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Closing ── */}
      <section className="rounded-2xl border bg-gradient-to-br from-slate-50 to-orange-50/30 px-7 py-7">
        <h2 className="mb-3 text-lg font-bold tracking-tight">{t.closingTitle}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{t.closing}</p>
      </section>

    </PageContainer>
  )
}

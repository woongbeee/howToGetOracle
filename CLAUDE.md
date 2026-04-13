# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

사용자와 상호작용하는 Dynamic Oracle 교육서. 좌측 사이드바 목차(TOC)에서 8개 챕터를 탐색하고, 각 섹션에서 개념 설명 + 인터랙티브 애니메이션 + 챕터별 시뮬레이터를 통해 Oracle 내부를 학습한다.

**8개 챕터:** 오라클 내부 구조·프로세스 → 인덱스 → 조인 → 옵티마이저 → 쿼리 변환 → 소트 튜닝 → 파티셔닝 → 병렬 처리

## 명령어

```bash
npm run dev       # 개발 서버 시작 (Vite HMR)
npm run build     # TypeScript 컴파일 후 Vite 번들링 (dist/)
npm run lint      # ESLint 검사
npm run preview   # 빌드 결과물 미리보기
npx prettier --write .  # 코드 포매팅 (format 스크립트 없음, 직접 실행)
```

> 테스트 프레임워크 없음. lint는 `npm run lint`로 확인.

## 아키텍처

### 앱 진입점 및 뷰 전환

`App.tsx`가 `AppView: 'landing' | 'book'` 로컬 state로 최상위 뷰를 제어한다. `'landing'` 시 `#root`에 `.landing` 클래스가 붙어 전체 배경 스타일이 달라진다.

### Book 레이아웃 (`src/book/`)

`BookLayout`이 `activeSectionId` state를 소유하고 `TableOfContents`와 `BookContent` 양쪽에 전달한다.

`BookContent`는 `sectionId`를 받아 `bookStructure.ts`의 `getSectionById()`로 챕터를 확인한 뒤, `SectionRouter`가 섹션 ID 접두사로 챕터 컴포넌트를 결정한다(`startsWith('internals-')` 등). **새 챕터를 추가할 때 섹션 ID 접두사가 `SectionRouter`의 분기 조건과 일치해야 한다.**

챕터 페이지 컴포넌트는 `sectionId`만 prop으로 받으며, `lang`은 `useSimulationStore`에서 직접 읽는다:

```ts
interface Props {
  sectionId: string   // 현재 활성 섹션 ID
}
// lang은 컴포넌트 내부에서: const lang = useSimulationStore(s => s.lang)
```

`onNavigate`는 `BookContent`에서 관리하며 Prev/Next 버튼에서 사용됨. 챕터 페이지가 내부 탐색이 필요한 경우 별도 prop으로 받는다.

`bookStructure.ts`의 `BOOK_CHAPTERS`가 단일 진실 공급원(TOC 데이터). 새 섹션 추가 시 여기만 수정하면 TOC·breadcrumb·Prev/Next가 자동 반영된다.

앱 첫 진입 시 활성 섹션은 `internals-storage` (Chapter 1 첫 섹션, `BookLayout.tsx`의 `useState` 초기값).

현재 `SectionRouter` 접두사 → 컴포넌트 매핑:
| 접두사 | 컴포넌트 | 파일 |
|--------|----------|------|
| `internals-` | `InternalsPage` | `src/book/chapters/InternalsPage.tsx` |
| `index-` | `IndexChapterPage` | `src/book/chapters/IndexChapterPage.tsx` |
| `join-` | `JoinPage` | `src/book/chapters/JoinPage.tsx` |
| `optimizer-` | `OptimizerChapterPage` | `src/book/chapters/OptimizerChapterPage.tsx` |
| `qt-` | `QueryTransformPage` | `src/book/chapters/QueryTransformPage.tsx` |
| `sort-` | `SortPage` | `src/book/chapters/SortPage.tsx` |
| `partition-` | `PartitionPage` | `src/book/chapters/PartitionPage.tsx` |
| `parallel-` | `ParallelPage` | `src/book/chapters/ParallelPage.tsx` |

각 챕터 페이지는 `sectionId`를 받아 내부적으로 `if/switch`로 섹션별 콘텐츠를 분기한다.

새 챕터 추가 체크리스트:
1. `BOOK_CHAPTERS`에 챕터 항목 추가 (`color`는 `BookContent.tsx`의 `COLOR_MAP` 키 중 하나여야 함: `blue|violet|emerald|orange|cyan|rose|amber|teal`)
2. 챕터 페이지 컴포넌트 생성 (`src/book/chapters/`)
3. `BookContent.tsx`의 `SectionRouter`에 접두사 분기 추가
4. 시뮬레이터 섹션(전체 높이 레이아웃이 필요한 섹션)은 `BookContent.tsx`의 `FULLSCREEN_SECTIONS` Set에 해당 섹션 ID를 추가해야 함. 그렇지 않으면 스크롤 래퍼로 감싸져 레이아웃이 깨짐

### 시뮬레이션 데이터 흐름

```
사용자 SQL 입력 (QueryInput)
  → simulationStore.startSimulation()
      → lib/optimizer/index.ts: optimize(sql)   ← CBO 실행 계획 생성
      → 13단계 시뮬레이션 루프 (각 단계마다 activeComponents 업데이트)
  → OracleDiagram (activeComponents에 따라 블록 하이라이트/애니메이션)
  → OptimizerPanel (OptimizerResult 표시)
  → QueryInput 하단 (stepLog 실시간, stepSummary 완료 후)
```

### 상태 관리 (`src/store/simulationStore.ts`)

Zustand 단일 스토어. 핵심 상태:
- `lang: 'ko' | 'en'` — UI 언어. `STEP_TEXTS`와 `STEP_PROCESS_LABEL`이 언어별 문자열 맵을 보유
- `currentStep / isRunning / isComplete` — 시뮬레이션 제어
- `activeComponents: Set<string>` — OracleDiagram에서 어떤 블록을 활성화할지
- `highlightedStep` — stepSummary 타임라인 클릭 시 해당 단계로 핀 고정 (null이면 현재 단계 따라감)
- `dataFlowArrows` — 컴포넌트 간 애니메이션 화살표
- `cachedQueries` — Library Cache 쿼리 목록 (최대 8개, FIFO). 3개 시드 쿼리로 초기화
- `bufferFlushed` — `flushBuffers()` 호출 후 `true`가 되어 다음 시뮬레이션에서 반드시 Buffer Miss 발생; 시뮬레이션 완료 시 자동 `false` 리셋
- `flushBuffers()` — DBWn+CKPT 플러시 애니메이션 단독 실행 (시뮬레이션과 무관)

Library Cache Hit 판단: `trim().toUpperCase()` 정규화 후 `cachedQueries`와 완전 일치 비교. Buffer Cache Hit 판단: `bufferFlushed`가 false이면 `Math.random() > 0.5`로 무작위 결정.

### CBO 옵티마이저 (`src/lib/optimizer/`)

Oracle CBO를 모방한 순수 TypeScript 구현:
- `parser.ts` — SQL SELECT 파싱 (테이블, 컬럼, WHERE 조건, JOIN 추출)
- `stats.ts` — 12개 테이블의 시뮬레이션 통계 (NDV, numRows, numBlocks 등)
- `estimator.ts` — 선택도(selectivity) 계산, 액세스 패스 비용 추정, 조인 비용 추정
- `planGenerator.ts` — 3단계 최적화: Query Transformer → Estimator → Plan Generator

`stats.ts`의 `TABLE_STATS` 테이블 이름이 `hrSchema.ts`·`coSchema.ts`의 스키마 이름과 일치해야 CBO가 올바르게 동작한다.

### 시뮬레이터 컴포넌트 (`src/components/`)

Internals 시뮬레이터를 구성하는 핵심 컴포넌트들:
- `OracleDiagram.tsx` — 인스턴스 블록 다이어그램 (activeComponents에 따라 하이라이트)
- `QueryInput.tsx` — SQL 입력창 + `LiveLog` / `SummaryTimeline` named export
- `OptimizerPanel.tsx` — CBO 실행 계획 3단계 시각화
- `DataPanel.tsx` — 스키마·샘플 데이터 브라우저
- `SchemaDiagram.tsx` — React Flow 기반 ERD
- `components/index/` — Index 챕터 전용 서브 컴포넌트들

### 데이터 스키마 (`src/data/`)

- `types.ts` — 공유 TypeScript 인터페이스: `SchemaTable`, `Schema`, `ColumnDef`, `ForeignKey`, `RowData`. `hrSchema`·`coSchema`·`SchemaDiagram` 등이 이 타입을 공통으로 사용
- `hrSchema.ts` — HR 스키마 7개 테이블 + 샘플 데이터
- `coSchema.ts` — CO(Customer Orders) 스키마 5개 테이블 + 샘플 데이터
- `largeDataGenerator.ts` — IndexPage용 대용량 가상 데이터 생성기 (Mulberry32 PRNG, 시드 기반). 모듈 import 시 1회 생성 후 캐시됨
- `index.ts` — 배럴 파일. `SCHEMAS`, `SAMPLE_QUERIES`, 두 스키마, `largeDataGenerator`를 re-export
- `dataset.ts` — 레거시 심플 `DATASET` 배열 (`Table[]` 타입, `types.ts`와 무관). 현재는 직접 참조 드물고 `hrSchema`/`coSchema`가 주 데이터 소스임

### 용어 사전 (`src/data/glossary.ts`, `src/book/GlossaryPanel.tsx`)

`GlossaryTerm` 인터페이스: `term` (영문 표시명), `definition: { ko, en }`, `sectionIds: string[]` (관련 섹션 ID 목록).

`GLOSSARY` 배열이 전체 용어 목록의 단일 진실 공급원. `getTermsForSection(sectionId)` 는 `sectionIds` 배열에 해당 섹션 ID가 포함된 용어를 필터링한다. `sortTerms()` 는 알파벳 순으로 정렬.

`GlossaryPanel`은 우측 고정 사이드 패널. `GlossaryBody`는 `key={sectionId}`로 마운트되어 섹션 변경 시 검색·확장 상태가 리셋된다. 용어 추가 시 `glossary.ts`의 `GLOSSARY`에만 항목을 추가하고 `sectionIds`에 해당 섹션 ID를 나열하면 패널에 자동 반영된다.

### 챕터 내 이중 언어 문자열 패턴

모든 챕터 페이지는 컴포넌트 최상단에 `T` 객체로 ko/en 문자열을 인라인 정의한다:

```ts
const T = {
  ko: { title: '...', desc: '...' },
  en: { title: '...', desc: '...' },
}
// 사용: const t = T[lang]  →  t.title
```

번역이 필요한 UI 문자열은 모두 이 패턴으로 관리하며, 별도 i18n 라이브러리 없음.

### 복잡한 챕터의 서브 컴포넌트 분리

콘텐츠가 많은 챕터(Index 등)는 섹션별 서브 컴포넌트를 `src/components/<챕터명>/`에 분리한다. 예: `src/components/index/` — `BTreeSection.tsx`, `BitmapSection.tsx`, `CompositeSection.tsx`, `IndexTypesOverview.tsx`. 챕터 페이지(`IndexChapterPage.tsx`)가 이를 import해 조합한다.

#### Index 챕터 우측 패널 (`HRSchemaPanel`)

`IndexChapterPage.tsx`의 `IndexLayout`은 좌측 스크롤 영역 + 우측 고정 `HRSchemaPanel`로 구성된다. `HRSchemaPanel`은 **스키마 탭**(HR 전체 7개 테이블 구조)과 **데이터 탭**(테이블 선택 버튼 + 해당 테이블 행 데이터)을 제공한다. `DataPanel.tsx`의 `SchemaView`·`TableView`를 재사용하며, `HR_SCHEMA` 배열 전체를 데이터 소스로 사용한다. `index-simulator` 섹션만 `IndexLayout` 외부(`PageContainer`)로 렌더링된다.

### 챕터 공통 UI (`src/book/chapters/shared.tsx`)

`PageContainer`, `ChapterTitle`, `SectionTitle`, `SubTitle`, `Prose`, `InfoBox`, `Table`, `ConceptGrid`, `Divider`, `SimulatorPlaceholder` 등 챕터 내 모든 공통 레이아웃 프리미티브. 새 챕터 콘텐츠 작성 시 이 컴포넌트들을 우선 사용한다.

`OracleInstanceMap` (`src/book/chapters/OracleInstanceMap.tsx`) — Internals 챕터 전용 인터랙티브 인스턴스 다이어그램. `InstanceComponentId` 타입으로 강조할 컴포넌트 ID를 받는다.

## 코드 스타일

- TypeScript strict 모드, `any` 타입 금지 (ESLint에서 error)
- named export만 사용 (`App.tsx`의 `export default App`은 Vite entry 요구사항 예외)
- CSS: Tailwind 유틸리티 클래스만 사용, 커스텀 CSS 파일 금지 (`index.css` 테마 변수 제외)
- Path alias: `@/` → `src/`

## ESLint / Prettier

- **ESLint**: TypeScript·React 문법 오류만 검사 (타입 오류, hooks 규칙, react-refresh)
- **Prettier** + `prettier-plugin-tailwindcss`: 포매팅·들여쓰기·Tailwind 클래스 자동 정렬
- `eslint-config-prettier`로 두 도구 충돌 방지

## 주요 의존성

- `zustand` — 전역 상태 관리
- `@xyflow/react` — ERD React Flow 기반 그래프 렌더링 (`SchemaDiagram`)
- `framer-motion` — 시뮬레이션 애니메이션 (화살표, 컴포넌트 하이라이트 전환)
- `lucide-react` — 아이콘 라이브러리
- `@base-ui/react` + `shadcn` — UI 컴포넌트 기반
- `tailwindcss` v4 — CSS-first 설정 방식 (`@import "tailwindcss"` in `index.css`)

## 테마 / 스타일링

`index.css`의 CSS 변수로 전역 테마 정의:
- Sapphire(파란계열), Tangerine(주황), Gold 액센트 컬러 사용
- shadcn/ui 스타일: `base-nova`
- React Flow 커스텀 오버라이드는 `index.css` 내 `.react-flow` 셀렉터에만 허용

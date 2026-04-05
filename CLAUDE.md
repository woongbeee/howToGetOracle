# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

사용자가 SQL 쿼리를 입력하면 Oracle Database 내부에서 일어나는 실행 과정을 시각적으로 시뮬레이션하는 교육용 앱. Oracle 인스턴스 아키텍처 다이어그램에서 각 컴포넌트(SGA, PGA, Buffer Cache, Library Cache 등)가 순차적으로 활성화되며, CBO(Cost-Based Optimizer)가 실행 계획을 생성해 보여준다.

## 명령어

```bash
npm run dev       # 개발 서버 시작 (Vite HMR)
npm run build     # TypeScript 컴파일 후 Vite 번들링 (dist/)
npm run lint      # ESLint 검사
npm run preview   # 빌드 결과물 미리보기
```

> 테스트 프레임워크 없음. lint는 `npm run lint`로 확인.

## 아키텍처

### 데이터 흐름

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
- `lang: 'ko' | 'en'` — UI 언어 설정 (`setLang()`으로 전환). `STEP_TEXTS`와 `STEP_PROCESS_LABEL`이 각 언어별 문자열 맵을 보유
- `currentStep / isRunning / isComplete` — 시뮬레이션 제어
- `activeComponents: Set<string>` — OracleDiagram에서 어떤 블록을 활성화할지
- `highlightedStep` — 사용자가 stepSummary 타임라인을 클릭하면 해당 단계로 핀 고정 (null이면 현재 단계 따라감)
- `dataFlowArrows` — 컴포넌트 간 애니메이션 화살표
- `stepLog / stepSummary` — 실행 로그 및 요약
- `cachedQueries` — Library Cache에 있는 쿼리 목록 (최대 8개, FIFO). 3개 시드 쿼리로 초기화되어 Library Cache Hit 시나리오 즉시 테스트 가능
- `optimizerResult: OptimizerResult | null` — CBO 결과
- `bufferFlushed` — `flushBuffers()` 호출 후 `true`가 되어 다음 시뮬레이션에서 반드시 Buffer Miss 발생; 시뮬레이션 완료 시 자동으로 `false` 리셋
- `flushBuffers()` — DBWn+CKPT 플러시 애니메이션 단독 실행 (시뮬레이션과 무관)

Library Cache Hit 판단: 쿼리 문자열을 `trim().toUpperCase()`로 정규화 후 `cachedQueries`와 완전 일치 비교. Buffer Cache Hit 판단: `bufferFlushed`가 false이면 `Math.random() > 0.5`로 무작위 결정.

### CBO 옵티마이저 (`src/lib/optimizer/`)

Oracle CBO를 모방한 순수 TypeScript 구현:
- `parser.ts` — SQL SELECT 파싱 (테이블, 컬럼, WHERE 조건, JOIN 추출)
- `stats.ts` — 12개 테이블의 시뮬레이션 통계 (NDV, numRows, numBlocks 등)
- `estimator.ts` — 선택도(selectivity) 계산, 액세스 패스 비용 추정, 조인 비용 추정
- `planGenerator.ts` — 3단계 최적화: Query Transformer → Estimator → Plan Generator
- `types.ts` — AccessPathType, JoinMethod, ExecutionPlan 등 타입 정의

### 데이터 스키마 (`src/data/`)

- `hrSchema.ts` — HR 스키마 7개 테이블 (EMPLOYEES, DEPARTMENTS 등) + 샘플 데이터
- `coSchema.ts` — CO(Customer Orders) 스키마 5개 테이블 + 샘플 데이터
- `dataset.ts` — DataPanel용 단순 `DATASET: Table[]` (스키마 무관, 별도 플랫 구조)
- `index.ts` — `src/data/` 배럴 파일. `SCHEMAS`, `SAMPLE_QUERIES`, 두 스키마, `largeDataGenerator` 함수를 한 곳에서 re-export
- `largeDataGenerator.ts` — IndexPage용 대용량 가상 데이터 생성기 (Mulberry32 PRNG, 시드 기반). EMPLOYEES 10k, ORDERS 50k, ORDER_ITEMS 100k 등 카디널리티 프로파일별 테이블 생성; 모듈 import 시 1회 생성 후 캐시됨
- `stats.ts`의 TABLE_STATS와 스키마 이름이 일치해야 CBO가 올바르게 동작

### 컴포넌트 구조

`App.tsx`가 최상위 뷰 상태(`AppView: 'landing' | 'simulator' | 'erd' | 'index'`)와 패널 열림 상태를 로컬 state로 관리한다. 앱 진입점은 항상 `LandingPage`이며, CTA 버튼으로 `simulator`, `erd`, 또는 `index` 뷰로 이동한다. 시뮬레이션 관련 상태는 전부 store에서 가져옴. QueryInput 패널은 드래그 핸들로 높이 조절 가능 (120px–520px, 기본 208px); `window` 이벤트 리스너로 구현.

- `LandingPage` — 진입 화면: 앱 소개, 주요 기능, 시뮬레이터/ERD/인덱스 진입 CTA. `lang` 토글 포함
- `OracleDiagram` — Oracle 인스턴스 구조 시각화 (SGA 하위: Library Cache, Dict Cache, Buffer Cache, Redo Log Buffer; Background Processes; Disk)
- `QueryInput` — SQL 입력 + 실시간 로그(실행 중) / 요약 타임라인(완료 후) + 샘플 쿼리 버튼
- `DataPanel` — 좌측 사이드바: 스키마 정의 뷰 / 테이블 데이터 뷰 (토글)
- `SchemaDiagram` (`SchemaDiagramView` export) — React Flow 기반 ERD (FK 관계 시각화)
- `OptimizerPanel` — 우측 사이드바: CBO 3단계, 액세스 패스 후보, 조인 방법, 실행 계획 트리
- `index/IndexPage` — Oracle 인덱스 교육 뷰 (탭: Overview / B-Tree / Bitmap / Composite & More). `lang`은 store에서 읽음. 하위 섹션 컴포넌트(`BTreeSection`, `BitmapSection`, `CompositeSection`, `IndexTypesOverview`)는 `lang` prop을 직접 받음

## 코드 스타일

- TypeScript strict 모드, `any` 타입 금지 (ESLint에서 error)
- named export만 사용 (default export 금지 — `App.tsx`의 `export default App`은 Vite entry 요구사항 예외)
- CSS: Tailwind 유틸리티 클래스만 사용, 커스텀 CSS 파일 금지 (`index.css` 테마 변수 제외)
- React 19 자동 최적화 우선 활용, 수동 최적화는 react-scan으로 확인 후 적용
- Path alias: `@/` → `src/`

## ESLint / Prettier

- **ESLint**: TypeScript·React 문법 오류만 검사 (타입 오류, hooks 규칙, react-refresh)
- **Prettier** + `prettier-plugin-tailwindcss`: 포매팅·들여쓰기·Tailwind 클래스 자동 정렬
- `eslint-config-prettier`로 두 도구 충돌 방지

## 주요 의존성

- `zustand` — 전역 상태 관리
- `@xyflow/react` — ERD React Flow 기반 그래프 렌더링 (`SchemaDiagram`)
- `framer-motion` — 시뮬레이션 애니메이션 (화살표, 컴포넌트 하이라이트 전환)
- `@base-ui/react` + `shadcn` — UI 컴포넌트 기반
- `tailwindcss` v4 — CSS-first 설정 방식 (`@import "tailwindcss"` in `index.css`)

## 테마 / 스타일링

`index.css`의 CSS 변수로 전역 테마 정의:
- Sapphire(파란계열), Tangerine(주황), Gold 액센트 컬러 사용
- shadcn/ui 스타일: `base-nova`
- React Flow 커스텀 오버라이드는 `index.css` 내 `.react-flow` 셀렉터에만 허용

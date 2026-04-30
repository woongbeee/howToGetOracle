# Inside Oracle — Interactive Learning Book

**https://woongbeee.github.io/woongbeee/**

문의: woongbeee@gmail.com

---

Oracle Database의 내부 동작 원리를 인터랙티브 애니메이션으로 배우는 학습서입니다.  
SQL 기초부터 인덱스, 조인, 옵티마이저, 소트 튜닝, 파티셔닝, 병렬 처리, 내부 구조까지 — 개념 설명과 실시간 시뮬레이터를 함께 제공합니다.

---

## 목차 (9 Chapters)

| # | 챕터 | 주요 내용 |
|---|------|-----------|
| 1 | SQL 기본 문법 | SELECT 구조, WHERE / GROUP BY / HAVING, JOIN, NULL, 날짜 함수, 윈도우 함수, 실행 순서, MERGE INTO, ROLLUP / CUBE / PIVOT |
| 2 | 오라클 내부 구조 | SGA / PGA, Shared Pool, Buffer Cache, Redo Log, Background Process, 인스턴스 시뮬레이터 |
| 3 | 인덱스 | B-Tree / Bitmap / 복합 인덱스 구조, 카디널리티별 인덱스 선택 원리 |
| 4 | 조인 | Nested Loops / Hash Join / Sort Merge Join, Self Join, CONNECT BY 계층 쿼리 |
| 5 | 옵티마이저 | CBO 비용 추정, 통계 정보, 액세스 패스 비교, Execution Plan |
| 6 | 쿼리 변환 | View Merging, Predicate Pushing, Subquery Unnesting, OR-Expansion |
| 7 | 소트 튜닝 | Sort 발생 조건, In-Memory vs Disk Sort, Sort 회피 전략 |
| 8 | 파티셔닝 | Range / List / Hash / Composite 파티션, Partition Pruning |
| 9 | 병렬 처리 | Parallel Query 아키텍처, PQ Coordinator / Slave, Parallel DML |

---

## 주요 기능

- **인터랙티브 북 레이아웃** — 좌측 TOC에서 챕터·섹션 탐색, 우측 Glossary 패널
- **Oracle Instance 시뮬레이터** — SQL 입력 시 Soft/Hard Parse 분기, Buffer Cache Hit/Miss, Disk I/O를 단계별 애니메이션으로 시각화
- **CBO Optimizer 패널** — Query Transformer → Estimator → Plan Generator 3단계 실행 계획 시각화
- **Schema ERD** — HR / CO 스키마 FK 관계도 (React Flow)
- **한국어 / English** 언어 전환 지원

---

## 실행 방법

Node.js 18 이상이 필요합니다.

```bash
git clone https://github.com/woongbeee/woongbeee.git
cd woongbeee
npm install
npm run dev
```

브라우저에서 `http://localhost:5173`을 엽니다.

---

## 기술 스택

| 역할 | 라이브러리 |
|------|-----------|
| UI 프레임워크 | React 19 + TypeScript |
| 번들러 | Vite |
| 상태 관리 | Zustand |
| 애니메이션 | Framer Motion |
| 스타일링 | Tailwind CSS v4 + shadcn/ui |
| ERD | React Flow (@xyflow/react) |

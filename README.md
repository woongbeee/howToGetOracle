# Inside Oracle — Interactive Learning Book

Oracle Database를 처음부터 끝까지 탐색하는 인터랙티브 학습서입니다.  
SQL 기초부터 내부 구조, 인덱스, 조인, 옵티마이저, 쿼리 변환, 소트 튜닝, 파티셔닝, 병렬 처리까지 — 개념 설명과 실시간 애니메이션을 함께 제공합니다.

---

## 왜 만들었나

Oracle 공식 문서나 교재에는 SGA, PGA, Buffer Cache, Library Cache 같은 개념이 텍스트와 정적 다이어그램으로만 설명됩니다.  
"쿼리가 실제로 어떤 순서로 어느 컴포넌트를 거치는가"를 눈으로 따라가기는 쉽지 않죠.

이 책은 Oracle 내부에서 벌어지는 일 — Soft/Hard Parse 분기, CBO 실행 계획 생성, Buffer Cache Hit/Miss, Disk I/O, Background Process 동작 — 을 실시간 애니메이션과 인터랙티브 시뮬레이터로 보여줍니다.

---

> **Oracle이라는 이름에 대해**
>
> 고대 그리스 델피의 아폴로 신전에서는 여사제가 신탁(Oracle)을 내려주는 것으로 유명했습니다.  
> 델피의 신탁이 잘 맞았던 이유로 학자들은 이렇게 설명합니다 — 그리스 각지에서 사람들이 몰려와 자국의 사정과 앞으로의 계획을 세세히 털어놓았기 때문에,  
> 여사제는 앉은 자리에서 세계의 신문을 구독하는 것과 같은 정보를 가질 수 있었다고요.
>
> Oracle도, AI도 잘 정리된 관계 데이터의 집합에서 통찰을 얻는다는 점에서 닮아 있습니다.  
> **대답보다 왜 이런 대답이 나왔는지가 더 중요합니다.**  
> 결과 뒤에 숨은 원리를 쉽게 보여주는 도구를 만들어, 기술이 세워놓은 장벽을 낮추고 싶었습니다.

---

## 목차 (9 Chapters)

| # | 챕터 | 주요 내용 |
|---|------|-----------|
| 1 | **SQL 기본 문법** | SELECT 구조, WHERE/GROUP BY/HAVING, JOIN 유형, NULL 처리, 날짜 함수, 윈도우 함수, 실행 순서 |
| 2 | **오라클 내부 구조·프로세스** | SGA/PGA 구조, Shared Pool, Buffer Cache, Redo Log, Background Processes, 인스턴스 시뮬레이터 |
| 3 | **인덱스** | B-Tree·Bitmap·복합 인덱스 구조, 카디널리티별 인덱스 선택 원리, 대용량 가상 데이터 실습 |
| 4 | **조인** | Nested Loops·Hash Join·Sort Merge Join 동작 원리, Self Join, CONNECT BY 계층 쿼리, Grouping Sets |
| 5 | **옵티마이저** | CBO 비용 추정 원리, 통계 정보, 액세스 패스 비교, Execution Plan 읽기 |
| 6 | **쿼리 변환** | View Merging, Predicate Pushing, Subquery Unnesting, OR-Expansion |
| 7 | **소트 튜닝** | Sort 발생 조건, In-Memory Sort vs Disk Sort, Sort 회피 전략 |
| 8 | **파티셔닝** | Range·List·Hash·Composite 파티션 구조, Partition Pruning |
| 9 | **병렬 처리** | Parallel Query 아키텍처, PQ Coordinator/Slave, Parallel DML |

---

## 주요 기능

### 인터랙티브 북 레이아웃
- 좌측 사이드바 TOC에서 챕터·섹션 탐색
- 섹션마다 개념 설명 → 인터랙티브 애니메이션 → 실습 시뮬레이터 순으로 구성
- 한국어 / English 언어 전환 지원
- 우측 용어 사전(Glossary) 패널 — 섹션별 관련 Oracle 용어 즉시 조회

### Oracle Instance 시뮬레이터 (Chapter 2)
- SQL을 입력하면 Oracle 인스턴스 내부 처리를 단계별 애니메이션으로 시각화
- Library Cache **Soft/Hard Parse** 분기, Buffer Cache **Hit/Miss**, Disk I/O, Background Process 동작 확인
- **Buffer Flush** 버튼으로 DBWn + CKPT 동작 시뮬레이션 — 이후 쿼리에서 반드시 Disk I/O 발생
- 실행 완료 후 타임라인 단계 클릭 → 해당 시점 상태로 다이어그램 핀 고정

### CBO Optimizer 패널
- Query Transformer → Estimator → Plan Generator 3단계 시각화
- 테이블별 액세스 패스 후보(Full Table Scan, Index Range Scan 등) 비용 비교
- Join Method 선택 과정 및 최종 Execution Plan 트리

### Schema ERD
- **HR 스키마** — EMPLOYEES, DEPARTMENTS, JOBS 등 7개 테이블
- **CO 스키마** — CUSTOMERS, ORDERS, ORDER_ITEMS 등 5개 테이블
- React Flow 기반 FK 관계 시각화

---

## 실행 방법

Node.js 18 이상이 필요합니다.

```bash
git clone https://github.com/woongbeee/InsideOracleDataBase.git
cd InsideOracleDataBase
npm install
npm run dev
```

브라우저에서 `http://localhost:5173`을 엽니다.

```bash
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과물 미리보기
```

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

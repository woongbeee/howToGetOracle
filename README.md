# Oracle Database Internals Simulator

SQL 쿼리를 입력하면 Oracle Database 내부에서 실제로 일어나는 처리 과정을 단계별로 시각화하는 교육용 인터랙티브 앱입니다.

## 왜 만들었나

Oracle 공식 문서나 교재에는 SGA, PGA, Buffer Cache, Library Cache 같은 개념이 텍스트와 정적 다이어그램으로만 설명됩니다. "쿼리가 실제로 어떤 순서로 어느 컴포넌트를 거치는가"를 눈으로 따라가기 어렵죠.

이 앱은 SQL을 실행했을 때 Oracle 인스턴스 내부에서 벌어지는 일 — Soft/Hard Parse 분기, CBO 실행 계획 생성, Buffer Cache Hit/Miss, Disk I/O, Background Process 동작 — 을 실시간 애니메이션으로 보여줍니다. DB 내부 구조를 처음 공부하는 사람도 흐름을 직관적으로 이해할 수 있도록 만들었습니다.

## 주요 기능

**Oracle Instance 다이어그램**
- SGA (Shared Pool → Library Cache / Data Dictionary Cache, Buffer Cache, Redo Log Buffer, Undo Segment)
- PGA, Server Process, Background Processes (DBWn, LGWR, CKPT, SMON, PMON)
- Disk Storage (Data Files, Online Redo Logs, Control File, Archive Logs)
- 각 단계에서 관련 컴포넌트가 강조되고 데이터 흐름 화살표가 표시됨

**단계별 시뮬레이션**
- Library Cache에 동일 쿼리가 있으면 Soft Parse, 없으면 Hard Parse → Dict Cache 조회 → CBO 최적화
- Buffer Cache Hit이면 디스크 없이 반환, Miss이면 Disk I/O 후 버퍼에 로드
- Buffer Flush 실행 후 쿼리를 돌리면 반드시 Cache Miss → Disk I/O 경로를 탐

**CBO Optimizer 패널**
- Query Transformer → Estimator → Plan Generator 3단계 시각화
- 테이블별 액세스 패스 후보 (Full Table Scan, Index Range Scan 등) 비용 비교
- Join Method 선택 과정 (Nested Loops / Hash Join / Sort Merge Join)
- 최종 Execution Plan 트리

**Schema ERD**
- HR 스키마 (EMPLOYEES, DEPARTMENTS, JOBS 등 7개 테이블)
- CO 스키마 (Customer Orders: CUSTOMERS, ORDERS, ORDER_ITEMS 등 5개 테이블)
- React Flow 기반 FK 관계 시각화

## 스크린샷

| Simulator | CBO Optimizer |
|-----------|--------------|
| Oracle Instance 다이어그램 + 실시간 단계 로그 | 3단계 최적화 과정 + 실행 계획 트리 |

## 실행 방법

Node.js 18 이상이 필요합니다.

```bash
# 저장소 클론
git clone https://github.com/woongbeee/InsideOracleDataBase.git
cd InsideOracleDataBase

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

브라우저에서 `http://localhost:5173` 을 엽니다.

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview
```

## 사용 방법

1. 하단 입력창에 SQL을 직접 입력하거나, 상단 샘플 쿼리 버튼 중 하나를 클릭합니다.
2. **RUN** 버튼 또는 `Ctrl+Enter`로 실행합니다.
3. 다이어그램에서 각 컴포넌트가 순서대로 활성화되는 것을 확인합니다.
4. 실행 완료 후 하단 타임라인의 각 단계를 클릭하면 해당 시점의 컴포넌트 상태로 다이어그램이 핀 고정됩니다.
5. 헤더의 **▶ Optimizer** 버튼을 누르면 CBO가 선택한 실행 계획 상세 내역을 볼 수 있습니다.
6. **Buffer Flush** 버튼을 누르면 DBWn + CKPT 동작을 시뮬레이션하고, 이후 쿼리 실행 시 반드시 Disk I/O가 발생합니다.
7. 하단 패널 상단 경계를 위아래로 드래그해 로그 영역 크기를 조절할 수 있습니다.

## 기술 스택

| 역할 | 라이브러리 |
|------|-----------|
| UI 프레임워크 | React 19 + TypeScript |
| 번들러 | Vite |
| 상태 관리 | Zustand |
| 애니메이션 | Framer Motion |
| 스타일링 | Tailwind CSS v4 + shadcn/ui |
| ERD | React Flow (@xyflow/react) |

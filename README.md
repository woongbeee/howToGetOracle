# Oracle Database Internals Simulator

SQL 쿼리를 입력하면 Oracle Database 내부의 처리 과정을 단계별로 시각화하는 교육용 인터랙티브 앱입니다.

---

## 왜 만들었나

Oracle 공식 문서나 교재에는 SGA, PGA, Buffer Cache, Library Cache 같은 개념이 텍스트와 정적 다이어그램으로만 설명됩니다.
"쿼리가 실제로 어떤 순서로 어느 컴포넌트를 거치는가"를 눈으로 따라가기는 쉽지 않죠.

이 앱은 SQL을 실행했을 때 Oracle 인스턴스 내부에서 벌어지는 일 — Soft/Hard Parse 분기, CBO 실행 계획 생성, Buffer Cache Hit/Miss, Disk I/O, Background Process 동작 — 을 실시간 애니메이션으로 보여줍니다.

---

> **Oracle이라는 이름에 대해**
>
> 고대 그리스 델피의 아폴로 신전에서는 여사제가 신탁(Oracle)을 내려주는 것으로 유명했습니다.
> 델피의 신탁이 잘 맞았던 이유로 학자들은 이렇게 설명합니다 — 그리스 각지에서 사람들이 몰려와 자국의 사정과 앞으로의 계획을 세세히 털어놓았기 때문에,
> 여사제는 앉은 자리에서 세계의 신문을 구독하는 것과 같은 정보를 가질 수 있었다고요.
>
> Oracle도, AI도 잘 정리된 관계 데이터의 집합에서 통찰을 얻는다는 점에서 닮아 있습니다.
> 세상에는 원하는 답을 척척 내놓는 도구들이 많지만, 그 안에서 무슨 일이 벌어지는지는 잘 보이지 않습니다.
> **대답보다 왜 이런 대답이 나왔는지가 더 중요합니다.**
> 결과 뒤에 숨은 원리를 쉽게 보여주는 도구를 만들어, 기술이 세워놓은 장벽을 낮추고 싶었습니다.

---

## 주요 기능

### Oracle Instance 다이어그램
- **SGA** — Shared Pool(Library Cache / Data Dictionary Cache), Buffer Cache, Redo Log Buffer, Undo Segment
- **PGA** — Server Process, Background Processes(DBWn, LGWR, CKPT, SMON, PMON)
- **Disk** — Data Files, Online Redo Logs, Control File, Archive Logs
- 각 실행 단계에서 관련 컴포넌트가 강조되고 데이터 흐름 화살표가 표시됩니다

### 단계별 시뮬레이션
- Library Cache에 동일 쿼리가 있으면 **Soft Parse**, 없으면 **Hard Parse** → Dict Cache 조회 → CBO 최적화
- Buffer Cache **Hit** 시 디스크 없이 반환, **Miss** 시 Disk I/O 후 버퍼에 로드
- Buffer Flush 실행 후 쿼리를 돌리면 반드시 Cache Miss → Disk I/O 경로를 탐

### CBO Optimizer 패널
- Query Transformer → Estimator → Plan Generator 3단계 시각화
- 테이블별 액세스 패스 후보(Full Table Scan, Index Range Scan 등) 비용 비교
- Join Method 선택 과정(Nested Loops / Hash Join / Sort Merge Join)
- 최종 Execution Plan 트리

### Schema ERD
- **HR 스키마** — EMPLOYEES, DEPARTMENTS, JOBS 등 7개 테이블
- **CO 스키마** — CUSTOMERS, ORDERS, ORDER_ITEMS 등 5개 테이블
- React Flow 기반 FK 관계 시각화

### Index Internals
- B-Tree, Bitmap, 복합 인덱스 구조를 탭별로 학습
- 실제 대용량 가상 데이터(최대 200,000 rows)를 기반으로 카디널리티별 인덱스 선택 원리 설명

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

## 사용 방법

1. 하단 입력창에 SQL을 직접 입력하거나, 샘플 쿼리 버튼을 클릭합니다.
2. **RUN** 버튼 또는 `Ctrl+Enter`로 실행합니다.
3. 다이어그램에서 각 컴포넌트가 순서대로 활성화되는 것을 확인합니다.
4. 실행 완료 후 하단 타임라인의 단계를 클릭하면 해당 시점의 상태로 다이어그램이 핀 고정됩니다.
5. 헤더의 **▶ Optimizer** 버튼으로 CBO 실행 계획 상세 내역을 확인합니다.
6. **Buffer Flush** 버튼으로 DBWn + CKPT 동작을 시뮬레이션하면, 이후 쿼리에서 반드시 Disk I/O가 발생합니다.
7. 하단 패널 경계를 드래그해 로그 영역 크기를 조절할 수 있습니다.

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

// Oracle Database Glossary
// Each term has: term (display name), definition (ko/en), tags (section IDs where it appears)

export interface GlossaryTerm {
  term: string
  definition: { ko: string; en: string }
  /** sectionId prefixes or full IDs this term is relevant to */
  sectionIds: string[]
}

export const GLOSSARY: GlossaryTerm[] = [
  // ── A ──────────────────────────────────────────────────────────────────────
  {
    term: 'AMM',
    definition: {
      ko: 'Automatic Memory Management. Oracle 11g 이후 SGA와 PGA를 MEMORY_TARGET 파라미터 하나로 자동 관리하는 기능.',
      en: 'Automatic Memory Management. Introduced in Oracle 11g, it manages both SGA and PGA automatically using a single MEMORY_TARGET parameter.',
    },
    sectionIds: ['internals-sga', 'internals-pga'],
  },
  {
    term: 'ARCn',
    definition: {
      ko: 'Archiver 프로세스. Online Redo Log가 꽉 차면 Archive Log File로 복사하는 백그라운드 프로세스. ARCHIVELOG 모드에서만 동작.',
      en: 'Archiver process. Copies online redo log files to archive log files when they fill up. Only active in ARCHIVELOG mode.',
    },
    sectionIds: ['internals-processes'],
  },
  {
    term: 'ASMM',
    definition: {
      ko: 'Automatic Shared Memory Management. SGA_TARGET 파라미터로 SGA 내부 구성 요소(Buffer Cache, Shared Pool 등)의 크기를 자동 조정하는 기능.',
      en: 'Automatic Shared Memory Management. Uses SGA_TARGET to automatically tune the sizes of SGA components like Buffer Cache and Shared Pool.',
    },
    sectionIds: ['internals-sga'],
  },
  {
    term: 'AWR',
    definition: {
      ko: 'Automatic Workload Repository. MMON 프로세스가 주기적으로 수집·저장하는 성능 스냅샷 저장소. 튜닝 분석에 활용.',
      en: 'Automatic Workload Repository. A repository of performance snapshots collected periodically by the MMON process, used for tuning analysis.',
    },
    sectionIds: ['internals-processes'],
  },

  // ── B ──────────────────────────────────────────────────────────────────────
  {
    term: 'B-Tree Index',
    definition: {
      ko: '균형 트리(Balanced Tree) 구조의 인덱스. Root → Branch → Leaf 블록으로 구성되며, 대부분의 OLTP 쿼리에 적합.',
      en: 'Balanced Tree index structure with Root → Branch → Leaf blocks. Suitable for most OLTP queries.',
    },
    sectionIds: ['index-btree', 'index-overview'],
  },
  {
    term: 'Bind Variable',
    definition: {
      ko: '쿼리에서 리터럴 대신 사용하는 플레이스홀더(:v1 등). Library Cache 재사용을 높여 Soft Parse 비율을 향상시킴.',
      en: 'A placeholder (:v1) used instead of literals in queries. Improves Library Cache reuse and increases Soft Parse rates.',
    },
    sectionIds: ['internals-sga', 'optimizer-overview'],
  },
  {
    term: 'Bitmap Index',
    definition: {
      ko: '컬럼 값별로 비트맵(0/1 배열)을 저장하는 인덱스. 선택도가 낮은(Cardinality 낮은) 컬럼에 유리. AND/OR 연산이 빠름.',
      en: 'An index storing bitmaps per column value. Efficient for low-cardinality columns and fast for AND/OR operations.',
    },
    sectionIds: ['index-bitmap', 'index-overview'],
  },
  {
    term: 'Block',
    definition: {
      ko: 'Oracle I/O의 최소 단위(기본 8KB). 데이터 파일은 블록 단위로 읽고 씀. Block Header(기본 정보·트랜잭션 슬롯), Data Header(Table/Row Directory), Free Space, Row Data로 구성. Buffer Cache도 블록 단위로 관리.',
      en: 'The minimum I/O unit in Oracle (default 8KB). Data files are read and written in blocks. A block contains a Block Header (metadata + transaction slots), Data Header (Table/Row Directory), Free Space, and Row Data. Buffer Cache is also managed per block.',
    },
    sectionIds: ['internals-storage', 'internals-overview', 'internals-sga'],
  },
  {
    term: 'Buffer Cache',
    definition: {
      ko: 'SGA의 구성 요소. 디스크에서 읽은 데이터 블록을 메모리에 캐싱. Cache Hit 시 물리적 I/O 없이 데이터에 접근.',
      en: 'An SGA component that caches data blocks read from disk in memory. Cache hits avoid physical I/O.',
    },
    sectionIds: ['internals-sga', 'internals-overview', 'internals-simulator'],
  },
  {
    term: 'Buffer Miss',
    definition: {
      ko: 'Buffer Cache에 요청한 블록이 없어 디스크에서 직접 읽어야 하는 상황. 물리적 I/O가 발생해 성능에 영향을 미침.',
      en: 'A situation where the requested block is not in Buffer Cache, requiring a physical disk read.',
    },
    sectionIds: ['internals-sga', 'internals-simulator'],
  },

  // ── C ──────────────────────────────────────────────────────────────────────
  {
    term: 'Cardinality',
    definition: {
      ko: '컬럼 내 유니크한 값의 수 또는 쿼리 결과의 예상 행 수. CBO가 실행 계획을 선택할 때 핵심 지표로 사용.',
      en: 'The number of unique values in a column, or the estimated number of rows returned by a query. A key metric for CBO plan selection.',
    },
    sectionIds: ['optimizer-stats', 'optimizer-overview', 'index-bitmap'],
  },
  {
    term: 'CBO',
    definition: {
      ko: 'Cost-Based Optimizer. 테이블 통계(행 수, NDV, 블록 수 등)를 기반으로 여러 실행 계획의 비용을 추정해 가장 낮은 비용의 계획을 선택.',
      en: 'Cost-Based Optimizer. Estimates the cost of multiple execution plans using table statistics (rows, NDV, blocks) and selects the cheapest plan.',
    },
    sectionIds: ['optimizer-overview', 'optimizer-stats', 'optimizer-plan'],
  },
  {
    term: 'CKPT',
    definition: {
      ko: 'Checkpoint 프로세스. Checkpoint 이벤트 발생 시 SCN을 컨트롤 파일과 데이터 파일 헤더에 기록하고 DBWn에 쓰기 신호를 전송.',
      en: 'Checkpoint process. Records the checkpoint SCN to the control file and data file headers, and signals DBWn to write dirty blocks.',
    },
    sectionIds: ['internals-processes'],
  },
  {
    term: 'Cluster Factor',
    definition: {
      ko: '인덱스 컬럼 순서와 테이블 행의 물리적 저장 순서의 유사 정도. 값이 낮을수록 Index Range Scan 비용이 낮아짐.',
      en: 'Measures how well the physical order of table rows matches the index column order. Lower values mean cheaper Index Range Scans.',
    },
    sectionIds: ['index-btree', 'optimizer-access-path'],
  },
  {
    term: 'Composite Index',
    definition: {
      ko: '두 개 이상의 컬럼으로 구성된 인덱스. 선두 컬럼(Leading Column) 조건이 있어야 효율적으로 사용됨.',
      en: 'An index built on two or more columns. Requires a leading column condition to be used efficiently.',
    },
    sectionIds: ['index-composite', 'index-overview'],
  },
  {
    term: 'Control File',
    definition: {
      ko: '데이터베이스의 물리적 구조(데이터 파일, 리두 로그 파일 경로, SCN 등)를 기록하는 바이너리 파일. 손상 시 복구 불가.',
      en: 'A binary file recording the physical structure of the database (data file paths, redo log paths, SCN). Critical — corruption means recovery failure.',
    },
    sectionIds: ['internals-overview', 'internals-processes'],
  },

  // ── D ──────────────────────────────────────────────────────────────────────
  {
    term: 'Data File',
    definition: {
      ko: '실제 테이블·인덱스 데이터를 저장하는 물리적 파일(.dbf). 테이블스페이스에 속하며 블록 단위로 구성. 하나의 테이블스페이스에 여러 데이터 파일을 추가해 공간을 확장할 수 있음.',
      en: 'Physical file (.dbf) storing actual table and index data. Belongs to a tablespace and is organized into blocks. Multiple data files can be added to a tablespace to expand its capacity.',
    },
    sectionIds: ['internals-storage', 'internals-overview'],
  },
  {
    term: 'DBWn',
    definition: {
      ko: 'Database Writer 프로세스. Buffer Cache의 Dirty(수정된) 블록을 데이터 파일에 기록. Checkpoint 신호 또는 임계값 초과 시 동작.',
      en: 'Database Writer process. Writes dirty (modified) blocks from Buffer Cache to data files. Triggered by checkpoint signals or threshold limits.',
    },
    sectionIds: ['internals-processes', 'internals-simulator'],
  },
  {
    term: 'Dictionary Cache',
    definition: {
      ko: 'Shared Pool의 일부. 테이블·컬럼·권한 등 데이터 딕셔너리 메타데이터를 캐싱해 반복 조회를 방지.',
      en: 'Part of Shared Pool. Caches data dictionary metadata (tables, columns, privileges) to avoid repeated lookups.',
    },
    sectionIds: ['internals-sga'],
  },
  {
    term: 'Dirty Block',
    definition: {
      ko: 'Buffer Cache에 올라와 있지만 아직 디스크에 반영되지 않은 수정된 블록. DBWn이 주기적으로 디스크에 기록.',
      en: 'A block in Buffer Cache that has been modified but not yet written to disk. DBWn periodically flushes dirty blocks.',
    },
    sectionIds: ['internals-sga', 'internals-processes'],
  },
  {
    term: 'DML',
    definition: {
      ko: 'Data Manipulation Language. INSERT, UPDATE, DELETE, MERGE 문. Redo Log에 변경 이력이 기록되며 UNDO 세그먼트에 이전 값이 저장.',
      en: 'Data Manipulation Language: INSERT, UPDATE, DELETE, MERGE. Changes are recorded in Redo Log; previous values are stored in UNDO segments.',
    },
    sectionIds: ['internals-sga', 'internals-processes'],
  },
  {
    term: 'DOP',
    definition: {
      ko: 'Degree of Parallelism. 병렬 처리 시 사용되는 병렬 슬레이브(PX 서버) 수. PARALLEL 힌트나 테이블 속성으로 지정.',
      en: 'Degree of Parallelism. The number of parallel slave (PX server) processes used. Specified via the PARALLEL hint or table attribute.',
    },
    sectionIds: ['parallel-dop', 'parallel-overview'],
  },

  // ── E ──────────────────────────────────────────────────────────────────────
  {
    term: 'Execution Plan',
    definition: {
      ko: 'CBO가 SQL을 실행하기 위해 선택한 작업 순서(액세스 패스, 조인 방법, 정렬 등). EXPLAIN PLAN 또는 DBMS_XPLAN으로 확인 가능.',
      en: 'The sequence of operations (access paths, join methods, sorts) chosen by the CBO. Viewable via EXPLAIN PLAN or DBMS_XPLAN.',
    },
    sectionIds: ['optimizer-plan', 'optimizer-overview'],
  },
  {
    term: 'Extent',
    definition: {
      ko: '논리적으로 연속된 블록들의 묶음. 세그먼트가 공간이 부족해지면 Extent 단위로 추가 할당받음. 연속된 블록 배치로 Sequential I/O 성능을 높임.',
      en: 'A set of logically contiguous blocks. When a segment runs out of space, another Extent is allocated. Contiguous block placement improves sequential I/O performance.',
    },
    sectionIds: ['internals-storage', 'internals-overview', 'partition-overview'],
  },

  // ── F ──────────────────────────────────────────────────────────────────────
  {
    term: 'Full Table Scan',
    definition: {
      ko: '테이블의 모든 블록을 순서대로 읽는 액세스 패스. 인덱스 없이도 사용 가능하며, 대량 데이터 처리 시 효율적일 수 있음.',
      en: 'An access path that reads every block in a table sequentially. Can be efficient for large data processing even without an index.',
    },
    sectionIds: ['optimizer-access-path', 'index-overview'],
  },

  // ── H ──────────────────────────────────────────────────────────────────────
  {
    term: 'Hard Parse',
    definition: {
      ko: '새로운 SQL이 Library Cache에 없어 파싱·최적화·실행 계획 생성 전 과정을 처음부터 수행하는 것. CPU 비용이 높음.',
      en: 'A full parse cycle (parsing, optimization, plan generation) performed when a SQL statement is not found in Library Cache. CPU-intensive.',
    },
    sectionIds: ['internals-sga', 'internals-simulator'],
  },
  {
    term: 'Hash Join',
    definition: {
      ko: '작은 테이블(Build Input)로 해시 테이블을 구성하고 큰 테이블(Probe Input)로 매칭하는 조인 방식. 대용량 조인에 효율적.',
      en: 'Builds a hash table from the smaller table (build input) and probes it with the larger table (probe input). Efficient for large-volume joins.',
    },
    sectionIds: ['join-hash', 'join-overview'],
  },
  {
    term: 'Hint',
    definition: {
      ko: 'SQL에 직접 지정하는 최적화 지시어(/*+ INDEX(...) */, /*+ PARALLEL(...) */ 등). CBO의 판단을 무시하고 특정 실행 계획을 강제할 수 있음.',
      en: 'Optimizer directives embedded in SQL (/*+ INDEX(...) */, /*+ PARALLEL(...) */). Override CBO decisions to force a specific execution plan.',
    },
    sectionIds: ['optimizer-plan', 'parallel-dop'],
  },

  // ── I ──────────────────────────────────────────────────────────────────────
  {
    term: 'INITRANS',
    definition: {
      ko: '블록 생성 시 기본으로 예약하는 트랜잭션 슬롯 수(기본값 1~2). 동시에 여러 트랜잭션이 같은 블록을 수정할 때 슬롯이 하나씩 사용됨. MAXTRANS까지 동적으로 늘어날 수 있음.',
      en: 'The number of transaction slots pre-allocated in a block at creation time (default 1–2). One slot is consumed per concurrent transaction modifying the block. Can grow dynamically up to MAXTRANS.',
    },
    sectionIds: ['internals-storage'],
  },
  {
    term: 'Index Fast Full Scan',
    definition: {
      ko: '인덱스 블록 전체를 순서 무시하고 멀티블록 I/O로 빠르게 읽는 스캔. 정렬 보장 없음. 인덱스만으로 쿼리 처리 가능할 때 사용.',
      en: 'Reads all index blocks using multi-block I/O without regard to order. No sort guarantee. Used when the query can be answered from the index alone.',
    },
    sectionIds: ['index-btree', 'optimizer-access-path'],
  },
  {
    term: 'Index Range Scan',
    definition: {
      ko: '인덱스 리프 블록을 범위 조건(BETWEEN, >, < 등)으로 순서대로 읽는 스캔. 결과가 정렬된 순서로 반환됨.',
      en: 'Scans leaf blocks sequentially using range conditions (BETWEEN, >, <). Results are returned in sorted order.',
    },
    sectionIds: ['index-btree', 'optimizer-access-path'],
  },
  {
    term: 'Index Unique Scan',
    definition: {
      ko: '유니크 인덱스에서 = 조건으로 단 하나의 행을 찾는 스캔. 가장 효율적인 인덱스 스캔 방법.',
      en: 'Locates a single row in a unique index using an equality condition. The most efficient index scan method.',
    },
    sectionIds: ['index-btree', 'optimizer-access-path'],
  },
  {
    term: 'Instance',
    definition: {
      ko: 'SGA(메모리 구조)와 Background Processes의 조합. 데이터베이스 파일이 없어도 인스턴스는 존재할 수 있음.',
      en: 'The combination of SGA (memory structures) and background processes. An instance can exist without a database file.',
    },
    sectionIds: ['internals-overview'],
  },

  // ── J ──────────────────────────────────────────────────────────────────────
  {
    term: 'JVM',
    definition: {
      ko: 'Java Virtual Machine. Oracle 데이터베이스 내에 내장된 JVM으로, Java Pool을 메모리로 사용해 PL/SQL 내에서 Java 코드를 실행 가능.',
      en: 'Java Virtual Machine embedded in Oracle Database. Uses Java Pool as memory and enables Java code execution from within PL/SQL.',
    },
    sectionIds: ['internals-sga'],
  },

  // ── L ──────────────────────────────────────────────────────────────────────
  {
    term: 'Large Pool',
    definition: {
      ko: 'SGA의 구성 요소. 병렬 쿼리(Parallel Query), RMAN 백업, 공유 서버 세션 등 대용량 메모리 할당에 사용.',
      en: 'An SGA component used for large memory allocations: Parallel Query, RMAN backup, and shared server sessions.',
    },
    sectionIds: ['internals-sga', 'parallel-overview'],
  },
  {
    term: 'LGWR',
    definition: {
      ko: 'Log Writer 프로세스. Redo Log Buffer의 내용을 Online Redo Log File에 기록. Commit 시 동기적으로 쓰기 수행.',
      en: 'Log Writer process. Writes Redo Log Buffer contents to Online Redo Log files. Performs a synchronous write on every COMMIT.',
    },
    sectionIds: ['internals-processes', 'internals-simulator'],
  },
  {
    term: 'Library Cache',
    definition: {
      ko: 'Shared Pool의 일부. 파싱된 SQL 커서와 실행 계획을 저장. 동일 SQL 재실행 시 Soft Parse로 재사용.',
      en: 'Part of Shared Pool. Stores parsed SQL cursors and execution plans. Reused on re-execution as a Soft Parse.',
    },
    sectionIds: ['internals-sga', 'internals-simulator'],
  },

  // ── M ──────────────────────────────────────────────────────────────────────
  {
    term: 'MAXTRANS',
    definition: {
      ko: '하나의 블록에서 동시에 허용하는 최대 트랜잭션 슬롯 수. 이 한도에 도달하면 추가 트랜잭션은 슬롯이 비워질 때까지 대기해야 함.',
      en: 'The maximum number of concurrent transaction slots allowed in a single block. Transactions wait for a free slot when this limit is reached.',
    },
    sectionIds: ['internals-storage'],
  },
  {
    term: 'MMON',
    definition: {
      ko: 'Manageability Monitor. AWR 스냅샷 수집, 알림(Alerts), 자가 진단(ADDM) 등 관리 작업을 담당하는 백그라운드 프로세스.',
      en: 'Manageability Monitor background process. Handles AWR snapshot collection, alerts, and ADDM self-diagnostics.',
    },
    sectionIds: ['internals-processes'],
  },
  {
    term: 'Multiblock Read',
    definition: {
      ko: '한 번의 I/O 요청으로 여러 연속 블록을 읽는 방식. Full Table Scan이나 Index Fast Full Scan에서 사용되어 I/O 효율을 높임.',
      en: 'Reading multiple contiguous blocks in a single I/O request. Used in Full Table Scans and Index Fast Full Scans to improve I/O efficiency.',
    },
    sectionIds: ['optimizer-access-path', 'index-btree'],
  },

  // ── N ──────────────────────────────────────────────────────────────────────
  {
    term: 'NDV',
    definition: {
      ko: 'Number of Distinct Values. 컬럼 내 유니크 값의 수. CBO가 선택도(Selectivity)를 계산하는 핵심 통계 정보.',
      en: 'Number of Distinct Values. The count of unique values in a column. A key statistic CBO uses to calculate selectivity.',
    },
    sectionIds: ['optimizer-stats'],
  },
  {
    term: 'Nested Loop Join',
    definition: {
      ko: '외부 테이블의 각 행에 대해 내부 테이블을 반복 탐색하는 조인 방식. 작은 테이블 + 인덱스 조합에 효율적.',
      en: 'For each row in the outer table, probes the inner table. Efficient when the outer table is small and the inner has an index.',
    },
    sectionIds: ['join-nested-loop', 'join-overview'],
  },

  // ── O ──────────────────────────────────────────────────────────────────────
  {
    term: 'Online Redo Log',
    definition: {
      ko: '모든 DML 변경사항을 순서대로 기록하는 파일. 인스턴스 복구에 사용. LGWR이 기록하며, 꽉 차면 ARCn이 아카이브로 복사.',
      en: 'Files that record all DML changes in order. Used for instance recovery. Written by LGWR; archived by ARCn when full.',
    },
    sectionIds: ['internals-processes', 'internals-sga'],
  },

  // ── P ──────────────────────────────────────────────────────────────────────
  {
    term: 'Partition Pruning',
    definition: {
      ko: '쿼리 조건에 따라 액세스가 불필요한 파티션을 스캔에서 제외하는 최적화. I/O를 줄여 성능을 크게 향상시킴.',
      en: 'Optimization that eliminates unnecessary partitions from a scan based on query conditions. Greatly reduces I/O.',
    },
    sectionIds: ['partition-pruning', 'partition-overview'],
  },
  {
    term: 'PGA',
    definition: {
      ko: 'Program Global Area. 각 서버 프로세스에 독립적으로 할당되는 비공유 메모리. Sort Area, Hash Area, Private SQL Area 등으로 구성.',
      en: 'Program Global Area. Non-shared memory allocated to each server process. Contains Sort Area, Hash Area, Private SQL Area, etc.',
    },
    sectionIds: ['internals-pga', 'internals-overview'],
  },
  {
    term: 'PCTFREE',
    definition: {
      ko: '블록 내 UPDATE를 대비해 비워두는 여유 공간 비율(기본 10%). INSERT는 남은 공간이 PCTFREE 이하가 되면 해당 블록에 더 이상 행을 삽입하지 않음.',
      en: 'The percentage of block space reserved for future UPDATE row growth (default 10%). INSERT stops adding rows to a block when free space drops to this threshold.',
    },
    sectionIds: ['internals-storage'],
  },
  {
    term: 'PCTUSED',
    definition: {
      ko: '블록의 사용 공간이 이 비율 이하로 떨어지면 해당 블록을 Freelist에 다시 등록해 INSERT가 가능하도록 함(기본 40%). DELETE 후 블록 재사용 시점을 결정.',
      en: 'When a block\'s used space falls below this percentage (default 40%), the block is re-added to the Freelist and becomes eligible for INSERT again. Determines when a block is reused after DELETE.',
    },
    sectionIds: ['internals-storage'],
  },
  {
    term: 'PMON',
    definition: {
      ko: 'Process Monitor. 비정상 종료된 세션의 리소스를 정리하고, Listener에 서비스를 등록하는 백그라운드 프로세스.',
      en: 'Process Monitor background process. Cleans up resources from abnormally terminated sessions and registers services with the Listener.',
    },
    sectionIds: ['internals-processes'],
  },
  {
    term: 'Predicate Pushdown',
    definition: {
      ko: '뷰나 서브쿼리 외부의 WHERE 조건을 내부로 밀어 넣어 더 일찍 필터링하는 쿼리 변환 기법.',
      en: 'A query transformation that pushes WHERE conditions from outside a view or subquery into it, enabling earlier filtering.',
    },
    sectionIds: ['qt-predicate-pushdown', 'qt-overview'],
  },
  {
    term: 'PX Server',
    definition: {
      ko: 'Parallel eXecution Server. 병렬 처리 시 Query Coordinator(QC)의 지시에 따라 분할된 작업을 실제로 수행하는 슬레이브 프로세스.',
      en: 'Parallel eXecution Server. A slave process that performs assigned work under the direction of the Query Coordinator (QC) during parallel execution.',
    },
    sectionIds: ['parallel-coordinator', 'parallel-overview'],
  },

  // ── Q ──────────────────────────────────────────────────────────────────────
  {
    term: 'QC',
    definition: {
      ko: 'Query Coordinator. 병렬 처리에서 전체 작업을 조율하는 마스터 프로세스. PX Server들에게 작업을 분배하고 결과를 취합.',
      en: 'Query Coordinator. The master process that orchestrates parallel execution, distributes work to PX Servers, and collects results.',
    },
    sectionIds: ['parallel-coordinator', 'parallel-overview'],
  },

  // ── R ──────────────────────────────────────────────────────────────────────
  {
    term: 'Redo',
    definition: {
      ko: '데이터 변경 이력. 인스턴스 장애 후 복구 시 Redo Log를 재실행(Redo)해 변경사항을 복원하는 데 사용.',
      en: 'The record of data changes. Used during instance recovery to re-apply (redo) changes from Redo Log files.',
    },
    sectionIds: ['internals-processes', 'internals-sga'],
  },
  {
    term: 'Redo Log Buffer',
    definition: {
      ko: 'SGA 내 메모리 버퍼. DML 변경 이력을 LGWR가 Online Redo Log File에 기록하기 전 임시 보관.',
      en: 'An in-memory SGA buffer. Temporarily holds DML change records before LGWR writes them to Online Redo Log files.',
    },
    sectionIds: ['internals-sga', 'internals-simulator'],
  },
  {
    term: 'ROWID',
    definition: {
      ko: '행의 물리적 위치를 나타내는 주소값(파일 번호·블록 번호·행 슬롯). B-Tree 인덱스의 리프 노드에 저장됨.',
      en: 'The physical address of a row (file number, block number, row slot). Stored in B-Tree index leaf nodes.',
    },
    sectionIds: ['index-btree', 'optimizer-access-path'],
  },
  {
    term: 'RMAN',
    definition: {
      ko: 'Recovery Manager. Oracle 데이터베이스 백업 및 복구를 자동화하는 도구. Large Pool을 메모리로 활용.',
      en: 'Recovery Manager. Automates Oracle database backup and recovery. Uses Large Pool as memory.',
    },
    sectionIds: ['internals-sga'],
  },

  // ── S ──────────────────────────────────────────────────────────────────────
  {
    term: 'SCN',
    definition: {
      ko: 'System Change Number. Oracle이 변경 이벤트마다 단조 증가시키는 내부 타임스탬프. 데이터 일관성과 복구의 기준점.',
      en: 'System Change Number. A monotonically increasing internal timestamp incremented at every change event. The basis for data consistency and recovery.',
    },
    sectionIds: ['internals-storage', 'internals-processes', 'internals-overview'],
  },
  {
    term: 'Segment',
    definition: {
      ko: '하나의 데이터베이스 오브젝트(테이블·인덱스 등)가 사용하는 Extent들의 집합. 테이블 하나는 하나의 Segment에 대응(파티션 테이블은 파티션당 하나). Table·Index·Undo·Temp Segment로 구분.',
      en: 'The set of Extents used by a single database object (table, index, etc.). One table maps to one Segment (partitioned tables have one per partition). Classified as Table, Index, Undo, or Temp Segment.',
    },
    sectionIds: ['internals-storage'],
  },
  {
    term: 'Selectivity',
    definition: {
      ko: '전체 행 중 조건을 만족하는 행의 비율(0~1). CBO가 액세스 패스 비용을 추정할 때 핵심 지표. NDV가 높을수록 선택도가 낮아짐.',
      en: 'The fraction of rows satisfying a condition (0–1). A key metric CBO uses to estimate access path cost. Higher NDV means lower selectivity.',
    },
    sectionIds: ['optimizer-stats', 'optimizer-overview'],
  },
  {
    term: 'SGA',
    definition: {
      ko: 'System Global Area. 모든 서버 프로세스와 백그라운드 프로세스가 공유하는 메모리 영역. Buffer Cache, Shared Pool, Redo Log Buffer 등으로 구성.',
      en: 'System Global Area. Shared memory region for all server and background processes. Contains Buffer Cache, Shared Pool, Redo Log Buffer, etc.',
    },
    sectionIds: ['internals-sga', 'internals-overview'],
  },
  {
    term: 'Shared Pool',
    definition: {
      ko: 'SGA의 구성 요소. Library Cache와 Dictionary Cache를 포함. SQL 파싱 결과와 데이터 딕셔너리 정보를 캐싱.',
      en: 'An SGA component containing Library Cache and Dictionary Cache. Caches SQL parse results and data dictionary information.',
    },
    sectionIds: ['internals-sga'],
  },
  {
    term: 'SMON',
    definition: {
      ko: 'System Monitor. 인스턴스 복구(Instance Recovery), 임시 세그먼트 정리, Extent Coalescing을 담당하는 백그라운드 프로세스.',
      en: 'System Monitor background process. Handles instance recovery, temporary segment cleanup, and extent coalescing.',
    },
    sectionIds: ['internals-processes'],
  },
  {
    term: 'Soft Parse',
    definition: {
      ko: '동일한 SQL이 Library Cache에 이미 존재해 파싱·최적화 과정을 건너뛰고 기존 실행 계획을 재사용하는 것.',
      en: 'Reusing an existing execution plan from Library Cache, skipping the parse and optimization steps for an identical SQL.',
    },
    sectionIds: ['internals-sga', 'internals-simulator'],
  },
  {
    term: 'Sort Area',
    definition: {
      ko: 'PGA 내 ORDER BY, GROUP BY, DISTINCT 처리에 사용되는 메모리 공간. 메모리가 부족하면 Temp 세그먼트로 Spill.',
      en: 'Memory in PGA used for ORDER BY, GROUP BY, and DISTINCT operations. Spills to Temp segment if memory is insufficient.',
    },
    sectionIds: ['internals-pga', 'sort-memory', 'sort-overview'],
  },
  {
    term: 'Sort Merge Join',
    definition: {
      ko: '두 테이블을 각각 조인 컬럼으로 정렬한 뒤 병합하는 조인 방식. 이미 정렬된 데이터나 비등가 조인에 유리.',
      en: 'Sorts both tables on the join column then merges them. Efficient for pre-sorted data or non-equi joins.',
    },
    sectionIds: ['join-sort-merge', 'join-overview'],
  },
  {
    term: 'Statistics',
    definition: {
      ko: 'CBO가 실행 계획을 수립하는 데 사용하는 테이블·컬럼·인덱스의 분포 정보. DBMS_STATS로 수집. 부정확하면 잘못된 계획이 생성됨.',
      en: 'Distribution information about tables, columns, and indexes used by CBO for plan selection. Collected via DBMS_STATS. Stale stats lead to poor plans.',
    },
    sectionIds: ['optimizer-stats', 'optimizer-overview'],
  },
  {
    term: 'Subquery Unnesting',
    definition: {
      ko: '서브쿼리를 JOIN으로 변환하는 쿼리 변환 기법. 옵티마이저가 더 다양한 조인 순서와 액세스 패스를 고려할 수 있게 함.',
      en: 'A query transformation that converts a subquery into a JOIN, allowing the optimizer to consider more join orders and access paths.',
    },
    sectionIds: ['qt-subquery-unnesting', 'qt-overview'],
  },

  // ── T ──────────────────────────────────────────────────────────────────────
  {
    term: 'Tablespace',
    definition: {
      ko: '하나 이상의 데이터 파일로 구성되는 논리적 저장 단위. 테이블·인덱스 등 세그먼트가 테이블스페이스에 속함.',
      en: 'A logical storage unit consisting of one or more data files. Tables, indexes, and other segments belong to a tablespace.',
    },
    sectionIds: ['internals-storage', 'internals-overview', 'partition-overview'],
  },
  {
    term: 'Temp Segment',
    definition: {
      ko: 'Sort Area나 Hash Area가 부족할 때 사용하는 임시 디스크 공간. TEMP 테이블스페이스에 위치. Disk Sort가 발생하면 성능 저하.',
      en: 'Temporary disk space used when Sort Area or Hash Area is insufficient. Located in the TEMP tablespace. Disk sorts degrade performance.',
    },
    sectionIds: ['sort-memory', 'internals-pga'],
  },

  // ── U ──────────────────────────────────────────────────────────────────────
  {
    term: 'UNDO',
    definition: {
      ko: '트랜잭션 롤백과 Read Consistency를 위해 변경 전 값을 저장하는 세그먼트. Undo Tablespace에 위치.',
      en: 'Segment storing before-images of changes for transaction rollback and read consistency. Located in the Undo Tablespace.',
    },
    sectionIds: ['internals-overview', 'internals-processes'],
  },

  // ── V ──────────────────────────────────────────────────────────────────────
  {
    term: 'View Merging',
    definition: {
      ko: '인라인 뷰나 서브쿼리를 메인 쿼리와 합쳐 단일 쿼리 블록으로 만드는 쿼리 변환. 옵티마이저의 최적화 범위를 넓힘.',
      en: 'A query transformation that merges an inline view or subquery into the main query block, expanding the optimizer\'s optimization scope.',
    },
    sectionIds: ['qt-view-merging', 'qt-overview'],
  },

  // ── 가 (Korean) ───────────────────────────────────────────────────────────
  {
    term: '가나다순',
    definition: {
      ko: '한글 사전 정렬 순서. 초성 → 중성 → 종성 순으로 정렬.',
      en: 'Korean alphabetical order. Sorted by initial consonant → vowel → final consonant.',
    },
    sectionIds: [],
  },
]

/** Return glossary terms relevant to a given sectionId */
export function getTermsForSection(sectionId: string): GlossaryTerm[] {
  const chapterPrefix = sectionId.split('-')[0]
  return GLOSSARY.filter(
    (t) =>
      t.sectionIds.includes(sectionId) ||
      t.sectionIds.some((id) => id === chapterPrefix || id.startsWith(chapterPrefix + '-'))
  )
}

/** Sort terms: English A-Z first (if starts with latin), then Korean 가나다 */
export function sortTerms(terms: GlossaryTerm[]): GlossaryTerm[] {
  return [...terms].sort((a, b) => {
    const aKorean = /^[가-힣]/.test(a.term)
    const bKorean = /^[가-힣]/.test(b.term)
    if (aKorean !== bKorean) return aKorean ? 1 : -1
    return a.term.localeCompare(b.term, aKorean ? 'ko' : 'en', { sensitivity: 'base' })
  })
}

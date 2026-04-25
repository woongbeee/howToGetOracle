import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { PageContainer, ChapterTitle, Prose, Divider, InfoBox } from '../shared'
import { SqlHighlight } from './SqlHighlight'

// ── Types ──────────────────────────────────────────────────────────────────

interface ArithRow {
  expr: string
  result: string
  desc: { ko: string; en: string }
}

interface TzSetupBlock {
  title: { ko: string; en: string }
  lines: Array<{ code: string; comment: { ko: string; en: string } }>
}

interface FuncItem {
  name: string
  signature: string
  desc: { ko: string; en: string }
  example: string
  resultHeaders: string[]
  resultRows: string[][]
  note?: { ko: string; en: string }
  dualInfo?: { ko: string; en: string }
  arith?: { title: { ko: string; en: string }; rows: ArithRow[] }
  tzSetup?: TzSetupBlock[]
  vsNote?: { ko: string; en: string }
  tzInfo?: { ko: string; en: string }
}

// ── Data ───────────────────────────────────────────────────────────────────

const FUNC_ITEMS: FuncItem[] = [
  {
    name: 'SYSDATE',
    signature: 'SYSDATE',
    desc: {
      ko: 'DB 서버의 현재 날짜와 시간을 반환합니다. 인자가 없으며, FROM DUAL과 함께 자주 사용됩니다. 시·분·초까지 포함된 DATE 타입을 반환합니다. 타임존 정보는 포함되지 않습니다.',
      en: 'Returns the current date and time of the DB server. Takes no arguments and is commonly used with FROM DUAL. Returns a DATE type including hours, minutes, and seconds — without timezone information.',
    },
    dualInfo: {
      ko: 'DUAL은 Oracle이 제공하는 특수한 1행 1열 더미 테이블입니다. 테이블 없이 함수나 표현식의 결과만 조회할 때 FROM DUAL을 사용합니다. SELECT SYSDATE FROM DUAL 처럼 실제 테이블 없이도 SQL 문법을 유지할 수 있습니다.',
      en: 'DUAL is a special one-row, one-column dummy table provided by Oracle. Use FROM DUAL when you only need to evaluate a function or expression without querying a real table — e.g., SELECT SYSDATE FROM DUAL.',
    },
    example:
      'SELECT SYSDATE,\n       SYSDATE + 1                      AS tomorrow,\n       SYSDATE - 7                      AS week_ago,\n       SYSDATE + 1/24                   AS plus_1h,\n       SYSDATE + 30/1440                AS plus_30m,\n       SYSDATE - TO_DATE(\'2025-01-01\', \'YYYY-MM-DD\') AS days_since\nFROM   DUAL',
    resultHeaders: ['SYSDATE', 'tomorrow', 'week_ago', 'plus_1h', 'plus_30m', 'days_since'],
    resultRows: [
      [
        '2025-04-25 09:30:00',
        '2025-04-26 09:30:00',
        '2025-04-18 09:30:00',
        '2025-04-25 10:30:00',
        '2025-04-25 10:00:00',
        '114.396',
      ],
    ],
    arith: {
      title: { ko: 'DATE 산술 연산 규칙', en: 'DATE Arithmetic Rules' },
      rows: [
        {
          expr: 'SYSDATE + 1',
          result: '내일 (1일 후)',
          desc: { ko: '정수 1 = 1일', en: 'integer 1 = 1 day' },
        },
        {
          expr: 'SYSDATE - 7',
          result: '7일 전',
          desc: { ko: '정수 7 = 7일', en: 'integer 7 = 7 days' },
        },
        {
          expr: 'SYSDATE + 1/24',
          result: '1시간 후',
          desc: { ko: '1/24일 = 1시간', en: '1/24 day = 1 hour' },
        },
        {
          expr: 'SYSDATE + 30/1440',
          result: '30분 후',
          desc: { ko: '30/1440일 = 30분', en: '30/1440 day = 30 min' },
        },
        {
          expr: 'SYSDATE + 1/86400',
          result: '1초 후',
          desc: { ko: '1/86400일 = 1초', en: '1/86400 day = 1 sec' },
        },
        {
          expr: 'date1 - date2',
          result: '일수 차이 (숫자)',
          desc: { ko: 'DATE - DATE = NUMBER', en: 'DATE − DATE = NUMBER (days)' },
        },
      ],
    },
    vsNote: {
      ko: 'SYSDATE는 초 단위 DATE 타입이고, SYSTIMESTAMP는 소수점 이하 초(나노초)와 타임존 오프셋까지 포함하는 TIMESTAMP WITH TIME ZONE 타입입니다.',
      en: 'vs SYSTIMESTAMP: SYSDATE returns a DATE (second precision). SYSTIMESTAMP returns TIMESTAMP WITH TIME ZONE — includes fractional seconds (nanoseconds) and timezone offset.',
    },
    note: {
      ko: 'DATE - DATE 연산은 일(day) 단위 NUMBER를 반환합니다. 두 날짜 사이의 시간 차이를 구할 때 (date1 - date2) * 24 로 시간을, * 1440 으로 분을 얻을 수 있습니다.',
      en: 'DATE - DATE returns a NUMBER in days. Multiply by 24 for hours, 1440 for minutes, or 86400 for seconds.',
    },
  },
  {
    name: 'SYSTIMESTAMP',
    signature: 'SYSTIMESTAMP',
    desc: {
      ko: 'DB 서버의 현재 날짜·시간·소수점 이하 초(fractional seconds)와 타임존 오프셋을 포함한 TIMESTAMP WITH TIME ZONE 타입을 반환합니다. SYSDATE보다 정밀한 시각이 필요하거나, 타임존 정보가 필요한 경우에 사용합니다.',
      en: 'Returns the current date, time, fractional seconds, and timezone offset as TIMESTAMP WITH TIME ZONE. Use when you need sub-second precision or timezone-aware timestamps — more precise than SYSDATE.',
    },
    example:
      "SELECT SYSTIMESTAMP                                AS ts_now,\n       SYSTIMESTAMP + INTERVAL '1' DAY            AS plus_1d,\n       SYSTIMESTAMP - INTERVAL '7' DAY            AS minus_7d,\n       SYSTIMESTAMP + INTERVAL '3' HOUR           AS plus_3h,\n       SYSTIMESTAMP - INTERVAL '30' MINUTE        AS minus_30m,\n       SYSTIMESTAMP + INTERVAL '0.5' SECOND       AS plus_half_sec\nFROM   DUAL",
    resultHeaders: ['ts_now', 'plus_1d', 'minus_7d', 'plus_3h', 'minus_30m', 'plus_half_sec'],
    resultRows: [
      [
        '2025-04-25 09:30:00.123456 +09:00',
        '2025-04-26 09:30:00.123456 +09:00',
        '2025-04-18 09:30:00.123456 +09:00',
        '2025-04-25 12:30:00.123456 +09:00',
        '2025-04-25 09:00:00.123456 +09:00',
        '2025-04-25 09:30:00.623456 +09:00',
      ],
    ],
    arith: {
      title: { ko: 'TIMESTAMP 산술 — INTERVAL 리터럴', en: 'TIMESTAMP Arithmetic — INTERVAL Literals' },
      rows: [
        {
          expr: "SYSTIMESTAMP + INTERVAL '1' DAY",
          result: '1일 후',
          desc: { ko: '1일 단위 이동', en: 'move by 1 day' },
        },
        {
          expr: "SYSTIMESTAMP + INTERVAL '3' HOUR",
          result: '3시간 후',
          desc: { ko: '시간 단위 이동', en: 'move by hours' },
        },
        {
          expr: "SYSTIMESTAMP - INTERVAL '30' MINUTE",
          result: '30분 전',
          desc: { ko: '분 단위 이동', en: 'move by minutes' },
        },
        {
          expr: "SYSTIMESTAMP + INTERVAL '0.5' SECOND",
          result: '0.5초 후',
          desc: { ko: '소수점 이하 초도 가능', en: 'fractional seconds supported' },
        },
        {
          expr: 'ts1 - ts2',
          result: 'INTERVAL 값',
          desc: { ko: 'TIMESTAMP - TIMESTAMP = INTERVAL DAY TO SECOND', en: 'result is INTERVAL DAY TO SECOND' },
        },
      ],
    },
    tzSetup: [
      {
        title: { ko: '세션 타임존 설정 및 확인', en: 'Session Timezone — Set & Check' },
        lines: [
          {
            code: "ALTER SESSION SET TIME_ZONE = 'Asia/Seoul';",
            comment: { ko: '세션 타임존을 서울(+09:00)로 설정', en: 'set session timezone to Seoul (+09:00)' },
          },
          {
            code: "ALTER SESSION SET TIME_ZONE = '+09:00';",
            comment: { ko: '오프셋으로 직접 지정도 가능', en: 'fixed offset also works' },
          },
          {
            code: 'SELECT DBTIMEZONE      FROM DUAL;',
            comment: { ko: 'DB 서버 타임존 확인', en: 'check DB server timezone' },
          },
          {
            code: 'SELECT SESSIONTIMEZONE FROM DUAL;',
            comment: { ko: '현재 세션 타임존 확인', en: 'check current session timezone' },
          },
          {
            code: 'SELECT CURRENT_TIMESTAMP FROM DUAL;',
            comment: { ko: '세션 타임존 반영 — 세션 변경 시 값도 바뀜', en: 'reflects session timezone — changes with session' },
          },
          {
            code: 'SELECT SYSTIMESTAMP    FROM DUAL;',
            comment: { ko: 'DB 서버 타임존 고정 — 세션 변경과 무관', en: 'fixed to DB server timezone — unaffected by session' },
          },
        ],
      },
      {
        title: { ko: 'SYSDATE에 타임존 붙여 변환', en: 'Attach Timezone to SYSDATE & Convert' },
        lines: [
          {
            code: "SELECT FROM_TZ(CAST(SYSDATE AS TIMESTAMP), 'Asia/Seoul')",
            comment: { ko: 'SYSDATE → TIMESTAMP → 서울 타임존 부착', en: 'attach Seoul timezone to SYSDATE' },
          },
          {
            code: "  AT TIME ZONE 'America/New_York' AS ny_time",
            comment: { ko: '뉴욕 시간으로 변환', en: 'convert to New York time' },
          },
          {
            code: 'FROM DUAL;',
            comment: { ko: '', en: '' },
          },
        ],
      },
    ],
    vsNote: {
      ko: 'SYSDATE와의 차이 정리: SYSDATE(DATE, 초 정밀도, 타임존 없음) vs SYSTIMESTAMP(TIMESTAMP WITH TIME ZONE, 나노초 정밀도, 타임존 포함). TIMESTAMP 산술에는 INTERVAL 리터럴을 사용하는 것이 권장됩니다.',
      en: 'SYSDATE (DATE, second precision, no timezone) vs SYSTIMESTAMP (TIMESTAMP WITH TIME ZONE, nanosecond precision, with timezone). INTERVAL literals are recommended for TIMESTAMP arithmetic.',
    },
    note: {
      ko: 'SYSTIMESTAMP - SYSTIMESTAMP 는 INTERVAL DAY TO SECOND 타입을 반환합니다. 정밀한 경과 시간 측정(예: 쿼리 수행 시간)에 활용합니다.',
      en: 'SYSTIMESTAMP - SYSTIMESTAMP returns an INTERVAL DAY TO SECOND. Useful for precise elapsed-time measurement such as query execution duration.',
    },
  },
  {
    name: '타임존 변환',
    signature: 'AT TIME ZONE / FROM_TZ / SYS_EXTRACT_UTC',
    desc: {
      ko: 'Oracle은 세 가지 방법으로 타임존을 다룹니다. AT TIME ZONE은 기존 TIMESTAMP를 다른 시간대로 변환합니다. FROM_TZ는 타임존 정보가 없는 TIMESTAMP에 타임존을 붙입니다. SYS_EXTRACT_UTC는 어떤 타임존이든 UTC(협정 세계시)로 통일해 비교할 때 씁니다.',
      en: 'Oracle provides three main timezone tools. AT TIME ZONE converts an existing TIMESTAMP to a different timezone. FROM_TZ attaches a timezone to a plain TIMESTAMP. SYS_EXTRACT_UTC normalizes any timestamp to UTC for comparison.',
    },
    tzInfo: {
      ko: "타임존 이름 예시: 'Asia/Seoul' (+09:00), 'America/New_York' (-05:00 또는 -04:00 DST), 'Europe/London' (+00:00 또는 +01:00 DST), 'UTC'. Oracle은 IANA 타임존 데이터베이스를 사용합니다. SELECT * FROM V$TIMEZONE_NAMES 로 전체 목록을 조회할 수 있습니다.",
      en: "Timezone name examples: 'Asia/Seoul' (+09:00), 'America/New_York' (-05:00 or -04:00 DST), 'Europe/London' (+00:00 or +01:00 DST), 'UTC'. Oracle uses the IANA timezone database. Query V$TIMEZONE_NAMES for the full list.",
    },
    example:
      "SELECT SYSTIMESTAMP                                        AS seoul_time,\n       SYSTIMESTAMP AT TIME ZONE 'UTC'                      AS utc_time,\n       SYSTIMESTAMP AT TIME ZONE 'America/New_York'         AS ny_time,\n       FROM_TZ(CAST(SYSDATE AS TIMESTAMP), 'Asia/Seoul')\n         AT TIME ZONE 'Europe/London'                       AS london_time,\n       SYS_EXTRACT_UTC(SYSTIMESTAMP)                        AS extracted_utc\nFROM   DUAL",
    resultHeaders: ['seoul_time', 'utc_time', 'ny_time', 'london_time', 'extracted_utc'],
    resultRows: [
      [
        '2025-04-25 09:30:00 +09:00',
        '2025-04-25 00:30:00 +00:00',
        '2025-04-24 20:30:00 -04:00',
        '2025-04-25 01:30:00 +01:00',
        '2025-04-25 00:30:00',
      ],
    ],
    note: {
      ko: "세션 타임존은 ALTER SESSION SET TIME_ZONE = 'Asia/Seoul' 로 바꿀 수 있습니다. DB 서버 타임존은 SELECT DBTIMEZONE FROM DUAL, 세션 타임존은 SELECT SESSIONTIMEZONE FROM DUAL 로 확인합니다.",
      en: "Change the session timezone with ALTER SESSION SET TIME_ZONE = 'Asia/Seoul'. Check DB timezone: SELECT DBTIMEZONE FROM DUAL; session timezone: SELECT SESSIONTIMEZONE FROM DUAL.",
    },
  },
  {
    name: 'ADD_MONTHS',
    signature: 'ADD_MONTHS(date, n)',
    desc: {
      ko: '날짜에 n개월을 더한 결과를 반환합니다. n이 음수이면 날짜가 이전 월로 이동합니다. 월말 처리를 자동으로 수행합니다.',
      en: 'Returns the date plus n months. A negative n moves the date to an earlier month. Automatically handles end-of-month adjustments.',
    },
    example:
      'SELECT hire_date,\n       ADD_MONTHS(hire_date,  3) AS plus_3m,\n       ADD_MONTHS(hire_date, -1) AS minus_1m\nFROM   employees\nWHERE  emp_id IN (101, 102, 103)',
    resultHeaders: ['hire_date', 'plus_3m', 'minus_1m'],
    resultRows: [
      ['2020-01-15', '2020-04-15', '2019-12-15'],
      ['2020-03-01', '2020-06-01', '2020-02-01'],
      ['2021-07-31', '2021-10-31', '2021-06-30'],
    ],
    note: {
      ko: '월말 날짜(예: 1월 31일)에 1개월을 더하면 2월의 마지막 날(28일 또는 29일)로 자동 조정됩니다.',
      en: 'Adding a month to a month-end date (e.g., Jan 31) automatically adjusts to the last day of the next month (Feb 28 or 29).',
    },
  },
  {
    name: 'MONTHS_BETWEEN',
    signature: 'MONTHS_BETWEEN(date1, date2)',
    desc: {
      ko: 'date1과 date2 사이의 개월 수를 숫자로 반환합니다. date1이 date2보다 늦으면 양수, 이르면 음수를 반환합니다. 소수점이 포함될 수 있습니다.',
      en: 'Returns the number of months between date1 and date2 as a number. Positive if date1 is later, negative if earlier. The result may include a decimal.',
    },
    example:
      'SELECT first_name,\n       hire_date,\n       ROUND(MONTHS_BETWEEN(SYSDATE, hire_date)) AS months_worked\nFROM   employees\nWHERE  emp_id IN (101, 102, 103)',
    resultHeaders: ['first_name', 'hire_date', 'months_worked'],
    resultRows: [
      ['Alice', '2020-01-15', '63'],
      ['Bob',   '2020-03-01', '61'],
      ['Carol', '2021-07-31', '45'],
    ],
    note: {
      ko: '근속 개월 수 계산, 계약 기간 산출 등에 자주 쓰입니다. TRUNC 또는 ROUND로 소수점을 제거해서 사용하는 경우가 많습니다.',
      en: 'Commonly used for calculating tenure or contract duration. Often combined with TRUNC or ROUND to remove the decimal.',
    },
  },
  {
    name: 'TRUNC (날짜)',
    signature: 'TRUNC(date [, fmt])',
    desc: {
      ko: "날짜를 지정한 단위(fmt)로 잘라냅니다. fmt를 생략하면 시간을 00:00:00으로 초기화합니다. TRUNC(date, 'MM')은 해당 월의 1일, TRUNC(date, 'YYYY')는 해당 연도의 1월 1일로 반환합니다.",
      en: "Truncates a date to the specified unit (fmt). Omitting fmt zeros out the time portion (00:00:00). TRUNC(date, 'MM') returns the 1st of the month; TRUNC(date, 'YYYY') returns January 1st of the year.",
    },
    example:
      "SELECT SYSDATE,\n       TRUNC(SYSDATE)         AS day_start,\n       TRUNC(SYSDATE, 'MM')   AS month_start,\n       TRUNC(SYSDATE, 'YYYY') AS year_start\nFROM   DUAL",
    resultHeaders: ['SYSDATE', 'day_start', 'month_start', 'year_start'],
    resultRows: [
      ['2025-04-25 09:30:00', '2025-04-25 00:00:00', '2025-04-01 00:00:00', '2025-01-01 00:00:00'],
    ],
    note: {
      ko: "날짜 범위 검색 시 WHERE hire_date >= TRUNC(SYSDATE, 'MM') 패턴으로 이번 달 1일부터의 데이터를 정확하게 조회할 수 있습니다.",
      en: "For range queries, WHERE hire_date >= TRUNC(SYSDATE, 'MM') precisely retrieves data from the first day of the current month.",
    },
  },
  {
    name: 'TO_DATE',
    signature: "TO_DATE(string, 'format')",
    desc: {
      ko: "문자열을 날짜(DATE) 타입으로 변환합니다. format은 'YYYY-MM-DD', 'YYYY/MM/DD HH24:MI:SS' 등 입력 문자열의 형식과 일치해야 합니다.",
      en: "Converts a string to a DATE type. The format must match the structure of the input string, such as 'YYYY-MM-DD' or 'YYYY/MM/DD HH24:MI:SS'.",
    },
    example:
      "SELECT TO_DATE('2025-01-15', 'YYYY-MM-DD')          AS d1,\n       TO_DATE('2025/06/30 18:00', 'YYYY/MM/DD HH24:MI') AS d2\nFROM   DUAL",
    resultHeaders: ['d1', 'd2'],
    resultRows: [['2025-01-15 00:00:00', '2025-06-30 18:00:00']],
    note: {
      ko: "NLS_DATE_FORMAT 세션 설정과 다른 형식의 문자열을 비교하면 암묵적 변환이 발생해 인덱스를 사용하지 못할 수 있습니다. 명시적으로 TO_DATE를 사용하는 것이 안전합니다.",
      en: "Comparing a string whose format differs from the session's NLS_DATE_FORMAT triggers implicit conversion, which can prevent index use. Explicitly using TO_DATE is safer.",
    },
  },
  {
    name: 'TO_CHAR (날짜)',
    signature: "TO_CHAR(date, 'format')",
    desc: {
      ko: "날짜(DATE)를 지정한 형식의 문자열로 변환합니다. 'YYYY-MM-DD', 'YYYY년 MM월 DD일', 'Day' 등 다양한 포맷 마스크를 사용할 수 있습니다.",
      en: "Converts a DATE to a string using the specified format. Supports a wide range of format masks such as 'YYYY-MM-DD', 'Month DD, YYYY', or 'Day'.",
    },
    example:
      "SELECT hire_date,\n       TO_CHAR(hire_date, 'YYYY-MM-DD')    AS fmt1,\n       TO_CHAR(hire_date, 'YYYY\"년\" MM\"월\"') AS fmt2,\n       TO_CHAR(hire_date, 'Day')            AS day_name\nFROM   employees\nWHERE  emp_id IN (101, 102)",
    resultHeaders: ['hire_date', 'fmt1', 'fmt2', 'day_name'],
    resultRows: [
      ['2020-01-15 00:00:00', '2020-01-15', '2020년 01월', 'Wednesday'],
      ['2020-03-01 00:00:00', '2020-03-01', '2020년 03월', 'Sunday'],
    ],
    note: {
      ko: "TO_CHAR 결과는 VARCHAR2 타입입니다. 날짜 비교 연산에 사용하면 문자열 비교가 되므로, 날짜 비교는 반드시 DATE 타입으로 수행하세요.",
      en: "The result of TO_CHAR is VARCHAR2. Using it in date comparisons performs string comparison — always compare dates as DATE types.",
    },
  },
]

const ITEM_COLOR: Record<string, { bg: string; border: string; text: string; active: string; code: string }> = {
  'SYSDATE':        { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800',   active: 'bg-blue-100 text-blue-700',    code: 'bg-blue-50 border-blue-100'    },
  'SYSTIMESTAMP':   { bg: 'bg-cyan-50',   border: 'border-cyan-200',   text: 'text-cyan-800',   active: 'bg-cyan-100 text-cyan-700',    code: 'bg-cyan-50 border-cyan-100'    },
  '타임존 변환':    { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-800',   active: 'bg-teal-100 text-teal-700',    code: 'bg-teal-50 border-teal-100'    },
  'ADD_MONTHS':     { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', active: 'bg-violet-100 text-violet-700', code: 'bg-violet-50 border-violet-100' },
  'MONTHS_BETWEEN': { bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-800',active: 'bg-emerald-100 text-emerald-700',code:'bg-emerald-50 border-emerald-100'},
  'TRUNC (날짜)':   { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', active: 'bg-orange-100 text-orange-700', code: 'bg-orange-50 border-orange-100' },
  'TO_DATE':        { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-800',   active: 'bg-rose-100 text-rose-700',    code: 'bg-rose-50 border-rose-100'    },
  'TO_CHAR (날짜)': { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800',  active: 'bg-amber-100 text-amber-700',   code: 'bg-amber-50 border-amber-100'  },
}

// ── ResultTable ──────────────────────────────────────────────────────────────

function ResultTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border text-xs">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/60">
            {headers.map((h, i) => (
              <th
                key={h}
                className={cn(
                  'whitespace-nowrap px-2.5 py-1.5 text-left font-mono text-[10px] font-bold',
                  i === headers.length - 1 ? 'text-emerald-700' : 'text-muted-foreground',
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b last:border-0">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={cn(
                    'whitespace-nowrap px-2.5 py-1 font-mono text-[11px]',
                    ci === row.length - 1 ? 'font-bold text-emerald-700' : 'text-foreground/80',
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── ArithTable ───────────────────────────────────────────────────────────────

function ArithTable({ title, rows, lang }: { title: { ko: string; en: string }; rows: ArithRow[]; lang: 'ko' | 'en' }) {
  return (
    <div>
      <p className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {title[lang]}
      </p>
      <div className="overflow-x-auto rounded-lg border text-xs">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/60">
              <th className="whitespace-nowrap px-2.5 py-1.5 text-left font-mono text-[10px] font-bold text-muted-foreground">식</th>
              <th className="whitespace-nowrap px-2.5 py-1.5 text-left font-mono text-[10px] font-bold text-emerald-700">{lang === 'ko' ? '결과' : 'Result'}</th>
              <th className="whitespace-nowrap px-2.5 py-1.5 text-left font-mono text-[10px] font-bold text-muted-foreground">{lang === 'ko' ? '설명' : 'Note'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.expr} className="border-b last:border-0">
                <td className="whitespace-nowrap px-2.5 py-1 font-mono text-[11px] text-blue-700">{r.expr}</td>
                <td className="whitespace-nowrap px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-700">{r.result}</td>
                <td className="whitespace-nowrap px-2.5 py-1 font-mono text-[11px] text-foreground/70">{r.desc[lang]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const T = {
  ko: {
    chapterTitle: '날짜와 시간를 다루는 법',
    chapterSubtitle: 'Oracle에서 날짜와 시간을 어떻게 계산하는 지 알아봅니다.',
    categoryLabel: '날짜 / 시간 함수',
    exampleQuery: '예시 쿼리',
    result: '실행 결과',
    dualBoxTitle: 'DUAL 이란?',
    vsTitle: 'SYSDATE vs SYSTIMESTAMP',
    tzBoxTitle: '타임존 이름 참고',
  },
  en: {
    chapterTitle: '날짜와 시간를 다루는 법',
    chapterSubtitle: 'Learn the essential Oracle date and time functions: SYSDATE, SYSTIMESTAMP, timezone conversion, ADD_MONTHS, MONTHS_BETWEEN, TRUNC, TO_DATE, and TO_CHAR.',
    categoryLabel: 'Date / Time Functions',
    exampleQuery: 'Example Query',
    result: 'Result',
    dualBoxTitle: 'What is DUAL?',
    vsTitle: 'SYSDATE vs SYSTIMESTAMP',
    tzBoxTitle: 'Timezone Name Reference',
  },
}

// ── DateSection ─────────────────────────────────────────────────────────────

export function DateSection({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]
  const [openItem, setOpenItem] = useState<string>(FUNC_ITEMS[0].name)
  const item = FUNC_ITEMS.find((f) => f.name === openItem)!
  const s = ITEM_COLOR[item.name]

  return (
    <PageContainer>
      <ChapterTitle
        icon="📋"
        num={1}
        title={t.chapterTitle}
        subtitle={t.chapterSubtitle}
      />

      <div className="grid grid-cols-[160px_1fr] items-start gap-4">
        {/* LEFT: 함수 목록 */}
        <div className="flex flex-col gap-1 rounded-xl border bg-muted/30 p-2">
          {FUNC_ITEMS.map((f) => {
            const fc = ITEM_COLOR[f.name]
            const isActive = f.name === openItem
            return (
              <button
                key={f.name}
                onClick={() => setOpenItem(f.name)}
                className={cn(
                  'rounded-lg px-3 py-2 text-left font-mono text-xs font-bold transition-all',
                  isActive ? fc.active : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {f.name}
              </button>
            )
          })}
        </div>

        {/* RIGHT: 상세 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-4"
          >
            {/* 헤더 */}
            <div className={cn('rounded-xl border px-4 py-3', s.bg, s.border, s.text)}>
              <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider opacity-60">
                {t.categoryLabel}
              </div>
              <div className="font-mono text-xl font-black">{item.name}</div>
              <div className={cn('mt-1.5 inline-block rounded border px-2 py-0.5 font-mono text-[11px]', s.active)}>
                {item.signature}
              </div>
            </div>

            {/* 설명 */}
            <div className="rounded-xl border bg-card px-4 py-3">
              <Prose>{item.desc[lang]}</Prose>
            </div>

            {/* DUAL 설명 InfoBox (SYSDATE 항목에만) */}
            {item.dualInfo && (
              <InfoBox color="blue" icon="🗄️" title={t.dualBoxTitle}>
                {item.dualInfo[lang]}
              </InfoBox>
            )}

            {/* 타임존 이름 InfoBox (타임존 항목에만) */}
            {item.tzInfo && (
              <InfoBox color="emerald" icon="🌏" title={t.tzBoxTitle}>
                {item.tzInfo[lang]}
              </InfoBox>
            )}

            {/* 예시 쿼리 */}
            <div>
              <p className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t.exampleQuery}
              </p>
              <div className={cn('rounded-xl border px-4 py-3', s.code)}>
                <SqlHighlight sql={item.example} />
              </div>
            </div>

            {/* 실행 결과 */}
            <div>
              <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t.result}
              </p>
              <ResultTable headers={item.resultHeaders} rows={item.resultRows} />
            </div>

            {/* 산술 연산 표 */}
            {item.arith && (
              <ArithTable title={item.arith.title} rows={item.arith.rows} lang={lang} />
            )}

            {/* vs 비교 노트 */}
            {item.vsNote && (
              <InfoBox color="orange" icon="⚡" title={t.vsTitle}>
                {item.vsNote[lang]}
              </InfoBox>
            )}

            {/* 참고 */}
            {item.note && (
              <>
                <Divider />
                <div className={cn('rounded-xl border px-4 py-3 text-xs leading-relaxed', s.bg, s.border, s.text)}>
                  <span className="mr-1.5 font-bold">💡</span>{item.note[lang]}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageContainer>
  )
}

export { T as DateT }

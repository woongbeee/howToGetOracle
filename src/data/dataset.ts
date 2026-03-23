export interface Column {
  name: string
  type: string
}

export interface Table {
  name: string
  description: string
  columns: Column[]
  rows: Record<string, string | number | null>[]
}

export const DATASET: Table[] = [
  {
    name: 'EMPLOYEES',
    description: '직원 정보 테이블',
    columns: [
      { name: 'EMPLOYEE_ID', type: 'NUMBER' },
      { name: 'FIRST_NAME', type: 'VARCHAR2(50)' },
      { name: 'LAST_NAME', type: 'VARCHAR2(50)' },
      { name: 'EMAIL', type: 'VARCHAR2(100)' },
      { name: 'DEPARTMENT_ID', type: 'NUMBER' },
      { name: 'SALARY', type: 'NUMBER' },
      { name: 'HIRE_DATE', type: 'DATE' },
    ],
    rows: [
      { EMPLOYEE_ID: 100, FIRST_NAME: 'Steven', LAST_NAME: 'King', EMAIL: 'sking@company.com', DEPARTMENT_ID: 90, SALARY: 24000, HIRE_DATE: '2003-06-17' },
      { EMPLOYEE_ID: 101, FIRST_NAME: 'Neena', LAST_NAME: 'Kochhar', EMAIL: 'nkochhar@company.com', DEPARTMENT_ID: 90, SALARY: 17000, HIRE_DATE: '2005-09-21' },
      { EMPLOYEE_ID: 102, FIRST_NAME: 'Lex', LAST_NAME: 'De Haan', EMAIL: 'ldehaan@company.com', DEPARTMENT_ID: 90, SALARY: 17000, HIRE_DATE: '2001-01-13' },
      { EMPLOYEE_ID: 103, FIRST_NAME: 'Alexander', LAST_NAME: 'Hunold', EMAIL: 'ahunold@company.com', DEPARTMENT_ID: 60, SALARY: 9000, HIRE_DATE: '2006-01-03' },
      { EMPLOYEE_ID: 104, FIRST_NAME: 'Bruce', LAST_NAME: 'Ernst', EMAIL: 'bernst@company.com', DEPARTMENT_ID: 60, SALARY: 6000, HIRE_DATE: '2007-05-21' },
      { EMPLOYEE_ID: 107, FIRST_NAME: 'Diana', LAST_NAME: 'Lorentz', EMAIL: 'dlorentz@company.com', DEPARTMENT_ID: 60, SALARY: 4200, HIRE_DATE: '2007-02-07' },
      { EMPLOYEE_ID: 124, FIRST_NAME: 'Kevin', LAST_NAME: 'Mourgos', EMAIL: 'kmourgos@company.com', DEPARTMENT_ID: 50, SALARY: 5800, HIRE_DATE: '2007-11-16' },
      { EMPLOYEE_ID: 141, FIRST_NAME: 'Trenna', LAST_NAME: 'Rajs', EMAIL: 'trajs@company.com', DEPARTMENT_ID: 50, SALARY: 3500, HIRE_DATE: '2003-10-17' },
    ],
  },
  {
    name: 'DEPARTMENTS',
    description: '부서 정보 테이블',
    columns: [
      { name: 'DEPARTMENT_ID', type: 'NUMBER' },
      { name: 'DEPARTMENT_NAME', type: 'VARCHAR2(100)' },
      { name: 'MANAGER_ID', type: 'NUMBER' },
      { name: 'LOCATION_ID', type: 'NUMBER' },
    ],
    rows: [
      { DEPARTMENT_ID: 10, DEPARTMENT_NAME: 'Administration', MANAGER_ID: 200, LOCATION_ID: 1700 },
      { DEPARTMENT_ID: 20, DEPARTMENT_NAME: 'Marketing', MANAGER_ID: 201, LOCATION_ID: 1800 },
      { DEPARTMENT_ID: 50, DEPARTMENT_NAME: 'Shipping', MANAGER_ID: 124, LOCATION_ID: 1500 },
      { DEPARTMENT_ID: 60, DEPARTMENT_NAME: 'IT', MANAGER_ID: 103, LOCATION_ID: 1400 },
      { DEPARTMENT_ID: 80, DEPARTMENT_NAME: 'Sales', MANAGER_ID: 145, LOCATION_ID: 2500 },
      { DEPARTMENT_ID: 90, DEPARTMENT_NAME: 'Executive', MANAGER_ID: 100, LOCATION_ID: 1700 },
      { DEPARTMENT_ID: 110, DEPARTMENT_NAME: 'Accounting', MANAGER_ID: 205, LOCATION_ID: 1700 },
    ],
  },
  {
    name: 'LOCATIONS',
    description: '위치 정보 테이블',
    columns: [
      { name: 'LOCATION_ID', type: 'NUMBER' },
      { name: 'STREET_ADDRESS', type: 'VARCHAR2(200)' },
      { name: 'CITY', type: 'VARCHAR2(100)' },
      { name: 'COUNTRY_ID', type: 'CHAR(2)' },
    ],
    rows: [
      { LOCATION_ID: 1400, STREET_ADDRESS: '2014 Jabberwocky Rd', CITY: 'Southlake', COUNTRY_ID: 'US' },
      { LOCATION_ID: 1500, STREET_ADDRESS: '2011 Interiors Blvd', CITY: 'South San Francisco', COUNTRY_ID: 'US' },
      { LOCATION_ID: 1700, STREET_ADDRESS: '2004 Charade Rd', CITY: 'Seattle', COUNTRY_ID: 'US' },
      { LOCATION_ID: 1800, STREET_ADDRESS: '460 Bloor St W', CITY: 'Toronto', COUNTRY_ID: 'CA' },
      { LOCATION_ID: 2500, STREET_ADDRESS: 'Magdalen Centre', CITY: 'Oxford', COUNTRY_ID: 'UK' },
    ],
  },
]

export const SAMPLE_QUERIES = [
  'SELECT * FROM EMPLOYEES',
  'SELECT * FROM DEPARTMENTS',
  'SELECT EMPLOYEE_ID, FIRST_NAME, SALARY FROM EMPLOYEES WHERE DEPARTMENT_ID = 60',
  'SELECT E.FIRST_NAME, D.DEPARTMENT_NAME FROM EMPLOYEES E JOIN DEPARTMENTS D ON E.DEPARTMENT_ID = D.DEPARTMENT_ID',
  'SELECT DEPARTMENT_ID, COUNT(*) FROM EMPLOYEES GROUP BY DEPARTMENT_ID',
]

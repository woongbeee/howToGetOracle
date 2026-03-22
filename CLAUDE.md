# CLAUDE.md

## 프로젝트 개요
사용자가 쿼리문을 입력하면, 오라클 데이터 베이스 시스템 내부에서 어떤 일이 일어나는지, 오라클 데이터 베이스 시스템을 다이어그램으로 시각적으로 표현한 UI 에서 보여주는 어플리케이션.

## 기술 스택
- **언어**: Vite, Typescript, React
- **Styling 라이브러리**: shadcn/ui


## 개발 가이드라인

## 코드 스타일

- TypeScript strict 모드, `any` 타입 금지
- named export만 사용 (default export 금지)
- CSS: Tailwind 유틸리티 클래스만 사용, 커스텀 CSS 파일 금지
- React 19 자동 최적화 우선 활용, 수동 최적화는 react-scan으로 확인 후 적용

## ESLint / Prettier 역할 구분

- **ESLint**: TypeScript·React 문법 오류만 검사 (타입 오류, hooks 규칙, react-refresh)
- **Prettier** + `prettier-plugin-tailwindcss`: 포매팅·들여쓰기·Tailwind 클래스 정렬
- 두 도구의 역할이 겹치지 않도록 s`eslint-config-prettier`로 충돌 방지
### 코딩 스타일


// src/lib/mockStore.ts — Barrel re-export (하위 호환)
// ────────────────────────────────────────────────────────────
// 원본 923줄을 mock/ 디렉토리로 분리했습니다.
//   mock/types.ts        — 타입 정의 (RoleType, Company, Issue 등)
//   mock/constants.ts    — 상수 (STATUS_LABEL, LAWYERS, MODULE_REGISTRY 등)
//   mock/data.ts         — 기본 시드 데이터
//   mock/store.ts        — store 객체 + 자동화 파이프라인
//   mock/consultStore.ts — ConsultStore 클래스
//   mock/index.ts        — barrel index
//
// 기존 import { store, Company } from '@/lib/mockStore' 형태가
// 변경 없이 작동합니다.
// ────────────────────────────────────────────────────────────

export * from './mock';

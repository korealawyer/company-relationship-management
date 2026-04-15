// src/lib/clientCookies.ts
// 순수 UI 시각적 상태(테마, 사이드바 토글 등)를 JS 단에서 즉시 읽고 쓰기 위한 유틸리티
// Server Component 제어와 달리 클릭 즉시 렌더링되게 하기 위해 일반 쿠키를 사용합니다.

export const setClientCookie = (name: string, value: string, days = 365) => {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

export const getClientCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return decodeURIComponent(match[2]);
  return null;
};

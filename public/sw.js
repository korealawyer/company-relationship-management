// IBS 법률사무소 CRM — Service Worker (PWA 푸시 알림)
// 이메일 열람/클릭 시 실시간 푸시 알림 수신

const CACHE_NAME = 'ibs-crm-v1';

// ── Install ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
    console.log('[SW] Service Worker 설치 완료');
    self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    console.log('[SW] Service Worker 활성화');
    event.waitUntil(self.clients.claim());
});

// ── Push 이벤트 수신 ─────────────────────────────────────
self.addEventListener('push', (event) => {
    console.log('[SW] 푸시 알림 수신:', event.data?.text());

    let data = {
        title: '🔔 IBS CRM 알림',
        body: '새로운 알림이 있습니다.',
        icon: '/ibs-icon-192.png',
        badge: '/ibs-icon-192.png',
        url: '/sales/call',
        tag: 'ibs-notification',
    };

    try {
        if (event.data) {
            const payload = event.data.json();
            data = { ...data, ...payload };
        }
    } catch (e) {
        if (event.data) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/ibs-icon-192.png',
        badge: data.badge || '/ibs-icon-192.png',
        tag: data.tag || 'ibs-notification',
        requireInteraction: true,  // 사용자가 직접 닫을 때까지 유지
        vibrate: [200, 100, 200],  // 진동 패턴
        data: { url: data.url || '/sales/call' },
        actions: [
            { action: 'call', title: '📞 바로 전화' },
            { action: 'view', title: '📋 CRM 보기' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ── 알림 클릭 처리 ───────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] 알림 클릭:', event.action);
    event.notification.close();

    const url = event.notification.data?.url || '/sales/call';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // 이미 열린 탭이 있으면 포커스
            for (const client of clientList) {
                if (client.url.includes('/sales') && 'focus' in client) {
                    return client.focus();
                }
            }
            // 없으면 새 탭 열기
            return self.clients.openWindow(url);
        })
    );
});

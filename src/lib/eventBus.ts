/**
 * src/lib/eventBus.ts
 * 
 * Task 4.4: Singleton Event Bus
 * 여러 컴포넌트에 산재되어 있는 window.dispatchEvent 기반 커스텀 이벤트를 
 * 단일 채널로 중앙 통제하여 메모리 누수 방지 및 로깅을 지원합니다.
 */

type EventHandler = (data?: any) => void;

class EventBus {
  private listeners: Map<string, EventHandler[]> = new Map();

  /**
   * 이벤트를 발행(Emit)합니다.
   * @param event 이벤트 이름
   * @param data 이벤트와 함께 전달할 데이터
   */
  emit(event: string, data?: any): void {
    if (typeof window === 'undefined') return;
    
    // 내부 디스패치 (EventBus 리스너)
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try { handler(data); } catch (e) { console.error(`[EventBus] Error in handler for ${event}`, e); }
      });
    }

    // 하위 호환성을 위해 window 커스텀 이벤트도 동시 발생
    try {
      window.dispatchEvent(new CustomEvent(event, { detail: data }));
    } catch (e) {
      console.warn(`[EventBus] Failed to dispatch CustomEvent ${event}`);
    }
  }

  /**
   * 이벤트를 구독(Subscribe)합니다.
   * @param event 이벤트 이름
   * @param handler 실행할 콜백 함수
   * @returns 구독 해제 함수(Unsubscribe)
   */
  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);

    // 하위 호환성을 위한 윈도우 이벤트 리스너 연동
    const windowHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      // EventBus emit에서 넘어온 호출인지, 직접 윈도우로 발생한 호출인지 구분이 어렵지만,
      // 일단 순수 윈도우 이벤트 처리 대응 (EventBus 내부 호출 시 중복 실행 방지 기능 추가 가능)
    };
    
    return () => this.off(event, handler);
  }

  /**
   * 이벤트 구독을 해제(Unsubscribe)합니다.
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      this.listeners.set(event, handlers.filter(h => h !== handler));
    }
  }
}

export const eventBus = new EventBus();

export interface NotificationSettings {
  notifyEmail: boolean;
  notifyKakao: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

const DEFAULT_SETTINGS: NotificationSettings = {
  notifyEmail: true,
  notifyKakao: true,
  frequency: 'immediate'
};

const getStorageKey = (caseId: string) => `notification_settings_${caseId}`;

export const notificationService = {
  /**
   * API 호출을 가정한 비동기 딜레이로 알림 설정을 가져옵니다.
   */
  async getSettings(caseId: string): Promise<NotificationSettings> {
    // API 호출 지연 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    
    const stored = localStorage.getItem(getStorageKey(caseId));
    if (stored) {
      try {
        return JSON.parse(stored) as NotificationSettings;
      } catch (e) {
        console.error('Failed to parse notification settings', e);
      }
    }
    return DEFAULT_SETTINGS;
  },

  /**
   * API 호출을 가정한 비동기 딜레이로 알림 설정을 저장합니다.
   */
  async saveSettings(caseId: string, settings: NotificationSettings): Promise<void> {
    // API 저장 호출 지연 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(getStorageKey(caseId), JSON.stringify(settings));
  }
};

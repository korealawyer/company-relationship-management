import { useState, useEffect, useCallback } from 'react';
import { notificationService, NotificationSettings } from '@/lib/notificationService';

export function useNotificationSettings(caseId: string | undefined) {
  const [settings, setSettings] = useState<NotificationSettings>({
    notifyEmail: true,
    notifyKakao: true,
    frequency: 'immediate'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (!caseId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    
    notificationService.getSettings(caseId)
      .then(data => {
        if (isMounted) {
          setSettings(data);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error(err);
          setError(err instanceof Error ? err : new Error('설정을 불러오는 중 오류가 발생했습니다.'));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [caseId]);

  // 설정 저장 함수
  const saveSettings = useCallback(async (newSettings?: NotificationSettings) => {
    if (!caseId) return false;
    
    const settingsToSave = newSettings ?? settings;
    
    setIsSaving(true);
    setError(null);
    try {
      await notificationService.saveSettings(caseId, settingsToSave);
      setSettings(settingsToSave);
      return true;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err : new Error('설정 저장 중 오류가 발생했습니다.'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [caseId, settings]);

  return {
    settings,
    setSettings,
    isLoading,
    isSaving,
    error,
    saveSettings
  };
}

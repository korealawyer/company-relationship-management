import { useState, useCallback, useMemo } from 'react';
import { Company } from '@/lib/types';
import { useCallLocks } from './useCallLocks';
import { getBrowserSupabase } from '@/lib/supabase';

export function useCallQueue(myUserId: string) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const { locks } = useCallLocks();
  
  const refresh = useCallback(async () => {
    try {
      // Supabase에서 companies 목록 가져오기
      const supabase = getBrowserSupabase();
      if (!supabase) return;
      
      const { data, error } = await supabase
        .from('companies')
        .select('*');
        
      if (error) throw error;
      
      if (data) {
        // snake_case를 camelCase로 변환
        const mappedCompanies = data.map((item: any) => ({
          ...item,
          storeCount: item.store_count,
          assignedLawyer: item.assigned_lawyer_id,
          riskScore: item.risk_score,
          riskLevel: item.risk_level,
          issueCount: item.issue_count,
          bizType: item.biz_category,
          privacyUrl: item.privacy_url,
          contactName: item.contact_name,
          contactEmail: item.contact_email,
          contactPhone: item.contact_phone,
          contractSentAt: item.contract_sent_at,
          contractSignedAt: item.contract_signed_at,
          lastCallResult: item.last_call_result,
          lastCallAt: item.last_call_at,
          callAttempts: item.call_attempts,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        })) as Company[];
        
        setCompanies(mappedCompanies);
      }
    } catch (e) {
      console.error('Failed to fetch companies list:', e);
    }
  }, []);

  const nextAvailableCompany = useMemo(() => {
    const available = companies.filter(c => {
      // lastCallResult 없을 것
      if (c.lastCallResult) return false;
      
      // 누군가의 락이 걸려있지 않을 것 (락 없어야 함)
      const lock = locks.find(l => l.companyId === c.id);
      if (lock) return false;
      
      return true;
    });

    // riskScore DESC 정렬
    available.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
    
    return available.length > 0 ? available[0] : null;
  }, [companies, locks]);

  const availableCount = useMemo(() => {
    return companies.filter(c => {
      if (c.lastCallResult) return false;
      const lock = locks.find(l => l.companyId === c.id);
      if (lock) return false;
      return true;
    }).length;
  }, [companies, locks]);

  const lockedByOthersCount = useMemo(() => {
    return locks.filter(l => l.userId !== myUserId).length;
  }, [locks, myUserId]);

  const completedTodayCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return companies.filter(c => {
      if (!c.lastCallAt) return false;
      return c.lastCallAt.startsWith(today);
    }).length;
  }, [companies]);

  return {
    companies,
    locks,
    nextAvailableCompany,
    availableCount,
    lockedByOthersCount,
    completedTodayCount,
    refresh
  };
}

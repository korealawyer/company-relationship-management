import { Company } from '../mockStore';

export const ConversionPredictionService = {
    /** 전환 확률 계산 — 7가지 신호 종합 */
    predict(company: Company): { score: number; factors: string[]; level: 'HOT' | 'WARM' | 'COLD'; urgency: string } {
        let score = 15; // 기본 15%
        const factors: string[] = [];

        // ① 파이프라인 단계 — 핵심 지표 (가중치 최대)
        const stageScores: Record<string, number> = {
            pending: 0, crawling: 0, analyzed: 5, assigned: 8,
            reviewing: 10, lawyer_confirmed: 15, emailed: 20,
            client_logged_in: 35, tour_completed: 45,
            client_viewed: 30, client_replied: 40,
            subscribed: 99,
        };
        const stageBonus = stageScores[company.status] ?? 0;
        if (stageBonus > 0) { score += stageBonus; factors.push(`파이프라인: ${company.status}`); }

        // ② 법적 위험도 (니즈 크기)
        if (company.riskScore >= 80) { score += 20; factors.push(`리스크 ${company.riskScore}점 — 즉각 대응 필요`); }
        else if (company.riskScore >= 60) { score += 12; factors.push(`리스크 ${company.riskScore}점 — 높음`); }
        else if (company.riskScore >= 40) { score += 6; factors.push(`리스크 ${company.riskScore}점 — 중간`); }

        // ③ 이슈 수 (구체적 니즈)
        const issueCount = company.issues?.length || 0;
        if (issueCount >= 7) { score += 12; factors.push(`이슈 ${issueCount}건 — 매우 많음`); }
        else if (issueCount >= 4) { score += 7; factors.push(`이슈 ${issueCount}건`); }
        else if (issueCount >= 2) { score += 3; factors.push(`이슈 ${issueCount}건`); }

        // ④ 고객 반응 (이메일 열람·회신 — 가장 강력 신호)
        if (company.clientReplied) { score += 20; factors.push('고객 회신 ✅ — 전환 임박'); }
        else if (company.emailSentAt) {
            // 이메일 발송 후 경과 시간 체크
            const hoursSinceSent = (Date.now() - new Date(company.emailSentAt).getTime()) / (1000 * 60 * 60);
            if (hoursSinceSent <= 24) { score += 8; factors.push('이메일 발송 24h 이내 — 풋프린트 기간'); }
            else if (hoursSinceSent <= 72) { score += 4; factors.push('이메일 발송 72h 이내'); }
            else { score -= 5; factors.push('이메일 미반응 72h+ — 관심 하락'); }
        }

        // ⑤ 통화 품질 (횟수보다 내용)
        if (company.callNote) {
            const note = company.callNote.toLowerCase();
            const hotWords = ['관심', '계약', '검토', '긍정', '좋아', '가능', '할게'];
            const coldWords = ['거절', '불필요', '관심없', '나중에', '그냥'];
            const hotCount = hotWords.filter(w => note.includes(w)).length;
            const coldCount = coldWords.filter(w => note.includes(w)).length;
            if (hotCount >= 2) { score += 15; factors.push('통화에서 강한 관심 신호'); }
            else if (hotCount === 1) { score += 8; factors.push('통화에서 관심 표현'); }
            if (coldCount >= 1) { score -= 10; factors.push('통화에서 거절 신호 있음'); }
            else if (!hotCount && !coldCount) { score += 3; factors.push('통화 기록 있음'); }
        } else if ((company.callAttempts || 0) >= 3) {
            score -= 8;
            factors.push(`${company.callAttempts}회 시도 미응답 — 관심 낮음`);
        }

        // ⑥ 기업 규모 (LTV 크기)
        if (company.storeCount >= 200) { score += 8; factors.push(`대형 ${company.storeCount}개점 — 높은 MRR`); }
        else if (company.storeCount >= 50) { score += 4; factors.push(`${company.storeCount}개점`); }

        // ⑦ 변호사 컨펌 + AI 의견서 (전문성 신뢰도)
        if (company.lawyerConfirmed && company.aiDraftReady) { score += 5; factors.push('변호사 검토 + AI 의견서 완료'); }
        else if (company.lawyerConfirmed) { score += 3; factors.push('변호사 검토 완료'); }

        score = Math.min(99, Math.max(3, score));
        const level = score >= 70 ? 'HOT' : score >= 40 ? 'WARM' : 'COLD';

        // 긴급도 메시지
        let urgency = '';
        if (level === 'HOT' && company.clientReplied) urgency = '지금 바로 전화하세요!';
        else if (level === 'HOT') urgency = '오늘 안에 전화';
        else if (level === 'WARM' && company.emailSentAt) urgency = '24h 내 팔로업';
        else if (level === 'WARM') urgency = '이번 주 내';
        else urgency = '장기 관리';

        return { score, factors, level, urgency };
    },
};

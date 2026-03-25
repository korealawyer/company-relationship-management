import { Company } from '../mockStore';

// 실제 BigKinds / 연합뉴스 API 연동 시 복원 예정
export interface NewsItem {
    id: string;
    title: string;
    source: string;
    date: string;
    category: 'pipc' | 'fine' | 'franchise' | 'regulation';
    summary: string;
    relatedBizTypes: string[];
    urgency: 'high' | 'medium' | 'low';
}

export const NEWS_FEED: NewsItem[] = [];

// NewsLeadService 비활성화 — 실시간 뉴스 API 연동 전까지 사용 안 함
export const NewsLeadService = {
    getRelevantNews(_companies: Company[], _limit = 3): (NewsItem & { matchCount: number })[] { return []; },
    getNewLeadSuggestions(_companies: Company[]): { company: Company; reason: string; newsId: string }[] { return []; },
    getCategoryIcon(_category: NewsItem['category']): string { return '📰'; },
    getUrgencyColor(_urgency: NewsItem['urgency']): string { return '#64748b'; },
};

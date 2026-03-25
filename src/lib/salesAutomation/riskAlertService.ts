import { Company, store } from '../mockStore';

export interface RiskAlert {
    id: string;
    companyId: string;
    companyName: string;
    riskScore: number;
    message: string;
    createdAt: string;
    dismissed: boolean;
}

export const RiskAlertService = {
    generateAlerts(companies: Company[]): RiskAlert[] {
        return companies
            .filter(c => c.riskScore >= 70 && !c.callNote)
            .map(c => ({
                id: `alert-${c.id}`,
                companyId: c.id,
                companyName: c.name,
                riskScore: c.riskScore,
                message: `${c.name} 리스크 ${c.riskScore}점 — 즉시 전화 필요`,
                createdAt: new Date().toISOString(),
                dismissed: false,
            }))
            .sort((a, b) => b.riskScore - a.riskScore);
    },

    getUrgentCount(companies: Company[]): number {
        return companies.filter(c => c.riskScore >= 70 && !c.callNote).length;
    },
};

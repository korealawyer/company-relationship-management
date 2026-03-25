export interface CourtEvent {
    date: string;
    type: string;
    result: string;
    courtroom?: string;
}

export interface CourtCaseResult {
    caseNumber: string;
    caseName: string;
    court: string;
    courtSection: string;
    caseType: string;
    filedDate: string;
    status: string;
    plaintiff: string;
    defendant: string;
    judge: string;
    nextDate: string | null;
    nextEvent: string | null;
    events: CourtEvent[];
}

export type CaseStatus = 'active' | 'pending' | 'won' | 'settled' | 'closed';

export interface LawCase {
    id: string;
    caseNumber: string;
    title: string;
    type: string;
    status: CaseStatus;
    court: string;
    judge: string;
    lawyer: string;
    plaintiff: string;
    defendant: string;
    filedDate: string;
    nextDate: string | null;
    nextEvent: string | null;
    amount: string;
    description: string;
    progress: number;
    updates: { date: string; content: string }[];
}

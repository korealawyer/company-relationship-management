import { NextRequest, NextResponse } from 'next/server';

/**
 * 대법원 나의사건검색 API
 * 
 * 실제 구현 시: https://safind.scourt.go.kr 에서 크롤링
 * 현재는 사건번호 기반 mock 데이터 반환
 * 
 * 향후 puppeteer / cheerio 기반 실제 크롤링으로 교체 예정
 */

interface CourtEvent {
    date: string;
    type: string;
    result: string;
    courtroom?: string;
}

interface CourtCaseResult {
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

// ── 목업 대법원 데이터 (실제로는 크롤링) ───────────────────
const MOCK_COURT_DB: Record<string, CourtCaseResult> = {
    '2026가합12345': {
        caseNumber: '2026가합12345',
        caseName: '손해배상(기)',
        court: '서울중앙지방법원',
        courtSection: '제12민사부',
        caseType: '민사',
        filedDate: '2026-01-15',
        status: '진행',
        plaintiff: '주식회사 놀부엔비지',
        defendant: '김○○',
        judge: '김영수',
        nextDate: '2026-04-08',
        nextEvent: '변론',
        events: [
            { date: '2026-03-10', type: '변론기일', result: '변론속행', courtroom: '제523호' },
            { date: '2026-02-20', type: '변론기일', result: '변론속행', courtroom: '제523호' },
            { date: '2026-01-25', type: '변론기일', result: '변론속행', courtroom: '제523호' },
            { date: '2026-01-15', type: '소장접수', result: '접수', courtroom: '' },
        ],
    },
    '2025나67890': {
        caseNumber: '2025나67890',
        caseName: '과징금부과처분취소',
        court: '서울행정법원',
        courtSection: '제5부',
        caseType: '행정',
        filedDate: '2025-11-20',
        status: '진행',
        plaintiff: '주식회사 놀부엔비지',
        defendant: '개인정보보호위원회',
        judge: '박진영',
        nextDate: '2026-03-25',
        nextEvent: '증인신문',
        events: [
            { date: '2026-03-05', type: '변론기일', result: '증인채택결정', courtroom: '제301호' },
            { date: '2026-02-10', type: '변론기일', result: '변론속행', courtroom: '제301호' },
            { date: '2025-12-15', type: '변론기일', result: '변론속행', courtroom: '제301호' },
            { date: '2025-11-20', type: '소장접수', result: '접수', courtroom: '' },
        ],
    },
    '2026가단34567': {
        caseNumber: '2026가단34567',
        caseName: '구상금',
        court: '수원지방법원',
        courtSection: '제8민사부',
        caseType: '민사',
        filedDate: '2026-03-01',
        status: '진행',
        plaintiff: '이○○',
        defendant: '주식회사 놀부엔비지',
        judge: '(미배정)',
        nextDate: '2026-04-15',
        nextEvent: '변론',
        events: [
            { date: '2026-03-01', type: '소장접수', result: '접수', courtroom: '' },
        ],
    },
    '2025가합78901': {
        caseNumber: '2025가합78901',
        caseName: '부당이득금',
        court: '서울중앙지방법원',
        courtSection: '제9민사부',
        caseType: '민사',
        filedDate: '2025-06-10',
        status: '종국(판결)',
        plaintiff: '주식회사 놀부엔비지',
        defendant: '주식회사 ○○마케팅 외 3',
        judge: '이현정',
        nextDate: null,
        nextEvent: null,
        events: [
            { date: '2026-02-28', type: '판결확정', result: '원고승소', courtroom: '' },
            { date: '2026-01-20', type: '선고', result: '원고전부승소', courtroom: '제412호' },
            { date: '2025-12-10', type: '변론기일', result: '변론종결', courtroom: '제412호' },
            { date: '2025-10-15', type: '변론기일', result: '변론속행', courtroom: '제412호' },
            { date: '2025-08-20', type: '변론기일', result: '변론속행', courtroom: '제412호' },
            { date: '2025-06-10', type: '소장접수', result: '접수', courtroom: '' },
        ],
    },
};

// ── 실제 크롤링 구현 (향후) ────────────────────────────────
// async function scrapeCourtCase(caseNumber: string): Promise<CourtCaseResult | null> {
//     // 1) puppeteer로 https://safind.scourt.go.kr 접속
//     // 2) 사건번호 입력 후 검색
//     // 3) 결과 테이블 파싱
//     // 4) CourtCaseResult 형태로 반환
//     return null;
// }

export async function POST(request: NextRequest) {
    try {
        const { caseNumber } = await request.json();

        if (!caseNumber) {
            return NextResponse.json({ error: '사건번호를 입력해주세요.' }, { status: 400 });
        }

        // 사건번호 정규화 (공백 제거)
        const normalized = caseNumber.replace(/\s/g, '');

        // 목업 DB에서 검색 (실제로는 크롤링)
        const result = MOCK_COURT_DB[normalized];

        if (!result) {
            return NextResponse.json({
                error: `사건번호 "${caseNumber}"에 해당하는 사건을 찾을 수 없습니다.`,
                suggestion: '사건번호 형식: 2026가합12345',
            }, { status: 404 });
        }

        // 크롤링 시뮬레이션 딜레이
        await new Promise(resolve => setTimeout(resolve, 800));

        return NextResponse.json({
            success: true,
            source: '대법원 사건검색시스템 (safind.scourt.go.kr)',
            fetchedAt: new Date().toISOString(),
            data: result,
        });
    } catch {
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}

// GET: 등록된 사건번호 목록 반환 (관리용)
export async function GET() {
    const cases = Object.values(MOCK_COURT_DB).map(c => ({
        caseNumber: c.caseNumber,
        caseName: c.caseName,
        court: c.court,
        status: c.status,
    }));

    return NextResponse.json({ cases });
}

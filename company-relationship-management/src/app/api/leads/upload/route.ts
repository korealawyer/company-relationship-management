import { NextRequest, NextResponse } from 'next/server';
import { leadStore, type Lead, type LeadStatus } from '@/lib/leadStore';
import { requireSessionFromCookie } from '@/lib/auth';

// 엑셀 업로드 API
// Phase 1: CSV 파싱 (내장 파서 — RFC 4180 준수)
// Phase 2: xlsx 라이브러리로 .xlsx 지원

// H2: 최대 허용 행 수 (메모리 보호)
const MAX_ROWS = 1000;

// QA-FIX #9: HTML 새니타이즈 — CSS/XSS 페이로드 차단
function sanitizeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// H2: RFC 4180 준수 CSV 파서 — 따옴표 내 쉼표/줄바꿈 처리
function parseCSV(text: string): Record<string, string>[] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const next = text[i + 1];

        if (inQuotes) {
            if (ch === '"' && next === '"') {
                currentField += '"';
                i++; // 이스케이프된 따옴표
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                currentField += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                currentRow.push(currentField.trim());
                currentField = '';
            } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
                currentRow.push(currentField.trim());
                if (currentRow.some(v => v)) rows.push(currentRow);
                currentRow = [];
                currentField = '';
                if (ch === '\r') i++; // \r\n 건너뛰기
                if (rows.length > MAX_ROWS + 1) break; // +1 for header
            } else {
                currentField += ch;
            }
        }
    }
    // 마지막 행 처리
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(v => v)) rows.push(currentRow);
    }

    if (rows.length < 2) return [];
    const headers = rows[0].map(h => h.replace(/^["']|["']$/g, ''));
    return rows.slice(1, MAX_ROWS + 1).map(values => {
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = (values[i] || '').replace(/^["']|["']$/g, ''); });
        return row;
    });
}

// 컬럼명 매핑 (한국어/영어 모두 지원)
const COL_MAP: Record<string, keyof Lead> = {
    '회사명': 'companyName', 'company': 'companyName', 'companyName': 'companyName',
    '도메인': 'domain', 'domain': 'domain',
    '개인정보처리방침URL': 'privacyUrl', 'privacyUrl': 'privacyUrl', '개인정보URL': 'privacyUrl',
    '담당자명': 'contactName', 'contact': 'contactName', 'contactName': 'contactName',
    '이메일': 'contactEmail', 'email': 'contactEmail', 'contactEmail': 'contactEmail',
    '전화': 'contactPhone', 'phone': 'contactPhone', 'contactPhone': 'contactPhone',
    '가맹점수': 'storeCount', 'storeCount': 'storeCount', '지점수': 'storeCount',
    '업종': 'bizType', 'bizType': 'bizType', 'category': 'bizType',
};

export async function POST(req: NextRequest) {
    // F-7: 인증 검증 추가 — 비로그인 업로드 차단
    const auth = await requireSessionFromCookie(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        if (!file) return NextResponse.json({ error: '파일 없음' }, { status: 400 });

        // SEC-FIX: 메모리 고갈(OOM) 방어용 파일 사이즈 제한 (5MB)
        if (file.size > 5 * 1024 * 1024) {
             return NextResponse.json({ error: '파일 크기가 5MB를 초과했습니다.' }, { status: 413 });
        }

        const text = await file.text();
        const rows = parseCSV(text);
        if (rows.length === 0) return NextResponse.json({ error: '파싱 가능한 데이터 없음' }, { status: 400 });

        const now = new Date().toISOString();
        const leads = rows.map((row, i) => {
            const mapped: Record<string, string | number> = {};
            Object.entries(row).forEach(([k, v]) => {
                const field = COL_MAP[k];
                if (field) mapped[field as string] = (field === 'storeCount') ? parseInt(v) || 0 : v;
            });
            // QA-FIX #9: 모든 문자열 필드에 HTML 새니타이즈 적용
            return {
                companyName: sanitizeHtml((mapped.companyName as string) || `미입력_${i + 1}`),
                domain: sanitizeHtml((mapped.domain as string) || ''),
                privacyUrl: sanitizeHtml((mapped.privacyUrl as string) || ''),
                contactName: sanitizeHtml((mapped.contactName as string) || ''),
                contactEmail: sanitizeHtml((mapped.contactEmail as string) || ''),
                contactPhone: sanitizeHtml((mapped.contactPhone as string) || ''),
                storeCount: (mapped.storeCount as number) || 0,
                bizType: (mapped.bizType as string) || '미분류',
                riskScore: 0,
                riskLevel: '' as const,
                issueCount: 0,
                status: 'pending' as LeadStatus,
                source: 'excel' as const,
            };
        });

        const added = leadStore.add(leads);
        // QA-FIX #8: MAX_ROWS 초과 시 사용자에게 경고 메시지 포함
        const totalParsedRows = rows.length;
        return NextResponse.json({
            ok: true,
            count: added.length,
            ...(totalParsedRows >= MAX_ROWS ? {
                warning: `최대 ${MAX_ROWS}행까지만 처리됩니다. 업로드된 파일에 더 많은 데이터가 있을 수 있습니다.`
            } : {}),
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: '업로드 처리 오류' }, { status: 500 });
    }
}

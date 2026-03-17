import { NextRequest, NextResponse } from 'next/server';
import { leadStore, type Lead, type LeadStatus } from '@/lib/leadStore';

// 엑셀 업로드 API
// Phase 1: CSV 파싱 (내장 파서)
// Phase 2: xlsx 라이브러리로 .xlsx 지원

function parseCSV(text: string): Record<string, string>[] {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] || ''; });
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
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        if (!file) return NextResponse.json({ error: '파일 없음' }, { status: 400 });

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
            return {
                companyName: (mapped.companyName as string) || `미입력_${i + 1}`,
                domain: (mapped.domain as string) || '',
                privacyUrl: (mapped.privacyUrl as string) || '',
                contactName: (mapped.contactName as string) || '',
                contactEmail: (mapped.contactEmail as string) || '',
                contactPhone: (mapped.contactPhone as string) || '',
                storeCount: (mapped.storeCount as number) || 0,
                bizType: (mapped.bizType as string) || '미분류',
                riskScore: 0,
                riskLevel: '' as '',
                issueCount: 0,
                status: 'pending' as LeadStatus,
                source: 'excel' as const,
            };
        });

        const added = leadStore.add(leads);
        return NextResponse.json({ ok: true, count: added.length });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: '업로드 처리 오류' }, { status: 500 });
    }
}

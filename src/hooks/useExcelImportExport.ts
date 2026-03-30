// @ts-nocheck
import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { store, Company, STATUS_LABEL } from '@/lib/mockStore';

export function useExcelImportExport(
    companies: Company[],
    refresh: () => void,
    showToast: (msg: string) => void,
    importBulk: (data: Partial<Company>[]) => Promise<{ success: number; skipped: number }>
) {
    const [showExcelUpload, setShowExcelUpload] = useState(false);
    const [excelData, setExcelData] = useState<Record<string, string>[]>([]);
    const [excelPreview, setExcelPreview] = useState<Record<string, string>[]>([]);
    const [excelUploading, setExcelUploading] = useState(false);
    const [importSuccess, setImportSuccess] = useState(0);
    const [importSkipped, setImportSkipped] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExcelDownload = () => {
        const data = companies.map(c => ({
            '기업명': c.name,
            '사업자번호': c.biz,
            '업종': c.bizType || '',
            '홈페이지': c.url || c.domain || '',
            '이메일': c.email,
            '전화번호': c.phone,
            '담당자': c.contactName || '',
            '담당자 전화': c.contactPhone || '',
            '가맹점수': c.storeCount,
            '상태': STATUS_LABEL[c.status] || c.status,
            '위험도': c.riskLevel || '',
            '배정 변호사': c.assignedLawyer || '',
            '통화 메모': c.callNote || '',
            '플랜': c.plan || '',
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'CRM 기업목록');
        
        ws['!cols'] = [
            { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 30 },
            { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
            { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 12 },
            { wch: 30 }, { wch: 10 },
        ];
        XLSX.writeFile(wb, `IBS_CRM_기업목록_${new Date().toISOString().slice(0, 10)}.xlsx`);
        showToast('📥 Excel 파일이 다운로드되었습니다');
    };

    const handleTemplateDownload = () => {
        const data = [
            {
                '기업명': '아이비에스 주식회사 (필수)',
                '사업자번호': '123-45-67890',
                '이메일': 'contact@ibs.example.com',
                '업종': 'IT / 소프트웨어',
                '홈페이지': 'https://ibs.example.com',
                '전화번호': '02-1234-5678',
                '가맹점수': '10',
                '담당자': '홍길동',
                '담당자 전화': '010-1234-5678',
                '담당자 이메일': 'hong@ibs.example.com',
                '개인정보방침 URL': 'https://ibs.example.com/privacy',
                '개인정보방침 전문': '당사는 고객의 개인정보를 소중하게 생각합니다...',
                '메모': '신규 유망 고객사',
            }
        ];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '업로드 양식');
        
        ws['!cols'] = [
            { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
            { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 10 },
            { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 40 },
            { wch: 30 },
        ];
        XLSX.writeFile(wb, 'CRM_업로드_양식.xlsx');
        showToast('📥 업로드 양식이 다운로드되었습니다');
    };

    const handleExcelFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target?.result, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const raw = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
                setExcelData(raw);
                setExcelPreview(raw.slice(0, 20)); // UI에는 20건만 표시
                setShowExcelUpload(true);
            } catch {
                showToast('❌ Excel 파일 파싱에 실패했습니다');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    const handleExcelImport = async () => {
        setExcelUploading(true);
        const mappedList: Partial<Company>[] = [];

        for (const row of excelData) {
            const name = String(row['기업명'] || row['회사명'] || row['name'] || '').trim();
            const email = String(row['이메일'] || row['email'] || '').trim();
            if (!name) continue;

            const biz = String(row['사업자번호'] || row['biz'] || '').trim();
            const memoContent = String(row['메모'] || row['memo'] || '').trim();
            const privacyUrl = String(row['개인정보방침 URL'] || row['privacyUrl'] || '').trim();
            const privacyPolicyText = String(row['개인정보방침 전문'] || row['privacyPolicyText'] || '').trim();

            const memos = memoContent ? [{
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                author: '시스템',
                content: memoContent
            }] : [];

            mappedList.push({
                name,
                biz,
                url: String(row['홈페이지'] || row['url'] || row['website'] || '').trim(),
                email,
                phone: String(row['전화번호'] || row['phone'] || '').trim(),
                storeCount: parseInt(String(row['가맹점수'] || row['storeCount'] || '0'), 10) || 0,
                status: 'pending',
                assignedLawyer: '', issues: [],
                salesConfirmed: false, salesConfirmedAt: '', salesConfirmedBy: '',
                lawyerConfirmed: false, lawyerConfirmedAt: '',
                emailSentAt: '', emailSubject: '',
                clientReplied: false, clientRepliedAt: '', clientReplyNote: '',
                loginCount: 0, callNote: '', plan: 'none',
                autoMode: true, aiDraftReady: false, source: 'manual',
                riskScore: 0, riskLevel: '', issueCount: 0,
                bizType: String(row['업종'] || row['bizType'] || '').trim(),
                domain: String(row['홈페이지'] || row['domain'] || '').trim(),
                privacyUrl,
                privacyPolicyText,
                contactName: String(row['담당자'] || row['contactName'] || '').trim(),
                contactEmail: String(row['담당자 이메일'] || row['contactEmail'] || email || '').trim(),
                contactPhone: String(row['담당자 전화'] || row['contactPhone'] || '').trim(),
                contacts: [], memos, timeline: [],
            });
        }

        try {
            const result = await importBulk(mappedList);
            setImportSuccess(result.success);
            setImportSkipped(result.skipped);
            showToast(`📤 신규 ${result.success}건 추가, 중복 ${result.skipped}건 스킵 완료 환료됨`);
        } catch (err) {
            showToast('❌ Excel 데이터 등록 중 오류가 발생했습니다');
        }

        setExcelUploading(false);
        setShowExcelUpload(false);
        setExcelData([]);
        setExcelPreview([]);
        refresh();
    };

    return {
        showExcelUpload, setShowExcelUpload,
        excelData, setExcelData, excelPreview, setExcelPreview,
        excelUploading, fileInputRef,
        handleExcelDownload, handleTemplateDownload, handleExcelFile, handleExcelImport
    };
}

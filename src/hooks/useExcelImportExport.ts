import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { store, Company, STATUS_LABEL } from '@/lib/mockStore';

export function useExcelImportExport(companies: Company[], refresh: () => void, showToast: (msg: string) => void) {
    const [showExcelUpload, setShowExcelUpload] = useState(false);
    const [excelPreview, setExcelPreview] = useState<Record<string, string>[]>([]);
    const [excelUploading, setExcelUploading] = useState(false);
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

    const handleExcelFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target?.result, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const raw = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
                setExcelPreview(raw.slice(0, 50));
                setShowExcelUpload(true);
            } catch {
                showToast('❌ Excel 파일 파싱에 실패했습니다');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    const handleExcelImport = () => {
        setExcelUploading(true);
        setTimeout(() => {
            let imported = 0;
            excelPreview.forEach(row => {
                const name = row['기업명'] || row['회사명'] || row['name'] || '';
                const email = row['이메일'] || row['email'] || '';
                if (!name) return;
                store.add({
                    name,
                    biz: row['사업자번호'] || row['biz'] || '',
                    url: row['홈페이지'] || row['url'] || row['website'] || '',
                    email,
                    phone: row['전화번호'] || row['phone'] || '',
                    storeCount: parseInt(row['가맹점수'] || row['storeCount'] || '0') || 0,
                    status: 'pending',
                    assignedLawyer: '', issues: [],
                    salesConfirmed: false, salesConfirmedAt: '', salesConfirmedBy: '',
                    lawyerConfirmed: false, lawyerConfirmedAt: '',
                    emailSentAt: '', emailSubject: '',
                    clientReplied: false, clientRepliedAt: '', clientReplyNote: '',
                    loginCount: 0, callNote: '', plan: 'none',
                    autoMode: true, aiDraftReady: false, source: 'manual' as const,
                    riskScore: 0, riskLevel: '', issueCount: 0,
                    bizType: row['업종'] || row['bizType'] || '',
                    domain: row['홈페이지'] || row['domain'] || '',
                    privacyUrl: '',
                    contactName: row['담당자'] || row['contactName'] || '',
                    contactEmail: row['담당자 이메일'] || email || '',
                    contactPhone: row['담당자 전화'] || row['contactPhone'] || '',
                    contacts: [], memos: [], timeline: [],
                });
                imported++;
            });
            setExcelUploading(false);
            setShowExcelUpload(false);
            setExcelPreview([]);
            refresh();
            showToast(`📤 ${imported}개 기업이 Excel에서 등록되었습니다`);
        }, 1000);
    };

    return {
        showExcelUpload, setShowExcelUpload,
        excelPreview, setExcelPreview,
        excelUploading, fileInputRef,
        handleExcelDownload, handleExcelFile, handleExcelImport
    };
}

// @ts-nocheck
import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { store, Company, STATUS_LABEL } from '@/lib/mockStore';
import { useUsers } from '@/hooks/useDataLayer';

export function useExcelImportExport(
    companies: Company[],
    refresh: () => void,
    showToast: (msg: string) => void,
    importBulk: (data: Partial<Company>[]) => Promise<{ success: number; skipped: number }>,
    updateCompany: (id: string, payload: Partial<Company>) => Promise<void>
) {
    const { users } = useUsers();
    const [importMode, setImportMode] = useState<'create_leads' | 'update_privacy'>('create_leads');
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
            '구분': c.franchiseType || '',
            '홈페이지': c.url || c.domain || '',
            '이메일': c.email,
            '전화번호': c.phone,
            '담당자': c.contactName || '',
            '담당자 전화': c.contactPhone || '',
            '가맹점수': c.storeCount,
            '상태': STATUS_LABEL[c.status] || c.status,
            '위험도': c.riskLevel || '',
            '배정 변호사': c.assignedLawyer || '',
            '영업자': c.assignedSalesName || '',
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
            { wch: 30 }, { wch: 15 }, { wch: 10 },
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
                '구분(프랜차이즈/그외)': '프랜차이즈',
                '업종': '식음료',
                '홈페이지': 'https://ibs.example.com',
                '전화번호': '02-1234-5678',
                '가맹점수': '10',
                '담당영업자': '홍길동 (시스템 직원 이름과 동일 시 자동 매핑, 다르면 메모 기록)',
                '담당자': '김철수',
                '담당자 전화': '010-1234-5678',
                '담당자 이메일': 'kim@ibs.example.com',
                '개인정보방침 URL': 'https://ibs.example.com/privacy',
                '개인정보방침 전문': '당사는 고객의 개인정보를 소중하게 생각합니다...',
                '메모': '신규 유망 고객사',
            }
        ];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '업로드 양식');
        
        ws['!cols'] = [
            { wch: 30 }, // 기업명
            { wch: 20 }, // 사업자번호
            { wch: 30 }, // 이메일
            { wch: 25 }, // 구분(프랜차이즈/그외)
            { wch: 20 }, // 업종
            { wch: 30 }, // 홈페이지
            { wch: 15 }, // 전화번호
            { wch: 10 }, // 가맹점수
            { wch: 65 }, // 담당영업자
            { wch: 15 }, // 담당자
            { wch: 20 }, // 담당자 전화
            { wch: 30 }, // 담당자 이메일
            { wch: 40 }, // 개인정보방침 URL
            { wch: 40 }, // 개인정보방침 전문
            { wch: 30 }, // 메모
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
                const arrayBuffer = evt.target?.result as ArrayBuffer;
                const data = new Uint8Array(arrayBuffer);
                const wb = XLSX.read(data, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const raw = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
                setExcelData(raw);
                setExcelPreview(raw.slice(0, 20)); // UI에는 20건만 표시
                setShowExcelUpload(true);
            } catch (err) {
                console.error('Excel parse error:', err);
                showToast('❌ Excel 파일 파싱에 실패했습니다');
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    const handleExcelImport = async () => {
        setExcelUploading(true);

        if (importMode === 'update_privacy') {
            let success = 0;
            let skipped = 0;
            
            for (const row of excelData) {
                const values = Object.values(row);
                // 요구사항 반영: a열, b열, c열 (기업명 개인정보처리방침url 개인정보처리방침전문) 지원
                const nameStr = String(row['기업명'] || row['회사명'] || values[0] || '').trim();
                const privacyUrl = String(row['개인정보처리방침url'] || row['개인정보처리방침 URL'] || values[1] || '').trim();
                const privacyText = String(row['개인정보처리방침전문'] || row['개인정보처리방침 전문'] || values[2] || '').trim();
                
                if (!nameStr) continue;

                // 기업명으로 매칭
                const matchedCompany = companies.find(c => c.name === nameStr);
                if (matchedCompany) {
                    const updates: Partial<Company> = {};
                    if (privacyUrl) updates.privacyUrl = privacyUrl;
                    if (privacyText) updates.privacyPolicyText = privacyText;
                    
                    if (Object.keys(updates).length > 0) {
                        try {
                            await updateCompany(matchedCompany.id, updates);
                            success++;
                        } catch (err) {
                            console.error('Update error:', err);
                            skipped++;
                        }
                    } else {
                        skipped++;
                    }
                } else {
                    skipped++;
                }
            }
            
            showToast(success > 0 
                ? `✅ 기업명 매칭 성공: ${success}건의 개인정보 데이터가 삽입되었습니다. (스킵/실패: ${skipped}건)` 
                : `❌ 매칭된 기업이 없거나 업데이트할 데이터가 없습니다. (스킵 ${skipped}건)`
            );
            setExcelUploading(false);
            setShowExcelUpload(false);
            setExcelData([]);
            setExcelPreview([]);
            refresh();
            return;
        }

        const mappedList: Partial<Company>[] = [];

        for (const row of excelData) {
            const name = String(row['기업명'] || row['회사명'] || row['name'] || '').trim();
            const email = String(row['이메일'] || row['email'] || '').trim();
            if (!name) continue;

            const bizType = String(row['업종'] || row['bizType'] || '').trim();
            const franchiseType = String(row['구분'] || row['구분(프랜차이즈/그외)'] || row['franchiseType'] || '').trim();
            if (!franchiseType || (franchiseType !== '프랜차이즈' && franchiseType !== '그외')) {
                showToast(`❌ [${name}] 기업의 구분(프랜차이즈/그외) 값이 누락되었거나 올바르지 않아 업로드가 취소되었습니다.`);
                setExcelUploading(false);
                return;
            }

            const biz = String(row['사업자번호'] || row['biz'] || '').trim();
            let memoContent = String(row['메모'] || row['memo'] || '').trim();
            const privacyUrl = String(row['개인정보방침 URL'] || row['개인정보처리방침 URL'] || row['개인정보처리방침url'] || row['privacyUrl'] || '').trim();
            const privacyPolicyText = String(row['개인정보방침 전문'] || row['개인정보처리방침 전문'] || row['개인정보처리방침전문'] || row['privacyPolicyText'] || '').trim();

            const salesNameInput = String(row['영업자'] || row['담당영업자'] || row['salesName'] || '').trim();
            let assignedSalesId = undefined;
            let assignedSalesName = undefined;

            if (salesNameInput) {
                const foundUser = users.find(u => u.name === salesNameInput);
                if (foundUser) {
                    assignedSalesId = foundUser.id;
                    assignedSalesName = foundUser.name;
                } else {
                    const notice = `[시스템] 엑셀 업로드: 지정된 영업자 '${salesNameInput}' 정보가 시스템에 없어 자동 연결되지 않았습니다.`;
                    memoContent = memoContent ? `${memoContent}\n\n${notice}` : notice;
                }
            }

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
                assignedLawyer: '', 
                assignedSalesId,
                assignedSalesName,
                issues: [],
                salesConfirmed: false, salesConfirmedAt: '', salesConfirmedBy: '',
                lawyerConfirmed: false, lawyerConfirmedAt: '',
                emailSentAt: '', emailSubject: '',
                clientReplied: false, clientRepliedAt: '', clientReplyNote: '',
                loginCount: 0, callNote: '', plan: 'none',
                autoMode: true, aiDraftReady: false, source: 'manual',
                riskScore: 0, riskLevel: '', issueCount: 0,
                bizType,
                franchiseType: franchiseType as '프랜차이즈' | '그외',
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
            if (mappedList.length === 0) {
                showToast('❌ 엑셀에서 읽어들일 수 있는 유효한 기업 데이터(기업명 필수)가 없습니다.');
                setExcelUploading(false);
                return;
            }

            const result = await importBulk(mappedList);
            setImportSuccess(result.success);
            setImportSkipped(result.skipped);
            
            if (result.success === 0 && result.skipped > 0) {
                showToast(`❌ 신규 등록 건이 없습니다. (형식 오류 또는 이미 등록된 사업자번호 ${result.skipped}건 스킵됨)`);
            } else {
                showToast(`📤 신규 ${result.success}건 추가, 중복/에러 ${result.skipped}건 스킵 완료됨`);
            }
        } catch (err) {
            console.error('Import Error:', err);
            showToast('❌ Excel 데이터 등록 중 내부 오류가 발생했습니다');
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
        excelUploading, fileInputRef, importMode, setImportMode,
        handleExcelDownload, handleTemplateDownload, handleExcelFile, handleExcelImport
    };
}

// @ts-nocheck
import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { store, Company, STATUS_LABEL } from '@/lib/mockStore';
import { useUsers } from '@/hooks/useDataLayer';
import { idbGet, idbSet, idbDel } from '@/lib/idb';
import { useEffect } from 'react';

export function useExcelImportExport(
    companies: Company[],
    refresh: () => void,
    showToast: (msg: string) => void,
    importBulk: (data: Partial<Company>[]) => Promise<{ success: number; skipped: number }>,
    updateCompany: (id: string, payload: Partial<Company>) => Promise<void>,
    updateBulk: (data: Partial<Company>[]) => Promise<{ success: number; skipped: number }>
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

    // IndexedDB에서 진행중인 작업 복구 (중간저장소)
    useEffect(() => {
        idbGet('pending_excel_upload').then(saved => {
            if (saved && saved.data && saved.data.length > 0) {
                if (window.confirm(`이전에 저장하지 못한 ${saved.data.length}건의 [${saved.mode === 'update_privacy' ? '방침 업로드' : '대량 업로드'}] 엑셀 데이터가 있습니다. 임시저장소에서 이어서 작업하시겠습니까?`)) {
                    setImportMode(saved.mode);
                    setExcelData(saved.data);
                    setExcelPreview(saved.data.slice(0, 20));
                    setShowExcelUpload(true);
                } else {
                    idbDel('pending_excel_upload');
                }
            }
        }).catch(console.error);
    }, []);

    const handleExcelDownload = () => {
        const data = companies.map(c => ({
            '기업명': c.name,
            '사업자번호': c.biz,
            '업종': c.bizType || '',
            '구분 카테고리': c.franchiseType || '',
            '홈페이지': c.url || c.domain || '',
            '이메일': c.email,
            '전화번호': c.phone,
            '담당자': c.contactName || '',
            '담당자 전화': c.contactPhone || '',
            '가맹점수': c.storeCount,
            '상태': STATUS_LABEL[c.status] || c.status,
            '위험도등급': c.riskLevel || '미분석',
            '발견된 법률이슈(건)': c.issueCount || 0,
            'AI 분석여부': c.status === 'analyzed' || c.status === 'client_replied' ? '완료' : '진행전',
            '개인정보처리방침 URL': c.privacyUrl || '',
            '개인정보처리방침 전문': c.privacyPolicyText || '',
            '배정 변호사': c.assignedLawyer || '',
            '영업자': c.assignedSalesName || '',
            '통화 메모': c.callNote || '',
            '플랜': c.plan || '',
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'CRM 기업목록');
        
        ws['!cols'] = [
            { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, // 이름, 사업자번호, 업종, 구분카테고리
            { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, // 홈페이지, 이메일, 전화번호, 담당자
            { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, // 담당자전화, 가맹점수, 상태, 위험도
            { wch: 18 }, { wch: 12 }, { wch: 40 }, { wch: 40 }, // 이슈건수, AI분석여부, URL, 전문
            { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 10 }, // 배정변호사, 영업자, 통화메모, 플랜
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
                '구분 카테고리': '프랜차이즈',
                '업종': '식음료',
                '홈페이지': 'https://ibs.example.com',
                '전화번호': '02-1234-5678',
                '가맹점수': '10',
                '담당영업자': '홍길동 (시스템 직원 이름과 동일 시 자동 매핑, 다르면 메모 기록)',
                '담당자': '김철수',
                '담당자 전화': '010-1234-5678',
                '담당자 이메일': 'kim@ibs.example.com',
                '개인정보처리방침 URL': 'https://ibs.example.com/privacy',
                '개인정보처리방침 전문': '당사는 고객의 개인정보를 소중하게 생각합니다...',
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
            { wch: 25 }, // 구분 카테고리
            { wch: 20 }, // 업종
            { wch: 30 }, // 홈페이지
            { wch: 15 }, // 전화번호
            { wch: 10 }, // 가맹점수
            { wch: 65 }, // 담당영업자
            { wch: 15 }, // 담당자
            { wch: 20 }, // 담당자 전화
            { wch: 30 }, // 담당자 이메일
            { wch: 40 }, // 개인정보처리방침 URL
            { wch: 40 }, // 개인정보처리방침 전문
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
                // 바로 로컬 저장소에 백업 (중간저장소)
                idbSet('pending_excel_upload', { mode: importMode, data: raw }).catch(console.error);
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
            const sb = (await import('@/lib/supabase')).getBrowserSupabase();
            if (!sb) {
                showToast('❌ DB 연결을 확인할 수 없습니다.');
                setExcelUploading(false);
                return;
            }

            // 전체 DB 기업 목록을 가져와서 매칭 (페이지네이션 된 상태가 아닌 전체 데이터셋)
            // Supabase API의 1000건 제한을 우회하기 위해 반복 조회합니다.
            let allDbCompanies: {id: string, name: string}[] = [];
            let hasMore = true;
            let offset = 0;
            const limit = 1000;
            
            while (hasMore) {
                const { data: dbComps, error } = await sb.from('companies')
                    .select('id, name')
                    .range(offset, offset + limit - 1);
                
                if (error || !dbComps || dbComps.length === 0) {
                    hasMore = false;
                } else {
                    allDbCompanies.push(...dbComps);
                    offset += limit;
                    if (dbComps.length < limit) hasMore = false;
                }
            }

            const updatesToProcess: { id: string, payload: Partial<Company> }[] = [];
            let skipped = 0;
            
            for (const row of excelData) {
                const values = Object.values(row);
                const nameStr = String(row['기업명'] || row['회사명'] || values[0] || '').trim();
                const privacyUrl = String(row['개인정보처리방침url'] || row['개인정보처리방침 URL'] || values[1] || '').trim();
                const privacyText = String(row['개인정보처리방침전문'] || row['개인정보처리방침 전문'] || values[2] || '').trim();
                let memoContent = String(row['메모'] || row['memo'] || '').trim();
                const salesNameInput = String(row['영업자'] || row['담당영업자'] || row['salesName'] || '').trim();
                
                if (!nameStr) {
                    skipped++;
                    continue;
                }

                const normalizedNameStr = nameStr.replace(/\s+/g, '');
                const matchedCompany = allDbCompanies.find((c: any) => c.name && c.name.replace(/\s+/g, '') === normalizedNameStr);
                
                if (matchedCompany) {
                    let hasUpdate = false;
                    const payload: Partial<Company> = {};
                    
                    if (privacyUrl) { payload.privacyUrl = privacyUrl; hasUpdate = true; }
                    if (privacyText) { payload.privacyPolicyText = privacyText; hasUpdate = true; }
                    
                    if (salesNameInput) {
                        const foundUser = users.find(u => u.name === salesNameInput);
                        if (foundUser) {
                            payload.assignedSalesId = foundUser.id;
                            payload.assignedSalesName = foundUser.name;
                            hasUpdate = true;
                        } else {
                            const notice = `[시스템] 일괄 업데이트: 지정된 영업자 '${salesNameInput}' 정보가 시스템에 없어 자동 연결되지 않았습니다.`;
                            memoContent = memoContent ? `${memoContent}\n\n${notice}` : notice;
                        }
                    }

                    if (memoContent) {
                        payload.memos = [{
                            id: crypto.randomUUID(),
                            createdAt: new Date().toISOString(),
                            author: '시스템',
                            content: memoContent
                        }];
                        hasUpdate = true;
                    }

                    if (hasUpdate) {
                        updatesToProcess.push({ id: matchedCompany.id, payload });
                    } else {
                        skipped++;
                    }
                } else {
                    skipped++;
                }
            }
            
            if (updatesToProcess.length === 0) {
                showToast(`❌ 매칭된 기업이 없거나 업데이트할 데이터가 없습니다. (스킵 ${skipped}건)`);
                setExcelUploading(false);
                setShowExcelUpload(false);
                setExcelData([]);
                setExcelPreview([]);
                await idbDel('pending_excel_upload');
                refresh();
                return;
            }

            try {
                // 1. 기업 DB Bulk Update (자동으로 50개씩 청크 분할 및 refresh 1회 실행 보장)
                const bulkPayload = updatesToProcess.map(u => ({ id: u.id, ...u.payload }));
                await updateBulk(bulkPayload);

                // 2. 추가되는 메모만 따로 모아서 Bulk Upsert (단일 HTTP 요청 최소화, Vercel/Supabase 부하 Zero)
                const newMemos: any[] = [];
                updatesToProcess.forEach(u => {
                    if (u.payload.memos && u.payload.memos.length > 0) {
                        u.payload.memos.forEach(m => {
                            newMemos.push({
                                company_id: u.id,
                                id: m.id || crypto.randomUUID(),
                                created_at: m.createdAt || new Date().toISOString(),
                                author: m.author || '시스템',
                                content: m.content
                            });
                        });
                    }
                });

                if (newMemos.length > 0) {
                    // 메모가 너무 많은 경우를 대비해 500개씩 청크로 보냅니다.
                    for (let i = 0; i < newMemos.length; i += 500) {
                        await sb.from('company_memos').upsert(newMemos.slice(i, i + 500));
                    }
                }

                showToast(`✅ 대량 업데이트 성공: ${updatesToProcess.length}건 완료. (스킵/실패: ${skipped}건)`);
            } catch (err) {
                console.error('Bulk update error:', err);
                showToast('❌ 대량 업데이트 중 오류가 발생했습니다.');
            }
            
            setExcelUploading(false);
            setShowExcelUpload(false);
            setExcelData([]);
            setExcelPreview([]);
            await idbDel('pending_excel_upload'); // 완료 시 중간저장소 초기화
            refresh();
            return;
        }

        const mappedList: Partial<Company>[] = [];

        for (const row of excelData) {
            const name = String(row['기업명'] || row['회사명'] || row['name'] || '').trim();
            const email = String(row['이메일'] || row['email'] || '').trim();
            if (!name) continue;

            const bizType = String(row['업종'] || row['bizType'] || '').trim();
            const franchiseType = String(row['구분'] || row['구분 카테고리'] || row['구분(프랜차이즈/그외)'] || row['franchiseType'] || '').trim();
            const allowedCategories = [
                '프랜차이즈', '중소기업', '병의원', '온라인쇼핑몰/이커머스', 
                '부동산 임대업', 'IT/소프트웨어', '스타트업', '건설/시공', 
                '제조업', '컨설팅/전문서비스', '협회/비영리', '기타'
            ];
            
            if (!franchiseType || !allowedCategories.includes(franchiseType)) {
                showToast(`❌ [${name}] 기업의 구분 카테고리 값이 누락되었거나 지정된 카테고리가 아니어 업로드가 취소되었습니다.`);
                setExcelUploading(false);
                return;
            }

            const biz = String(row['사업자번호'] || row['biz'] || '').trim();
            let memoContent = String(row['메모'] || row['memo'] || '').trim();
            const privacyUrl = String(row['개인정보처리방침 URL'] || row['개인정보처리방침url'] || row['개인정보방침 URL'] || row['privacyUrl'] || '').trim();
            const privacyPolicyText = String(row['개인정보처리방침 전문'] || row['개인정보처리방침전문'] || row['개인정보방침 전문'] || row['privacyPolicyText'] || '').trim();

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
                franchiseType,
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
            await idbDel('pending_excel_upload'); // 완료 후 백업 지우기
        } catch (err) {
            console.error('Import Error:', err);
            showToast('❌ 엑셀 등록에 실패했습니다');
            showToast('❌ Excel 데이터 등록 중 내부 오류가 발생했습니다');
        }

        setExcelUploading(false);
        setShowExcelUpload(false);
        setExcelData([]);
        setExcelPreview([]);
        await idbDel('pending_excel_upload'); // 완료 시 중간저장소 초기화
        refresh();
    };

    return {
        showExcelUpload, setShowExcelUpload,
        excelData, setExcelData, excelPreview, setExcelPreview,
        excelUploading, fileInputRef, importMode, setImportMode,
        handleExcelDownload, handleTemplateDownload, handleExcelFile, handleExcelImport
    };
}

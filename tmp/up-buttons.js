const fs = require('fs');

const path = 'src/app/(admin)/lawyer/privacy-review/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. handleFirstConfirm signature and logic update
const oldSig = `const handleFirstConfirm = async () => {`;
const newSig = `const handleFirstConfirm = async (action: 'next' | 'view_full') => {`;
content = content.replace(oldSig, newSig);

const oldLogic = `                // 다음 검토 대기 기업 확인
                const allCompanies = await supabaseCompanyStore.getAll();
                const nextPending = allCompanies.find((c: any) => 
                    ['assigned', 'reviewing'].includes(c.status) && c.id !== leadId
                );

                if (nextPending) {
                    router.push(\`/lawyer/privacy-review?leadId=\${nextPending.id}&company=\${encodeURIComponent(nextPending.name)}\`);
                } else {
                    router.push('/lawyer');
                }
            } else {
                setConfirmedTab('first');
            }`;

const newLogic = `                // 다음 검토 대기 기업 확인
                if (action === 'view_full') {
                    setTab('full');
                    if (!generated) {
                        setGenerating(true);
                        setTimeout(() => { setGenerating(false); setGenerated(true); }, 2000);
                    }
                } else {
                    const allCompanies = await supabaseCompanyStore.getAll();
                    const nextPending = allCompanies.find((c: any) => 
                        ['assigned', 'reviewing'].includes(c.status) && c.id !== leadId
                    );

                    if (nextPending) {
                        router.push(\`/lawyer/privacy-review?leadId=\${nextPending.id}&company=\${encodeURIComponent(nextPending.name)}\`);
                    } else {
                        router.push('/lawyer');
                    }
                }
            } else {
                if (action === 'view_full') {
                    setConfirmedTab(null);
                    setTab('full');
                } else {
                    setConfirmedTab('first');
                }
            }`;
content = content.replace(oldLogic, newLogic);

// 2. Update buttons in UI
const oldButtons = `{tab === 'first' ? (
                        <button onClick={handleFirstConfirm} disabled={confirming}
                            title="조문검토 결과를 영업팀 CRM과 고객 프라이버시 리포트에 자동 반영합니다"
                            style={{ display: 'flex', alignItems: 'center', gap: 7, background: confirming ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 24px', fontWeight: 900, fontSize: 16, cursor: confirming ? 'not-allowed' : 'pointer', boxShadow: '0 2px 12px rgba(22,163,74,0.4)' }}>
                            {confirming && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                            {!confirming && <CheckCircle2 size={16} />}
                            {confirming ? (confirmProgress || '반영 중...') : '1차 검토 컨펌'}
                        </button>
                    ) : (`;

const newButtons = `{tab === 'first' ? (
                        <>
                            <button onClick={() => handleFirstConfirm('view_full')} disabled={confirming}
                                title="CRM 반영 후 고객 의견서(전체수정완본) 탭으로 이동합니다"
                                style={{ display: 'flex', alignItems: 'center', gap: 7, background: confirming ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 18px', fontWeight: 900, fontSize: 15, cursor: confirming ? 'not-allowed' : 'pointer', boxShadow: '0 2px 12px rgba(22,163,74,0.4)' }}>
                                {confirming && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                                {!confirming && <CheckCircle2 size={16} />}
                                {confirming ? (confirmProgress || '반영 중...') : '1차 조문 컨펌 및 고객 의견서 보기'}
                            </button>
                            <button onClick={() => handleFirstConfirm('next')} disabled={confirming}
                                title="CRM 반영 후 다음 대기중인 회사로 이동합니다"
                                style={{ display: 'flex', alignItems: 'center', gap: 7, background: confirming ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 18px', fontWeight: 900, fontSize: 15, cursor: confirming ? 'not-allowed' : 'pointer', boxShadow: '0 2px 12px rgba(37,99,235,0.4)' }}>
                                {confirming ? '반영 중...' : '1차 조문 컨펌 및 다음 회사보기'}
                            </button>
                            <button onClick={handleFullTab} disabled={confirming}
                                title="CRM 반영 없이 의견서 보기 탭으로 단순 전환합니다"
                                style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 9, padding: '9px 18px', fontWeight: 900, fontSize: 15, cursor: confirming ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <FileText size={16} />
                                고객 의견서만 보기
                            </button>
                        </>
                    ) : (`;

content = content.replace(oldButtons, newButtons);

fs.writeFileSync(path, content, 'utf8');
console.log('Buttons updated!');

import { LawCase } from '@/types/cases';

export function getCases(co: string): LawCase[] {
    return [
        // ── Page 1 ──
        { id:'C001', caseNumber:'2026가합12345', title:'가맹계약 해지 손해배상 청구', type:'민사 · 손해배상', status:'active',
          court:'서울중앙지방법원 제12민사부', judge:'김영수 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'김○○ (전 가맹점주)', filedDate:'2026-01-15', nextDate:'2026-04-08', nextEvent:'제3차 변론기일',
          amount:'1억 2,000만원', description:'가맹계약 일방 해지 후 경업금지 위반 및 영업비밀 유출에 따른 손해배상 청구', progress:45,
          updates:[{date:'2026-03-10',content:'피고 측 답변서 제출 완료.'},{date:'2026-02-20',content:'제2차 변론기일 진행.'},{date:'2026-01-15',content:'소장 접수 및 사건번호 배정.'}] },

        { id:'C002', caseNumber:'2025나67890', title:'개인정보 유출 과징금 취소 소송', type:'행정 · 과징금', status:'active',
          court:'서울행정법원 제5부', judge:'박진영 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'개인정보보호위원회', filedDate:'2025-11-20', nextDate:'2026-03-25', nextEvent:'증인신문',
          amount:'3,000만원', description:'가맹점 고객 개인정보 유출 사건 관련 과징금 부과처분 취소 청구', progress:60,
          updates:[{date:'2026-03-05',content:'증인 2명 채택. 3/25 증인신문 예정.'},{date:'2026-02-10',content:'보안 감사 보고서 추가 증거 제출.'}] },

        { id:'C003', caseNumber:'2026가단34567', title:'가맹점 인테리어 하자 보수 청구', type:'민사 · 하자보수', status:'pending',
          court:'수원지방법원', judge:'미배정', lawyer:'박준호 변호사',
          plaintiff:'이○○ (가맹점주)', defendant:co, filedDate:'2026-03-01', nextDate:'2026-04-15', nextEvent:'제1차 변론기일',
          amount:'4,500만원', description:'가맹점 인테리어 시공 하자에 대한 보수비용 및 영업손실 청구', progress:10,
          updates:[{date:'2026-03-12',content:'답변서 작성 중.'},{date:'2026-03-01',content:'소장 수령.'}] },

        { id:'C004', caseNumber:'2025가합78901', title:'프랜차이즈 광고비 분담금 분쟁', type:'민사 · 부당이득', status:'won',
          court:'서울중앙지방법원', judge:'이현정 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'○○마케팅 외 3인', filedDate:'2025-06-10', nextDate:null, nextEvent:null,
          amount:'8,700만원', description:'지역 광고 대행사의 광고비 횡령 및 부당이득 반환 청구', progress:100,
          updates:[{date:'2026-02-28',content:'판결 확정. 원고 전부 승소.'},{date:'2026-01-20',content:'선고기일. 원고 승소 판결.'}] },

        { id:'C005', caseNumber:'2025노12345', title:'직원 부당해고 구제 신청', type:'노동 · 부당해고', status:'settled',
          court:'중앙노동위원회', judge:'조정위원회', lawyer:'박준호 변호사',
          plaintiff:'박○○ (전 직원)', defendant:co, filedDate:'2025-09-15', nextDate:null, nextEvent:null,
          amount:'2,400만원', description:'영업부 직원 해고 관련 부당해고 구제 신청', progress:100,
          updates:[{date:'2026-01-10',content:'조정 합의 성립. 합의금 2,400만원 지급 완료.'}] },

        { id:'C006', caseNumber:'2026가합23456', title:'상표권 침해 금지 가처분', type:'지식재산 · 상표권', status:'active',
          court:'서울중앙지방법원 제50민사부', judge:'최영희 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'○○푸드 외 2인', filedDate:'2026-02-10', nextDate:'2026-04-02', nextEvent:'심문기일',
          amount:'5억원', description:'유사 상호 및 간판 사용 업체의 상표권 침해 중지 청구', progress:35,
          updates:[{date:'2026-03-15',content:'상대방 의견서 제출.'},{date:'2026-02-10',content:'가처분 신청 접수.'}] },

        { id:'C007', caseNumber:'2025가합56789', title:'공정거래법 위반 시정명령 취소', type:'행정 · 공정거래', status:'active',
          court:'서울고등법원 제7행정부', judge:'안성호 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'공정거래위원회', filedDate:'2025-10-05', nextDate:'2026-03-28', nextEvent:'제5차 변론기일',
          amount:'1억 5,000만원', description:'가맹사업법 위반 관련 공정위 시정명령 취소 소송', progress:70,
          updates:[{date:'2026-03-10',content:'경제 분석 감정결과 법원 제출.'},{date:'2025-12-01',content:'감정인 선임.'}] },

        { id:'C008', caseNumber:'2026가단45678', title:'임대차 보증금 반환 청구', type:'민사 · 임대차', status:'pending',
          court:'서울남부지방법원', judge:'미배정', lawyer:'박준호 변호사',
          plaintiff:co, defendant:'○○부동산개발', filedDate:'2026-03-05', nextDate:'2026-04-22', nextEvent:'제1차 변론기일',
          amount:'2억 3,000만원', description:'폐업 가맹점 매장 임대차 보증금 반환 분쟁', progress:5,
          updates:[{date:'2026-03-14',content:'임대인 측 연락 시도.'},{date:'2026-03-05',content:'소장 접수.'}] },

        // ── Page 2 ──
        { id:'C009', caseNumber:'2025가합11111', title:'원자재 공급계약 채무불이행', type:'민사 · 채무불이행', status:'active',
          court:'서울중앙지방법원 제15민사부', judge:'한미영 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'○○식자재유통', filedDate:'2025-08-20', nextDate:'2026-04-10', nextEvent:'제6차 변론기일',
          amount:'2억 1,000만원', description:'원자재 공급 지연 및 품질 하자에 따른 손해배상 청구', progress:75,
          updates:[{date:'2026-03-12',content:'감정결과 원고 유리.'},{date:'2026-01-15',content:'감정인 지정.'}] },

        { id:'C010', caseNumber:'2026가합22222', title:'가맹점주 영업지역 침해 소송', type:'민사 · 영업권', status:'active',
          court:'인천지방법원 제3민사부', judge:'정수빈 판사', lawyer:'박준호 변호사',
          plaintiff:'최○○ (가맹점주)', defendant:co, filedDate:'2026-02-01', nextDate:'2026-04-05', nextEvent:'제2차 변론기일',
          amount:'9,500만원', description:'동일 영업지역 내 신규 가맹점 출점에 따른 영업권 침해 주장', progress:25,
          updates:[{date:'2026-03-08',content:'영업지역 설정 근거 자료 제출.'},{date:'2026-02-01',content:'소장 접수.'}] },

        { id:'C011', caseNumber:'2025가합33333', title:'식품위생법 위반 영업정지 취소', type:'행정 · 영업정지', status:'won',
          court:'서울행정법원 제3부', judge:'윤정아 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'서울특별시 강남구청', filedDate:'2025-05-10', nextDate:null, nextEvent:null,
          amount:'—', description:'가맹점 위생점검 결과 영업정지 15일 처분 취소 소송', progress:100,
          updates:[{date:'2025-12-15',content:'원고 승소 판결 확정. 영업정지 취소.'},{date:'2025-09-20',content:'선고기일.'}] },

        { id:'C012', caseNumber:'2026가단44444', title:'배달앱 수수료 부당인상 이의', type:'민사 · 부당이득', status:'pending',
          court:'서울중앙지방법원', judge:'미배정', lawyer:'박준호 변호사',
          plaintiff:co, defendant:'○○딜리버리 주식회사', filedDate:'2026-03-10', nextDate:'2026-05-01', nextEvent:'제1차 변론기일',
          amount:'3억 2,000만원', description:'배달 플랫폼 수수료 일방 인상에 따른 부당이득 반환 청구', progress:3,
          updates:[{date:'2026-03-10',content:'소장 접수 완료.'}] },

        { id:'C013', caseNumber:'2025가합55555', title:'가맹점 로열티 미납 청구', type:'민사 · 대여금', status:'won',
          court:'대전지방법원 제2민사부', judge:'서동욱 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'정○○ 외 5인', filedDate:'2025-04-01', nextDate:null, nextEvent:null,
          amount:'1억 8,500만원', description:'가맹점주 5인 로열티 및 광고분담금 미납분 청구 소송', progress:100,
          updates:[{date:'2026-01-30',content:'전부 승소. 강제집행 개시.'},{date:'2025-11-10',content:'선고기일.'}] },

        { id:'C014', caseNumber:'2025가합66666', title:'퇴직금 지급 청구', type:'노동 · 퇴직금', status:'settled',
          court:'서울남부지방법원', judge:'조정위원회', lawyer:'박준호 변호사',
          plaintiff:'한○○ 외 3인 (전 직원)', defendant:co, filedDate:'2025-07-20', nextDate:null, nextEvent:null,
          amount:'4,200만원', description:'본사 구조조정에 따른 퇴직 직원 퇴직금 및 미지급 수당 청구', progress:100,
          updates:[{date:'2025-12-05',content:'합의 완료. 합의금 4,200만원 분납 합의.'}] },

        { id:'C015', caseNumber:'2026가합77777', title:'정보공개서 허위기재 과태료 이의', type:'행정 · 과태료', status:'active',
          court:'서울행정법원 제8부', judge:'배지훈 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'공정거래위원회', filedDate:'2026-01-20', nextDate:'2026-04-18', nextEvent:'제3차 변론기일',
          amount:'5,000만원', description:'정보공개서 매출액 기재 오류 관련 과태료 부과처분 취소', progress:40,
          updates:[{date:'2026-03-05',content:'회계 감정 결과 제출.'},{date:'2026-01-20',content:'소장 접수.'}] },

        { id:'C016', caseNumber:'2025가합88888', title:'가맹점 식중독 사고 구상금', type:'민사 · 구상금', status:'settled',
          court:'부산지방법원 제5민사부', judge:'강민수 판사', lawyer:'박준호 변호사',
          plaintiff:co, defendant:'○○식품 (납품업체)', filedDate:'2025-03-15', nextDate:null, nextEvent:null,
          amount:'6,300만원', description:'가맹점 식중독 사고 피해 보상금 기지급분 납품업체 구상 청구', progress:100,
          updates:[{date:'2025-10-20',content:'조정 합의. 구상금 5,800만원 수령.'},{date:'2025-07-10',content:'조정기일.'}] },

        // ── Page 3 ──
        { id:'C017', caseNumber:'2026가합99999', title:'특허 침해 손해배상 청구', type:'지식재산 · 특허', status:'active',
          court:'특허법원', judge:'오영진 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'○○테크 주식회사', filedDate:'2026-02-20', nextDate:'2026-05-10', nextEvent:'기술설명회',
          amount:'15억원', description:'자동화 조리 시스템 특허 침해에 대한 손해배상 청구', progress:15,
          updates:[{date:'2026-03-10',content:'기술설명회 일정 확정.'},{date:'2026-02-20',content:'소장 접수.'}] },

        { id:'C018', caseNumber:'2025가합10101', title:'물류센터 화재 보험금 청구', type:'민사 · 보험금', status:'active',
          court:'서울중앙지방법원 제20민사부', judge:'임지현 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'○○화재해상보험', filedDate:'2025-09-01', nextDate:'2026-04-12', nextEvent:'감정결과 변론',
          amount:'12억원', description:'중앙 물류센터 화재 사고 관련 보험금 지급 거절에 대한 소송', progress:55,
          updates:[{date:'2026-03-01',content:'화재 원인 감정결과 접수.'},{date:'2025-12-10',content:'감정인 선임.'}] },

        { id:'C019', caseNumber:'2026가단20202', title:'근로계약 위반 손해배상', type:'노동 · 근로계약', status:'pending',
          court:'서울동부지방법원', judge:'미배정', lawyer:'박준호 변호사',
          plaintiff:'윤○○ (전 점장)', defendant:co, filedDate:'2026-03-12', nextDate:'2026-05-08', nextEvent:'제1차 변론기일',
          amount:'7,800만원', description:'가맹점 점장 근로계약 위반 및 부당전보에 따른 손해배상 청구', progress:3,
          updates:[{date:'2026-03-12',content:'소장 수령. 사건 검토 중.'}] },

        { id:'C020', caseNumber:'2025가합30303', title:'세무조사 부과처분 취소', type:'행정 · 세무', status:'won',
          court:'서울행정법원 제10부', judge:'김태희 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'국세청 서울지방국세청', filedDate:'2025-03-01', nextDate:null, nextEvent:null,
          amount:'7억 2,000만원', description:'법인세 추징 부과처분 취소 소송. 이전가격 산정 방법 다툼', progress:100,
          updates:[{date:'2025-11-30',content:'전부 승소. 추징세액 환급 완료.'},{date:'2025-09-15',content:'선고기일.'}] },

        { id:'C021', caseNumber:'2026가합40404', title:'영업비밀 유출 가처분', type:'민사 · 영업비밀', status:'active',
          court:'서울중앙지방법원 제45민사부', judge:'나현수 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'전○○ (전 임원) 외 2인', filedDate:'2026-03-01', nextDate:'2026-04-03', nextEvent:'심문기일',
          amount:'10억원', description:'퇴사 임원의 경쟁사 이직 및 영업비밀(레시피DB) 유출 금지 가처분', progress:20,
          updates:[{date:'2026-03-10',content:'가처분 심문기일 지정.'},{date:'2026-03-01',content:'가처분 신청.'}] },

        { id:'C022', caseNumber:'2025가합50505', title:'하도급법 위반 과징금 취소', type:'행정 · 하도급', status:'settled',
          court:'서울고등법원 제3행정부', judge:'홍성준 판사', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'공정거래위원회', filedDate:'2025-06-01', nextDate:null, nextEvent:null,
          amount:'2억원', description:'인테리어 하도급 대금 미지급 관련 과징금 부과 처분 취소 소송', progress:100,
          updates:[{date:'2026-02-10',content:'조정 합의. 과징금 50% 감경.'},{date:'2025-11-20',content:'조정기일.'}] },

        { id:'C023', caseNumber:'2025가합60606', title:'임직원 횡령 형사고소', type:'형사 · 횡령', status:'active',
          court:'서울중앙지방검찰청', judge:'담당: 3차장검사실', lawyer:'박준호 변호사',
          plaintiff:co, defendant:'장○○ (전 재무팀장)', filedDate:'2025-12-01', nextDate:'2026-04-20', nextEvent:'피의자 소환조사',
          amount:'3억 5,000만원', description:'재무팀장의 법인카드 사적 사용 및 허위 거래처 횡령 고소', progress:30,
          updates:[{date:'2026-03-05',content:'회계 포렌식 보고서 검찰 제출.'},{date:'2025-12-01',content:'고소장 접수.'}] },

        { id:'C024', caseNumber:'2026가합70707', title:'가맹사업 정보공개서 등록 거부 취소', type:'행정 · 등록거부', status:'pending',
          court:'서울행정법원', judge:'미배정', lawyer:'김수현 변호사',
          plaintiff:co, defendant:'공정거래위원회', filedDate:'2026-03-15', nextDate:'2026-05-15', nextEvent:'제1차 변론기일',
          amount:'—', description:'신규 브랜드 정보공개서 등록 거부처분 취소 소송', progress:2,
          updates:[{date:'2026-03-15',content:'소장 접수.'}] },
    ];
}

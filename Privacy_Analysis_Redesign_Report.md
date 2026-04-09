# [IBS Law CRM] UI/UX Redesign Report: Privacy Analysis Dashboard

> 본 문서는 `/privacy-analysis` (개인정보처리방침 진단 결과) 페이지의 신규 디자인 명세서 및 프로덕션 레벨의 UI 컴포넌트 코드를 포함하고 있습니다. **해당 내용을 인쇄(Print to PDF) 기능을 통해 PDF로 즉시 내보내어 보고용으로 사용할 수 있습니다.**

---

## 1. Design Concept & Strategy (Global 1% Aesthetic)

본 페이지는 단순한 진단 결과 창을 넘어, 기업 고객이 **리스크의 심각성을 직관적으로 인지**하고 **자연스럽게 유료 솔루션 및 상담으로 전환(Sales Closing)**되도록 설계된 하이엔드 리포트(Premium Landing) 화면입니다.

### 🎨 핵심 UI/UX 적용 사항
1. **5:5 ~ 4:6 Split Layout (Data Syncing Model)**
   - **좌측 고정 패널**: 스크롤이 내려감에 따라 우측 문단에 해당하는 "고객사 원문"과 "위반 법조문"이 자동으로 동기화되어 매칭됩니다.
   - 불필요한 장식을 버리고 딱 두 가지(원문 / 법조문)에만 시선을 집중시킵니다.
2. **Sales Hooking Area (다크 / 글래스모피즘 톤)**
   - 우측 상단의 [IBS 종합 의견] 박스는 권위와 무게감을 주는 어두운 Slate-900 톤에 부드러운 Gradient 블러 속성을 주어 시각적 압도감을 선사합니다.
3. **Typography & Color Palette**
   - 촌스러운 빨간색 대신 신뢰감을 저해하지 않으면서도 긴장감을 주는 `Crimson` 및 `Rose` 계열을 경고 컬러로 사용했습니다.
   - 솔루션 제시 부분은 `Emerald/Green` 톤으로 매칭하여 심리적 안도감을 주고, 법무법인의 가이드를 따르도록 유도합니다.
4. **Micro-interactions (Tailwind 기반)**
   - 마우스 오버 시 카드 경계선의 미세한 컬러 변화(`group-hover`), 부드러운 그림자(Shadow) 전환으로 럭셔리 SaaS(Stripe, Linear)의 촉각적인 UX를 구현했습니다.

---

## 2. Production React Component Code

개발 환경(dev)에 직접 적용하지 않고, 필요한 시점에 프론트엔드 팀이 바로 `복사/붙여넣기` 하여 사용할 수 있도록 완벽하게 타이핑된 `React(Next.js)` + `Tailwind CSS` 단일 컴포넌트를 제공합니다.

*Icon 사용을 위해 `lucide-react` 패키지가 필요합니다.*

```tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, AlertTriangle, Scale, CheckCircle2, FileText, ChevronRight, TrendingDown } from 'lucide-react';

// ==========================================
// 1. Mock Data (더미 데이터)
// ==========================================
const dummyData = {
  overallOpinion: {
    score: 42,
    riskLevel: "고위험 (High Risk)",
    summary: "현재 귀사의 개인정보처리방침은 개정된 개인정보보호법(2023. 9. 15. 시행)의 주요 요건을 충족하지 못하고 있습니다. 특히 수집 항목의 포괄적 동의와 파기 절차의 누락으로 인해, 감독기관의 실태점검 시 즉각적인 시정 조치 및 막대한 과징금 부과 대상이 될 수 있습니다. 신속한 전면 개정이 권고됩니다."
  },
  clauses: [
    {
      id: 1,
      title: "조항 1. 개인정보 수집 항목의 과도한 대상 지정",
      severity: "치명적",
      issueSummary: "회원가입 시 필수 항목과 선택 항목을 명확히 구분하지 않고, 서비스 제공에 직접적으로 필요하지 않은 '직장명', '연봉' 등의 민감한 정보를 필수 동의 항목으로 포함하여 수집하고 있습니다.",
      legalRisk: "최소수집원칙 위반으로 인한 시정명령 및 형사고발. 정보주체의 동의 없이 위법하게 수집된 개인정보로 간주될 소지가 다분합니다.",
      expectedSanction: "전체 매출액의 최대 3% 이하 과징금 부과 (개정법 기준)",
      recommendedFix: "수집 항목을 '필수'와 '선택'으로 명확히 분리하고, 직장명 및 연봉 정보는 목적 달성에 필요한 최소한의 정보가 아님을 고려해 수집을 중단하거나 선택 항목으로 전환하세요.",
      originalText: "\"회원가입 시 본인확인 및 맞춤형 서비스 제공을 위해 이름, 전화번호, 이메일, 직장명, 연봉, 가족관계 정보를 수집합니다.\"",
      violatedLaw: "[개인정보 보호법 제16조 (개인정보의 수집 제한)]\n① 개인정보처리자는 개인정보의 처리 목적을 명확하게 하여야 하고 그 목적에 필요한 최소한의 개인정보만을 정당하게 수집하여야 한다.\n③ 개인정보처리자는 정보주체가 필요한 최소한의 정보 외의 개인정보 수집에 동의하지 아니한다는 이유로 정보주체에게 재화 또는 서비스의 제공을 거부하여서는 아니 된다."
    },
    {
      id: 2,
      title: "조항 2. 파기 기한 및 절차 명시 누락",
      severity: "고위험",
      issueSummary: "개인정보 보유기간이 경과하거나 처리 목적이 달성된 후에도 파기 기한(5일 이내)과 재생 불가능한 파기 방법에 대해 명시되어 있지 않아, 내부적으로 데이터가 무단 보관될 위험이 있습니다.",
      legalRisk: "보유기간 경과 후 미파기로 인한 민원 발생 및 과태료 부과 리스크 증가.",
      expectedSanction: "3천만 원 이하의 과태료 부과",
      recommendedFix: "보유기간 경과 시 지체 없이(5일 이내) 파기함을 명시하고, 전자적 파일은 복구 불가능한 기술적 방법으로, 종이는 파쇄 또는 소각한다는 구체적 절차를 추가하세요.",
      originalText: "\"수집된 개인정보는 목적이 달성된 후 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 폐기됩니다.\"",
      violatedLaw: "[개인정보 보호법 제21조 (개인정보의 파기)]\n① 개인정보처리자는 보유기간의 경과, 개인정보의 처리 목적 달성 등 그 개인정보가 불필요하게 되었을 때에는 지체 없이 그 개인정보 파기하여야 한다."
    }
  ]
};

// ==========================================
// 2. Main Component
// ==========================================
export default function PrivacyAnalysisReport() {
  // 스크롤 스파이를 위한 State & Ref
  const [activeId, setActiveId] = useState(dummyData.clauses[0].id);
  const clauseRefs = useRef<(HTMLElement | null)[]>([]);

  // 우측 스크롤 시 좌측 데이터 동기화 (Intersection Scroll Spy)
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 300; // Offset 조정
      const currentClause = clauseRefs.current.find((ref) => {
        if (!ref) return false;
        const { offsetTop, offsetHeight } = ref;
        return scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight;
      });

      if (currentClause) {
        setActiveId(Number(currentClause.id.replace('clause-', '')));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeData = dummyData.clauses.find(c => c.id === activeId) || dummyData.clauses[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex justify-center">
      <div className="max-w-[1600px] w-full flex flex-col lg:flex-row">
        
        {/* ============================== */}
        {/* LEFT PANEL: Data & Evidence    */}
        {/* ============================== */}
        <aside className="w-full lg:w-[40%] p-8 lg:p-12 lg:sticky top-0 h-auto lg:h-screen overflow-y-auto border-r border-slate-200 bg-white shadow-[2px_0_12px_rgba(0,0,0,0.03)] transition-all duration-500">
          <div className="mb-10">
            <h2 className="text-xs font-bold tracking-widest text-[#94A3B8] uppercase py-1">Evidence Data</h2>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-800">분석 근거 데이터</h1>
            <p className="mt-2 text-[14px] text-slate-500 leading-relaxed">
              우측 리포트 화면을 스크롤하시면 해당 조항의 근거 원문 및 위반 법령이 자동으로 매칭됩니다.
            </p>
          </div>

          <div className="space-y-10">
            {/* 1) Original Text */}
            <div className="group flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-600" />
                <h3 className="text-[17px] font-bold text-slate-800">고객사 방침 원문</h3>
              </div>
              <div className="relative p-7 bg-[#F4F4F5] rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-colors">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[70%] bg-slate-400 rounded-r-md"></div>
                <p className="text-[15px] leading-8 text-slate-700 font-medium whitespace-pre-wrap pl-2 font-mono tracking-tight">
                  {activeData.originalText}
                </p>
              </div>
            </div>

            {/* 2) Violated Law */}
            <div className="group flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#9F1239]" />
                <h3 className="text-[17px] font-bold text-[#9F1239]">위반 법조문</h3>
              </div>
              <div className="p-7 bg-gradient-to-br from-[#FFF1F2] to-[#FFE4E6] rounded-2xl border border-[#FECDD3] hover:border-[#FDA4AF] hover:shadow-sm transition-all group-hover:-translate-y-0.5">
                <p className="text-[14px] leading-8 text-[#881337] font-semibold whitespace-pre-wrap">
                  {activeData.violatedLaw}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ============================== */}
        {/* RIGHT PANEL: Report & Action   */}
        {/* ============================== */}
        <main className="w-full lg:w-[60%] pb-24 xl:pb-32 bg-[#FAFAFA]">
          {/* Top Hooking Area: IBS Comprehensive Opinion */}
          <div className="bg-slate-900 px-8 py-14 lg:px-16 lg:py-20 relative overflow-hidden">
            {/* Decorative Dark Glassmorphism Effect */}
            <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-600/30 via-indigo-600/20 to-transparent blur-[100px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
            
            <div className="relative z-10">
              <h2 className="text-[#34D399] font-bold tracking-widest text-xs uppercase mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                IBS 법률팀 종합 진단
              </h2>
              
              <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 border-b border-white/10 pb-10 mb-10">
                <div>
                  <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                    진단 스코어 <span className="text-[#F43F5E]">{dummyData.overallOpinion.score}점</span>
                  </h1>
                  <p className="text-lg text-slate-400 mt-4 font-medium flex items-center gap-2">
                    현재 리스크 수준: 
                    <span className="text-[#FB7185] font-bold px-3 py-1 bg-rose-500/10 rounded-full border border-rose-500/20">
                      {dummyData.overallOpinion.riskLevel}
                    </span>
                  </p>
                </div>
                
                {/* Call to Action Button */}
                <button className="whitespace-nowrap px-8 py-4 bg-white text-slate-900 rounded-xl font-bold shadow-xl shadow-white/5 hover:scale-[1.02] active:scale-[0.98] transition-transform w-fit flex items-center gap-2 text-sm">
                  도입 단가 확인 및 상담 신청 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-[16px] lg:text-[17px] text-slate-300 leading-relaxed font-light max-w-3xl">
                {dummyData.overallOpinion.summary}
              </p>
            </div>
          </div>

          {/* Clause Details List */}
          <div className="p-8 lg:p-16 space-y-20">
            {dummyData.clauses.map((clause, index) => (
              <section 
                key={clause.id} 
                id={`clause-${clause.id}`}
                ref={el => clauseRefs.current[index] = el}
                className="scroll-mt-20 group"
              >
                {/* Header (Title + Badge) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 group-hover:text-[#1E40AF] transition-colors leading-tight">
                    {clause.title}
                  </h2>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border w-fit shrink-0 ${
                    clause.severity === '치명적' 
                      ? 'bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]' 
                      : 'bg-[#FFF7ED] text-[#C2410C] border-[#FFEDD5]'
                  }`}>
                    {clause.severity}
                  </span>
                </div>

                {/* Issue Summary */}
                <p className="text-[16px] text-slate-600 leading-8 mb-10 pb-8 border-b border-slate-200 border-dashed">
                  {clause.issueSummary}
                </p>

                {/* [KEY] Grid: Legal Risk vs Expected Sanction */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                  {/* Card 1: Legal Risk */}
                  <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm transition-all hover:shadow-md hover:border-slate-300 group/card relative md:min-h-[170px]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FB923C] to-[#E11D48] opacity-0 group-hover/card:opacity-100 transition-opacity rounded-t-2xl"></div>
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-[#E11D48]" />
                      <h4 className="font-bold text-slate-800 text-[15px]">법률 리스크 시나리오</h4>
                    </div>
                    <p className="text-[14px] text-slate-600 leading-relaxed">
                      {clause.legalRisk}
                    </p>
                  </div>

                  {/* Card 2: Expected Sanction */}
                  <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm transition-all hover:shadow-md hover:border-slate-300 group/card relative md:min-h-[170px]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F43F5E] to-[#9F1239] opacity-0 group-hover/card:opacity-100 transition-opacity rounded-t-2xl"></div>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown className="w-5 h-5 text-[#9F1239]" />
                      <h4 className="font-bold text-slate-800 text-[15px]">예상 제재 리스크</h4>
                    </div>
                    <div className="bg-[#FFF1F2] border border-[#FFE4E6] p-4 rounded-xl mt-2">
                      <p className="text-[15px] font-extrabold text-[#BE123C] leading-snug">
                        {clause.expectedSanction}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recommended Fix (Solution) */}
                <div className="bg-[#ECFDF5] p-8 lg:p-10 rounded-2xl border border-[#A7F3D0] relative overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                  {/* Watermark Icon */}
                  <div className="absolute -right-8 -top-8 text-[#D1FAE5] opacity-50 transform rotate-12 transition-transform group-hover:rotate-0 duration-500">
                    <CheckCircle2 className="w-48 h-48" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-6 h-6 text-[#059669]" />
                      <h4 className="text-[18px] font-extrabold text-[#064E3B]">IBS 솔루션 제안 (수정 권고)</h4>
                    </div>
                    <p className="text-[15px] font-medium text-[#065F46] leading-8 max-w-2xl">
                      {clause.recommendedFix}
                    </p>
                  </div>
                </div>
                
                {/* End of Section Divider (if not last) */}
                {index !== dummyData.clauses.length - 1 && (
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-20"></div>
                )}
              </section>
            ))}
          </div>
        </main>

      </div>
    </div>
  );
}
```

## 3. How to create PDF
좌측 파일 탐색기에서 이 파일을 여신 후, 마크다운 뷰어 환경이나 IDE에서 프린트(PDF 출력) 기능을 이용하시어 즉시 추출할 수 있습니다. 프론트엔드 작업 시엔 Component 부분만 떼어내 사용하시면 됩니다.

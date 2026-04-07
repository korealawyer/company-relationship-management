export const metadata = {
  title: '개인정보처리방침',
  description: 'IBS 법률사무소 개인정보 처리방침입니다.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-[var(--foreground)]">
      <div className="space-y-4 mb-12 border-b border-white/10 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          IBS 법률사무소 개인정보 처리방침
        </h1>
        <p className="text-white/60">시행일: 2026년 3월 1일</p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold mb-4 text-white text-gold-gradient inline-block">서문</h2>
          <p className="text-white/80 leading-relaxed text-lg">
            IBS 법률사무소(대표변호사 유정훈, 이하 ‘IBS’라 합니다)는 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령을 준수하며 적법하게 개인정보를 처리하고 안전하게 관리합니다. 이에 「개인정보 보호법」 제30조에 따라 개인정보 처리방침을 다음과 같이 수립·공개합니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-[#c9a84c]/20 pb-2 inline-block">제1조 (개인정보 처리 목적)</h2>
          <p className="text-white/80 leading-relaxed mb-6 text-lg">IBS는 다음 목적을 위하여 개인정보를 처리합니다.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <h3 className="font-bold text-white mb-4 text-lg">① 법률 리포트 서비스 제공</h3>
              <ul className="list-disc pl-5 space-y-2 text-white/80 leading-relaxed marker:text-[#c9a84c]">
                <li>기업 회원 등록 및 계정 생성</li>
                <li>이메일을 통한 임시 비밀번호 발송 및 홈페이지 접속 인증</li>
                <li>법률 리포트 열람 서비스 제공</li>
              </ul>
            </div>
            
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <h3 className="font-bold text-white mb-4 text-lg">② 기업 법률 자문 및 분쟁 대응 서비스</h3>
              <ul className="list-disc pl-5 space-y-2 text-white/80 leading-relaxed marker:text-[#c9a84c]">
                <li>비즈니스 모델 대응 전략 법률자문</li>
                <li>경영 의사결정 관련 법률 및 협상 심리 자문</li>
                <li>가맹점주와의 사전 분쟁 검토</li>
                <li>소송 및 분쟁 대응 서비스 제공</li>
              </ul>
            </div>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <h3 className="font-bold text-white mb-4 text-lg">③ 법률 정보 및 리포트 제공</h3>
              <ul className="list-disc pl-5 space-y-2 text-white/80 leading-relaxed marker:text-[#c9a84c]">
                <li>법률 리포트 발송</li>
                <li>법률 개정 사항 안내</li>
                <li>업종별 법률 뉴스 제공</li>
              </ul>
            </div>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <h3 className="font-bold text-white mb-4 text-lg">④ 마케팅 및 서비스 안내(선택)</h3>
              <ul className="list-disc pl-5 space-y-2 text-white/80 leading-relaxed marker:text-[#c9a84c]">
                <li>법률 리포트 및 콘텐츠 안내</li>
                <li>법률 서비스 안내 및 이벤트 정보 제공</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white border-b-2 border-[#c9a84c]/20 pb-2 inline-block">제2조 (처리하는 개인정보 항목)</h2>
          <p className="text-white/80 leading-relaxed mb-4 text-lg">IBS는 다음 개인정보를 수집·이용합니다.</p>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {['사업자등록번호', '상호(법인명)', '대표자명', '연락처', '이메일', '업종', '로그인 정보(이메일, 비밀번호)', '접속기록, IP주소, 쿠키'].map(item => (
              <span key={item} className="bg-[#132258]/80 text-[#f0f4ff] border border-[#a8872c]/30 px-3 py-1.5 rounded-full text-sm font-medium">
                {item}
              </span>
            ))}
          </div>

          <div className="bg-[#a8872c]/10 border-l-4 border-[#c9a84c] p-4 rounded-r-lg">
            <p className="text-white/90 font-medium">
              ※ 법률 자문 요청 시 상담 내용 및 분쟁 관련 정보가 추가로 수집될 수 있습니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white border-b-2 border-[#c9a84c]/20 pb-2 inline-block">제3조 (개인정보의 처리 및 보유 기간)</h2>
          <p className="text-white/80 leading-relaxed mb-4 text-lg">IBS는 다음 기간 동안 개인정보를 보유 및 이용합니다.</p>
          <ul className="space-y-4 text-white/80 leading-relaxed text-lg list-none pl-0">
            <li className="flex items-start">
              <span className="text-[#c9a84c] mr-3 mt-1">✓</span>
              <div>
                <strong className="text-white font-semibold block">법률 리포트 서비스 정보</strong>
                <span className="text-white/60">서비스 이용 종료 요청 시까지</span>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-[#c9a84c] mr-3 mt-1">✓</span>
              <div>
                <strong className="text-white font-semibold block">법률 상담 및 자문 기록</strong>
                <span className="text-white/60">상담 종료 후 3년</span>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-[#c9a84c] mr-3 mt-1">✓</span>
              <div>
                <strong className="text-white font-semibold block">마케팅 수신 동의 정보</strong>
                <span className="text-white/60">수신 거부 시까지</span>
              </div>
            </li>
          </ul>
          <p className="text-white/60 mt-4 italic text-sm">
            단, 관계 법령에 따라 일정 기간 보관이 필요한 경우 해당 법령에 따릅니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white border-b-2 border-[#c9a84c]/20 pb-2 inline-block">제4조 (개인정보의 제3자 제공)</h2>
          <p className="text-white/80 leading-relaxed mb-4 text-lg">IBS는 원칙적으로 개인정보를 외부에 제공하지 않습니다. 다만 다음의 경우 예외로 합니다.</p>
          <ul className="list-disc pl-6 space-y-2 text-white/80 leading-relaxed text-lg marker:text-[#c9a84c]">
            <li>정보주체의 동의를 받은 경우</li>
            <li>법률 자문 수행을 위해 담당 변호사에게 제공되는 경우</li>
            <li>법령에 따라 제공이 요구되는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white border-b-2 border-[#c9a84c]/20 pb-2 inline-block">제5조 (개인정보 처리업무의 위탁)</h2>
          <p className="text-white/80 leading-relaxed mb-4 text-lg">IBS는 서비스 운영을 위하여 일부 업무를 외부 업체에 위탁할 수 있습니다.</p>
          <ul className="list-disc pl-6 space-y-2 text-white/80 leading-relaxed text-lg marker:text-[#c9a84c]">
            <li>이메일 발송 시스템 운영</li>
            <li>홈페이지 유지관리 및 시스템 운영</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white border-b-2 border-[#c9a84c]/20 pb-2 inline-block">제6조 (개인정보의 파기)</h2>
          <p className="text-white/80 leading-relaxed mb-4 text-lg">개인정보 보유기간이 경과하거나 처리 목적이 달성된 경우 지체 없이 파기합니다.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#132258]/50 border border-[#1a2f72] p-4 rounded-xl flex items-center">
              <div className="bg-[#0a1532] p-3 rounded-lg mr-4">
                <svg className="w-6 h-6 text-[#c9a84c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <strong className="text-white block">전자파일</strong>
                <span className="text-white/60 text-sm">복구 불가능한 방법으로 삭제</span>
              </div>
            </div>
            <div className="bg-[#132258]/50 border border-[#1a2f72] p-4 rounded-xl flex items-center">
              <div className="bg-[#0a1532] p-3 rounded-lg mr-4">
                <svg className="w-6 h-6 text-[#c9a84c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <strong className="text-white block">종이문서</strong>
                <span className="text-white/60 text-sm">파쇄 또는 소각</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white border-b-2 border-[#c9a84c]/20 pb-2 inline-block">제7조 (정보주체의 권리 및 행사방법)</h2>
          <p className="text-white/80 leading-relaxed mb-4 text-lg">정보주체는 언제든지 다음 권리를 행사할 수 있습니다.</p>
          <ul className="list-disc pl-6 space-y-2 text-white/80 leading-relaxed text-lg marker:text-[#c9a84c]">
            <li>개인정보 열람</li>
            <li>개인정보 정정</li>
            <li>개인정보 삭제</li>
            <li>처리 정지 요청</li>
            <li>법률 리포트 수신 거부</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white border-b-2 border-[#c9a84c]/20 pb-2 inline-block">제8조 (개인정보 자동 수집 장치)</h2>
          <p className="text-white/80 leading-relaxed text-lg bg-white/5 border border-white/10 p-5 rounded-xl">
            IBS 홈페이지는 서비스 제공을 위해 <strong className="text-[#c9a84c] font-semibold">쿠키</strong>를 사용할 수 있으며 웹 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white border-b-2 border-[#c9a84c]/20 pb-2 inline-block">제9조 (개인정보 보호책임자)</h2>
          <div className="glass-card p-6 border border-[#c9a84c]/30 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a84c]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <p className="text-white font-bold text-xl mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-[#c9a84c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              IBS 법률사무소
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-12">
              <div className="flex items-center">
                <div className="bg-[#1a2f72] p-2 rounded-lg mr-3">
                  <svg className="w-4 h-4 text-[#e8c87a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <span className="block text-white/50 text-xs font-semibold mb-1">이메일</span>
                  <a href="mailto:cs@ibslaw.co.kr" className="text-white hover:text-[#c9a84c] transition-colors font-medium">cs@ibslaw.co.kr</a>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-[#1a2f72] p-2 rounded-lg mr-3">
                  <svg className="w-4 h-4 text-[#e8c87a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <span className="block text-white/50 text-xs font-semibold mb-1">전화</span>
                  <a href="tel:02-598-8518" className="text-white hover:text-[#c9a84c] transition-colors font-medium">02-598-8518</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-8 border-t border-white/10 pb-8 mt-16">
          <h2 className="text-xl font-bold mb-4 text-white">제10조 (시행일)</h2>
          <p className="text-white/80 leading-relaxed text-lg">
            본 개인정보 처리방침은 <strong className="text-white font-semibold">2026년 3월 1일</strong>부터 시행됩니다.
          </p>
        </section>
      </div>
    </div>
  );
}
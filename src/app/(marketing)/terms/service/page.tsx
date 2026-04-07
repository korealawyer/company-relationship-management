export const metadata = {
  title: '이용약관',
  description: 'IBS 법률사무소 회원 이용약관입니다.',
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-[var(--foreground)]">
      <div className="space-y-4 mb-12 border-b border-white/10 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          IBS 법률사무소 회원 이용약관
        </h1>
        <p className="text-white/60">시행일: 2026년 3월 1일</p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold mb-4 text-white">제1조 (목적)</h2>
          <p className="text-white/80 leading-relaxed text-lg">
            본 약관은 IBS공동법률사무소(대표변호사 유정훈, 이하 ‘IBS’라 합니다)가 운영하는 법률, 송무 및 회원 서비스 등 이용과 관련하여 IBS와 회원 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white">제2조 (용어의 정의)</h2>
          <ol className="list-decimal pl-6 space-y-3 text-white/80 leading-relaxed text-lg marker:text-white/50 marker:font-bold">
            <li><strong className="text-white font-semibold">회원</strong> : 본 약관에 동의하고 IBS 홈페이지에 회원으로 가입하여 서비스를 이용하는 기업 또는 기업 담당자 및 개인을 의미합니다.</li>
            <li><strong className="text-white font-semibold">회원 계정</strong> : 회원이 IBS 홈페이지에 로그인하기 위하여 사용하는 이메일 기반 계정을 의미합니다.</li>
            <li><strong className="text-white font-semibold">이용계약</strong> : 회원이 본 약관에 동의하고 IBS가 이를 승인함으로써 체결되는 서비스 이용 계약을 의미합니다.</li>
            <li><strong className="text-white font-semibold">법률 리포트</strong> : IBS가 기업의 업종, 경영환경 및 법률 환경을 분석하여 제공하는 법률 관련 보고서를 의미합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white">제3조 (회사 정보의 제공)</h2>
          <p className="text-white/80 leading-relaxed mb-3 text-lg">IBS는 다음 정보를 홈페이지에 게시합니다.</p>
          <ul className="list-disc pl-6 space-y-2 text-white/80 leading-relaxed text-lg marker:text-[#c9a84c]">
            <li>상호</li>
            <li>대표자</li>
            <li>사업자등록번호</li>
            <li>주소</li>
            <li>연락처</li>
            <li>이메일</li>
            <li>개인정보 보호책임자</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white">제4조 (약관의 효력 및 변경)</h2>
          <ol className="list-decimal pl-6 space-y-3 text-white/80 leading-relaxed text-lg marker:text-white/50 marker:font-bold">
            <li>본 약관은 홈페이지에 게시하거나 기타 방법으로 회원에게 공지함으로써 효력이 발생합니다.</li>
            <li>IBS는 관련 법령을 위반하지 않는 범위에서 본 약관을 변경할 수 있습니다.</li>
            <li>약관이 변경되는 경우 적용일자 및 변경 사유를 명시하여 시행일 7일 이전에 공지합니다.</li>
            <li>회원에게 불리한 내용이 변경되는 경우에는 시행일 30일 전에 공지합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white">제5조 (회원가입)</h2>
          <p className="text-white/80 leading-relaxed mb-3 text-lg">회원가입 절차는 다음과 같습니다.</p>
          <ol className="list-decimal pl-6 space-y-3 text-white/80 leading-relaxed text-lg marker:text-white/50 marker:font-bold">
            <li>기업 정보 입력</li>
            <li>이용약관 및 개인정보 처리방침 동의</li>
            <li>이메일로 임시 비밀번호 발송에 따른 홈페이지 로그인</li>
            <li>마케팅 정보 수신 동의 (선택)</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white">제6조 (회원계정의 관리)</h2>
          <ol className="list-decimal pl-6 space-y-3 text-white/80 leading-relaxed text-lg marker:text-white/50 marker:font-bold">
            <li>회원은 자신의 계정 정보를 안전하게 관리할 책임이 있습니다.</li>
            <li>회원은 계정을 제3자에게 양도, 대여 또는 공유할 수 없습니다.</li>
            <li>계정 도용을 인지한 경우 즉시 IBS에 통지하여야 합니다.</li>
            <li>회원의 관리 소홀로 발생한 문제에 대해서 IBS는 책임을 지지 않습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white">제7조 (회원정보의 변경)</h2>
          <p className="text-white/80 leading-relaxed text-lg">
            회원은 언제든지 자신의 회원정보를 열람하고 수정할 수 있으며, 변경하지 않아 발생하는 불이익은 회원의 책임입니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white">제8조 (회원 탈퇴)</h2>
          <p className="text-white/80 leading-relaxed text-lg">
            회원은 언제든지 홈페이지 또는 이메일을 통해 탈퇴를 요청할 수 있으며 IBS는 지체 없이 탈퇴를 처리합니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white">제9조 (회원의 의무)</h2>
          <p className="text-white/80 leading-relaxed mb-3 text-lg">회원은 다음 행위를 하여서는 안 됩니다.</p>
          <ol className="list-decimal pl-6 space-y-3 text-white/80 leading-relaxed text-lg marker:text-white/50 marker:font-bold">
            <li>타인의 계정 사용</li>
            <li>허위 정보 입력</li>
            <li>서비스 운영 방해 행위</li>
            <li>IBS 또는 제3자의 권리를 침해하는 행위</li>
            <li>법령 또는 본 약관을 위반하는 행위</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white">제10조 (회원자격 제한 및 정지)</h2>
          <p className="text-white/80 leading-relaxed text-lg">
            IBS는 약관 위반, 서비스 운영 방해, 불법 행위 또는 타인의 권리 침해가 발생한 경우 회원의 서비스 이용을 제한하거나 회원자격을 정지할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white">제11조 (회원에 대한 통지)</h2>
          <p className="text-white/80 leading-relaxed text-lg">
            IBS는 이메일, 홈페이지 공지 또는 서비스 알림 등의 방법으로 회원에게 통지할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white">제12조 (개인정보 보호)</h2>
          <p className="text-white/80 leading-relaxed text-lg">
            IBS는 회원의 개인정보 보호를 위해 개인정보 처리방침을 수립하여 운영하며 개인정보 관련 사항은 개인정보 처리방침에 따릅니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white">제13조 (면책)</h2>
          <div className="space-y-4">
            <p className="text-white/80 leading-relaxed text-lg">
              IBS는 회원의 귀책 사유, 시스템 장애, 불가항력적 사유 또는 서비스 이용 과정에서 발생한 간접 손해에 대해 책임을 지지 않습니다.
            </p>
            <p className="text-white/80 leading-relaxed text-lg">
              또한 IBS가 제공하는 법률 리포트 및 정보는 일반적인 법률 정보 제공을 목적으로 하며 개별 사건에 대한 법률 자문을 대체하지 않습니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-white">제14조 (분쟁 해결 및 관할 법원)</h2>
          <p className="text-white/80 leading-relaxed text-lg">
            IBS와 회원 간 분쟁이 발생할 경우 상호 협의를 통해 해결하며 협의가 이루어지지 않는 경우 IBS 본점 소재지 관할 법원을 전속 관할로 합니다.
          </p>
        </section>

        <section className="pt-8 border-t border-white/10">
          <h2 className="text-xl font-bold mb-4 text-white">부칙</h2>
          <p className="text-white/80 leading-relaxed text-lg">
            본 약관은 <strong className="text-white font-semibold">2026년 3월 1일</strong>부터 시행합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
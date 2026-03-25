'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Check, Send, RefreshCw } from 'lucide-react';
import { C } from '@/lib/callPageUtils';
import { Company } from '@/lib/mockStore';

export interface KakaoModalProps {
  kakaoTarget: Company | null;
  kakaoTemplate: number;
  setKakaoTemplate: (i: number) => void;
  kakaoSending: boolean;
  setKakaoSending: (v: boolean) => void;
  setKakaoTarget: (v: Company | null) => void;
  setToast: (s: string) => void;
}

const getTemplates = (co: Company) => [
  {
    title: '📊 분석 보고서 안내',
    desc: '개인정보 진단 보고서 발송 알림',
    msg: `[IBS 법률사무소]\n\n${co.contactName || '담당자'}님, 안녕하세요.\n${co.name}의 개인정보처리방침 진단 보고서가 준비되었습니다.\n\n▶ 보고서 확인하기\nhttps://ibs-law.co.kr/report/${co.id}\n\n문의: 02-1234-5678`,
  },
  {
    title: '📞 통화 팔로업',
    desc: '통화 후 추가 자료 안내',
    msg: `[IBS 법률사무소]\n\n${co.contactName || '담당자'}님, 오늘 통화 감사드립니다.\n말씀드린 ${co.name} 관련 상세 검토 의견서를 첨부드립니다.\n\n▶ 검토 의견서 확인\nhttps://ibs-law.co.kr/opinion/${co.id}\n\n추가 문의사항이 있으시면 편하게 연락주세요.`,
  },
  {
    title: '🔔 리마인드 안내',
    desc: '계약/회신 리마인드',
    msg: `[IBS 법률사무소]\n\n${co.contactName || '담당자'}님, 안녕하세요.\n${co.name} 건 관련 회신 부탁드립니다.\n\n미조치 시 법적 리스크가 발생할 수 있어 사전 대응을 권고드리며,\n편하신 시간에 연락 주시면 상세 안내 도와드리겠습니다.\n\n📞 02-1234-5678`,
  },
];

export default function KakaoModal({
  kakaoTarget,
  kakaoTemplate,
  setKakaoTemplate,
  kakaoSending,
  setKakaoSending,
  setKakaoTarget,
  setToast,
}: KakaoModalProps) {
  return (
    <AnimatePresence>
      {kakaoTarget && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
          onClick={() => setKakaoTarget(null)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="rounded-2xl p-6 w-[480px] shadow-xl"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: '#FAE100' }}
              >
                <MessageCircle className="w-5 h-5" style={{ color: '#3C1E1E' }} />
              </div>
              <div>
                <h3 className="text-base font-black" style={{ color: C.heading }}>
                  카카오 알림톡 발송
                </h3>
                <p className="text-[11px]" style={{ color: C.sub }}>
                  {kakaoTarget.name} · {kakaoTarget.contactName || '담당자'} ·{' '}
                  {kakaoTarget.contactPhone || kakaoTarget.phone}
                </p>
              </div>
              <button
                onClick={() => setKakaoTarget(null)}
                className="ml-auto p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" style={{ color: C.muted }} />
              </button>
            </div>

            {/* Template selection */}
            <p className="text-[11px] font-bold mb-2" style={{ color: C.muted }}>
              템플릿 선택
            </p>
            <div className="flex flex-col gap-2 mb-4">
              {getTemplates(kakaoTarget).map((t, i) => (
                <button
                  key={i}
                  onClick={() => setKakaoTemplate(i)}
                  className="text-left p-3 rounded-xl transition-all"
                  style={{
                    background: kakaoTemplate === i ? '#FFFDE7' : '#f8fafc',
                    border: `1.5px solid ${kakaoTemplate === i ? '#FAE100' : C.borderLight}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold"
                      style={{ color: kakaoTemplate === i ? '#5D4037' : C.heading }}
                    >
                      {t.title}
                    </span>
                    {kakaoTemplate === i && (
                      <Check className="w-3.5 h-3.5" style={{ color: '#F9A825' }} />
                    )}
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: C.sub }}>
                    {t.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Preview */}
            <div className="p-3 rounded-xl mb-4" style={{ background: '#FFFDE7', border: '1px solid #FFF9C4' }}>
              <p className="text-[10px] font-bold mb-1" style={{ color: '#5D4037' }}>
                미리보기
              </p>
              <pre
                className="text-[10px] whitespace-pre-wrap leading-relaxed"
                style={{ color: '#4E342E', fontFamily: 'inherit' }}
              >
                {getTemplates(kakaoTarget)[kakaoTemplate].msg}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setKakaoTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                style={{ background: '#f8f9fc', color: C.sub, border: `1px solid ${C.border}` }}
              >
                취소
              </button>
              <button
                disabled={kakaoSending}
                onClick={async () => {
                  setKakaoSending(true);
                  await new Promise((r) => setTimeout(r, 1200));
                  setKakaoSending(false);
                  setKakaoTarget(null);
                  setToast(`💬 카카오 알림톡 발송 완료 → ${kakaoTarget.name}`);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02]"
                style={{
                  background: kakaoSending ? '#FFF9C4' : '#FAE100',
                  color: '#3C1E1E',
                  border: '1px solid #F9A825',
                }}
              >
                {kakaoSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    발송 중...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    알림톡 발송
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-[9px] mt-3" style={{ color: C.faint }}>
              알리고 API 연동 · 건당 6.5원 · 카톡 미수신 시 SMS 자동 대체발송
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

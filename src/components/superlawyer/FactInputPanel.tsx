'use client';
/**
 * FactInputPanel — 사실관계 입력 패널
 * 
 * 사용자가 사건의 사실관계(당사자, 분쟁 경위, 쟁점 등)를 입력하면
 * AI가 법률 의견서 초안을 생성합니다.
 */

import { useState } from 'react';

interface FactInputPanelProps {
  onGenerate: (facts: FactInputData) => void;
  isGenerating?: boolean;
}

export interface FactInputData {
  clientName: string;
  opponentName: string;
  caseType: string;
  factSummary: string;
  keyIssues: string;
  desiredOutcome: string;
}

const CASE_TYPES = [
  '민사 — 손해배상',
  '민사 — 임대차분쟁',
  '민사 — 계약분쟁',
  '형사 — 사기/횡령',
  '형사 — 폭행/상해',
  '행정 — 인허가',
  '기업법무 — M&A',
  '기업법무 — 주주분쟁',
  '프랜차이즈 — 가맹분쟁',
  '노동 — 부당해고',
  '부동산 — 소유권분쟁',
  '기타',
];

export default function FactInputPanel({
  onGenerate,
  isGenerating = false,
}: FactInputPanelProps) {
  const [formData, setFormData] = useState<FactInputData>({
    clientName: '',
    opponentName: '',
    caseType: '민사 — 임대차분쟁',
    factSummary: '',
    keyIssues: '',
    desiredOutcome: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  const isFormValid = formData.clientName && formData.factSummary;

  return (
    <div className="fact-input-panel">
      <div className="panel-header">
        <div className="panel-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <line x1="10" y1="9" x2="8" y2="9"/>
          </svg>
        </div>
        <h2>사실관계 입력</h2>
        <p className="panel-desc">입력된 사실관계를 바탕으로 법률 의견서 초안을 작성합니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="fact-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="clientName">의뢰인 *</label>
            <input
              id="clientName"
              name="clientName"
              type="text"
              placeholder="홍길동"
              value={formData.clientName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="opponentName">상대방</label>
            <input
              id="opponentName"
              name="opponentName"
              type="text"
              placeholder="김철수"
              value={formData.opponentName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="caseType">사건 유형</label>
          <select
            id="caseType"
            name="caseType"
            value={formData.caseType}
            onChange={handleChange}
          >
            {CASE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="factSummary">사실관계 요약 *</label>
          <textarea
            id="factSummary"
            name="factSummary"
            rows={6}
            placeholder="분쟁의 경위와 주요 사실관계를 시간순으로 기술해 주세요.&#10;&#10;예: 2025년 6월 15일 의뢰인은 상대방과 강남구 소재 상가 임대차계약을 체결하였습니다..."
            value={formData.factSummary}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="keyIssues">핵심 쟁점</label>
          <textarea
            id="keyIssues"
            name="keyIssues"
            rows={3}
            placeholder="주요 법적 쟁점을 기술해 주세요.&#10;&#10;예: 상가임대차보호법상 계약갱신요구권 행사 가능 여부"
            value={formData.keyIssues}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="desiredOutcome">희망 결과</label>
          <textarea
            id="desiredOutcome"
            name="desiredOutcome"
            rows={2}
            placeholder="의뢰인이 원하는 결과를 간략히 기술해 주세요."
            value={formData.desiredOutcome}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          className="generate-btn"
          disabled={!isFormValid || isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="btn-spinner" />
              법률 의견서 생성 중...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              법률 의견서 생성
            </>
          )}
        </button>
      </form>
    </div>
  );
}

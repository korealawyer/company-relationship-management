# ⚖️ 법률 AI 에이전트 — Phase 1~3 완전 개발 프롬프트

> 새 세션에 전체 복붙 → 순서대로 개발 진행

---

## 📦 프로젝트 컨텍스트

- **경로:** `c:\projects\company-relationship-management`
- **스택:** Next.js 15 App Router · TypeScript · Tailwind · Supabase
- **AI 인프라:** `src/lib/ai.ts` → `callClaude(opts)` (Claude/OpenAI/Gemini 멀티 프로바이더)
- **인증 패턴:** `requireSessionFromCookie(req)` from `@/lib/auth`
- **기존 documents API:** `POST /api/documents` → `{ title, doc_type, doc_source, case_id, urgency }` → 201
- **기존 contracts API:** `POST /api/contracts` → `{ contract_title, party_a_name, party_b_name, party_b_email, contract_body, template_type, case_id }` → `{ contract, sign_url }`
- **기존 cases API:** `PATCH /api/cases/[id]` → `{ status }` / `POST /api/cases` → 신규 사건 생성

---

## 🏗️ 3단계 개발 계획

| 단계 | 내용 | 파일 수 |
|---|---|---|
| **Phase 1** | AI 텍스트 생성 어시스턴트 (채팅 패널 UI + API) | 3개 |
| **Phase 2** | 생성된 문서 → documents 테이블 저장 버튼 | +1개 수정 |
| **Phase 3** | 계약서 → 전자서명 발송 / 사건 상태 자동 업데이트 / 신규 사건 생성 | +2개 수정 |

---

## Phase 1 — AI 텍스트 생성 어시스턴트

### 📁 `src/app/api/ai/legal-agent/route.ts` [NEW]

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireSessionFromCookie } from '@/lib/auth';
import { callClaude, hasAIKey, mockDelay } from '@/lib/ai';

const CASE_TYPE_KO: Record<string, string> = {
  civil:'민사', criminal:'형사', administrative:'행정', corporate:'기업',
  franchise:'프랜차이즈', labor:'노동', real_estate:'부동산', family:'가사', other:'기타',
};
const STATUS_KO: Record<string, string> = {
  intake:'상담중', retained:'수임', active:'진행중', closing:'종결준비', closed:'종결',
};
const HEARING_KO: Record<string, string> = {
  pleading:'변론기일', judgment:'선고기일', mediation:'조정기일',
  conciliation:'화해기일', examination:'심문기일', evidence:'증거조사기일', other:'기타',
};

const ACTION_PROMPTS: Record<string, string> = {
  summarize: '이 사건 현황을 변호사가 의뢰인에게 보고할 수 있는 3~5줄 요약을 작성하세요.',
  contract:  '이 사건에 맞는 수임계약서 초안을 작성하세요. 착수금/성공보수/업무범위/비밀유지 조항 포함.',
  brief:     '이 사건의 준비서면 목차와 핵심 쟁점을 정리하세요.',
  notice:    '상대방에게 보낼 내용증명 초안을 작성하세요.',
  report:    '의뢰인에게 전달할 월간 법무 현황 리포트 초안을 작성하세요.',
  analysis:  '이 사건의 법적 쟁점과 예상 전략을 분석하세요.',
  reminder:  '가장 임박한 기일에 대해 의뢰인에게 보낼 카카오 알림 문자 초안을 작성하세요.',
};

const MOCK_RESPONSES: Record<string, string> = {
  summarize: `📋 **사건 요약**\n\n현재 진행중인 사건으로 담당 변호사가 적극 대응 중입니다.\n- 현재 단계: 소장 제출 완료\n- 다음 기일: 검토 중\n\n> ⚠️ AI 초안입니다. 담당 변호사 검토 필수.`,
  contract:  `📝 **수임계약서 초안**\n\n**수임계약서**\n\n제1조 (수임 범위) 을은 갑의 본 사건 처리를 수임한다.\n제2조 (수임료) 착수금: 협의, 성공보수: 승소 시 협의\n제3조 (비밀유지) 수임 중 취득한 비밀 엄수\n\n> ⚠️ AI 초안입니다. 담당 변호사 검토 필수.`,
  notice:    `📮 **내용증명 초안**\n\n수신: [상대방] 귀중\n\n귀하의 [행위]로 인한 피해에 대해 이 서신 수령 후 **7일 이내** 조치가 없을 시 법적 조치를 취할 것임을 통보합니다.\n\n> ⚠️ AI 초안입니다. 담당 변호사 검토 필수.`,
  default:   `⚖️ **법률 AI 에이전트**\n\n아래 버튼을 클릭하거나 직접 질문을 입력하세요.\n\n📋 사건요약 / 📝 계약서초안 / ⚖️ 서면목차 / 📮 내용증명 / 📊 의뢰인리포트 / 🔍 법적분석 / 📱 기일알림`,
};

export async function POST(req: NextRequest) {
  const auth = requireSessionFromCookie(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { messages, caseContext, action } = await req.json();

    const hearingLines = (caseContext.hearings ?? [])
      .filter((h: {hearing_date: string}) => new Date(h.hearing_date) >= new Date())
      .sort((a: {hearing_date: string}, b: {hearing_date: string}) => a.hearing_date.localeCompare(b.hearing_date))
      .slice(0, 3)
      .map((h: {hearing_type: string; hearing_date: string; court_name: string; is_immutable: boolean}) =>
        `  - ${HEARING_KO[h.hearing_type]??h.hearing_type}: ${h.hearing_date} ${h.court_name}${h.is_immutable?' [불변기일]':''}`)
      .join('\n') || '  - 예정된 기일 없음';

    const system = `당신은 법무법인 전용 법률 AI 에이전트입니다.

━━━━━━━━━━━━━━━━━━━━━━━━
📁 현재 사건
━━━━━━━━━━━━━━━━━━━━━━━━
사건명: ${caseContext.title}
사건번호: ${caseContext.case_number??'미부여'}
유형: ${CASE_TYPE_KO[caseContext.case_type]??caseContext.case_type}
상태: ${STATUS_KO[caseContext.status]??caseContext.status}
상대방: ${caseContext.opponent??'미입력'}
착수금: ${caseContext.retainer_fee ? caseContext.retainer_fee.toLocaleString('ko-KR')+'원' : '미입력'}
성공보수: ${caseContext.success_fee ? caseContext.success_fee.toLocaleString('ko-KR')+'원' : '미입력'}
메모: ${caseContext.notes??'없음'}
예정기일:
${hearingLines}
━━━━━━━━━━━━━━━━━━━━━━━━

규칙: 한국어로만 응답 / 마크다운 사용 / 문서 초안에는 반드시 "⚠️ AI 초안입니다. 담당 변호사 검토 필수." 추가 / 주민번호·계좌번호 절대 생성 금지`;

    let finalMessages = [...(messages??[])];
    if (action && finalMessages.length === 0) {
      const p = ACTION_PROMPTS[action];
      if (p) finalMessages = [{ role: 'user', content: p }];
    }

    if (hasAIKey) {
      try {
        const result = await callClaude({ system, messages: finalMessages, maxTokens: 2048, endpoint: 'legal-agent' });
        return NextResponse.json({ message: result.text, mock: false });
      } catch (e) { console.error('[legal-agent] AI 오류:', e); }
    }

    await mockDelay(600);
    return NextResponse.json({ message: MOCK_RESPONSES[action??'default'] ?? MOCK_RESPONSES.default, mock: true });
  } catch (e) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
```

---

### 📁 `src/components/cases/LegalAgentPanel.tsx` [NEW]

```tsx
'use client';
import { useState, useRef, useEffect } from 'react';

interface Msg { role: 'user'|'assistant'; content: string; ts: Date; mock?: boolean; saved?: boolean; }
interface Hearing { hearing_type: string; hearing_date: string; court_name: string; is_immutable: boolean; }
interface CaseCtx {
  id: string; title: string; case_type: string; status: string;
  opponent: string|null; case_number: string|null;
  retainer_fee: number|null; success_fee: number|null; notes: string|null;
  hearings: Hearing[];
}
interface Props { isOpen: boolean; onClose: () => void; caseCtx: CaseCtx; }

const ACTIONS = [
  { id:'summarize', label:'📋 사건 요약' }, { id:'contract',  label:'📝 계약서 초안' },
  { id:'brief',     label:'⚖️ 서면 목차'  }, { id:'notice',    label:'📮 내용증명'    },
  { id:'report',    label:'📊 의뢰인 리포트'}, { id:'analysis', label:'🔍 법적 분석'   },
  { id:'reminder',  label:'📱 기일 알림'  },
] as const;
type ActionId = typeof ACTIONS[number]['id'];

// ── Phase 2: 문서 저장 버튼 ───────────────────────────────────────────────
async function saveDocument(content: string, caseCtx: CaseCtx, action: string): Promise<boolean> {
  const docTypeMap: Record<string, string> = {
    contract: 'contract', notice: 'legal_notice', brief: 'court_filing',
    report: 'client_report', summarize: 'memo', analysis: 'memo', reminder: 'memo',
  };
  const titleMap: Record<string, string> = {
    contract: `수임계약서_${caseCtx.title}`, notice: `내용증명_${caseCtx.title}`,
    brief: `준비서면목차_${caseCtx.title}`, report: `월간리포트_${caseCtx.title}`,
    summarize: `사건요약_${caseCtx.title}`, analysis: `법적분석_${caseCtx.title}`,
    reminder: `기일알림초안_${caseCtx.title}`,
  };
  const res = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: titleMap[action] ?? `AI초안_${caseCtx.title}`,
      doc_type: docTypeMap[action] ?? 'memo',
      doc_source: 'internal',
      case_id: caseCtx.id,
      urgency: 'normal',
      ai_generated: true,
      content_preview: content.slice(0, 500),
    }),
  });
  return res.ok;
}

// ── Phase 3: 계약서 전자서명 발송 ─────────────────────────────────────────
async function sendForEsign(content: string, caseCtx: CaseCtx, email: string): Promise<{sign_url: string}|null> {
  const res = await fetch('/api/contracts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contract_title: `수임계약서_${caseCtx.title}`,
      party_a_name: '법무법인',
      party_b_name: caseCtx.opponent ?? '의뢰인',
      party_b_email: email,
      contract_body: content,
      template_type: 'retainer',
      case_id: caseCtx.id,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return { sign_url: data.sign_url };
}

// ── Phase 3: 사건 상태 자동 업데이트 ─────────────────────────────────────
async function updateCaseStatus(caseId: string, newStatus: string): Promise<boolean> {
  const res = await fetch(`/api/cases/${caseId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus }),
  });
  return res.ok;
}

// ── Phase 3: 신규 사건 생성 ───────────────────────────────────────────────
async function createNewCase(params: { title: string; case_type: string; opponent?: string }): Promise<string|null> {
  const res = await fetch('/api/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, status: 'intake', priority: 'medium' }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data?.id ?? null;
}

// ── 메시지 버블 ───────────────────────────────────────────────────────────
function Bubble({ msg, caseCtx, lastAction, onSaved }: {
  msg: Msg; caseCtx: CaseCtx; lastAction: string; onSaved: () => void;
}) {
  const isUser = msg.role === 'user';
  const [saving, setSaving] = useState(false);
  const [esignEmail, setEsignEmail] = useState('');
  const [esignSending, setEsignSending] = useState(false);
  const [esignUrl, setEsignUrl] = useState<string|null>(null);
  const [showEsign, setShowEsign] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusDone, setStatusDone] = useState(false);
  const isDoc = !isUser && msg.content.includes('⚠️');

  async function handleSave() {
    setSaving(true);
    const ok = await saveDocument(msg.content, caseCtx, lastAction);
    if (ok) onSaved();
    setSaving(false);
  }

  async function handleEsign() {
    if (!esignEmail) return;
    setEsignSending(true);
    const result = await sendForEsign(msg.content, caseCtx, esignEmail);
    if (result) setEsignUrl(result.sign_url);
    setEsignSending(false);
  }

  async function handleStatusUpdate(newStatus: string) {
    setStatusUpdating(true);
    await updateCaseStatus(caseCtx.id, newStatus);
    setStatusDone(true);
    setStatusUpdating(false);
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold mr-2 flex-shrink-0 mt-0.5">AI</div>
      )}
      <div className="max-w-[85%]">
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
        }`}>
          {msg.content}
        </div>

        {/* Phase 2: 문서 저장 버튼 */}
        {isDoc && !msg.saved && (
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-[11px] px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition disabled:opacity-50"
            >
              {saving ? '저장 중...' : '💾 문서로 저장'}
            </button>

            {/* Phase 3: 계약서일 때만 전자서명 버튼 */}
            {lastAction === 'contract' && (
              <button
                onClick={() => setShowEsign(v => !v)}
                className="text-[11px] px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition"
              >
                ✍️ 전자서명 발송
              </button>
            )}

            {/* Phase 3: 사건 상태 업데이트 */}
            {!statusDone && (
              <button
                onClick={() => handleStatusUpdate('retained')}
                disabled={statusUpdating}
                className="text-[11px] px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition disabled:opacity-50"
              >
                {statusUpdating ? '업데이트 중...' : '🔄 상태 → 수임 변경'}
              </button>
            )}
            {statusDone && <span className="text-[11px] text-emerald-600">✓ 상태 업데이트됨</span>}
          </div>
        )}

        {/* Phase 2: 저장 완료 */}
        {msg.saved && <span className="text-[11px] text-emerald-600 mt-1 block">✓ 문서 저장 완료</span>}

        {/* Phase 3: 전자서명 이메일 입력 */}
        {showEsign && !esignUrl && (
          <div className="mt-2 flex gap-2">
            <input
              type="email"
              value={esignEmail}
              onChange={e => setEsignEmail(e.target.value)}
              placeholder="수신인 이메일"
              className="flex-1 text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={handleEsign}
              disabled={esignSending || !esignEmail}
              className="text-[11px] px-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {esignSending ? '발송 중...' : '발송'}
            </button>
          </div>
        )}
        {esignUrl && (
          <div className="mt-2 text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
            ✅ 서명 링크 발행 완료<br />
            <a href={esignUrl} target="_blank" rel="noopener noreferrer" className="underline break-all">{esignUrl}</a>
          </div>
        )}

        <div className="mt-1 text-[10px] text-slate-400">
          {msg.ts.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}
          {msg.mock && <span className="ml-1.5 text-amber-500 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">MOCK</span>}
        </div>
      </div>
    </div>
  );
}

// ── 메인 패널 ─────────────────────────────────────────────────────────────
export function LegalAgentPanel({ isOpen, onClose, caseCtx }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState('');
  const [newCaseInput, setNewCaseInput] = useState('');
  const [newCaseId, setNewCaseId] = useState<string|null>(null);
  const [showNewCase, setShowNewCase] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && msgs.length === 0) {
      setMsgs([{ role:'assistant', content:`⚖️ **${caseCtx.title}** 사건 AI 에이전트입니다.\n\n아래 빠른 버튼을 클릭하거나 자유롭게 입력하세요.`, ts: new Date() }]);
    }
  }, [isOpen]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs]);

  async function send(content: string, action?: ActionId) {
    if (loading) return;
    const userContent = content.trim() || ACTIONS.find(a => a.id === action)?.label || '';
    if (!userContent) return;

    setLastAction(action ?? '');
    setMsgs(prev => [...prev, { role:'user', content: userContent, ts: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      const payload = {
        messages: [...msgs, { role:'user', content: userContent }]
          .map(m => ({ role: m.role, content: m.content })),
        caseContext: caseCtx,
        ...(action ? { action } : {}),
      };
      const res = await fetch('/api/ai/legal-agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setMsgs(prev => [...prev, { role:'assistant', content: data.message ?? '오류가 발생했습니다.', ts: new Date(), mock: data.mock }]);
    } catch {
      setMsgs(prev => [...prev, { role:'assistant', content:'❌ 연결 오류. 다시 시도해 주세요.', ts: new Date() }]);
    } finally { setLoading(false); }
  }

  // Phase 3: 신규 사건 생성
  async function handleCreateCase() {
    if (!newCaseInput.trim()) return;
    // AI가 입력에서 사건 정보 파싱 시도
    const parts = newCaseInput.split('/').map(s => s.trim());
    const id = await createNewCase({
      title: parts[0] || newCaseInput,
      case_type: parts[1] || 'civil',
      opponent: parts[2],
    });
    if (id) {
      setNewCaseId(id);
      setMsgs(prev => [...prev, { role:'assistant', content:`✅ 신규 사건이 생성되었습니다!\n\n사건 ID: ${id}\n사건명: ${parts[0]}\n\n[사건 바로가기](/cases/${id})`, ts: new Date() }]);
    }
    setNewCaseInput('');
    setShowNewCase(false);
  }

  function markSaved(idx: number) {
    setMsgs(prev => prev.map((m, i) => i === idx ? { ...m, saved: true } : m));
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full md:w-[430px] z-50 flex flex-col bg-slate-50 border-l border-slate-200 shadow-2xl">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">⚖️</div>
            <div>
              <p className="font-semibold text-sm">법률 AI 에이전트</p>
              <p className="text-[10px] text-white/70 truncate max-w-[200px]">{caseCtx.title}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMsgs([])} title="초기화" className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs">🔄</button>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="px-3 py-2 border-b border-slate-100 bg-white flex-shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {ACTIONS.map(a => (
              <button key={a.id} onClick={() => send('', a.id)} disabled={loading}
                className="text-[11px] font-medium px-2.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-40 transition active:scale-95">
                {a.label}
              </button>
            ))}
            {/* Phase 3: 신규 사건 생성 버튼 */}
            <button onClick={() => setShowNewCase(v => !v)} disabled={loading}
              className="text-[11px] font-medium px-2.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-40 transition active:scale-95">
              ➕ 신규 사건 생성
            </button>
          </div>
          {/* Phase 3: 신규 사건 생성 입력창 */}
          {showNewCase && (
            <div className="mt-2 flex gap-2">
              <input value={newCaseInput} onChange={e => setNewCaseInput(e.target.value)}
                placeholder="사건명 / 유형(civil,criminal...) / 상대방"
                className="flex-1 text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              <button onClick={handleCreateCase}
                className="text-[11px] px-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition">생성</button>
            </div>
          )}
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {msgs.map((m, i) => (
            <Bubble key={i} msg={m} caseCtx={caseCtx} lastAction={lastAction} onSaved={() => markSaved(i)} />
          ))}
          {loading && (
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold">AI</div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  {[0,150,300].map(d => <div key={d} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 경고 배너 */}
        {msgs.some(m => m.content.includes('⚠️')) && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 flex-shrink-0">
            <p className="text-[10px] text-amber-700 text-center">⚠️ AI 생성 초안 — 반드시 담당 변호사 검토 후 사용하세요.</p>
          </div>
        )}

        {/* 입력창 */}
        <div className="px-3 pb-4 pt-2 bg-white border-t border-slate-100 flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="자유롭게 질문하세요... (Enter 전송, Shift+Enter 줄바꿈)"
              rows={2}
              className="flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-400"
              disabled={loading} />
            <button onClick={() => send(input)} disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition active:scale-95 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
```

---

### 📁 `src/app/cases/[id]/page.tsx` [MODIFY]

기존 파일에 아래 3군데를 수정한다.

**A. import 추가** (파일 상단 import 섹션에):
```tsx
import { LegalAgentPanel } from '@/components/cases/LegalAgentPanel';
```

**B. state 추가** (`CaseDetailPage` 함수 내 state 선언부에):
```tsx
const [agentOpen, setAgentOpen] = useState(false);
```

**C. 헤더 버튼 추가** (상태 변경 `<select>` 바로 앞에):
```tsx
<button
  onClick={() => setAgentOpen(true)}
  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600
             text-white text-sm font-semibold shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition-all"
>
  <span>⚖️</span> AI 에이전트
</button>
```

**D. 최상위 div 닫히기 직전에 패널 마운트**:
```tsx
<LegalAgentPanel
  isOpen={agentOpen}
  onClose={() => setAgentOpen(false)}
  caseCtx={{
    id: caseData.id,
    title: caseData.title,
    case_type: caseData.case_type,
    status: caseData.status,
    opponent: caseData.opponent,
    case_number: caseData.case_number,
    retainer_fee: caseData.retainer_fee,
    success_fee: caseData.success_fee,
    notes: caseData.notes,
    hearings: caseData.hearings.map(h => ({
      hearing_type: h.hearing_type,
      hearing_date: h.hearing_date,
      court_name: h.court_name,
      is_immutable: h.is_immutable,
    })),
  }}
/>
```

---

## ✅ 완료 기준

### Phase 1 — 텍스트 生成
- [ ] "⚖️ AI 에이전트" 버튼이 사건 상세 헤더에 보인다
- [ ] 버튼 클릭 → 우측 패널 슬라이드인
- [ ] 7개 빠른 액션 버튼 모두 동작 (사건 요약/계약서/서면목차/내용증명/리포트/분석/기일알림)
- [ ] 자유 텍스트 입력 + Enter 전송 동작
- [ ] API Key 없으면 MOCK 배지로 응답

### Phase 2 — 문서 저장
- [ ] AI 초안(⚠️ 포함) 하단에 "💾 문서로 저장" 버튼 표시
- [ ] 클릭 시 `POST /api/documents` 호출 → 저장 완료 메시지
- [ ] 저장 후 버튼이 "✓ 문서 저장 완료"로 변경

### Phase 3 — 자동화 액션
- [ ] 계약서 초안 하단에 "✍️ 전자서명 발송" 버튼 표시
- [ ] 이메일 입력 → `POST /api/contracts` → sign_url 표시
- [ ] "🔄 상태 → 수임 변경" 버튼 → `PATCH /api/cases/[id]` 호출
- [ ] "➕ 신규 사건 생성" 버튼 → 입력폼 → `POST /api/cases` → 사건 ID 반환

---

## 🔧 환경 변수

`.env.local`에 하나 이상 설정 시 실제 AI 동작 (없으면 Mock):
```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
AI_PROVIDER=claude
```

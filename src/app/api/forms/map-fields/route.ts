import { requireSessionFromCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Note: OpenAI API SDK (또는 fetch) 및 docxtemplater는 실제 프로덕션 환경에서 패키지로 설치해야 합니다.
// npm install openai

export async function POST(request: Request) {
  const __auth = await requireSessionFromCookie(request as any);
  if (!__auth.ok) return NextResponse.json({ error: __auth.error }, { status: __auth.status });

  try {
    const { userInput, caseContext, formId } = await request.json();

    if (!userInput) {
      return NextResponse.json({ error: '의뢰인 입력(자연어)이 필요합니다.' }, { status: 400 });
    }

    // 1. Supabase에서 formId에 해당하는 template_fields 목록을 가져옵니다.
    // 임시 하드코딩된 메타데이터 (예: 대여금 반환 소장)
    const mockTemplateFields = [
      { field_key: 'plaintiff_name', field_label: '원고 이름', type: 'text' },
      { field_key: 'defendant_name', field_label: '피고 이름', type: 'text' },
      { field_key: 'claim_amount', field_label: '청구 금액(원)', type: 'number' },
      { field_key: 'loan_date', field_label: '돈을 빌려준 날짜', type: 'date' },
      { field_key: 'incident_summary', field_label: '사건 경위 요약', type: 'long_text' }
    ];

    // 2. GPT-4o 프롬프트 구성
    const systemPrompt = `
당신은 대한민국 최고 수준의 법률 AI 어시스턴트입니다.
의뢰인의 자연어 입력과 이미 알고 있는 사건 정보(caseContext)를 분석하여, 다음 JSON 스키마에 맞게 빈칸 데이터를 추출하세요.
절대 다른 말은 하지 말고 순수 JSON만 반환하세요.

[필요한 데이터 (template_fields)]
${JSON.stringify(mockTemplateFields, null, 2)}

[사건 기본 정보 (CRM)]
${JSON.stringify(caseContext || {}, null, 2)}
    `;

    // 3. (모의) OpenAI API 호출
    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // const completion = await openai.chat.completions.create({ ... });
    
    console.log("GPT Parsing Initiated for prompt:", userInput);
    
    // 모의 반환값 생성 (GPT가 실제 응답한다고 가정)
    const mockGptResponse = {
      plaintiff_name: caseContext?.clientName || "홍길동",
      defendant_name: "미상 (입력 분석 필요)",
      claim_amount: "입력에서 추출 필요",
      loan_date: "입력에서 추출 필요",
      incident_summary: "입력을 법률적 문서체로 요약한 텍스트"
    };

    // 간단한 정규식으로 모의 파싱 (시연 목적)
    if (userInput.includes('500만') || userInput.includes('500 만')) {
      mockGptResponse.claim_amount = "5,000,000";
    }
    if (userInput.includes('작년 10월')) {
      mockGptResponse.loan_date = "2025-10-01 (추정)";
    }
    if (userInput.includes('친구') && userInput.includes('안 갚아요')) {
      mockGptResponse.defendant_name = "채무자 (지인)";
      mockGptResponse.incident_summary = "원고는 피고에게 금전을 대여하였으나, 피고가 변제 기일이 지났음에도 현재까지 이를 변제하고 있지 아니함.";
    }

    return NextResponse.json({
      success: true,
      mappedFields: mockGptResponse,
      _metadata: {
        formId,
        fieldsConfig: mockTemplateFields
      }
    });

  } catch (error: any) {
    console.error("AI Form Mapping Error:", error);
    return NextResponse.json(
      { success: false, error: '서식 데이터 추출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

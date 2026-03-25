-- 법률 서식 생성 엔진 (C-6) 테이블 정의
-- 작성자: IBS 로펌 CRM 개발팀
-- 생성일: 2026-03-25

-- 1. 서식 메타데이터 레지스트리
CREATE TABLE IF NOT EXISTS public.legal_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL CHECK (category IN ('민사', '형사', '가사', '행정', '신청', '보전처분', '파산회생', '기타')),
    sub_category TEXT,       -- 예: '소장', '답변서', '준비서면', '신청서', '탄원서'
    title TEXT NOT NULL,     -- 예: '대여금 반환 청구의 소'
    description TEXT,        -- 의뢰인이 쉽게 이해할 수 있는 서식 용도 설명
    file_url TEXT NOT NULL,  -- Supabase Storage bucket ('legal-templates') 내의 DOCX 경로
    version INTEGER DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (검색 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_legal_templates_category ON public.legal_templates(category);
CREATE INDEX IF NOT EXISTS idx_legal_templates_title ON public.legal_templates USING gin (title gin_trgm_ops);

-- 2. 서식 내 가변 필드 정의 (AI가 채워야 할 항목들)
CREATE TABLE IF NOT EXISTS public.template_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES public.legal_templates(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL,      -- docxtemplater 치환 키 (예: 'plaintiff_name', 'claim_amount')
    field_label TEXT NOT NULL,    -- 사용자 UI에 보일 라벨 (예: '원고 성명', '상대방이 안 갚은 금액')
    field_type TEXT DEFAULT 'text' CHECK (field_type IN ('text', 'date', 'number', 'long_text', 'boolean')),
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, field_key) -- 템플릿 내 필드키 중복 방지
);

-- 문서 스토리지 셋업 (Supabase Storage)
-- insert into storage.buckets (id, name, public) values ('legal-templates', 'legal-templates', false);

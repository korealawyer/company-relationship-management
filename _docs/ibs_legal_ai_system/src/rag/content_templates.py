"""콘텐츠 생성 템플릿 정의"""

from typing import Dict, List, Any

# 블로그 템플릿 섹션 구조
BLOG_SECTIONS = {
    "title": {
        "name": "제목 (H1)",
        "description": "독자가 실제로 할 법한 질문 형태를 권장",
        "example": "퇴직금은 언제까지 줘야 할까? 지연 시 발생하는 법적 문제 정리",
        "requirements": {
            "min_length": 20,
            "max_length": 120,
            "format": "질문 형태 권장",
            "seo_optimized": True,
        }
    },
    "tldr": {
        "name": "요약 (TL;DR)",
        "description": "글의 핵심 메시지를 간단히 정리 (3-5줄)",
        "example": "퇴직금은 퇴직일로부터 14일 이내에 지급해야 합니다. 지연 시 지연이자와 손해배상 책임이 발생할 수 있습니다.",
        "requirements": {
            "min_length": 100,
            "max_lines": 5,
            "reusable": True,  # 카드뉴스, 썸네일, 뉴스레터 인트로로 재사용
        }
    },
    "situation_example": {
        "name": "상황 예시",
        "description": "현실에서 자주 나오는 사례를 스토리텔링 형식으로 묘사하고, 그 예시의 결말까지 포함",
        "example": "직원 A씨가 퇴사했는데, 퇴직금을 한 달 뒤에 주면 안 되냐고 대표가 묻는 상황. 이 경우 퇴직금 지급 지연으로 인해 지연이자가 발생하고, 근로기준법 위반으로 처벌받을 수 있습니다.",
        "requirements": {
            "min_length": 100,
            "style": "스토리텔링",
            "must_include": ["상황 묘사", "결말 또는 법적 결과"],
            "detailed_guide": """
**반드시 포함해야 할 내용**:
1. 상황 묘사: 현실적인 사례를 스토리텔링 형식으로 구체적으로 묘사
2. 결말 또는 법적 결과: 해당 상황의 결말이나 법적 결과를 반드시 포함
   - 예: "이 경우 퇴직금 지급 지연으로 인해 지연이자가 발생하고, 근로기준법 위반으로 처벌받을 수 있습니다."
   - 예: "결국 A씨는 변호사를 통해 퇴직금을 받았고, 회사는 지연이자를 지급해야 했습니다."

**작성 형식**:
- 스토리텔링 형식으로 상황을 구체적으로 묘사
- 반드시 결말이나 법적 결과를 포함하여 독자가 이해할 수 있도록 작성
            """.strip()
        }
    },
    "core_concepts": {
        "name": "핵심 개념 정리",
        "description": "관련 법령, 기본 개념, 판례 포함",
        "example": "근로기준법 제34조에 따르면...",
        "requirements": {
            "min_length": 200,
            "must_include": ["법령 조문 번호", "기본 개념 설명", "판례 번호"],
            "detailed_guide": """
**반드시 포함해야 할 내용**:
1. 법령 조문 번호 인용 및 설명 (최소 100자 이상)
   - 예: "형법 제347조에 따르면, 사기죄는 타인을 기망하여 재산상의 이익을 취득하는 범죄입니다."
   - 각 법령 조문의 구성요건과 적용 요건을 구체적으로 설명하세요.

2. 기본 개념 설명 (최소 50자 이상)
   - 법률 용어를 "용어(설명)" 형식으로 설명하세요.
   - 예: "기망(상대방을 속이는 행위)", "처분행위(재산을 처분하는 행위)"

3. 판례 번호 인용 및 요지 (최소 50자 이상)
   - 예: "대법원 2014고합693 판결에서는 사기죄의 구성요건에 대해 명확히 밝혔습니다."

**작성 형식**:
- H3 하위 섹션(###)을 사용하여 각 법령별로 구분하세요.
- 예: "### 형법 제347조의 사기죄", "### 특경법 제3조의 적용 요건"
            """.strip()
        }
    },
    "qa": {
        "name": "자주 묻는 질문 (Q&A)",
        "description": "3-5개 질문/답변 구성",
        "example": "Q1. 퇴직금은 언제까지 지급해야 하나요?\nA1. [답변]",
        "requirements": {
            "min_count": 3,
            "max_count": 5,
            "format": "Q&A 형식",
            "reusable": True,  # 유튜브 쇼츠, 릴스로 재활용
            "detailed_guide": """
**반드시 포함해야 할 내용**:
1. 각 질문은 독자가 실제로 궁금해할 만한 내용으로 작성하세요.
2. 각 답변은 최소 100자 이상으로 상세하게 작성하세요.
3. 답변에는 반드시 법령 조문 번호나 판례 번호를 인용하세요.
   - 예: "근로기준법 제34조에 따르면..." 또는 "대법원 2020다123456 판결에서는..."

**작성 형식**:
- Q1, Q2, Q3 형식으로 질문을 번호 매기세요.
- A1, A2, A3 형식으로 답변을 번호 매기세요.
- 각 답변은 H3 하위 섹션(###)을 사용하여 구분할 수 있습니다.
            """.strip()
        }
    },
    "checklist": {
        "name": "체크리스트 / To-do 리스트",
        "description": "독자가 지금 당장 무엇을 해야 하는지 한눈에 볼 수 있는 bullet 형식",
        "example": "퇴직금 지급 전 체크할 것 3가지:\n- [ ] 항목 1\n- [ ] 항목 2",
        "requirements": {
            "min_count": 3,
            "max_count": 7,
            "format": "bullet 형식",
            "reusable": True,  # 인포그래픽, 카드뉴스로 재활용
        }
    },
    "warnings": {
        "name": "주의할 점 & 예외 사항",
        "description": "예외 조항, 판례로 달라지는 부분, 오해하기 쉬운 지점 정리",
        "example": "단, 합의서에 명시된 경우에는 예외적으로...",
        "requirements": {
            "min_length": 100,
            "format": "별도 박스형 섹션",
        }
    },
    "summary": {
        "name": "마무리 요약 & 권장 행동",
        "description": "핵심 정리 및 권장 행동",
        "example": "핵심을 다시 정리하고, 필요 시 변호사 상담을 권장",
        "requirements": {
            "min_length": 100,
            "must_include": ["핵심 정리", "권장 행동"],
        }
    },
    "disclaimer": {
        "name": "디스클레이머",
        "description": "필수 법적 고지 문구",
        "example": "",
        "requirements": {
            "required": False,  # 필수 섹션 아님 (삭제됨)
            "fixed_text": "",  # 디스클레이머 문구 삭제
        }
    }
}

# 섹션 순서 (작성 순서)
SECTION_ORDER = [
    "title",
    "tldr",
    "situation_example",
    "core_concepts",
    "qa",
    "checklist",
    "warnings",
    "summary",
    "disclaimer",
]

# 필수 섹션 목록 (실제로 필수인 섹션만)
REQUIRED_SECTIONS = [
    section_id
    for section_id, section_info in BLOG_SECTIONS.items()
    if section_info.get("requirements", {}).get("required", False) or section_id == "title"
]
# title과 disclaimer만 필수, 나머지는 선택적

# 재사용 가능한 섹션 목록
REUSABLE_SECTIONS = [
    section_id
    for section_id, section_info in BLOG_SECTIONS.items()
    if section_info.get("requirements", {}).get("reusable", False)
]


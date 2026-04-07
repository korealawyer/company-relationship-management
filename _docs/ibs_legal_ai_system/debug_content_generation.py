#!/usr/bin/env python3
"""
단계별 콘텐츠 생성 디버그 스크립트

각 노드를 하나씩 실행하면서 상태를 확인합니다.
문서 검색 → 문서 요약 → 프롬프트 생성 → 초안 작성 순서로 진행합니다.
"""

import sys
from pathlib import Path
import json

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from src.rag import VectorStore, EmbeddingGenerator, LLMManager
from src.rag.content_workflow import ContentWorkflow, ContentWorkflowState
from config.settings import settings

import logging
from datetime import datetime

# 상세한 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("debug_content_generation.log", encoding="utf-8"),
    ]
)
logger = logging.getLogger(__name__)


def print_section(title: str):
    """섹션 제목 출력"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


def print_state_info(state: ContentWorkflowState, step_name: str):
    """상태 정보 출력"""
    print(f"\n[{step_name} 완료] 상태 정보:")
    print(f"  - topic: {state.get('topic', 'N/A')[:50]}...")
    print(f"  - context 길이: {len(state.get('context', ''))}자")
    summarized_ctx = state.get('summarized_context', '')
    print(f"  - summarized_context 길이: {len(summarized_ctx) if summarized_ctx else 0}자")
    print(f"  - references 수: {len(state.get('references', []))}개")
    prompt = state.get('prompt', '')
    print(f"  - prompt 길이: {len(prompt) if prompt else 0}자")
    draft = state.get('draft', '')
    print(f"  - draft 길이: {len(draft) if draft else 0}자")
    print(f"  - error: {state.get('error', 'None')}")
    print(f"  - revision_count: {state.get('revision_count', 0)}")


def safe_input(prompt: str) -> str:
    """안전한 입력 (디버그용)"""
    try:
        return input(prompt)
    except (EOFError, KeyboardInterrupt):
        return ""


def debug_step_by_step():
    """단계별 디버그 실행"""
    
    print("=" * 80)
    print("콘텐츠 생성 워크플로우 단계별 디버그")
    print("=" * 80)
    
    # 테스트 파라미터
    topic = "사기죄와 특경법 적용 유무의 차이 설명해줘"
    content_type = "blog"
    n_references = 5
    max_revisions = 2  # 디버그를 위해 2로 제한
    
    print(f"\n테스트 파라미터:")
    print(f"  - topic: {topic}")
    print(f"  - content_type: {content_type}")
    print(f"  - n_references: {n_references}")
    print(f"  - max_revisions: {max_revisions}")
    
    # 초기화
    print_section("1. 컴포넌트 초기화")
    try:
        vector_store = VectorStore()
        embedding_generator = EmbeddingGenerator()
        llm_manager = LLMManager()
        content_workflow = ContentWorkflow(
            vector_store=vector_store,
            embedding_generator=embedding_generator,
            llm_manager=llm_manager
        )
        print("✅ 초기화 완료")
    except Exception as e:
        print(f"❌ 초기화 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        return
    
    # 초기 상태 설정
    state: ContentWorkflowState = {
        "topic": topic,
        "content_type": content_type,
        "style": None,
        "target_length": None,
        "include_sections": [],
        "keywords": [],
        "document_types": None,
        "search_results": [],
        "context": "",
        "summarized_context": None,
        "references": [],
        "prompt": None,
        "draft": None,
        "structured_content": None,
        "structure_score": None,
        "content_quality_score": None,
        "legal_accuracy_score": None,
        "evaluation_score": None,
        "evaluation_feedback": [],
        "metadata": {},
        "reusable_blocks": {},
        "version": datetime.now().strftime("%Y%m%d"),
        "n_references": n_references,
        "revision_count": 0,
        "max_revisions": max_revisions,
        "should_rewrite": False,
        "previous_score": None,
        "error": None,
    }
    
    safe_input("\n[Enter] 다음 단계로 진행...")
    
    # Step 1: 문서 검색
    print_section("2. 문서 검색 (search_documents)")
    try:
        state = content_workflow._search_documents_node(state)
        print_state_info(state, "검색 완료")
        
        if state.get("error"):
            print(f"[ERROR] 검색 오류: {state['error']}")
            return
        
        search_results = state.get("search_results", [])
        context = state.get("context", "")
        references = state.get("references", [])
        
        print(f"\n검색 결과 상세:")
        print(f"  - 검색 결과 수: {len(search_results)}개")
        print(f"  - 컨텍스트 길이: {len(context)}자")
        print(f"  - 참고 문서 수: {len(references)}개")
        
        if search_results:
            print(f"\n검색 결과 미리보기 (최대 3개):")
            for i, res in enumerate(search_results[:3], 1):
                metadata = res.get("metadata", {})
                res_id = res.get("id", "N/A")
                print(f"\n  {i}. ID: {res_id[:50]}...")
                print(f"     타입: {metadata.get('type', 'N/A')}")
                print(f"     제목: {metadata.get('title', 'N/A')[:60]}...")
                print(f"     거리: {res.get('distance', 'N/A')}")
        
        if context:
            print(f"\n컨텍스트 미리보기 (처음 500자):")
            print("-" * 80)
            print(context[:500] + "..." if len(context) > 500 else context)
            print("-" * 80)
        else:
            print("\n⚠️ 컨텍스트가 비어있습니다!")
            
    except Exception as e:
        print(f"[ERROR] 검색 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        return
    
    safe_input("\n[Enter] 다음 단계로 진행...")
    
    # Step 2: 문서 요약 (새로 추가된 단계)
    print_section("3. 문서 요약 (summarize_documents)")
    try:
        state = content_workflow._summarize_documents_node(state)
        print_state_info(state, "문서 요약 완료")
        
        if state.get("error"):
            print(f"[ERROR] 문서 요약 오류: {state['error']}")
            # 요약 오류 시에도 원본 컨텍스트로 진행 가능하도록 return 하지 않음
        
        summarized_context = state.get("summarized_context", "")
        original_context_length = len(state.get("context", ""))
        
        if summarized_context:
            print(f"\n요약 결과 미리보기 (전체 내용):")
            print(summarized_context)
            print(f"\n원본 컨텍스트 길이: {original_context_length}자")
            print(f"요약된 컨텍스트 길이: {len(summarized_context)}자")
            if original_context_length > 0:
                reduction_rate = (1 - len(summarized_context) / original_context_length) * 100
                print(f"감소율: {reduction_rate:.1f}%")
        else:
            print("[WARNING] 문서 요약 결과가 비어있습니다. 원본 컨텍스트가 사용됩니다.")
            
    except Exception as e:
        print(f"[ERROR] 문서 요약 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        # 요약 실패 시에도 원본 컨텍스트로 진행 가능하도록 return 하지 않음
    
    safe_input("\n[Enter] 다음 단계로 진행...")
    
    # Step 3: 프롬프트 생성 (단계 번호 업데이트)
    print_section("4. 프롬프트 생성 (generate_prompt)")
    try:
        state = content_workflow._generate_prompt_node(state)
        print_state_info(state, "프롬프트 생성 완료")
        
        if state.get("error"):
            print(f"[ERROR] 프롬프트 생성 오류: {state['error']}")
            return
        
        prompt = state.get("prompt", "")
        if prompt:
            # 프롬프트 길이 상세 계산
            import re
            prompt_length_total = len(prompt)
            prompt_length_no_spaces = len(re.sub(r'\s+', '', prompt))
            
            # 토큰 수 추정 (한글 기준: 1자 ≈ 1토큰, 영문 기준: 4자 ≈ 3토큰)
            # 간단한 추정: 전체 길이의 0.75배 (한글과 영문 혼합 고려)
            estimated_tokens = int(prompt_length_total * 0.75)
            
            # 프롬프트 구성 요소 분석
            context_in_prompt = state.get("context", "")
            summarized_context_in_prompt = state.get("summarized_context", "")
            
            # 프롬프트 내 컨텍스트 길이 추정 (프롬프트에 포함된 컨텍스트)
            context_length_in_prompt = 0
            if summarized_context_in_prompt and summarized_context_in_prompt in prompt:
                context_length_in_prompt = len(summarized_context_in_prompt)
            elif context_in_prompt and context_in_prompt in prompt:
                context_length_in_prompt = len(context_in_prompt)
            
            print(f"\n프롬프트 길이 정보:")
            print(f"  - 전체 길이: {prompt_length_total:,}자")
            print(f"  - 공백 제외 길이: {prompt_length_no_spaces:,}자")
            print(f"  - 추정 토큰 수: {estimated_tokens:,}토큰 (약 {estimated_tokens/1000:.1f}K 토큰)")
            if context_length_in_prompt > 0:
                context_ratio = (context_length_in_prompt / prompt_length_total) * 100
                print(f"  - 컨텍스트 길이: {context_length_in_prompt:,}자 ({context_ratio:.1f}%)")
                print(f"  - 프롬프트 지시사항 길이: {prompt_length_total - context_length_in_prompt:,}자 ({100 - context_ratio:.1f}%)")
            
            # 프롬프트 구성 요소 분석
            print(f"\n프롬프트 구성 요소 분석:")
            if "절대 필수" in prompt or "최우선" in prompt:
                print(f"  - ✅ 길이 요구사항 포함됨")
            if "참고 문서" in prompt or "CONTEXT" in prompt:
                print(f"  - ✅ 참고 문서 포함됨")
            if "기승전결" in prompt:
                print(f"  - ✅ 구조 지시사항 포함됨")
            if "예시" in prompt or "example" in prompt.lower():
                print(f"  - ✅ 예시 포함됨")
            
            print(f"\n프롬프트 미리보기 (처음 1000자):")
            print("-" * 80)
            print(prompt[:1000] + "..." if len(prompt) > 1000 else prompt)
            print("-" * 80)
            
            # 프롬프트 끝부분 미리보기 (컨텍스트 포함 여부 확인)
            if len(prompt) > 1000:
                print(f"\n프롬프트 끝부분 미리보기 (마지막 500자):")
                print("-" * 80)
                print("..." + prompt[-500:])
                print("-" * 80)
        else:
            print("\n⚠️ 프롬프트가 비어있습니다!")
            
    except Exception as e:
        print(f"[ERROR] 프롬프트 생성 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        return
    
    safe_input("\n[Enter] 다음 단계로 진행...")
    
    # Step 4: 초안 작성
    print_section("5. 초안 작성 (generate_draft)")
    try:
        state = content_workflow._generate_draft_node(state)
        print_state_info(state, "초안 작성 완료")
        
        if state.get("error"):
            print(f"[ERROR] 초안 작성 오류: {state['error']}")
        
        draft = state.get("draft", "")
        if draft:
            # 공백 제외 길이 계산
            import re
            text_length_no_spaces = len(re.sub(r'\s+', '', draft))
            print(f"\n초안 길이 정보:")
            print(f"  - 전체 길이: {len(draft):,}자")
            print(f"  - 공백 제외 길이: {text_length_no_spaces:,}자")
            
            print(f"\n초안 전체 내용:")
            print("=" * 80)
            print(draft)
            print("=" * 80)
        else:
            print("\n⚠️ 초안이 비어있습니다!")
            
    except Exception as e:
        print(f"[ERROR] 초안 작성 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        return
    
    safe_input("\n[Enter] 다음 단계로 진행...")
    
    # Step 5: 평가
    print_section("6. 평가 (evaluate)")
    try:
        state = content_workflow._evaluate_node(state)
        print_state_info(state, "평가 완료")
        
        structure_score = state.get("structure_score", 0.0)
        content_quality_score = state.get("content_quality_score", 0.0)
        legal_accuracy_score = state.get("legal_accuracy_score", 0.0)
        evaluation_feedback = state.get("evaluation_feedback", [])
        
        print(f"\n평가 점수:")
        print(f"  - 구조 점수: {structure_score:.1f}/30")
        print(f"  - 내용 품질 점수: {content_quality_score:.1f}/40")
        print(f"  - 법적 정확성 점수: {legal_accuracy_score:.1f}/30")
        total_score = structure_score + content_quality_score + legal_accuracy_score
        print(f"  - 총점: {total_score:.1f}/100")
        
        if evaluation_feedback:
            print(f"\n평가 피드백 (최대 10개):")
            for i, fb in enumerate(evaluation_feedback[:10], 1):
                print(f"  {i}. {fb}")
        else:
            print("\n피드백 없음")
            
    except Exception as e:
        print(f"[ERROR] 평가 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        return
    
    # 상태 저장
    output_file = "debug_content_generation_state.json"
    try:
        summarized_ctx = state.get("summarized_context", "")
        output_result = {
            "topic": state.get("topic"),
            "content_type": state.get("content_type"),
            "context_length": len(state.get("context", "")),
            "summarized_context_length": len(summarized_ctx) if summarized_ctx else 0,
            "draft_length": len(state.get("draft", "")),
            "evaluation_score": state.get("evaluation_score"),
            "structure_score": state.get("structure_score"),
            "content_quality_score": state.get("content_quality_score"),
            "legal_accuracy_score": state.get("legal_accuracy_score"),
            "revision_count": state.get("revision_count", 0),
            "error": state.get("error"),
            "evaluation_feedback": state.get("evaluation_feedback", [])[:20],  # 최대 20개만
            "references_count": len(state.get("references", [])),
        }
        
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(output_result, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ 상태를 {output_file}에 저장했습니다.")
    except Exception as e:
        print(f"⚠️ 상태 저장 실패: {str(e)}")
    
    print("\n" + "=" * 80)
    print("단계별 디버그 완료")
    print("=" * 80)


if __name__ == "__main__":
    try:
        debug_step_by_step()
    except KeyboardInterrupt:
        print("\n\n⚠️ 사용자에 의해 중단되었습니다.")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ 치명적 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

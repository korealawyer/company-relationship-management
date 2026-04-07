#!/usr/bin/env python3
"""
간단한 워크플로우 디버그 스크립트

전체 워크플로우를 실행하되, 각 단계의 결과를 상세히 출력합니다.
"""

import sys
from pathlib import Path
import json

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from src.rag import VectorStore, EmbeddingGenerator, LLMManager
from src.rag.content_workflow import ContentWorkflow
from config.settings import settings

import logging

# 상세한 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
    ]
)
logger = logging.getLogger(__name__)


def debug_full_workflow():
    """전체 워크플로우 디버그 실행"""
    
    print("=" * 80)
    print("콘텐츠 생성 워크플로우 전체 실행 디버그")
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
    print("\n[1] 컴포넌트 초기화 중...")
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
    
    # 워크플로우 실행
    print("\n[2] 워크플로우 실행 중...")
    print("   (각 단계의 로그를 확인하세요)")
    
    try:
        result = content_workflow.run(
            topic=topic,
            content_type=content_type,
            style=None,
            target_length=None,
            include_sections=None,
            keywords=None,
            document_types=None,
            n_references=n_references,
            max_revisions=max_revisions,
        )
        
        print("\n" + "=" * 80)
        print("워크플로우 실행 완료")
        print("=" * 80)
        
        # 결과 분석
        print(f"\n결과 분석:")
        print(f"  - draft 길이: {len(result.get('draft', ''))}자")
        print(f"  - evaluation_score: {result.get('evaluation_score')}")
        print(f"  - revision_count: {result.get('revision_count', 0)}")
        print(f"  - error: {result.get('error', 'None')}")
        print(f"  - 피드백 수: {len(result.get('evaluation_feedback', []))}개")
        print(f"  - 참고 문서 수: {len(result.get('references', []))}개")
        
        draft = result.get("draft", "")
        if draft:
            print(f"\n✅ 콘텐츠 생성 성공!")
            print(f"\n콘텐츠 미리보기 (처음 500자):")
            print("-" * 80)
            print(draft[:500] + "..." if len(draft) > 500 else draft)
            print("-" * 80)
        else:
            print(f"\n❌ 콘텐츠가 비어있습니다!")
            print(f"  - 에러: {result.get('error', 'None')}")
            print(f"  - 평가 점수: {result.get('evaluation_score')}")
            print(f"  - 재시도 횟수: {result.get('revision_count', 0)}")
        
        # 상태 저장
        output_file = "debug_workflow_result.json"
        try:
            output_result = {
                "topic": result.get("topic"),
                "content_type": result.get("content_type"),
                "draft": result.get("draft", ""),
                "evaluation_score": result.get("evaluation_score"),
                "revision_count": result.get("revision_count", 0),
                "error": result.get("error"),
                "evaluation_feedback": result.get("evaluation_feedback", [])[:10],  # 최대 10개만
                "references": result.get("references", []),
            }
            
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(output_result, f, ensure_ascii=False, indent=2)
            
            print(f"\n✅ 결과를 {output_file}에 저장했습니다.")
        except Exception as e:
            print(f"⚠️ 결과 저장 실패: {str(e)}")
        
    except Exception as e:
        print(f"\n❌ 워크플로우 실행 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # 재귀 제한 오류인 경우
        if "recursion limit" in str(e).lower():
            print("\n" + "=" * 80)
            print("재귀 제한 오류 분석")
            print("=" * 80)
            print("재작성 루프가 너무 많이 반복되었습니다.")
            print("가능한 원인:")
            print("  1. 평가 점수가 계속 70점 미만")
            print("  2. 재작성 후에도 점수가 개선되지 않음")
            print("  3. revision_count가 제대로 증가하지 않음")
            print("\n해결 방법:")
            print("  1. max_revisions를 줄이기 (예: 1 또는 2)")
            print("  2. 평가 기준 완화 (임계값을 낮추기)")
            print("  3. 재작성 로직 개선")


if __name__ == "__main__":
    try:
        debug_full_workflow()
    except KeyboardInterrupt:
        print("\n\n⚠️ 사용자에 의해 중단되었습니다.")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ 치명적 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


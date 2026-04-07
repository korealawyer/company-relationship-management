"""프롬프트 템플릿 로더"""

from pathlib import Path
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)


class PromptLoader:
    """프롬프트 템플릿 파일 로더"""
    
    # 필수 프롬프트 파일 목록
    REQUIRED_FILES = [
        "blog_base.txt",
        "blog_instructions.txt",
        "system_blog.txt",
        "system_base.txt",
        "basic_template.txt",
    ]
    
    # 선택적 프롬프트 파일 목록 (없어도 동작하지만 있으면 사용)
    OPTIONAL_FILES = [
        "blog_sections_template.txt",
    ]
    
    def __init__(self, prompts_dir: Optional[Path] = None, validate: bool = True):
        """
        프롬프트 로더 초기화
        
        Args:
            prompts_dir: 프롬프트 템플릿 파일이 있는 디렉토리
                       None이면 기본 경로 사용 (src/rag/prompts/)
            validate: 필수 파일 검증 여부 (기본값: True)
        
        Raises:
            FileNotFoundError: 필수 프롬프트 파일이 없을 때
        """
        if prompts_dir is None:
            # 현재 파일 기준으로 prompts 디렉토리 찾기
            current_file = Path(__file__)
            prompts_dir = current_file.parent / "prompts"
        
        self.prompts_dir = Path(prompts_dir)
        self._cache = {}  # 파일 내용 캐시
        
        if not self.prompts_dir.exists():
            error_msg = f"프롬프트 디렉토리가 존재하지 않습니다: {self.prompts_dir}"
            logger.error(error_msg)
            raise FileNotFoundError(error_msg)
        
        # 필수 파일 검증
        if validate:
            self.validate_required_files()
    
    def validate_required_files(self) -> None:
        """
        필수 프롬프트 파일 존재 여부 검증
        
        Raises:
            FileNotFoundError: 필수 파일이 없을 때
        """
        missing_files = []
        
        for filename in self.REQUIRED_FILES:
            file_path = self.prompts_dir / filename
            if not file_path.exists():
                missing_files.append(str(file_path))
        
        if missing_files:
            error_msg = (
                f"필수 프롬프트 파일이 없습니다. 다음 파일들을 확인해주세요:\n"
                + "\n".join(f"  - {f}" for f in missing_files)
            )
            logger.error(error_msg)
            raise FileNotFoundError(error_msg)
        
        logger.info(f"필수 프롬프트 파일 검증 완료: {len(self.REQUIRED_FILES)}개 파일 확인됨")
    
    def load_template(self, filename: str, use_cache: bool = True, required: bool = False) -> str:
        """
        템플릿 파일 로드
        
        Args:
            filename: 템플릿 파일명 (예: "blog_base.txt")
            use_cache: 캐시 사용 여부
            required: 필수 파일 여부 (True이면 파일이 없을 때 예외 발생)
        
        Returns:
            템플릿 내용 (문자열)
        
        Raises:
            FileNotFoundError: required=True이고 파일이 없을 때
        """
        # 캐시 확인
        if use_cache and filename in self._cache:
            return self._cache[filename]
        
        # 파일 경로
        file_path = self.prompts_dir / filename
        
        if not file_path.exists():
            error_msg = f"프롬프트 템플릿 파일이 없습니다: {file_path}"
            logger.error(error_msg)
            if required:
                raise FileNotFoundError(error_msg)
            return ""
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read().strip()
            
            if not content:
                error_msg = f"프롬프트 템플릿 파일이 비어있습니다: {file_path}"
                logger.error(error_msg)
                if required:
                    raise ValueError(error_msg)
                return ""
            
            # 캐시에 저장
            if use_cache:
                self._cache[filename] = content
            
            logger.debug(f"프롬프트 템플릿 로드 완료: {filename}")
            return content
        
        except Exception as e:
            error_msg = f"프롬프트 템플릿 로드 실패: {filename}, 오류: {str(e)}"
            logger.error(error_msg)
            if required:
                raise
            return ""
    
    def format_template(
        self,
        filename: str,
        required: bool = False,
        **kwargs
    ) -> str:
        """
        템플릿 파일을 로드하고 플레이스홀더를 치환
        
        Args:
            filename: 템플릿 파일명
            required: 필수 파일 여부 (True이면 파일이 없을 때 예외 발생)
            **kwargs: 플레이스홀더 치환 값 (예: TOPIC="사기죄", CONTEXT="...")
        
        Returns:
            치환된 템플릿 내용
        
        Raises:
            FileNotFoundError: required=True이고 파일이 없을 때
        """
        template = self.load_template(filename, required=required)
        
        if not template and required:
            raise ValueError(f"프롬프트 템플릿이 비어있습니다: {filename}")
        
        # 플레이스홀더 치환
        for key, value in kwargs.items():
            placeholder = f"{{{key}}}"
            template = template.replace(placeholder, str(value))
        
        return template
    
    def clear_cache(self):
        """캐시 초기화"""
        self._cache.clear()
        logger.debug("프롬프트 캐시 초기화 완료")


# 전역 인스턴스 (싱글톤)
_prompt_loader: Optional[PromptLoader] = None


def get_prompt_loader(prompts_dir: Optional[Path] = None) -> PromptLoader:
    """
    프롬프트 로더 인스턴스 반환 (싱글톤)
    
    Args:
        prompts_dir: 프롬프트 디렉토리 (첫 호출 시에만 적용)
    
    Returns:
        PromptLoader 인스턴스
    """
    global _prompt_loader
    
    if _prompt_loader is None:
        _prompt_loader = PromptLoader(prompts_dir)
    
    return _prompt_loader


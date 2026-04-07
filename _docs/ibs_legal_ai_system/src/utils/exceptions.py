"""커스텀 예외 클래스"""

from typing import Optional, Dict, Any

# 사용자 친화적 에러 메시지 템플릿
ERROR_MESSAGES = {
    "EMBEDDING_FAILED": "문서 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    "SEARCH_FAILED": "검색 중 오류가 발생했습니다. 검색어를 확인해주세요.",
    "VECTOR_STORE_ERROR": "데이터베이스 연결 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    "LLM_ERROR": "답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    "SESSION_ERROR": "세션 관리 중 오류가 발생했습니다. 새로고침 후 다시 시도해주세요.",
    "VALIDATION_ERROR": "입력 데이터에 오류가 있습니다. 입력값을 확인해주세요.",
    "CONFIGURATION_ERROR": "시스템 설정에 오류가 있습니다. 관리자에게 문의해주세요.",
    "GENERAL_ERROR": "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
}


class LegalAIException(Exception):
    """
    기본 예외 클래스
    
    모든 커스텀 예외의 기본 클래스입니다.
    사용자 친화적인 에러 메시지를 제공합니다.
    """
    
    def __init__(
        self, 
        message: str, 
        code: str = "GENERAL_ERROR",
        details: Optional[Dict[str, Any]] = None,
        user_friendly: bool = True
    ):
        """
        예외 초기화
        
        Args:
            message: 기술적 에러 메시지
            code: 에러 코드
            details: 추가 상세 정보
            user_friendly: 사용자 친화적 메시지 사용 여부
        """
        self.message = message
        self.code = code
        self.details = details or {}
        self.user_friendly = user_friendly
        
        # 사용자 친화적 메시지 가져오기
        if user_friendly and code in ERROR_MESSAGES:
            self.user_message = ERROR_MESSAGES[code]
        else:
            self.user_message = message
        
        super().__init__(self.message)
    
    def to_dict(self, include_technical: bool = False) -> Dict[str, Any]:
        """
        예외를 딕셔너리로 변환
        
        Args:
            include_technical: 기술적 메시지 포함 여부
            
        Returns:
            에러 딕셔너리
        """
        result = {
            "error": {
                "code": self.code,
                "message": self.user_message,
            }
        }
        
        if include_technical:
            result["error"]["technical_message"] = self.message
            result["error"]["details"] = self.details
        
        return result


class VectorStoreError(LegalAIException):
    """벡터 스토어 관련 에러"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "VECTOR_STORE_ERROR", details)


class EmbeddingError(LegalAIException):
    """임베딩 생성 에러"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "EMBEDDING_ERROR", details)


class SearchError(LegalAIException):
    """검색 에러"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "SEARCH_ERROR", details)


class LLMError(LegalAIException):
    """LLM 관련 에러"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "LLM_ERROR", details)


class SessionError(LegalAIException):
    """세션 관리 에러"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "SESSION_ERROR", details)


class ValidationError(LegalAIException):
    """데이터 검증 에러"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "VALIDATION_ERROR", details)


class ConfigurationError(LegalAIException):
    """설정 관련 에러"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "CONFIGURATION_ERROR", details)


"""FastAPI 메인 애플리케이션"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from config.settings import settings
from .routers import search, ask, health, admin, monitoring, generate
from .middleware import RateLimitMiddleware, LoggingMiddleware
from ..utils.logging_config import setup_logging
from ..utils.exceptions import LegalAIException

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 생명주기 관리"""
    # Startup
    try:
        logger.info("IBS 법률 AI 시스템 API 서버 시작")
        logger.info(f"환경: {settings.log_level}")
        
        # 필수 설정 검증
        if not settings.openai_api_key:
            logger.warning("OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.")
        else:
            logger.info("OpenAI API 키가 설정되어 있습니다.")
        
        # 벡터 DB 초기화 확인 (선택적)
        try:
            from src.api.dependencies import get_vector_store
            vector_store = get_vector_store()
            count = vector_store.get_count()
            logger.info(f"벡터 DB 연결 성공: {count}개 문서")
        except Exception as e:
            logger.warning(f"벡터 DB 초기화 경고 (서버는 계속 실행됩니다): {e}")
        
        yield
    except Exception as e:
        logger.error(f"서버 시작 실패: {e}", exc_info=True)
        raise
    finally:
        # Shutdown
        logger.info("IBS 법률 AI 시스템 API 서버 종료")


# FastAPI 앱 생성
app = FastAPI(
    title="IBS 법률 AI 시스템 API",
    description="법률 정보 RAG 기반 질의응답 API",
    version="0.1.0",
    lifespan=lifespan,
)

# 미들웨어 추가 (순서 중요)
# FastAPI에서 미들웨어는 역순으로 실행되므로, 
# CORS를 가장 먼저 추가하여 가장 나중에 실행되도록 함
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# RateLimitMiddleware
app.add_middleware(RateLimitMiddleware, default_limit=settings.rate_limit_default)

# LoggingMiddleware를 가장 나중에 추가하여 가장 먼저 실행되도록 함
app.add_middleware(LoggingMiddleware)

# 로깅 설정
setup_logging()

# 라우터 등록
app.include_router(search.router, prefix="/api/v1", tags=["search"])
app.include_router(ask.router, prefix="/api/v1", tags=["ask"])
app.include_router(generate.router, prefix="/api/v1", tags=["generate"])
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(monitoring.router, prefix="/api/v1", tags=["monitoring"])


@app.exception_handler(LegalAIException)
async def legal_ai_exception_handler(request, exc: LegalAIException):
    """LegalAI 커스텀 예외 핸들러"""
    logger.error(f"LegalAI 예외 발생: {exc.code} - {exc.message}", exc_info=True)
    return JSONResponse(
        status_code=400,
        content=exc.to_dict(),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """전역 예외 핸들러"""
    logger.error(f"예외 발생: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "내부 서버 오류가 발생했습니다.",
                "details": {}
            }
        },
    )


if __name__ == "__main__":
    """직접 실행 시"""
    import uvicorn
    uvicorn.run(
        "src.api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload,
    )


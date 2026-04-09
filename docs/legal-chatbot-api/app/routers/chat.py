"""
Chat API Router - 채팅 관련 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from app.database import get_db
from app.schemas import (
    ChatStartRequest,
    ChatStartResponse,
    ChatMessageRequest,
    ChatMessageResponse,
    CaseLogResponse,
    ConversationHistoryResponse,
    MessageSchema
)
from app.models import Session as SessionModel, Message, CaseLog
from app.services.chat_service import LegalChatService
import uuid
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["chat"])
chat_service = LegalChatService()


@router.post("/start", response_model=ChatStartResponse)
async def start_chat(
    request: ChatStartRequest,
    db: DBSession = Depends(get_db)
):
    """
    새로운 상담 세션 시작
    
    - 세션 ID 생성
    - 접속 정보 저장 (IP, User-Agent, Location)
    - 환영 메시지 반환
    """
    session_id = str(uuid.uuid4())
    
    # 세션 생성
    session = SessionModel(
        id=session_id,
        client_ip=request.client_ip,
        user_agent=request.user_agent,
        location=request.location
    )
    db.add(session)
    
    # CaseLog 초기화
    case_log = CaseLog(
        session_id=session_id,
        status="gathering_info"
    )
    db.add(case_log)
    
    db.commit()
    
    welcome_message = """안녕하세요. 법률 상담 AI 보조원입니다.

변호사님과의 상담 전에 사건 내용을 체계적으로 정리해 드리겠습니다.
편안하게 어떤 일이 있으셨는지 말씀해 주세요."""
    
    # 환영 메시지 저장
    ai_msg = Message(
        session_id=session_id,
        role="ai",
        content=welcome_message
    )
    db.add(ai_msg)
    db.commit()
    
    return ChatStartResponse(
        session_id=session_id,
        message=welcome_message
    )


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(
    request: ChatMessageRequest,
    db: DBSession = Depends(get_db)
):
    """
    메시지 전송 및 AI 응답 받기
    
    - 사용자 메시지 저장
    - AI 응답 생성
    - 사건 정보 추출 및 업데이트
    """
    # 세션 존재 확인
    session = db.query(SessionModel).filter(
        SessionModel.id == request.session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")
    
    if session.is_finished:
        raise HTTPException(status_code=400, detail="이미 종료된 세션입니다.")
    
    # AI 응답 생성
    ai_response, case_info = await chat_service.chat(
        db=db,
        session_id=request.session_id,
        user_message=request.message
    )
    
    return ChatMessageResponse(
        session_id=request.session_id,
        user_message=request.message,
        ai_message=ai_response,
        timestamp=datetime.utcnow()
    )


@router.get("/report/{session_id}", response_model=CaseLogResponse)
async def get_case_report(
    session_id: str,
    db: DBSession = Depends(get_db)
):
    """
    사건 일지 조회
    
    - 현재까지 수집된 사건 정보 반환
    """
    case_log = db.query(CaseLog).filter(
        CaseLog.session_id == session_id
    ).first()
    
    if not case_log:
        raise HTTPException(status_code=404, detail="사건 일지를 찾을 수 없습니다.")
    
    return CaseLogResponse(
        session_id=session_id,
        legal_category=case_log.legal_category,
        case_type=case_log.case_type,
        subject=case_log.subject,
        when_where=case_log.when_where,
        antagonist=case_log.antagonist,
        goal=case_log.goal,
        action=case_log.action,
        details=case_log.details,
        status=case_log.status,
        summary=case_log.summary
    )


@router.get("/history/{session_id}", response_model=ConversationHistoryResponse)
async def get_conversation_history(
    session_id: str,
    db: DBSession = Depends(get_db)
):
    """
    대화 내역 조회
    
    - 전체 대화 기록 반환
    """
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")
    
    messages = db.query(Message).filter(
        Message.session_id == session_id
    ).order_by(Message.created_at).all()
    
    return ConversationHistoryResponse(
        session_id=session_id,
        messages=[MessageSchema.from_orm(msg) for msg in messages]
    )


@router.post("/confirm/{session_id}")
async def confirm_case_log(
    session_id: str,
    db: DBSession = Depends(get_db)
):
    """
    사건 일지 확정 및 세션 종료
    """
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")
    
    chat_service.confirm_case_log(db, session_id)
    
    return {"message": "사건 일지가 확정되었습니다.", "session_id": session_id}

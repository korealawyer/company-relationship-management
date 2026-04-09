"""
Pydantic schemas for API request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class ChatStartRequest(BaseModel):
    """상담 세션 시작 요청"""
    client_ip: Optional[str] = None
    user_agent: Optional[str] = None
    location: Optional[str] = None


class ChatStartResponse(BaseModel):
    """상담 세션 시작 응답"""
    session_id: str
    message: str


class ChatMessageRequest(BaseModel):
    """채팅 메시지 요청"""
    session_id: str
    message: str


class ChatMessageResponse(BaseModel):
    """채팅 메시지 응답"""
    session_id: str
    user_message: str
    ai_message: str
    timestamp: datetime


class MessageSchema(BaseModel):
    """메시지 스키마"""
    role: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class CaseLogResponse(BaseModel):
    """사건 일지 응답"""
    session_id: str
    legal_category: Optional[str] = None
    case_type: Optional[str] = None
    subject: Optional[str] = None
    when_where: Optional[str] = None
    antagonist: Optional[str] = None
    goal: Optional[str] = None
    action: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    status: str
    summary: Optional[str] = None
    
    class Config:
        from_attributes = True


class ConversationHistoryResponse(BaseModel):
    """대화 내역 응답"""
    session_id: str
    messages: List[MessageSchema]
    
    class Config:
        from_attributes = True

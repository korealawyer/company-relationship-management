"""
Database models for Legal Chatbot API
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class Session(Base):
    """상담 세션 테이블"""
    __tablename__ = "sessions"
    
    id = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_finished = Column(Boolean, default=False)
    
    # 접속 정보
    client_ip = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    location = Column(String, nullable=True)
    
    # Relationships
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
    case_log = relationship("CaseLog", back_populates="session", uselist=False, cascade="all, delete-orphan")


class Message(Base):
    """대화 메시지 테이블"""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    role = Column(String, nullable=False)  # 'user' or 'ai'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", back_populates="messages")


class CaseLog(Base):
    """사건 일지 테이블"""
    __tablename__ = "case_logs"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False, unique=True)
    
    # 사건 분류
    legal_category = Column(String, nullable=True)  # 민사, 형사, 가사 등
    case_type = Column(String, nullable=True)  # 살인, 사기, 이혼 등
    
    # 5W1H 요소
    subject = Column(Text, nullable=True)  # 주어
    when_where = Column(Text, nullable=True)  # 일시+장소
    antagonist = Column(Text, nullable=True)  # 상대방
    goal = Column(Text, nullable=True)  # 목적
    action = Column(Text, nullable=True)  # 행위
    
    # 추가 정보
    details = Column(JSON, nullable=True)  # 사건별 특화 정보
    status = Column(String, default="gathering_info")  # gathering_info, confirming, completed
    summary = Column(Text, nullable=True)  # 전체 요약
    
    # Relationships
    session = relationship("Session", back_populates="case_log")

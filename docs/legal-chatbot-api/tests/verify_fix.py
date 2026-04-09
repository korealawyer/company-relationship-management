
import pytest
from unittest.mock import MagicMock, patch
from langchain_core.messages import AIMessage
from app.services.chat_service import LegalChatService
from app.database import SessionLocal
from app.models import Message

import asyncio

async def test_chat_ratelimit_error_handling():
    """RateLimitError 발생 시 예외 처리가 잘 되는지 테스트"""
    service = LegalChatService()
    db = SessionLocal()
    session_id = "test-session-ratelimit"
    
    with patch("langchain_openai.ChatOpenAI.invoke", side_effect=Exception("RateLimitError: insufficient_quota")):
        ai_response, case_info = await service.chat(db, session_id, "test message")
        
        assert "OpenAI 할당량 초과" in ai_response
        assert case_info is None
        
        # Verify message was saved even if it's an error message
        saved_msg = db.query(Message).filter(Message.session_id == session_id, Message.role == "ai").first()
        assert saved_msg is not None
        assert "OpenAI 할당량 초과" in saved_msg.content
        
    db.close()

if __name__ == "__main__":
    asyncio.run(test_chat_ratelimit_error_handling())
    print("Verification test passed!")

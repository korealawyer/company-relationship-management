"""
Test cases for Legal Chatbot API
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, Base, engine
from sqlalchemy.orm import sessionmaker

# 테스트용 데이터베이스 설정
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


class TestChatAPI:
    """채팅 API 테스트"""
    
    def test_health_check(self):
        """헬스 체크 테스트"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    def test_start_chat(self):
        """상담 세션 시작 테스트"""
        response = client.post(
            "/chat/start",
            json={
                "client_ip": "127.0.0.1",
                "user_agent": "TestClient/1.0",
                "location": "Seoul, Korea"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "message" in data
        return data["session_id"]
    
    def test_send_message(self):
        """메시지 전송 테스트"""
        # 세션 시작
        session_id = self.test_start_chat()
        
        # 메시지 전송
        response = client.post(
            "/chat/message",
            json={
                "session_id": session_id,
                "message": "친구에게 돈을 빌려줬는데 안 갚아요."
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "ai_message" in data
        assert data["session_id"] == session_id
    
    def test_get_case_report(self):
        """사건 일지 조회 테스트"""
        # 세션 시작
        session_id = self.test_start_chat()
        
        # 리포트 조회
        response = client.get(f"/chat/report/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == session_id
        assert "status" in data
    
    def test_get_conversation_history(self):
        """대화 내역 조회 테스트"""
        # 세션 시작
        session_id = self.test_start_chat()
        
        # 대화 내역 조회
        response = client.get(f"/chat/history/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == session_id
        assert "messages" in data
        assert len(data["messages"]) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

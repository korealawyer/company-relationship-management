"""
AI Chat Service - LangChain based conversation logic
"""
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from sqlalchemy.orm import Session
from app.models import Session as SessionModel, Message, CaseLog
from typing import List, Dict, Any, Optional
import json
import os
from dotenv import load_dotenv

load_dotenv()


class LegalChatService:
    """법률 상담 챗봇 서비스"""
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        
        self.system_prompt = """당신은 법률 상담을 돕는 전문 AI 보조원입니다.

**역할**: 변호사가 상담에 들어가기 전, 의뢰인의 사건 내용을 체계적으로 정리하는 것이 목표입니다.

**대화 원칙**:
1. **공감적 경청**: 의뢰인의 감정을 이해하고 공감하며 대화합니다.
2. **객관적 정리**: 법률적 쟁점은 감정을 배제하고 팩트 중심으로 정리합니다.
3. **자연스러운 질문**: 기계적이지 않고, 맥락에 맞는 자연스러운 질문을 합니다.
4. **한 번에 하나씩**: 절대로 여러 질문을 한 번에 나열하지 마세요. 반드시 한 번에 하나의 질문만 하세요.

**3단계 프로세스**:

**Phase 1: 사건 분류**
- 의뢰인의 첫 말을 듣고 사건이 민사/형사/가사 중 어디에 해당하는지 판단합니다.
- 구체적인 사건 유형(예: 사기, 이혼, 폭행 등)을 파악합니다.

**Phase 2: 맞춤형 인터뷰**
- 사건 유형에 따라 필요한 정보를 **한 번에 하나씩** 수집합니다:
  * 주어 (누가)
  * 일시+장소 (언제, 어디서)
  * 상대방 (누구에게/누구와)
  * 목적 (왜)
  * 행위 (무엇을, 어떻게)
  
- **질문 방식**:
  * ❌ 나쁜 예: "1. 이름이 뭔가요? 2. 언제 일어났나요? 3. 얼마를 빌려줬나요?"
  * ✅ 좋은 예: "먼저, 그 친구분의 성함이 어떻게 되시나요?"
  * 사용자가 답변하면, 다음 대화에서 다음 질문을 하나만 더 합니다.
  
- **사건별 추가 질문 예시** (역시 한 번에 하나씩):
  * 형사-사기: 기망 행위, 피해 금액, 증거 자료
  * 가사-이혼: 자녀 유무, 양육권, 재산 분할, 혼인 기간
  * 민사-대여금: 차용증 유무, 변제 기일, 독촉 여부

**Phase 3: 확인**
- 모든 정보가 수집되면 요약하여 의뢰인에게 확인받습니다.
- "말씀하신 내용을 정리해 보았습니다. 이 내용이 맞나요?"

**응답 형식**:
일반 대화 시에는 자연스럽게 대화하되, 정보가 충분히 수집되었다고 판단되면 다음 JSON 형식으로 응답하세요:

```json
{
  "type": "summary",
  "legal_category": "민사|형사|가사",
  "case_type": "구체적 사건명",
  "subject": "주어",
  "when_where": "일시+장소",
  "antagonist": "상대방",
  "goal": "목적",
  "action": "행위",
  "details": {"추가정보": "값"},
  "summary": "전체 요약"
}
```

**중요**: 
- 의뢰인이 충분한 정보를 제공하지 않았다면 절대 요약하지 말고 계속 질문하세요.
- 질문은 반드시 한 번에 하나씩만 하세요. 여러 질문을 나열하지 마세요.
"""
    
    def get_conversation_history(self, db: Session, session_id: str) -> List:
        """대화 기록을 LangChain 메시지 형식으로 변환"""
        messages = db.query(Message).filter(
            Message.session_id == session_id
        ).order_by(Message.created_at).all()
        
        history = []
        for msg in messages:
            if msg.role == "user":
                history.append(HumanMessage(content=msg.content))
            elif msg.role == "ai":
                history.append(AIMessage(content=msg.content))
        
        return history
    
    def extract_case_info(self, response: str) -> Optional[Dict[str, Any]]:
        """AI 응답에서 사건 정보 추출"""
        try:
            # JSON 형식 응답 확인
            if "```json" in response:
                json_start = response.find("```json") + 7
                json_end = response.find("```", json_start)
                json_str = response[json_start:json_end].strip()
                data = json.loads(json_str)
                
                if data.get("type") == "summary":
                    return data
            
            return None
        except Exception as e:
            print(f"Error extracting case info: {e}")
            return None
    
    async def chat(
        self,
        db: Session,
        session_id: str,
        user_message: str
    ) -> tuple[str, Optional[Dict[str, Any]]]:
        """
        사용자 메시지 처리 및 AI 응답 생성
        
        Returns:
            (ai_response, case_info_dict or None)
        """
        # 사용자 메시지 저장
        user_msg = Message(
            session_id=session_id,
            role="user",
            content=user_message
        )
        db.add(user_msg)
        db.commit()
        
        # 대화 기록 가져오기
        history = self.get_conversation_history(db, session_id)
        
        # AI 응답 생성
        messages = [
            SystemMessage(content=self.system_prompt),
            *history,
            HumanMessage(content=user_message)
        ]
        
        try:
            # 모델을 gpt-4o-mini로 변경 (더 빠르고 저렴함)
            self.llm.model_name = "gpt-4o-mini"
            response = self.llm.invoke(messages)
            ai_response = response.content
        except Exception as e:
            # OpenAI API 오류 처리
            error_msg = str(e)
            print(f"LLM Error: {error_msg}")
            
            if "insufficient_quota" in error_msg or "RateLimitError" in error_msg:
                ai_response = "죄송합니다. 현재 AI 서비스 사용량이 많아 잠시 후 다시 시도해 주세요. (OpenAI 할당량 초과)"
            else:
                ai_response = "죄송합니다. 대화 중 오류가 발생했습니다. 나중에 다시 시도해 주세요."
            
            # 오류 발생 시에도 AI 응답으로 저장하여 대화 흐름 유지
            case_info = None
        
        # AI 응답 저장
        ai_msg = Message(
            session_id=session_id,
            role="ai",
            content=ai_response
        )
        db.add(ai_msg)
        db.commit()
        
        # 사건 정보 추출 시도
        case_info = self.extract_case_info(ai_response)
        
        # CaseLog 업데이트
        if case_info:
            case_log = db.query(CaseLog).filter(
                CaseLog.session_id == session_id
            ).first()
            
            if not case_log:
                case_log = CaseLog(session_id=session_id)
                db.add(case_log)
            
            # 정보 업데이트
            case_log.legal_category = case_info.get("legal_category")
            case_log.case_type = case_info.get("case_type")
            case_log.subject = case_info.get("subject")
            case_log.when_where = case_info.get("when_where")
            case_log.antagonist = case_info.get("antagonist")
            case_log.goal = case_info.get("goal")
            case_log.action = case_info.get("action")
            case_log.details = case_info.get("details")
            case_log.summary = case_info.get("summary")
            case_log.status = "confirming"
            
            db.commit()
        
        return ai_response, case_info
    
    def get_case_log(self, db: Session, session_id: str) -> Optional[CaseLog]:
        """사건 일지 조회"""
        return db.query(CaseLog).filter(
            CaseLog.session_id == session_id
        ).first()
    
    def confirm_case_log(self, db: Session, session_id: str):
        """사건 일지 확정"""
        case_log = self.get_case_log(db, session_id)
        if case_log:
            case_log.status = "completed"
            db.commit()
        
        # 세션 종료
        session = db.query(SessionModel).filter(
            SessionModel.id == session_id
        ).first()
        if session:
            session.is_finished = True
            db.commit()

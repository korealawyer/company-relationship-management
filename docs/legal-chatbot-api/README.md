# Legal Chatbot API

법률 상담 전 AI 자동 질문을 통해 사건 일지를 체계적으로 정리하는 챗봇 API입니다.

## 기능

- 🤖 AI 기반 자동 질문 생성 (5W1H)
- 📝 사건 유형별 맞춤형 인터뷰
- 💾 전체 대화 내역 저장
- 📊 구조화된 사건 일지 생성
- 🌍 접속 위치/기기 추적

## 설치 방법

1. 가상환경 생성 및 활성화:
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

2. 의존성 설치:
```bash
pip install -r requirements.txt
```

3. 환경 변수 설정:
`.env.example`을 복사하여 `.env` 파일을 생성하고 OpenAI API 키를 입력하세요.

```bash
cp .env.example .env
```

## 실행 방법

```bash
uvicorn app.main:app --reload
```

서버가 실행되면 http://127.0.0.1:8000/docs 에서 API 문서를 확인할 수 있습니다.

## API 엔드포인트

- `POST /chat/start` - 새로운 상담 세션 시작
- `POST /chat/message` - 메시지 전송 및 AI 응답 받기
- `GET /chat/report/{session_id}` - 사건 일지 조회
- `GET /chat/history/{session_id}` - 대화 내역 조회

## 기술 스택

- **FastAPI** - 웹 프레임워크
- **SQLAlchemy** - ORM
- **LangChain** - AI 프레임워크
- **OpenAI GPT-4** - 언어 모델
- **SQLite** - 데이터베이스

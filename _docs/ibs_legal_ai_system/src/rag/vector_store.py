"""벡터 DB 관리"""

from typing import List, Dict, Any, Optional
from pathlib import Path
import logging
import signal
import threading

try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False

from ..models import BaseDocument
from config.settings import settings

logger = logging.getLogger(__name__)


class VectorStore:
    """벡터 DB 관리 클래스"""
    
    def __init__(self, collection_name: str = "legal_documents", lazy_init: bool = True):
        self.collection_name = collection_name
        self.client = None
        self.collection = None
        self._initialized = False
        if not lazy_init:
            self._initialize()
    
    def _ensure_initialized(self):
        """초기화가 필요하면 초기화 수행"""
        if not self._initialized:
            logger.info("ChromaDB 지연 초기화 시작 (실제 사용 시점)")
            print("  [VectorStore] ChromaDB 지연 초기화 시작...", flush=True)
            try:
                self._initialize()
                logger.info("ChromaDB 지연 초기화 완료")
                print("  [VectorStore] ChromaDB 지연 초기화 완료", flush=True)
            except Exception as e:
                logger.error(f"ChromaDB 지연 초기화 실패: {str(e)}")
                print(f"  [VectorStore] ERROR: 지연 초기화 실패 - {str(e)}", flush=True)
                raise
    
    def _initialize(self):
        """벡터 DB 초기화"""
        if settings.vector_db_type == "chroma":
            if not CHROMA_AVAILABLE:
                raise ImportError("chromadb가 설치되지 않았습니다. pip install chromadb를 실행하세요.")
            
            persist_path = settings.chroma_persist_path
            logger.info(f"ChromaDB 초기화 시작: 경로={persist_path}")
            print(f"  [VectorStore] ChromaDB 경로 확인: {persist_path}", flush=True)
            
            # 경로 존재 여부 확인
            path_obj = Path(persist_path)
            if path_obj.exists():
                logger.info(f"ChromaDB 디렉토리 존재: {persist_path}")
                print(f"  [VectorStore] 디렉토리 존재 확인됨", flush=True)
            else:
                logger.info(f"ChromaDB 디렉토리 없음, 생성 예정: {persist_path}")
                print(f"  [VectorStore] 디렉토리 없음, 생성 예정", flush=True)
            
            try:
                print(f"  [VectorStore] ChromaDB 클라이언트 생성 중... (이 작업은 시간이 걸릴 수 있습니다)", flush=True)
                import sys
                sys.stdout.flush()
                
                # ChromaDB 클라이언트 생성 (블로킹 작업)
                # 큰 데이터베이스의 경우 시간이 오래 걸릴 수 있음
                import time
                start_time = time.time()
                self.client = chromadb.PersistentClient(
                    path=str(persist_path),
                    settings=ChromaSettings(
                        anonymized_telemetry=False,
                        allow_reset=True,
                    )
                )
                elapsed_time = time.time() - start_time
                logger.info(f"ChromaDB 클라이언트 생성 완료 (소요 시간: {elapsed_time:.2f}초)")
                print(f"  [VectorStore] ChromaDB 클라이언트 생성 완료 ({elapsed_time:.2f}초 소요)", flush=True)
            except Exception as e:
                logger.error(f"ChromaDB 클라이언트 생성 실패: {str(e)}")
                print(f"  [VectorStore] ERROR: 클라이언트 생성 실패 - {str(e)}", flush=True)
                raise
            
            # 컬렉션 생성 또는 가져오기
            logger.info(f"컬렉션 '{self.collection_name}' 로드 시도 중...")
            print(f"  [VectorStore] 컬렉션 '{self.collection_name}' 로드 시도 중...", flush=True)
            try:
                self.collection = self.client.get_collection(name=self.collection_name)
                logger.info(f"기존 컬렉션 로드 완료: {self.collection_name}")
                print(f"  [VectorStore] 기존 컬렉션 로드 완료", flush=True)
            except Exception as e:
                logger.info(f"기존 컬렉션 없음, 새 컬렉션 생성 중: {str(e)}")
                print(f"  [VectorStore] 기존 컬렉션 없음, 새 컬렉션 생성 중...", flush=True)
                try:
                    self.collection = self.client.create_collection(
                        name=self.collection_name,
                        metadata={"description": "법률 문서 벡터 저장소"}
                    )
                    logger.info(f"새 컬렉션 생성 완료: {self.collection_name}")
                    print(f"  [VectorStore] 새 컬렉션 생성 완료", flush=True)
                except Exception as e2:
                    logger.error(f"컬렉션 생성 실패: {str(e2)}")
                    print(f"  [VectorStore] ERROR: 컬렉션 생성 실패 - {str(e2)}", flush=True)
                    raise
            self._initialized = True
        else:
            raise ValueError(f"지원하지 않는 벡터 DB 타입: {settings.vector_db_type}")
    
    def add_documents(
        self,
        documents: List[BaseDocument],
        embeddings: List[List[float]],
        metadatas: Optional[List[Dict[str, Any]]] = None,
    ) -> List[str]:
        """
        문서를 벡터 DB에 추가합니다.
        
        Args:
            documents: 추가할 문서 리스트
            embeddings: 문서 임베딩 리스트
            metadatas: 메타데이터 리스트 (선택)
            
        Returns:
            추가된 문서 ID 리스트
        """
        self._ensure_initialized()
        if len(documents) != len(embeddings):
            raise ValueError(f"문서와 임베딩의 개수가 일치하지 않습니다. 문서: {len(documents)}개, 임베딩: {len(embeddings)}개")
        
        ids = []
        texts = []
        metadata_list = []
        valid_embeddings = []
        
        for i, doc in enumerate(documents):
            # 텍스트 추출
            if isinstance(doc.content, str):
                text = doc.content.strip()
            elif isinstance(doc.content, list):
                text = "\n".join(str(item) for item in doc.content).strip()
            else:
                text = str(doc.content).strip()
            
            # 빈 텍스트 검증
            if not text:
                logger.warning(f"문서 {doc.id}의 텍스트가 비어있습니다. 건너뜁니다.")
                continue
            
            # 임베딩 검증
            if i >= len(embeddings):
                logger.warning(f"문서 {doc.id}에 대한 임베딩이 없습니다. 건너뜁니다.")
                continue
            
            embedding = embeddings[i]
            if not embedding or len(embedding) == 0:
                logger.warning(f"문서 {doc.id}의 임베딩이 비어있습니다. 건너뜁니다.")
                continue
            
            # 유효한 문서만 추가
            ids.append(doc.id)
            texts.append(text)
            valid_embeddings.append(embedding)
            
            # 메타데이터 구성
            metadata = {
                "id": doc.id,
                "category": doc.category,
                "sub_category": doc.sub_category,
                "type": doc.type,
                "title": doc.title,
            }
            
            # 추가 메타데이터 병합
            if doc.metadata:
                # Pydantic 모델인 경우 딕셔너리로 변환
                if hasattr(doc.metadata, 'model_dump'):
                    raw_metadata = doc.metadata.model_dump()
                elif isinstance(doc.metadata, dict):
                    raw_metadata = doc.metadata.copy()
                else:
                    # 기타 경우 dict()로 변환 시도
                    try:
                        raw_metadata = dict(doc.metadata)
                    except (TypeError, ValueError):
                        # 변환 실패 시 문자열로 변환
                        raw_metadata = {"raw_metadata": str(doc.metadata)}
                
                # ChromaDB는 리스트를 지원하지 않으므로 문자열로 변환
                for key, value in raw_metadata.items():
                    if isinstance(value, list):
                        # 리스트를 쉼표로 구분된 문자열로 변환
                        metadata[key] = ", ".join(str(v) for v in value)
                    elif isinstance(value, dict):
                        # 딕셔너리는 JSON 문자열로 변환
                        import json
                        metadata[key] = json.dumps(value, ensure_ascii=False)
                    elif value is None:
                        # None 값은 건너뛰기
                        continue
                    else:
                        metadata[key] = value
            
            metadata_list.append(metadata)
        
        # 유효한 문서가 없으면 에러
        if not ids:
            raise ValueError("저장할 유효한 문서가 없습니다. 모든 문서가 빈 텍스트이거나 임베딩이 없습니다.")
        
        # 메타데이터 병합
        if metadatas:
            for i, meta in enumerate(metadatas):
                if i < len(metadata_list):
                    metadata_list[i].update(meta)
        
        # 벡터 DB에 추가
        try:
            # 최종 검증
            if len(ids) != len(valid_embeddings) or len(ids) != len(texts) or len(ids) != len(metadata_list):
                raise ValueError(
                    f"데이터 개수 불일치: ids={len(ids)}, embeddings={len(valid_embeddings)}, "
                    f"texts={len(texts)}, metadatas={len(metadata_list)}"
                )
            
            # 배치 크기 제한 (한 번에 너무 많은 데이터 추가 방지)
            BATCH_SIZE = 100  # 한 번에 추가할 최대 청크 수
            import time
            
            if len(ids) <= BATCH_SIZE:
                # 작은 배치는 한 번에 처리
                self._add_batch_with_retry(
                ids=ids,
                embeddings=valid_embeddings,
                documents=texts,
                metadatas=metadata_list,
            )
            else:
                # 큰 배치는 여러 번으로 나누어 처리
                logger.info(f"큰 배치 감지 ({len(ids)}개). {BATCH_SIZE}개씩 나누어 처리합니다.")
                all_added_ids = []
                
                for i in range(0, len(ids), BATCH_SIZE):
                    batch_ids = ids[i:i+BATCH_SIZE]
                    batch_embeddings = valid_embeddings[i:i+BATCH_SIZE]
                    batch_texts = texts[i:i+BATCH_SIZE]
                    batch_metadatas = metadata_list[i:i+BATCH_SIZE]
                    
                    self._add_batch_with_retry(
                        ids=batch_ids,
                        embeddings=batch_embeddings,
                        documents=batch_texts,
                        metadatas=batch_metadatas,
                    )
                    all_added_ids.extend(batch_ids)
                    
                    # 배치 간 짧은 지연 (인덱스 파일 쓰기 완료 대기)
                    if i + BATCH_SIZE < len(ids):
                        time.sleep(0.2)
                
                ids = all_added_ids
            
            # 저장 확인
            count_after = self.collection.count()
            logger.info(f"{len(ids)}개 문서를 벡터 DB에 추가했습니다. (총 {count_after}개)")
            return ids
            
        except Exception as e:
            logger.error(f"벡터 DB 저장 실패: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            raise
    
    def _add_batch_with_retry(
        self,
        ids: List[str],
        embeddings: List[List[float]],
        documents: List[str],
        metadatas: List[Dict[str, Any]],
        max_retries: int = 3,
    ):
        """
        배치를 ChromaDB에 추가 (재시도 로직 포함)
        
        Args:
            ids: 문서 ID 리스트
            embeddings: 임베딩 리스트
            documents: 문서 텍스트 리스트
            metadatas: 메타데이터 리스트
            max_retries: 최대 재시도 횟수
        """
        import time
        
        for attempt in range(max_retries):
            try:
                # ChromaDB에 추가
                self.collection.add(
                    ids=ids,
                    embeddings=embeddings,
                    documents=documents,
                    metadatas=metadatas,
                )
                
                # 저장 확인을 위한 짧은 지연
                time.sleep(0.1)
                return
                
            except Exception as e:
                error_msg = str(e)
                is_retryable = (
                    "compaction" in error_msg.lower() or
                    "hnsw" in error_msg.lower() or
                    "index" in error_msg.lower() or
                    "InternalError" in str(type(e).__name__)
                )
                
                if attempt < max_retries - 1 and is_retryable:
                    # 재시도 가능한 오류인 경우
                    wait_time = (2 ** attempt) * 0.5  # 지수 백오프: 0.5초, 1초, 2초
                    logger.warning(
                        f"벡터 DB 저장 실패 (시도 {attempt + 1}/{max_retries}): {error_msg}. "
                        f"{wait_time:.1f}초 후 재시도합니다."
                    )
                    time.sleep(wait_time)
                    
                    # 클라이언트 재연결 시도
                    try:
                        self._reconnect()
                    except Exception as reconnect_error:
                        logger.warning(f"클라이언트 재연결 실패: {reconnect_error}")
                else:
                    # 재시도 불가능하거나 최대 재시도 횟수 초과
                    logger.error(f"벡터 DB 저장 최종 실패: {error_msg}")
                    raise
    
    def _reconnect(self):
        """ChromaDB 클라이언트 재연결"""
        if not CHROMA_AVAILABLE:
            raise ImportError("chromadb가 설치되지 않았습니다.")
        
        if settings.vector_db_type != "chroma":
            raise ValueError(f"지원하지 않는 벡터 DB 타입: {settings.vector_db_type}")
        
        try:
            # 기존 컬렉션 이름 저장
            collection_name = self.collection_name
            
            # 새 클라이언트 생성
            self.client = chromadb.PersistentClient(
                path=str(settings.chroma_persist_path),
                settings=ChromaSettings(
                    anonymized_telemetry=False,
                    allow_reset=True,
                )
            )
            
            # 컬렉션 다시 가져오기
            self.collection = self.client.get_collection(name=collection_name)
            logger.info(f"ChromaDB 클라이언트 재연결 완료: {collection_name}")
            
        except Exception as e:
            logger.error(f"ChromaDB 클라이언트 재연결 실패: {str(e)}")
            raise
    
    def search(
        self,
        query_embedding: List[float],
        n_results: int = 5,
        where: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        벡터 검색을 수행합니다.
        
        Args:
            query_embedding: 쿼리 임베딩
            n_results: 반환할 결과 개수
            where: 메타데이터 필터 조건
            
        Returns:
            검색 결과 딕셔너리
        """
        self._ensure_initialized()
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where,
        )
        
        return results
    
    def delete(self, ids: Optional[List[str]] = None, where: Optional[Dict[str, Any]] = None):
        """
        문서를 삭제합니다.
        
        Args:
            ids: 삭제할 문서 ID 리스트
            where: 삭제할 문서 필터 조건
        """
        self._ensure_initialized()
        self.collection.delete(ids=ids, where=where)
        logger.info(f"문서 삭제 완료: ids={ids}, where={where}")
    
    def update(
        self,
        ids: List[str],
        embeddings: Optional[List[List[float]]] = None,
        documents: Optional[List[str]] = None,
        metadatas: Optional[List[Dict[str, Any]]] = None,
    ):
        """
        문서를 업데이트합니다.
        
        Args:
            ids: 업데이트할 문서 ID 리스트
            embeddings: 새로운 임베딩 (선택)
            documents: 새로운 문서 내용 (선택)
            metadatas: 새로운 메타데이터 (선택)
        """
        self.collection.update(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
        )
        logger.info(f"{len(ids)}개 문서를 업데이트했습니다.")
    
    def get_count(self) -> int:
        """컬렉션의 문서 개수를 반환합니다."""
        self._ensure_initialized()
        return self.collection.count()
    
    def reset(self):
        """컬렉션을 초기화합니다."""
        self._ensure_initialized()
        self.client.delete_collection(name=self.collection_name)
        self._initialized = False
        self._initialize()
        logger.info(f"컬렉션 '{self.collection_name}'을 초기화했습니다.")


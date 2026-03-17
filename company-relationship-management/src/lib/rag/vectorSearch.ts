// src/lib/rag/vectorSearch.ts — TF-IDF 기반 간이 벡터 검색
// 외부 의존성 0, in-memory 유사도 검색

import { LEGAL_KNOWLEDGE, type LegalArticle } from './legalKnowledge';

// ── 한국어 형태소 간이 토크나이저 ─────────────────────────────
function tokenize(text: string): string[] {
    // 조사/어미 제거 간이 처리 + 공백 분리
    return text
        .replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length >= 2)
        .map(t => t.toLowerCase());
}

// ── TF-IDF 계산 ───────────────────────────────────────────────
interface TFIDF {
    terms: Map<string, number>;
    docLength: number;
}

function computeTFIDF(text: string): TFIDF {
    const tokens = tokenize(text);
    const freq = new Map<string, number>();
    for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);
    return { terms: freq, docLength: tokens.length };
}

function cosineSimilarity(a: TFIDF, b: TFIDF): number {
    let dot = 0, normA = 0, normB = 0;
    for (const [term, freqA] of a.terms) {
        const freqB = b.terms.get(term) || 0;
        dot += freqA * freqB;
        normA += freqA * freqA;
    }
    for (const [, freqB] of b.terms) normB += freqB * freqB;
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 키워드 가중치 보너스 (키워드 매칭 시 추가 점수)
function keywordBonus(query: string, article: LegalArticle): number {
    const queryLower = query.toLowerCase();
    let bonus = 0;
    for (const kw of article.keywords) {
        if (queryLower.includes(kw)) bonus += 0.3;
    }
    return Math.min(bonus, 1.5); // 최대 1.5 보너스
}

// ── 사전 계산된 문서 벡터 ──────────────────────────────────────
const DOC_VECTORS = LEGAL_KNOWLEDGE.map(article => ({
    article,
    tfidf: computeTFIDF(`${article.law} ${article.article} ${article.title} ${article.content} ${article.keywords.join(' ')}`),
}));

/**
 * 쿼리와 가장 관련 높은 법률 조문 top-N 검색
 */
export function searchLegal(query: string, topN = 3): { article: LegalArticle; score: number }[] {
    const queryVec = computeTFIDF(query);

    const scored = DOC_VECTORS.map(({ article, tfidf }) => ({
        article,
        score: cosineSimilarity(queryVec, tfidf) + keywordBonus(query, article),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topN).filter(s => s.score > 0.05);
}

/**
 * 검색 결과를 AI 프롬프트에 삽입할 수 있는 텍스트로 변환
 */
export function buildRAGContext(query: string, topN = 3): string {
    const results = searchLegal(query, topN);
    if (results.length === 0) return '';

    const lines = results.map(r =>
        `[${r.article.law} ${r.article.article}] ${r.article.title}\n${r.article.content}`
    );

    return `\n\n[관련 법률 조문 참조]\n${lines.join('\n\n')}`;
}

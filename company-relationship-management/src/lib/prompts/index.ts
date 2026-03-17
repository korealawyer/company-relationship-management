// src/lib/prompts/index.ts — C3: 프롬프트 레지스트리

export { PRIVACY_ANALYSIS_SYSTEM, PRIVACY_USER_TEMPLATE } from './privacy';
export { REVIEW_SINGLE_SYSTEM, REVIEW_COMPARE_SYSTEM, REVIEW_USER_SINGLE, REVIEW_USER_COMPARE } from './review';
export { CHAT_SYSTEM, CHAT_SYSTEM_EAP, CHAT_SYSTEM_BUSINESS, getChatSystemPrompt } from './chat';
export { DRIP_PERSONALIZE_SYSTEM, DRIP_USER_TEMPLATE } from './drip';
export { BRIEF_SYSTEM } from './brief';

/**
 * 이름으로 프롬프트 조회 (런타임 동적 선택용)
 */
const PROMPT_REGISTRY: Record<string, string> = {};

// 모든 프롬프트를 레지스트리에 등록
import { PRIVACY_ANALYSIS_SYSTEM } from './privacy';
import { REVIEW_SINGLE_SYSTEM, REVIEW_COMPARE_SYSTEM } from './review';
import { CHAT_SYSTEM, CHAT_SYSTEM_EAP, CHAT_SYSTEM_BUSINESS } from './chat';
import { DRIP_PERSONALIZE_SYSTEM } from './drip';
import { BRIEF_SYSTEM } from './brief';

PROMPT_REGISTRY['privacy.analysis'] = PRIVACY_ANALYSIS_SYSTEM;
PROMPT_REGISTRY['review.single'] = REVIEW_SINGLE_SYSTEM;
PROMPT_REGISTRY['review.compare'] = REVIEW_COMPARE_SYSTEM;
PROMPT_REGISTRY['chat.legal'] = CHAT_SYSTEM;
PROMPT_REGISTRY['chat.eap'] = CHAT_SYSTEM_EAP;
PROMPT_REGISTRY['chat.business'] = CHAT_SYSTEM_BUSINESS;
PROMPT_REGISTRY['drip.personalize'] = DRIP_PERSONALIZE_SYSTEM;
PROMPT_REGISTRY['brief'] = BRIEF_SYSTEM;

export function getPrompt(name: string): string | undefined {
    return PROMPT_REGISTRY[name];
}

export function listPrompts(): string[] {
    return Object.keys(PROMPT_REGISTRY);
}

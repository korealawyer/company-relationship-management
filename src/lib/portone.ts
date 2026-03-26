// src/lib/portone.ts — 포트원 v2 결제 연동 스텁
// 실제 SDK 통합 전까지 mock 모드로 동작

export interface PortOneConfig {
    storeId: string;
    channelKey: string;
}

export interface PaymentRequest {
    paymentId: string;           // 고유 결제 ID
    orderName: string;           // "법률 자문 구독 - Standard"
    totalAmount: number;         // 원 단위
    currency: 'KRW';
    payMethod: 'CARD' | 'VIRTUAL_ACCOUNT' | 'EASY_PAY';
    customer: {
        customerId: string;
        fullName: string;
        email: string;
        phoneNumber?: string;
    };
    // 구독 결제 전용
    isSubscription?: boolean;
    subscriptionInterval?: 'MONTHLY' | 'YEARLY';
}

export interface PaymentResult {
    success: boolean;
    paymentId: string;
    transactionId?: string;
    paidAt?: string;
    failReason?: string;
}

export interface VerifyResult {
    verified: boolean;
    paymentId: string;
    status: 'PAID' | 'FAILED' | 'CANCELLED' | 'PENDING';
    amount: number;
    paidAt?: string;
}

// 환경변수 체크 — 설정되어 있으면 실연동 모드
function getConfig(): PortOneConfig | null {
    const storeId = typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_PORTONE_STORE_ID || '')
        : '';
    const channelKey = typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || '')
        : '';
    if (storeId && channelKey) return { storeId, channelKey };
    return null;
}

import * as PortOne from '@portone/browser-sdk/v2';

/**
 * 결제 요청 (포트원 v2)
 * 
 * - 환경변수 미설정 시: mock 결제 (항상 성공)
 * - 환경변수 설정 시: 실제 PortOne SDK 호출
 */
export async function requestPayment(req: PaymentRequest): Promise<PaymentResult> {
    const config = getConfig();

    if (!config) {
        // ── 환경변수 누락 시 Mock 모드로 동작 (개발/테스트용) ──
        console.warn('[PortOne Mock] 환경변수 미설정. 결제 시뮬레이션을 진행합니다:', req.orderName, req.totalAmount);
        await new Promise(r => setTimeout(r, 1500)); // 결제 시뮬레이션

        return {
            success: true,
            paymentId: req.paymentId,
            transactionId: `mock_tx_${Date.now()}`,
            paidAt: new Date().toISOString(),
        };
    }

    // ── 실연동 모드 (실제 PortOne v2 SDK 연동) ──
    try {
        const response = await PortOne.requestPayment({
            storeId: config.storeId,
            channelKey: config.channelKey,
            paymentId: req.paymentId,
            orderName: req.orderName,
            totalAmount: req.totalAmount,
            currency: req.currency,
            payMethod: req.payMethod,
            customer: req.customer,
        });
        
        if (response?.code !== undefined) {
             return { 
                success: false, 
                paymentId: req.paymentId, 
                failReason: response.message || '결제 실패' 
             };
        }
        
        return {
            success: true,
            paymentId: req.paymentId,
            transactionId: response?.paymentId, // PortOne v2 often returns paymentId and txId based on PG
            paidAt: new Date().toISOString()
        };
    } catch (error: any) {
        console.error('[PortOne Error]', error);
        return {
            success: false,
            paymentId: req.paymentId,
            failReason: error?.message || '결제 진행 중 오류가 발생했습니다.',
        };
    }
}

/**
 * 결제 검증 (서버사이드)
 * 
 * 실제 환경에서는 API Route에서 PortOne REST API를 호출하여 검증합니다.
 */
export async function verifyPayment(paymentId: string): Promise<VerifyResult> {
    const config = getConfig();

    if (!config) {
        // Mock 모드
        return {
            verified: true,
            paymentId,
            status: 'PAID',
            amount: 500000,
            paidAt: new Date().toISOString(),
        };
    }

    // 실연동 시: POST /api/payment/verify → PortOne REST API 호출
    // const res = await fetch(`https://api.portone.io/v2/payments/${paymentId}`, {
    //     headers: { 'Authorization': `PortOne ${process.env.PORTONE_API_SECRET}` },
    // });
    
    return {
        verified: false,
        paymentId,
        status: 'PENDING',
        amount: 0,
    };
}

/**
 * 결제 ID 생성 유틸
 */
export function generatePaymentId(companyId: string): string {
    return `ibs_${companyId}_${Date.now()}`;
}

/**
 * 구독 플랜별 가격
 */
export const PLAN_PRICES: Record<string, number> = {
    starter: 330000,
    standard: 550000,
    premium: 1100000,
};

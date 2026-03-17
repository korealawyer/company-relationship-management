'use client';
import React from 'react';
import { Company } from '@/lib/mockStore';

interface ContractEmailTemplateProps {
    company: Company;
    plan?: 'starter' | 'standard' | 'premium';
}

const PLAN_DETAILS: Record<string, { name: string; price: string; features: string[] }> = {
    starter: {
        name: 'Starter',
        price: '월 30만원~',
        features: ['개인정보처리방침 검토 1회', '변호사 검토 의견서', '수정 초안 제공'],
    },
    standard: {
        name: 'Standard',
        price: '월 50만원~',
        features: ['Starter 전체 포함', '분기별 정기 검토', '가맹점 법률상담 BACKCALL', '법률 문서 2,000종 제공'],
    },
    premium: {
        name: 'Premium',
        price: '월 100만원~',
        features: ['Standard 전체 포함', '전담 파트너 변호사 배정', '임직원 법률상담 포함', '분기 리스크 브리핑', 'EAP 심리상담'],
    },
};

export default function ContractEmailTemplate({ company, plan = 'standard' }: ContractEmailTemplateProps) {
    const planInfo = PLAN_DETAILS[plan] || PLAN_DETAILS.standard;
    const highIssues = company.issues?.filter(i => i.level === 'HIGH').length || 0;
    const totalIssues = company.issues?.length || company.issueCount || 0;

    return (
        <div style={{ maxWidth: 640, margin: '0 auto', fontFamily: "'Pretendard', -apple-system, sans-serif" }}>
            {/* 헤더 */}
            <div style={{
                background: 'linear-gradient(135deg, #04091a 0%, #0d1b3e 100%)',
                padding: '32px 40px',
                borderRadius: '16px 16px 0 0',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'linear-gradient(135deg, #e8c87a, #c9a84c)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: 14, color: '#04091a',
                    }}>
                        IBS
                    </div>
                    <div>
                        <p style={{ color: '#f0f4ff', fontWeight: 800, fontSize: 16, margin: 0 }}>IBS 법률사무소</p>
                        <p style={{ color: 'rgba(240,244,255,0.5)', fontSize: 12, margin: 0 }}>프랜차이즈 전문 법률 자문</p>
                    </div>
                </div>
                <h1 style={{ color: '#e8c87a', fontSize: 22, fontWeight: 900, margin: 0, lineHeight: 1.4 }}>
                    법률 자문 서비스 계약서
                </h1>
                <p style={{ color: 'rgba(240,244,255,0.6)', fontSize: 14, margin: '8px 0 0' }}>
                    아래 내용을 확인하시고 전자서명을 진행해 주세요.
                </p>
            </div>

            {/* 계약 요약 */}
            <div style={{
                background: '#ffffff',
                padding: '32px 40px',
                borderLeft: '1px solid #e5e7eb',
                borderRight: '1px solid #e5e7eb',
            }}>
                {/* 기업 정보 */}
                <div style={{
                    background: '#f8f9fc', borderRadius: 12, padding: '20px 24px',
                    marginBottom: 24, border: '1px solid #e5e7eb',
                }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: 1, margin: '0 0 12px' }}>
                        계약 대상 기업
                    </p>
                    <p style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>{company.name}</p>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748b' }}>
                        <span>사업자등록번호: {company.biz || '-'}</span>
                        <span>가맹점: {company.storeCount.toLocaleString()}개</span>
                    </div>
                </div>

                {/* 분석 결과 요약 */}
                <div style={{
                    background: '#fef2f2', borderRadius: 12, padding: '20px 24px',
                    marginBottom: 24, border: '1px solid #fecaca',
                }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' as const, letterSpacing: 1, margin: '0 0 12px' }}>
                        법률 검토 결과 요약
                    </p>
                    <div style={{ display: 'flex', gap: 24 }}>
                        <div>
                            <p style={{ fontSize: 28, fontWeight: 900, color: '#dc2626', margin: 0 }}>{totalIssues}건</p>
                            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>발견 이슈</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 28, fontWeight: 900, color: '#dc2626', margin: 0 }}>{highIssues}건</p>
                            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>고위험 (HIGH)</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 28, fontWeight: 900, color: company.riskLevel === 'HIGH' ? '#dc2626' : '#d97706', margin: 0 }}>
                                {company.riskLevel || 'N/A'}
                            </p>
                            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>위험 등급</p>
                        </div>
                    </div>
                </div>

                {/* 플랜 정보 */}
                <div style={{
                    background: '#fffbeb', borderRadius: 12, padding: '20px 24px',
                    marginBottom: 24, border: '1px solid #fde68a',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: '#b8960a', textTransform: 'uppercase' as const, letterSpacing: 1, margin: 0 }}>
                            선택 플랜
                        </p>
                        <span style={{
                            background: 'linear-gradient(135deg, #e8c87a, #c9a84c)', padding: '4px 12px',
                            borderRadius: 20, fontSize: 11, fontWeight: 900, color: '#04091a',
                        }}>
                            {planInfo.name}
                        </span>
                    </div>
                    <p style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '0 0 12px' }}>{planInfo.price}</p>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                        {planInfo.features.map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                                <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span> {f}
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA 버튼 */}
                <div style={{ textAlign: 'center' as const, margin: '32px 0 16px' }}>
                    <a
                        href={`/checkout?plan=${plan}&company=${encodeURIComponent(company.name)}`}
                        style={{
                            display: 'inline-block',
                            background: 'linear-gradient(135deg, #e8c87a, #c9a84c)',
                            color: '#04091a', padding: '14px 40px',
                            borderRadius: 12, fontWeight: 900, fontSize: 15,
                            textDecoration: 'none',
                            boxShadow: '0 4px 16px rgba(201,168,76,0.3)',
                        }}
                    >
                        ✍️ 전자서명 진행하기
                    </a>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12 }}>
                        버튼 클릭 시 전자서명 페이지로 이동합니다
                    </p>
                </div>
            </div>

            {/* 법적 고지 */}
            <div style={{
                background: '#f8f9fc', padding: '24px 40px',
                borderRadius: '0 0 16px 16px',
                border: '1px solid #e5e7eb', borderTop: 'none',
            }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>법적 고지</p>
                <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                    본 계약서는 「전자서명법」 제3조에 따른 전자서명으로 체결됩니다.
                    전자서명된 계약서는 서면 계약과 동일한 법적 효력을 가집니다.
                    계약 체결 후 30일 이내 청약 철회가 가능하며, 이후에는 약정 기간에 따라 적용됩니다.
                </p>
                <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 16, paddingTop: 16 }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        IBS 법률사무소 | 서울특별시 서초구 서초대로 | 02-555-1234 | legal@ibslaw.co.kr
                    </p>
                </div>
            </div>
        </div>
    );
}

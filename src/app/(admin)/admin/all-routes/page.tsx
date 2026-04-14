'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, LayoutDashboard, Search, MonitorPlay, Users, FileText, Globe, Unlock, ExternalLink, Briefcase, Handshake, Mail, CreditCard } from 'lucide-react';

const ALL_ROUTES = [
  {
    category: '관리자 및 시스템 (Admin & God View)',
    icon: <Shield className="w-5 h-5 text-red-400" />,
    items: [
      { path: '/admin', label: '관리자 홈' },
      { path: '/admin/ai-prompts', label: 'AI 프롬프트 관리' },
      { path: '/admin/all-routes', label: '사이트맵 (현재 페이지)' },
      { path: '/admin/clients', label: '클라이언트 관리' },
      { path: '/admin/contract-preview', label: '계약서 템플릿 미리보기' },
      { path: '/admin/email-preview', label: '이메일 템플릿 미리보기' },
      { path: '/admin/permissions', label: '권한 설정' },
      { path: '/admin/reports', label: '리포트 (관리자용)' },
      { path: '/admin/users', label: '전체 유저 관리' },
      { path: '/god-view/sales-board', label: '갓 뷰 세일즈 보드' },
      { path: '/preview', label: '컴포넌트/디자인 미리보기' },
    ]
  },
  {
    category: '영업 및 내부 부서 (Sales & Internal)',
    icon: <MonitorPlay className="w-5 h-5 text-blue-400" />,
    items: [
      { path: '/employee', label: '직원 포털 (CRM / 메뉴)' },
      { path: '/finance', label: '재무팀 대시보드' },
      { path: '/sales/dashboard', label: '영업 대시보드' },
      { path: '/sales-queue', label: '세일즈 큐 (영업 대기현황)' },
      { path: '/sales/call', label: '전화 영업 스크립트 뷰' },
      { path: '/sales/email-history', label: '이메일 발송 내역' },
      { path: '/sales/guide', label: '영업 가이드라인' },
      { path: '/sales/pricing-calculator', label: '견적 계산기' },
      { path: '/sales/voice-memo', label: '음성 메모 및 요약' },
      { path: '/counselor', label: 'EAP 상담사 뷰' },
    ]
  },
  {
    category: '법무 및 송무 (Legal)',
    icon: <Briefcase className="w-5 h-5 text-purple-400" />,
    items: [
      { path: '/cases', label: '사건 목록' },
      { path: '/cases/[id]', label: '사건 상세 (동적 ID)' },
      { path: '/lawyer', label: '변호사 홈' },
      { path: '/lawyer/privacy-review', label: '사생활/조문 검토' },
      { path: '/legal/review', label: '법적 리스크 검토' },
      { path: '/litigation', label: '송무팀 대시보드' },
      { path: '/personal-litigation', label: '개인 송무 현황' },
      { path: '/superlawyer', label: '수퍼 변호사 전용 뷰' },
    ]
  },
  {
    category: '고객 포털 (Client Portal)',
    icon: <Users className="w-5 h-5 text-emerald-400" />,
    items: [
      { path: '/dashboard', label: '고객 대시보드 (메인)' },
      { path: '/client-portal', label: '구 클라이언트 포털' },
      { path: '/client-portal/my-cases', label: '나의 사건 내역' },
      { path: '/chat', label: '채팅 및 메시지' },
      { path: '/company-hr', label: '고객사 HR 관리' },
      { path: '/consultation', label: '상담 예약 및 신청' },
      { path: '/consultation-history', label: '상담 이력' },
      { path: '/notifications', label: '알림 내역 센터' },
      { path: '/welcome', label: '환영 및 안내 가이드' },
    ]
  },
  {
    category: '계약 및 문서 (Contracts & Docs)',
    icon: <FileText className="w-5 h-5 text-amber-400" />,
    items: [
      { path: '/contracts', label: '전자 계약 목록' },
      { path: '/contracts/[id]', label: '계약 상세' },
      { path: '/contracts/new', label: '신규 계약 생성' },
      { path: '/contracts/sign/[token]', label: '모바일/외부 계약 서명 링크' },
      { path: '/documents', label: '문서함 보관소' },
      { path: '/documents/[id]', label: '문서 상세 페이지' },
      { path: '/documents/requests', label: '문서 제출 요청 현황' },
      { path: '/documents/upload', label: '단일 문서 업로드 창' },
      { path: '/client-portal/document-requests', label: '(포털) 문서 요청 현황' },
      { path: '/client-portal/document-requests/new', label: '(포털) 신규 문서 요청' },
      { path: '/client-portal/documents/[id]', label: '(포털) 문서 상세' },
    ]
  },
  {
    category: '결제 및 인증 설정 (Auth & Billing)',
    icon: <CreditCard className="w-5 h-5 text-teal-400" />,
    items: [
      { path: '/login', label: '로그인' },
      { path: '/signup', label: '회원가입' },
      { path: '/signup/consent', label: '회원가입 약관 동의' },
      { path: '/onboarding', label: '최초 로그인 온보딩' },
      { path: '/forgot-password', label: '비밀번호 찾기' },
      { path: '/intake/[token]', label: '비회원 정보 수집 폼' },
      { path: '/profile', label: '개인 프로필 수정' },
      { path: '/settings', label: '사용자 및 앱 설정' },
      { path: '/billing', label: '결제 및 인보이스' },
      { path: '/checkout', label: '카드 등록/결제 진행' },
      { path: '/subscribe/success', label: '구독 완료 안내' },
    ]
  },
  {
    category: '마케팅, 가이드, 약관 (Marketing & Info)',
    icon: <Globe className="w-5 h-5 text-sky-400" />,
    items: [
      { path: '/', label: '메인 랜딩 (Root)' },
      { path: '/about', label: '초기 소개 페이지' },
      { path: '/landing', label: '외부 광고용 랜딩 구좌' },
      { path: '/portal', label: '포털 랜딩 진입점' },
      { path: '/pricing', label: '가격 정책 (Pricing)' },
      { path: '/privacy-report', label: '프라이버시 진단 신청' },
      { path: '/privacy-report/result', label: '진단 결과 뷰어' },
      { path: '/service', label: '제공 서비스 안내' },
      { path: '/payment-guide', label: '결제 방법 가이드' },
      { path: '/payment-guide/cms', label: 'CMS 자동이체 가이드' },
      { path: '/terms/privacy', label: '개인정보처리방침' },
      { path: '/legal/terms', label: '이용약관' },
      { path: '/help', label: '고객 센터 및 FAQ' },
    ]
  }
];

export default function AllRoutesPage() {
  const [search, setSearch] = useState('');

  const filteredRoutes = ALL_ROUTES.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.path.toLowerCase().includes(search.toLowerCase()) || 
      item.label.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8" style={{ background: '#04091a', color: '#f0f4ff' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 text-center relative max-w-2xl mx-auto">
          <h1 className="text-3xl font-black mb-3" style={{ background: 'linear-gradient(135deg, #e8c87a, #c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            전체 라우트 인덱스 (God View)
          </h1>
          <p className="text-sm font-medium mb-6" style={{ color: 'rgba(240,244,255,0.6)' }}>
            플랫폼에 존재하는 모든 동적/정적 페이지 경로 모음입니다. (총 75개 라우트)
          </p>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text"
              placeholder="경로 또는 페이지 이름으로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoutes.map((section, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-6 rounded-2xl relative overflow-hidden group flex flex-col h-full"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {section.icon}
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">{section.category}</h2>
              </div>
              
              <div className="space-y-2 flex-grow">
                {section.items.map((item, itemIdx) => {
                  const isDynamic = item.path.includes('[');
                  return isDynamic ? (
                    <div 
                      key={itemIdx} 
                      className="flex flex-col p-3 rounded-xl transition-all duration-200 border border-transparent bg-white/5 opacity-60"
                      title="동적 라우트는 직접 이동할 수 없습니다."
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-gray-400">{item.label} <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1 py-0.5 rounded ml-2">동적 경로</span></span>
                      </div>
                      <div className="text-xs break-all" style={{ color: 'rgba(240,244,255,0.3)', fontFamily: 'monospace' }}>
                        {item.path}
                      </div>
                    </div>
                  ) : (
                    <Link 
                      key={itemIdx} 
                      href={item.path}
                      className="flex flex-col p-3 rounded-xl transition-all duration-200 hover:bg-white/5 border border-transparent hover:border-white/10"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-gray-200">{item.label}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 flex-shrink-0 ml-2" />
                      </div>
                      <div className="text-xs break-all" style={{ color: 'rgba(240,244,255,0.4)', fontFamily: 'monospace' }}>
                        {item.path}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          ))}
          {filteredRoutes.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-400">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

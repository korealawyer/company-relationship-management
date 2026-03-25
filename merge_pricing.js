const fs = require('fs');
const pricingFile = 'src/app/pricing/page.tsx';
const consultFile = 'src/app/consultation/page.tsx';

let pricingContent = fs.readFileSync(pricingFile, 'utf8');
let consultContent = fs.readFileSync(consultFile, 'utf8');

// Add new imports to pricing
const newImports = `
import { FileText, Scale, Clock, ChevronDown, CreditCard, BadgeCheck, AlertTriangle } from 'lucide-react';
import OrderModal from '../consultation/components/OrderModal';
import { SERVICES } from '../consultation/constants';
import CostComparison from '../consultation/components/CostComparison';
`;
if (!pricingContent.includes('OrderModal')) {
    pricingContent = pricingContent.replace("import { calcPrice", newImports.trim() + "\nimport { calcPrice");
}

// Add viewMode to PublicPricingView
const publicPricingRegex = /function PublicPricingView\(\) \{[\s\S]*?const \[storeCount, setStoreCount\] = useState\(30\);/m;
if (!pricingContent.includes('const [viewMode, setViewMode]')) {
pricingContent = pricingContent.replace(publicPricingRegex, `function PublicPricingView() {
    const [storeCount, setStoreCount] = useState(30);
    const [viewMode, setViewMode] = useState<'subscription' | 'single'>('subscription');
    const [selected, setSelected] = useState<typeof SERVICES[0] | null>(null);
    const [monthlyCount, setMonthlyCount] = useState(3);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    
    const faqs = [
        { q: '결제 후 얼마나 걸리나요?', a: '결제 완료 즉시 담당 변호사가 배정됩니다. 서비스별로 명시된 시간(24~48시간) 내에 고품질의 서면 답변을 보장합니다. 기한 초과 시에는 100% 전액 환불을 보장합니다.' },
        { q: '정기 구독 서비스랑은 무엇이 다른가요?', a: '단건 문의는 당장 필요한 사안에 대해서만 개별로 의뢰하고 비용을 지불하는 방식입니다. 만약 월 7건 이상 정기적인 자문이 필요하시다면 최대 60% 이상 저렴한 구독 플랜을 추천드립니다. 단건 고객님이 추후 구독으로 전환하실 경우 첫 달 할인 쿠폰을 발급해 드립니다.' },
        { q: '지금 당장 문서가 없어도 상담이 가능한가요?', a: '네, 가능합니다. 우선 현재의 상황과 궁금하신 점을 텍스트로 남겨주시면 담당 변호사가 전체적인 현황을 파악한 뒤 추가로 필요한 서류 목록을 안내해 드립니다.' },
        { q: '마음에 안 들면 환불되나요?', a: '네. 검토 결과물이 전달되기 전이라면 언제든 전액 환불이 가능합니다. 결과물 수령 후라도 부족한 부분이 있다면 변호사와 직접 논의하여 추가적인 보완을 무료로 진행해 드립니다.' },
        { q: '상담 내용에 대한 보안은 어떻게 유지되나요?', a: 'IBS 법률사무소의 모든 변호사들은 법률이 정하는 엄격한 비밀유지 의무를 준수합니다. 남겨주신 내용과 첨부 파일은 담당 변호사 외에는 절대 열람할 수 없으며 강력한 보안 시스템 내에 안전하게 보관됩니다.' },
    ];
`);
}

// Add Toggle in PublicPricingView
const toggleUI = `
            {/* ── 요금제 토글 ── */}
            <div className="relative z-10 flex justify-center mb-8">
                <div className="flex bg-white/5 p-1.5 rounded-[20px] border border-white/10 backdrop-blur-md">
                    <button onClick={() => setViewMode('subscription')} 
                        className={\`px-8 py-3.5 rounded-2xl font-bold text-[15px] transition-all duration-300 \${viewMode === 'subscription' ? 'bg-gradient-to-r from-[#e8c87a] to-[#c9a84c] text-black shadow-lg shadow-[#c9a84c]/20 scale-105' : 'text-white/60 hover:text-white'}\`}>
                        정기 구독 (Subscription)
                    </button>
                    <button onClick={() => setViewMode('single')} 
                        className={\`px-8 py-3.5 rounded-2xl font-bold text-[15px] transition-all duration-300 \${viewMode === 'single' ? 'bg-gradient-to-r from-[#e8c87a] to-[#c9a84c] text-black shadow-lg shadow-[#c9a84c]/20 scale-105' : 'text-white/60 hover:text-white'}\`}>
                        단건 의뢰 (Single Case)
                    </button>
                </div>
            </div>
`;

if (!pricingContent.includes('요금제 토글')) {
pricingContent = pricingContent.replace('            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">', '            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">\n' + toggleUI);
}

// Extract Single Case content from consultContent
const startStr = '// ── 서비스 메뉴 ──';
const endStr = '{/* ── 주문 모달 ── */}';
const singleCaseStart = consultContent.indexOf(startStr);
const singleCaseEnd = consultContent.indexOf(endStr);
let singleContent = consultContent.substring(singleCaseStart, singleCaseEnd);

// Wrap existing subscription content
const subStart = pricingContent.indexOf('{/* 메인 계산기');
const subEnd = pricingContent.indexOf('            </div>\n        </div>\n    );\n}\n\n// ── 메인 페이지: 역할에 따라 분기');

if (subStart > -1 && subEnd > -1 && !pricingContent.includes("viewMode === 'subscription'")) {
    let subContent = pricingContent.substring(subStart, subEnd);

    const replacement = `
                <AnimatePresence mode="wait">
                    {viewMode === 'subscription' ? (
                        <motion.div key="subscription" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                            ${subContent}
                        </motion.div>
                    ) : (
                        <motion.div key="single" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                            <div className="max-w-6xl mx-auto">
                            ${singleContent}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
`;

    pricingContent = pricingContent.substring(0, subStart) + replacement + pricingContent.substring(subEnd);
}

// Also need to put the OrderModal at the very end of PublicPricingView
const returnRegex = /        <\/div>\n    \);\n\}/;
if (!pricingContent.includes('OrderModal service={selected}')) {
    pricingContent = pricingContent.replace(returnRegex, `            <AnimatePresence>
                {selected && <OrderModal service={selected} onClose={() => setSelected(null)} />}
            </AnimatePresence>
        </div>
    );
}`);
}

fs.writeFileSync(pricingFile, pricingContent);
console.log('Merge complete!');

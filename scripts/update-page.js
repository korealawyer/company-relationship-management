const fs = require('fs');

let content = fs.readFileSync('src/app/(client)/privacy-analysis/page.tsx', 'utf8');

content = content.replace(
  "import { useRouter } from 'next/navigation';",
  "import { useRouter, useSearchParams } from 'next/navigation';\nimport useSWR from 'swr';\n\nconst fetcher = (url: string) => fetch(url).then(r => r.json());\n"
);

content = content.replace(
  "const IssueItem = ({ issue, index }: { issue: any; index: number }) => {",
  "const IssueItem = ({ issue, index, isBlinded }: { issue: any; index: number; isBlinded?: boolean }) => {"
);

content = content.replace(
  "className=\"transition-all relative z-10\"",
  "className={`transition-all relative z-10 ${isBlinded ? 'pointer-events-none' : ''}`}"
);

content = content.replace(
  "<h3 className=\"text-[15px] font-black text-gray-900 leading-snug\">{issue.title}</h3>",
  "<h3 className={`text-[15px] font-black text-gray-900 leading-snug ${isBlinded ? 'blur-[5px] opacity-70 select-none' : ''}`}>{isBlinded ? '비공개 법적 위반 경고사항' : issue.title}</h3>"
);

content = content.replace(
  /<ChevronDown\s+className={`w-4 h-4 text-gray-300 mt-1 flex-shrink-0 transition-transform duration-300 \${expanded \? 'rotate-180' : ''}`} \/>/g,
  "{!isBlinded ? <ChevronDown className={`w-4 h-4 text-gray-300 mt-1 flex-shrink-0 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} /> : <Lock className=\"w-4 h-4 text-gray-400 mt-1 flex-shrink-0\" />}"
);

content = content.replace(
  "{expanded && (",
  "{expanded && !isBlinded && ("
);

content = content.replace(
  "export default function PrivacyAnalysisClientPage() {\n    const router = useRouter();\n    const { companies, isLoading } = useCompanies();\n    const { user, loading: authLoading } = useAuth();\n    const [company, setCompany] = useState<any>(null);\n    const bookRef = useRef<HTMLDivElement>(null);\n    const { scrollYProgress, scrollY } = useScroll();\n    const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);\n    const [showBottomBanner, setShowBottomBanner] = useState(false);",
  "export default function PrivacyAnalysisClientPage() {\n    const router = useRouter();\n    const { companies, isLoading: companiesLoading } = useCompanies();\n    const { user, loading: authLoading } = useAuth();\n    const [targetId, setTargetId] = useState<string | null>(null);\n    const bookRef = useRef<HTMLDivElement>(null);\n    const { scrollYProgress, scrollY } = useScroll();\n    const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);\n    const [showBottomBanner, setShowBottomBanner] = useState(false);\n\n    const { data: analysisData, error: analysisError, isLoading: analysisLoading } = useSWR(\n        targetId ? `/api/analyze?targetId=${targetId}` : null,\n        fetcher\n    );\n    \n    const company = analysisData?.company;\n    const isPremium = analysisData?.isPremium ?? true;\n    const isLoading = analysisLoading || targetId === null;\n"
);


// Replace the big generic useEffect for session match
const oldUseEffect = `    useEffect(() => {
        if (authLoading || isLoading) return;
        const session = user || getSession();

        const resolveCompany = async () => {
            let match = null;
            if (session) {
                // 1. Initial array check
                if (session.companyId) {
                    match = companies?.find((c) => c.id === session.companyId);
                }
                
                // 3. Fallback to bizNo from companyId string
                if (!match && session.companyId) {
                    const digits = session.companyId.replace(/\\D/g, '');
                    if (digits.length >= 10) {
                        match = companies?.find((c: any) => c.biz === digits || c.biz?.replace(/\\D/g, '') === digits);
                    }
                }

                // 4. Fallback to bizNo from email
                if (!match && session.email) {
                    const prefix = session.email.split('@')[0].replace(/\\D/g, '');
                    if (prefix.length >= 10) {
                        match = companies?.find((c: any) => c.biz === prefix || c.biz?.replace(/\\D/g, '') === prefix);
                    }
                }
                
                // If it's a UUID but not matched above, maybe use the ID directly
                let targetId = match ? match.id : (session.companyId && session.companyId.length > 20 ? session.companyId : null);
                
                // If nothing is found, use the first company
                if (!targetId && companies && companies.length > 0) {
                    targetId = companies[0].id;
                }

                // Upgrade to full model to retrieve \`lawyerProfile\` and full nested relations
                if (targetId) {
                    try {
                        const fullComp = await dataLayer.companies.getById(targetId);
                        if (fullComp) {
                            match = fullComp;
                        }
                    } catch (e) {
                        console.error('Failed to fetch full company', e);
                    }
                }
            } else if (companies && companies.length > 0) {
                // If no session but companies exist, load the full profile of the first one
                try {
                    const fullComp = await dataLayer.companies.getById(companies[0].id);
                    if (fullComp) {
                        match = fullComp;
                    }
                } catch (e) {
                    console.error('Failed to fallback full company', e);
                }
            }

            // Set final match
            setCompany(match || (companies && companies.length > 0 ? companies[0] : null));
        };

        resolveCompany();
    }, [companies, user, isLoading, authLoading]);`;

const newUseEffect = `    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('targetId');
            if (id) {
                setTargetId(id);
                return;
            }
        }
        
        if (authLoading || companiesLoading) return;
        const session = user || getSession();
        
        let match = null;
        if (session) {
            if (session.companyId) {
                match = companies?.find((c) => c.id === session.companyId);
            }
            if (!match && session.companyId) {
                const digits = session.companyId.replace(/\\D/g, '');
                if (digits.length >= 10) {
                    match = companies?.find((c: any) => c.biz === digits || c.biz?.replace(/\\D/g, '') === digits);
                }
            }
            if (!match && session.email) {
                const prefix = session.email.split('@')[0].replace(/\\D/g, '');
                if (prefix.length >= 10) {
                    match = companies?.find((c: any) => c.biz === prefix || c.biz?.replace(/\\D/g, '') === prefix);
                }
            }
            let fallbackId = match ? match.id : (session.companyId && session.companyId.length > 20 ? session.companyId : null);
            if (!fallbackId && companies && companies.length > 0) {
                fallbackId = companies[0].id;
            }
            setTargetId(fallbackId || null);
        } else if (companies && companies.length > 0) {
            setTargetId(companies[0].id);
        } else {
            setTargetId(null); // Wait for query param or unauthenticated request fail
        }
    }, [companies, user, authLoading, companiesLoading]);`;

content = content.replace(oldUseEffect, newUseEffect);

// Replace mapping to pass isBlinded
content = content.replace(
    "{displayIssues.map((issue: any, idx: number) => (\n                                                        <IssueItem key={idx} issue={issue} index={idx} />\n                                                    ))}",
    "{displayIssues.map((issue: any, idx: number) => {\n                                                        const isBlinded = issue.customDraft === 'BLIND_TREATMENT';\n                                                        return <IssueItem key={idx} issue={issue} index={idx} isBlinded={isBlinded} />\n                                                    })}\n                                                    {!isPremium && (\n                                                        <div className=\"absolute bottom-1/4 left-0 right-0 h-[300px] bg-gradient-to-t from-white via-white/90 to-transparent flex flex-col items-center justify-end pb-12 z-20 pointer-events-auto\">\n                                                            <div className=\"bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-2xl flex flex-col items-center border border-gray-100 max-w-sm text-center mx-auto relative top-[80px]\">\n                                                                <Lock className=\"w-10 h-10 mb-3 text-amber-500\" />\n                                                                <h3 className=\"text-lg font-black text-gray-900 mb-2\">프리미엄 세부 검토안 잠김</h3>\n                                                                <p className=\"text-sm font-medium text-gray-500 mb-5 leading-relaxed\">\n                                                                    상세 권고안을 확인하고 법적 리스크를<br/>해결하려면 전문 변호사에게 조문 개정을 위임하세요.\n                                                                </p>\n                                                                <button\n                                                                    onClick={() => router.push(`/contracts/sign/${company?.id}`)}\n                                                                    className=\"w-full flex justify-center items-center gap-2 px-6 py-4 rounded-xl font-black text-[15px] transition-all hover:scale-105 shadow-xl\"\n                                                                    style={{\n                                                                        background: `linear-gradient(135deg, ${'#c9a84c'}, ${'#e8c87a'})`,\n                                                                        color: '#0a0e1a',\n                                                                    }}\n                                                                >\n                                                                    <FileSignature className=\"w-5 h-5\" /> 방침 전면 개정 위임하기\n                                                                </button>\n                                                            </div>\n                                                        </div>\n                                                    )}"
);

// Fallback items mapping
content = content.replace(
    "{displayIssues.map((issue: any, idx: number) => (\n                                                <IssueItem key={idx} issue={issue} index={idx} />\n                                            ))}",
    "{displayIssues.map((issue: any, idx: number) => {\n                                                const isBlinded = issue.customDraft === 'BLIND_TREATMENT';\n                                                return <IssueItem key={idx} issue={issue} index={idx} isBlinded={isBlinded} />\n                                            })}\n                                            {!isPremium && (\n                                                <div className=\"absolute bottom-1/4 left-0 right-0 h-[300px] bg-gradient-to-t from-white via-white/90 to-transparent flex flex-col items-center justify-end pb-12 z-20 pointer-events-auto\">\n                                                    <div className=\"bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-2xl flex flex-col items-center border border-gray-100 max-w-sm text-center mx-auto relative top-[80px]\">\n                                                        <Lock className=\"w-10 h-10 mb-3 text-amber-500\" />\n                                                        <h3 className=\"text-lg font-black text-gray-900 mb-2\">프리미엄 세부 검토안 잠김</h3>\n                                                        <button\n                                                            onClick={() => router.push(`/contracts/sign/${company?.id}`)}\n                                                            className=\"w-full flex justify-center items-center gap-2 px-6 py-4 rounded-xl font-black text-[15px] transition-all hover:scale-105 shadow-xl\"\n                                                            style={{\n                                                                background: `linear-gradient(135deg, ${'#c9a84c'}, ${'#e8c87a'})`,\n                                                                color: '#0a0e1a',\n                                                            }}\n                                                        >\n                                                            <FileSignature className=\"w-5 h-5\" /> 방침 전면 개정 위임하기\n                                                        </button>\n                                                    </div>\n                                                </div>\n                                            )}"
);

fs.writeFileSync('src/app/(client)/privacy-analysis/page.tsx', content);

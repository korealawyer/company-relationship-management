const fs = require('fs');
let code = fs.readFileSync('src/app/(client)/privacy-analysis/page.tsx', 'utf8');

const targetStart = 'export default function PrivacyAnalysisClientPage() {';
const targetEnd = '    if (!isLoading && !company) {';
const startIndex = code.indexOf(targetStart);
const endIndex = code.indexOf(targetEnd);

if (startIndex !== -1 && endIndex !== -1) {
  const newHeader = `export default function PrivacyAnalysisClientPage() {
    const router = useRouter();
    const { companies, isLoading: companiesLoading } = useCompanies();
    const { user, loading: authLoading } = useAuth();
    const [targetId, setTargetId] = useState<string | null>(null);
    const bookRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress, scrollY } = useScroll();
    const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
    const [showBottomBanner, setShowBottomBanner] = useState(false);

    const { data: analysisData, isLoading: analysisLoading } = useSWR(
        targetId ? \`/api/analyze?targetId=\${targetId}\` : null,
        fetcher
    );
    
    const company = analysisData?.company;
    const isPremium = analysisData?.isPremium ?? true;
    const isLoading = analysisLoading || targetId === null;

    useEffect(() => {
        const unsubscribe = scrollY.on('change', (latest) => {
            if (latest > 400) {
                setShowBottomBanner(true);
            } else {
                setShowBottomBanner(false);
            }
        });
        return () => unsubscribe();
    }, [scrollY]);

    useEffect(() => {
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
            setTargetId(null);
        }
    }, [companies, user, authLoading, companiesLoading]);

`;
  code = code.substring(0, startIndex) + newHeader + code.substring(endIndex);
  console.log('Main logic replaced.');
}

const mapRegEx1 = /<div>[\s\n]*\{displayIssues\.map\(\(issue: any, idx: number\) => \([\s\n]*<IssueItem key=\{idx\} issue=\{issue\} index=\{idx\} \/>[\s\n]*\)\)\}[\s\n]*<\/div>/g;

const mapReplacement = `<div className="relative pb-32">
                                                    {displayIssues.map((issue: any, idx: number) => {
                                                        const isBlinded = issue.customDraft === 'BLIND_TREATMENT';
                                                        return <IssueItem key={idx} issue={issue} index={idx} isBlinded={isBlinded} />
                                                    })}
                                                    {!isPremium && (
                                                        <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t from-[#faf9f6] via-[#faf9f6]/95 to-transparent flex flex-col items-center justify-end pb-8 z-20 pointer-events-auto">
                                                            <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-2xl flex flex-col items-center border border-gray-100 max-w-sm text-center mx-auto">
                                                                <Lock className="w-10 h-10 mb-3 text-amber-500" />
                                                                <h3 className="text-lg font-black text-gray-900 mb-2">프리미엄 세부 검토안 잠김</h3>
                                                                <p className="text-sm font-medium text-gray-500 mb-5 leading-relaxed">
                                                                    상세 권고안을 확인하고 법적 리스크를<br/>해결하려면 전문 변호사에게 조문 개정을 위임하세요.
                                                                </p>
                                                                <button
                                                                    onClick={() => router.push(\`/contracts/sign/\${company?.id}\`)}
                                                                    className="w-full flex justify-center items-center gap-2 px-6 py-4 rounded-xl font-black text-[15px] transition-all hover:scale-105 shadow-xl"
                                                                    style={{
                                                                        background: \`linear-gradient(135deg, '#c9a84c', '#e8c87a')\`,
                                                                        color: '#0a0e1a',
                                                                    }}
                                                                >
                                                                    <FileSignature className="w-5 h-5" /> 방침 전면 개정 위임하기
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>`;

code = code.replace(mapRegEx1, mapReplacement);

// Fix gradient color passing inside style prop
code = code.replace(
  `background: \`linear-gradient(135deg, '#c9a84c', '#e8c87a')\``,
  `background: \`linear-gradient(135deg, \${'#c9a84c'}, \${'#e8c87a'})\``
);
code = code.replace(
  `background: \`linear-gradient(135deg, '#c9a84c', '#e8c87a')\``,
  `background: \`linear-gradient(135deg, \${'#c9a84c'}, \${'#e8c87a'})\``
);


fs.writeFileSync('src/app/(client)/privacy-analysis/page.tsx', code);
console.log('Script done.');

'use client';
import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Clock, ArrowLeft, Scale, FileText, Loader2, Download, Lock, FilePlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import EditableText from '@/components/crm/EditableText';
import { useRequireAuth } from '@/lib/AuthContext';
import {
    DEFAULT_SCENARIO_CATEGORIES, CLAUSE_SCENARIO_MAP,
    type ScenarioCategory, getScenarioCategories,
} from '@/lib/prompts/privacy';
import { supabaseCompanyStore } from '@/lib/supabaseStore';
import { useAutoSettings } from '@/hooks/useDataLayer';
import type { Company, Issue } from '@/lib/mockStore';

// ?? ?됱긽 ??????????????????????????????????????????????????
const R: Record<string, { border: string; bg: string; tag: string; text: string; label: string }> = {
    HIGH: { border: '#dc2626', bg: '#fef2f2', tag: '#fee2e2', text: '#991b1b', label: '?뵶 怨좎쐞?? },
    MEDIUM: { border: '#d97706', bg: '#fffbeb', tag: '#fef3c7', text: '#92400e', label: '?윞 二쇱쓽' },
    LOW: { border: '#2563eb', bg: '#eff6ff', tag: '#dbeafe', text: '#1e40af', label: '?뵷 ??꾪뿕' },
    OK: { border: '#16a34a', bg: '#f0fdf4', tag: '#dcfce7', text: '#166534', label: '???묓샇' },
};

// ?? 議곕Ц ?곗씠?????????????????????????????????????????????
interface Clause {
    num: string; title: string; original: string;
    riskSummary: string; level: 'HIGH' | 'MEDIUM' | 'LOW' | 'OK';
    lawRef: string; lawText: string; scenario: string; penalty: string;
    lawyerOpinion: string; recommendation: string;
    aiFixed: string; revisionOpinion: string; legalBasis: string[];
}

const CLAUSES: Clause[] = [
    {
        num: '珥앹튃', title: '珥앹튃 (?쒕Ц)', level: 'LOW',
        original: '(二??먮윭???댄븯 "?뱀궗"???????댁슜?먯쓽 媛쒖씤?뺣낫瑜?以묒슂?쒗븯硫? 媛쒖씤?뺣낫蹂댄샇踰???愿??踰뺣졊??以?섑븯怨??덉뒿?덈떎. 蹂?泥섎━諛⑹묠? 愿??踰뺣졊 諛??대? ?댁쁺諛⑹묠???곕씪 蹂寃쎈맆 寃쎌슦 怨듭??ы빆???듯빐 怨좎??⑸땲??',
        riskSummary: '?곸젏 ??쓬. ?꾩냽 議고빆怨쇱쓽 ?뺥빀???뺤씤 ?꾩슂.',
        lawRef: '媛쒕낫踰?짠3',
        lawText: '??議?媛쒖씤?뺣낫 蹂댄샇 ?먯튃) 媛쒖씤?뺣낫泥섎━?먮뒗 媛쒖씤?뺣낫??泥섎━ 紐⑹쟻??紐낇솗?섍쾶 ?섏뿬???섍퀬, 洹?紐⑹쟻???꾩슂??踰붿쐞?먯꽌 理쒖냼?쒖쓽 媛쒖씤?뺣낫留뚯쓣 ?곷쾿?섍퀬 ?뺣떦?섍쾶 ?섏쭛?섏뿬???쒕떎.',
        scenario: '?쒕Ц?먯꽌 "愿??踰뺣졊??以?섑븯怨??덉뒿?덈떎"?쇨퀬 ?좎뼵?섎㈃???ㅼ젣 ?꾩냽 議고빆?먯꽌 ?ㅼ닔 ?꾨컲 ?ы빆???뺤씤??寃쎌슦, 媛쒖씤?뺣낫蹂댄샇?꾩썝?뚮뒗 ?대? "?뺤떇??以踰뺤쓽吏留??덉쓣 肉??ㅼ쭏??愿由?遺??濡??먮떒?⑸땲?? ?대뒗 ?ㅻⅨ ?꾨컲 ?ы빆??怨쇳깭猷??곗젙 ??媛以??붿냼濡??묒슜?섎ŉ, ?쒖젙紐낅졊 怨듬Ц?먯꽌 ?먯＜ ?몄슜?⑸땲??',
        penalty: '吏곸젒 ?쒖옱 ?놁쓬 (? ?꾨컲 ??媛以묒궗??',
        lawyerOpinion: '?쒕Ц ?먯껜??吏곸젒?곸씤 踰뺤쟻 ?꾨컲 ?붿냼???놁쑝?? 蹂?蹂닿퀬?쒖뿉???뺤씤???ㅼ닔???꾨컲 ?ы빆怨?紐⑥닚?⑸땲?? "愿??踰뺣졊??以?섑븯怨??덉뒿?덈떎"?쇰뒗 ?좎뼵??臾멸뎄瑜??ъ슜?섎㈃???ㅼ젣濡쒕뒗 ?щ윭 議고빆?먯꽌 踰뺣졊 誘몄??섍? ?뺤씤?섏뿀湲??뚮Ц?낅땲??\n\n?됱젙湲곌? 議곗궗 ???대윭??紐⑥닚???쒗쁽? "?뺤떇??以踰뺤쓽吏留??덉쓣 肉??ㅼ쭏??愿由ш? 遺?ы븯?????먮떒??洹쇨굅媛 ?????덉뒿?덈떎.',
        recommendation: '?꾩냽 議고빆??以踰뺤꽦???뺣낫???? ?쒕Ц???④퍡 ?뺣퉬?섏뿬 ?쇨??깆쓣 ?좎??섏뿬???⑸땲??',
        aiFixed: '(二??먮윭???댄븯 "?뱀궗")??媛쒖씤?뺣낫蹂댄샇踰? ?뺣낫?듭떊留??댁슜珥됱쭊 諛??뺣낫蹂댄샇 ?깆뿉 愿??踰뺣쪧 ??愿??踰뺣졊??以?섑븯硫? 蹂?泥섎━諛⑹묠? 踰뺣졊 媛쒖젙 ?먮뒗 ?대? ?뺤콉 蹂寃????덊럹?댁? 怨듭??ы빆???듯빐 7?????ъ쟾 怨좎??⑸땲??',
        revisionOpinion: '蹂?議고빆? 媛쒖씤?뺣낫蹂댄샇踰???議?媛쒖씤?뺣낫 蹂댄샇 ?먯튃)???곕씪, ?좎뼵??臾멸뎄瑜?援ъ껜???댄뻾 ?쎌냽?쇰줈 蹂寃쏀븯??듬땲?? ?뱁엳 泥섎━諛⑹묠 蹂寃???"7?????ъ쟾 怨좎?" ?섎Т瑜?紐낆떆?섏뿬, ?뺣낫二쇱껜????沅뚮━瑜??ㅼ쭏?곸쑝濡?蹂댁옣?섎뒗 ?뺥깭濡??섏젙?섏??듬땲??',
        legalBasis: ['媛쒖씤?뺣낫蹂댄샇踰???議?(媛쒖씤?뺣낫 蹂댄샇 ?먯튃)', '媛쒖씤?뺣낫蹂댄샇踰???0議?(媛쒖씤?뺣낫 泥섎━諛⑹묠???섎┰ 諛?怨듦컻)'],
    },
    {
        num: '??議?, title: '?섏쭛?섎뒗 媛쒖씤?뺣낫 ??ぉ', level: 'HIGH',
        original: '?뚯궗???쒕퉬???쒓났???꾪빐 ?ㅼ쓬 媛쒖씤?뺣낫瑜??섏쭛?⑸땲??\n?먰븘?섅묒씠由? ?앸뀈?붿씪, ?깅퀎, 濡쒓렇?퇙D, 鍮꾨?踰덊샇, 鍮꾨?踰덊샇 吏덈Ц怨??듬?, ?먰깮?꾪솕踰덊샇, ?먰깮二쇱냼, ?대??꾪솕踰덊샇, ?대찓?? 吏곸뾽, ?뚯궗紐? ?뚯궗?꾪솕踰덊샇\n?먯옄?숈닔吏묆묒꽌鍮꾩뒪 ?댁슜湲곕줉, ?묒냽濡쒓렇, ?묒냽IP?뺣낫, 寃곗젣湲곕줉, ?좏샇硫붾돱, ?좏샇留ㅼ옣, 硫ㅻ쾭??뭅???뚯??щ?, 荑좏궎, 遺덈웾 ?댁슜 湲곕줉',
        riskSummary: '??怨쇰떎?섏쭛 ?섏떖 ??"鍮꾨?踰덊샇 吏덈Ц/?듬?" ?쒗쁽 ???꾩닔쨌?좏깮 誘몃텇由?,
        lawRef: '媛쒕낫踰?짠16, 짠29',
        lawText: '??6議?媛쒖씤?뺣낫???섏쭛 ?쒗븳) ??媛쒖씤?뺣낫泥섎━?먮뒗 ??5議곗젣1??媛??몄쓽 ?대뒓 ?섎굹???대떦?섏뿬 媛쒖씤?뺣낫瑜??섏쭛?섎뒗 寃쎌슦?먮뒗 洹?紐⑹쟻???꾩슂??理쒖냼?쒖쓽 媛쒖씤?뺣낫瑜??섏쭛?섏뿬???쒕떎. ??寃쎌슦 理쒖냼?쒖쓽 媛쒖씤?뺣낫 ?섏쭛?대씪???낆쬆梨낆엫? 媛쒖씤?뺣낫泥섎━?먭? 遺?댄븳??',
        scenario: '媛쒖씤?뺣낫蹂댄샇?꾩썝???뺢린媛먯궗 ??怨쇰떎?섏쭛 ??ぉ???곷컻?섎㈃ 利됱떆 ?쒖젙紐낅졊???대젮吏묐땲?? 理쒓렐 3?꾧컙 ?꾨옖李⑥씠利?湲곗뾽 ?됯퇏 怨쇳깭猷뚮뒗 2,800留뚯썝?낅땲??\n\n荑좏뙜??寃쎌슦 2023??媛쒖씤?뺣낫 ?좎텧濡?怨쇱쭠湲?55?듭썝??遺怨쇰릺?덉쑝硫? ?명꽣?뚰겕??44?듭썝??遺怨쇰릺?덉뒿?덈떎. 怨쇰떎?섏쭛? ?좎텧 ???쇳빐 踰붿쐞瑜??뺣??쒗궎??媛以??ъ쑀?낅땲??\n\n?먰븳 ?뺣낫二쇱껜媛 誘쇱썝???쒓린??寃쎌슦 吏묐떒?뚯넚?쇰줈 ?뺣??????덉쑝硫? ?먮???1?몃떦 10~30留뚯썝???꾩옄猷뚭? ?몄젙?섍퀬 ?덉뼱 ?洹쒕え ?뚯썝 蹂댁쑀 湲곗뾽?쇱닔濡??ъ젙??由ъ뒪?ш? ?쎈땲??',
        penalty: '怨쇳깭猷?理쒕? 5,000留뚯썝 + ?쒖젙紐낅졊',
        lawyerOpinion: '媛쒖씤?뺣낫蹂댄샇踰???6議?????? "媛쒖씤?뺣낫泥섎━?먮뒗 紐⑹쟻 ?ъ꽦???꾩슂??理쒖냼?쒖쓽 媛쒖씤?뺣낫瑜??섏쭛?섏뿬???쒕떎"怨?洹쒖젙?섍퀬 ?덉뒿?덈떎.\n\n?꾪뻾 諛⑹묠? ?뚯쭅?? ?뚯궗紐? ?뚯궗?꾪솕踰덊샇, ?먰깮?꾪솕踰덊샇?????쒕퉬???쒓났??吏곸젒??愿?⑥씠 ?녿뒗 ??ぉ??\'?꾩닔\'濡?遺꾨쪟?섍퀬 ?덉뼱 怨쇰떎?섏쭛???대떦???뚯?媛 ?믪뒿?덈떎. ?뱁엳 ?뚮퉬諛踰덊샇 吏덈Ц怨??듬?????ぉ? ?됰Ц ??μ쑝濡??ㅼ씤?????덉뼱 ??9議??덉쟾議곗튂?섎Т) ?꾨컲 異붿젙??洹쇨굅媛 ?⑸땲??\n\n?꾩닔 ??ぉ怨??좏깮 ??ぉ??遺꾨━媛 ?뺤떇?곸쑝濡쒕룄 ?대（?댁?吏 ?딆븯?쇰ŉ, ?대뒗 媛쒖씤?뺣낫蹂댄샇?꾩썝?뚯쓽 ?뺢린 ?먭? ??理쒖슦??吏????곸엯?덈떎.',
        recommendation: '?꾩닔 ??ぉ???뚯씠由? 濡쒓렇?퇙D, 鍮꾨?踰덊샇, ?대??꾪솕踰덊샇, ?대찓?쇈띾줈 ?쒖젙?섍퀬, ?섎㉧吏???좏깮 ??ぉ?쇰줈 遺꾨━?섏뿬???⑸땲??',
        aiFixed: '?먰븘?섅묒씠由? 濡쒓렇?퇙D, 鍮꾨?踰덊샇, ?대??꾪솕踰덊샇, ?대찓??n?먯꽑?앫묒깮?꾩썡?? ?깅퀎, ?먰깮二쇱냼\n?먯옄?숈닔吏묆묒꽌鍮꾩뒪 ?댁슜湲곕줉, ?묒냽濡쒓렇, ?묒냽IP, 荑좏궎\n?먭껐????異붽??섏쭛?묎껐?쒖닔???뺣낫, 嫄곕옒?댁뿭\n\n??鍮꾨?踰덊샇 遺꾩떎 ??蹂몄씤?뺤씤? "?깅줉???대찓???몄쬆" 諛⑹떇?쇰줈 泥섎━?섎ŉ, 蹂꾨룄 吏덈Ц쨌?듬?? ?섏쭛?섏? ?딆뒿?덈떎.',
        revisionOpinion: '媛쒖씤?뺣낫蹂댄샇踰???6議?媛쒖씤?뺣낫???섏쭛 ?쒗븳)???곕씪 ?쒕퉬???쒓났??遺덊븘?뷀븳 ??ぉ(吏곸뾽, ?뚯궗紐??????꾩닔?먯꽌 ?쒖쇅?섍퀬 ?좏깮 ??ぉ?쇰줈 ?щ텇瑜섑븯??듬땲??\n\n?뚮퉬諛踰덊샇 吏덈Ц怨??듬??띿? ??9議??덉쟾議곗튂?섎Т) ?꾨컲 ?뚯?媛 ?덉뼱 ?대찓???몄쬆 諛⑹떇?쇰줈 ?泥댄븯??듬땲?? ?대뒗 媛쒖씤?뺣낫蹂댄샇?꾩썝?뚯쓽 2024??媛?대뱶?쇱씤??遺?⑺븯??諛⑹떇?낅땲??',
        legalBasis: ['媛쒖씤?뺣낫蹂댄샇踰???6議?(媛쒖씤?뺣낫???섏쭛 ?쒗븳)', '媛쒖씤?뺣낫蹂댄샇踰???9議?(?덉쟾議곗튂?섎Т)'],
    },
    {
        num: '??議?, title: '媛쒖씤?뺣낫 ?섏쭛쨌?댁슜 紐⑹쟻', level: 'MEDIUM',
        original: '?뱀궗???섏쭛??媛쒖씤?뺣낫瑜??ㅼ쓬 紐⑹쟻???댁슜?⑸땲??\n- ?쒕퉬???쒓났 諛?怨꾩빟 ?댄뻾\n- ?뚯썝 愿由?諛?蹂몄씤 ?뺤씤\n- 留덉???諛?愿묎퀬 ?쒖슜\n- ?듦퀎 遺꾩꽍',
        riskSummary: '"留덉???諛?愿묎퀬 ?쒖슜" 蹂꾨룄 ?숈쓽 ?놁씠 ?꾩닔 紐⑹쟻???쇱옱.',
        lawRef: '媛쒕낫踰?짠15, 짠22',
        lawText: '??2議??숈쓽瑜?諛쏅뒗 諛⑸쾿) ??媛쒖씤?뺣낫泥섎━?먮뒗 ?뺣낫二쇱껜?먭쾶 ?ы솕 ?먮뒗 ?쒕퉬?ㅻ? ?띾낫?섍굅???먮ℓ瑜?沅뚯쑀?섍린 ?꾪븯??媛쒖씤?뺣낫??泥섎━??????숈쓽瑜?諛쏆쑝?ㅻ뒗 ?뚯뿉???뺣낫二쇱껜媛 ?대? 紐낇솗?섍쾶 ?몄??????덈룄濡??뚮━怨??숈쓽瑜?諛쏆븘???쒕떎.',
        scenario: '蹂꾨룄 ?숈쓽 ?놁씠 留덉??낆씠 吏꾪뻾??寃쎌슦, ?뺣낫二쇱껜媛 ?ㅽ뙵 ?좉퀬瑜??섎㈃ 諛⑹넚?듭떊?꾩썝???먮뒗 媛쒖씤?뺣낫蹂댄샇?꾩썝?뚭? 議곗궗??李⑹닔?⑸땲?? ?숈쓽 ?덉감 ?좉껐???뺤씤?섎㈃ ?대떦 留덉????쒕룞 ?꾩껜媛 遺덈쾿?쇰줈 媛꾩＜?????덉뒿?덈떎.\n\n理쒓렐 ?꾨옖李⑥씠利??낃퀎?먯꽌??媛留뱀젏二쇰뱾??蹂몄궗??留덉????숈쓽 ?덉감 誘몃퉬瑜??댁쑀濡?媛留밴퀎???댁?瑜?二쇱옣?섎뒗 ?щ?媛 利앷??섍퀬 ?덉뒿?덈떎. ?먰븳 寃쎌웳 釉뚮옖?쒓? "媛쒖씤?뺣낫 ?몄쬆 痍⑤뱷"??留덉??낆뿉 ?쒖슜?섎㈃???곷???鍮꾧탳 ?댁쐞???볦씪 ???덉뒿?덈떎.',
        penalty: '怨쇳깭猷?3,000留뚯썝 ?댄븯',
        lawyerOpinion: '媛쒖씤?뺣낫蹂댄샇踰???5議????????몃뒗 ?뺣낫二쇱껜???숈쓽瑜?諛쏆쓣 ???섏쭛쨌?댁슜 紐⑹쟻??紐낇솗???뚮젮???쒕떎怨?洹쒖젙?⑸땲??\n\n?꾪뻾 諛⑹묠?먯꽌 "留덉???諛?愿묎퀬 ?쒖슜"???꾩닔 ?섏쭛쨌?댁슜 紐⑹쟻???ы븿?쒗궓 寃껋? 臾몄젣?낅땲?? 媛숈? 踰???2議?????뿉 ?곕씪, ?ы솕 ?먮뒗 ?쒕퉬?ㅼ쓽 ?띾낫쨌?먮ℓ 沅뚯쑀 ?깆쓣 ?꾪븳 媛쒖씤?뺣낫 泥섎━??諛섎뱶??蹂꾨룄 ?숈쓽瑜?諛쏆븘???⑸땲??\n\n?꾩옱 ?뺥깭濡쒕뒗 ?꾩닔 ?숈쓽??留덉??낆쓣 ?쇱썙?ｌ? "臾살?留??숈쓽(bundled consent)"濡??먮떒?????덉쑝硫? ?대뒗 ?숈쓽 ?먯껜???좏슚?깆쓣 ?쇱넀?????덉뒿?덈떎.',
        recommendation: '留덉???紐⑹쟻???꾩닔 ?댁슜 紐⑹쟻?먯꽌 遺꾨━?섍퀬, 蹂꾨룄???좏깮 ?숈쓽 ?덉감瑜?留덈젴?섏뿬???⑸땲??',
        aiFixed: '?먰븘???댁슜 紐⑹쟻??n???쒕퉬???쒓났 諛?怨꾩빟 ?댄뻾\n???뚯썝 愿由?諛?蹂몄씤 ?뺤씤\n???쒕퉬??媛쒖꽑???꾪븳 ?듦퀎 遺꾩꽍\n\n?먯꽑???숈쓽 紐⑹쟻 ??蹂꾨룄 ?숈쓽 ?쒖뿉留??쒖슜??n???대깽?맞룻봽濡쒕え?샕룰킅怨좎꽦 ?뺣낫 諛쒖넚 (SMS, ?대찓?? ???몄떆)\n\n???좏깮 ?숈쓽瑜?嫄곕??섏떆?붾씪??湲곕낯 ?쒕퉬???댁슜?먮뒗 ?쒗븳???놁뒿?덈떎.',
        revisionOpinion: '媛쒖씤?뺣낫蹂댄샇踰???2議?????뿉 ?곕씪 留덉???紐⑹쟻 ?섏쭛쨌?댁슜? 諛섎뱶??蹂꾨룄 ?숈쓽瑜?諛쏆븘???⑸땲?? 蹂??섏젙?덉뿉?쒕뒗 ?꾩닔 ?댁슜 紐⑹쟻怨??좏깮 ?숈쓽 紐⑹쟻??紐낇솗??遺꾨━?섍퀬, ?좏깮 ?숈쓽 嫄곕? ?쒖뿉???쒕퉬???댁슜???쒗븳???놁쓬??紐낆떆?섏??듬땲??',
        legalBasis: ['媛쒖씤?뺣낫蹂댄샇踰???5議?(媛쒖씤?뺣낫???섏쭛쨌?댁슜)', '媛쒖씤?뺣낫蹂댄샇踰???2議?(?숈쓽瑜?諛쏅뒗 諛⑸쾿)'],
    },
    {
        num: '??議?, title: '媛쒖씤?뺣낫 蹂댁쑀쨌?댁슜 湲곌컙', level: 'MEDIUM',
        original: '?뱀궗??媛쒖씤?뺣낫 ?섏쭛 諛??댁슜 紐⑹쟻 ?ъ꽦 ??吏泥??놁씠 ?뚭린?⑸땲??\n?ㅻ쭔, 愿怨꾨쾿?뱀뿉 ?섑빐 蹂댁〈??寃쎌슦:\n- 怨꾩빟 ?먮뒗 泥?빟泥좏쉶 ?깆쓽 湲곕줉: 5??n- ?뚮퉬??遺덈쭔 諛?遺꾩웳泥섎━ 湲곕줉: 3??,
        riskSummary: '荑좏궎 ??젣 二쇨린, 鍮꾪솢??怨꾩젙 泥섎━, 留덉???泥좏쉶 ??湲곌컙 誘몃챸??',
        lawRef: '媛쒕낫踰?짠21, ?뺣낫?듭떊留앸쾿 짠29',
        lawText: '??1議?媛쒖씤?뺣낫???뚭린) ??媛쒖씤?뺣낫泥섎━?먮뒗 蹂댁쑀湲곌컙??寃쎄낵, 媛쒖씤?뺣낫??泥섎━ 紐⑹쟻 ?ъ꽦 ??洹?媛쒖씤?뺣낫媛 遺덊븘?뷀븯寃??섏뿀???뚯뿉??吏泥??놁씠 洹?媛쒖씤?뺣낫瑜??뚭린?섏뿬???쒕떎.',
        scenario: '鍮꾪솢??怨꾩젙?먯꽌 媛쒖씤?뺣낫 ?좎텧 ?ш퀬媛 諛쒖깮??寃쎌슦, 遺덊븘?뷀븳 ?뺣낫瑜??뚭린?섏? ?딆? 洹梨낆궗?좉? ?뷀빐???먰빐諛곗긽 梨낆엫??媛以묐맗?덈떎.\n\n理쒓렐 ?먮??먯꽌 1?몃떦 10~30留뚯썝???꾩옄猷뚭? ?몄젙?섍퀬 ?덉뼱, ?뚯썝 10留뚮챸 湲곗뾽 湲곗? 理쒕? 30?듭썝 洹쒕え??吏묐떒?뚯넚??媛?ν빀?덈떎.\n\n?먰븳 ??쒖씠??媛쒖씤?????誘쇱궗 ?먰빐諛곗긽 泥?뎄??蹂묓뻾?????덉쑝硫? 媛쒕낫踰?짠74???곕씪 怨좎쓽쨌以묎낵????5???댄븯 吏뺤뿭 ?먮뒗 5,000留뚯썝 ?댄븯 踰뚭툑???뺤궗泥섎쾶 媛?μ꽦???덉뒿?덈떎.',
        penalty: '怨쇳깭猷?2,000留뚯썝 ?댄븯 + ?쒖젙紐낅졊',
        lawyerOpinion: '媛쒖씤?뺣낫蹂댄샇踰???1議?????? "蹂댁쑀湲곌컙??寃쎄낵, 泥섎━ 紐⑹쟻 ?ъ꽦 ??媛쒖씤?뺣낫媛 遺덊븘?뷀븯寃??섏뿀????吏泥??놁씠 ?뚭린?섏뿬???쒕떎"怨?洹쒖젙?⑸땲??\n\n?꾪뻾 諛⑹묠? 荑좏궎????젣 二쇨린, 鍮꾪솢??怨꾩젙(?κ린 誘몄씠?⑹옄)??泥섎━ 湲곗?, 留덉????숈쓽 泥좏쉶 ???뺣낫 蹂댁쑀 湲곌컙 ???ㅻТ?곸쑝濡?以묒슂???ы빆???꾪? 紐낆떆?섏? ?딄퀬 ?덉뒿?덈떎.\n\n?뱁엳 ?κ린 誘몄씠?⑹옄(1???댁긽 誘몄젒?? 怨꾩젙??媛쒖씤?뺣낫??蹂꾨룄 遺꾨━ ??ν븯嫄곕굹 ?뚭린?섏뿬???섎뒗???뺣낫?듭떊留앸쾿 ??9議?, ?댁뿉 ???湲곗????놁뼱 遺덊븘?뷀븳 ?뺣낫瑜??κ린 蹂닿??섎뒗 寃곌낵瑜?珥덈옒?섍퀬 ?덉뒿?덈떎.',
        recommendation: '荑좏궎, 鍮꾪솢??怨꾩젙, 留덉???泥좏쉶 ??媛곴컖???뚭린 湲곗?怨??덉감瑜?援ъ껜?곸쑝濡?紐낆떆?섏뿬???⑸땲??',
        aiFixed: '?먯씠??紐⑹쟻 ?ъ꽦 ??利됱떆 ?뚭린??n- 荑좏궎: ?몄뀡 荑좏궎??釉뚮씪?곗? 醫낅즺 ?? 吏??荑좏궎??1???대궡 ?먮룞 ??젣\n- 鍮꾪솢??怨꾩젙: 理쒖쥌 濡쒓렇?몄씪濡쒕???1??寃쎄낵 ???뚭린 (30?????ъ쟾 ?덈궡)\n- 留덉????숈쓽 泥좏쉶 利됱떆 愿???뺣낫 ?뚭린\n\n?먮쾿?뱀뿉 ?곕Ⅸ 蹂댁〈??n- 怨꾩빟쨌泥?빟泥좏쉶 湲곕줉: 5??(?꾩옄?곴굅?섎쾿)\n- ?뚮퉬??遺덈쭔쨌遺꾩웳 湲곕줉: 3??(?꾩옄?곴굅?섎쾿)\n- ?묒냽 濡쒓렇: 3媛쒖썡 (?듭떊鍮꾨?蹂댄샇踰?',
        revisionOpinion: '媛쒖씤?뺣낫蹂댄샇踰???1議?諛??뺣낫?듭떊留앸쾿 ??9議곗뿉 ?곕씪, 湲곗〈???꾨씫??荑좏궎 ??젣 二쇨린, 鍮꾪솢??怨꾩젙 泥섎━ 湲곗?, 留덉????숈쓽 泥좏쉶 ???뚭린 湲고븳??援ъ껜?곸쑝濡?紐낆떆?섏??듬땲?? ?뱁엳 鍮꾪솢??怨꾩젙??寃쎌슦 30?????ъ쟾 ?덈궡 ?섎Т瑜??ы븿?섏뿬 ?뺣낫二쇱껜??沅뚮━瑜?蹂댁옣?섏??듬땲??',
        legalBasis: ['媛쒖씤?뺣낫蹂댄샇踰???1議?(媛쒖씤?뺣낫???뚭린)', '?뺣낫?듭떊留앸쾿 ??9議?(媛쒖씤?뺣낫???뚭린)'],
    },
    {
        num: '??議?, title: '媛쒖씤?뺣낫???????쒓났', level: 'HIGH',
        original: '?뱀궗???댁슜?먯쓽 媛쒖씤?뺣낫瑜????먯뿉寃??쒓났?섏? ?딆뒿?덈떎. ?ㅻ쭔, 踰뺣졊???섑븯嫄곕굹 ?댁슜?먯쓽 ?숈쓽媛 ?덈뒗 寃쎌슦 ?덉쇅濡??⑸땲??',
        riskSummary: '?ㅼ젣 PG??룸같?ъ빋쨌愿묎퀬?뚮옯?????쒓났 ?꾪솴 ?꾨㈃ 誘몃챸??',
        lawRef: '媛쒕낫踰?짠17, 짠75',
        lawText: '??7議?媛쒖씤?뺣낫???쒓났) ??媛쒖씤?뺣낫泥섎━?먮뒗 ?뺣낫二쇱껜???숈쓽瑜?諛쏆? 寃쎌슦, ?쒓났諛쏅뒗 ?먯쓽 ?댁슜 紐⑹쟻, ?쒓났?섎뒗 媛쒖씤?뺣낫????ぉ, ?쒓났諛쏅뒗 ?먯쓽 蹂댁쑀 諛??댁슜 湲곌컙???뺣낫二쇱껜?먭쾶 ?뚮젮???쒕떎.',
        scenario: '?뺣낫二쇱껜??誘쇱썝 ?먮뒗 ?뺢린媛먯궗 ???ㅼ젣 ?????쒓났 ?꾪솴怨?泥섎━諛⑹묠 媛꾩쓽 遺덉씪移섍? ?뺤씤?섎㈃, 誘몃룞???쒓났?쇰줈 媛꾩＜?⑸땲??\n\n荑좏뙜??2023???щ??먯꽌 留ㅼ텧??湲곕컲 怨쇱쭠湲?55?듭썝??遺怨쇰릺?덉쑝硫? ?꾨컲?ъ떎??媛쒖씤?뺣낫蹂댄샇?꾩썝???덊럹?댁???6媛쒖썡媛?怨듯몴?⑸땲?? ?꾨옖李⑥씠利?湲곗뾽??寃쎌슦 ?대윭??怨듯몴??媛留뱀젏二??댄깉怨??뚮퉬???좊ː ?섎씫?쇰줈 吏곴껐?⑸땲??\n\n????⑺뭹泥??숆탳쨌愿怨듭꽌쨌?湲곗뾽)??嫄곕옒 ?낆껜??媛쒖씤?뺣낫 愿由??몄쬆???붽뎄?섎뒗 異붿꽭?대ŉ, ?꾨컲 ?대젰???덉쑝硫?嫄곕옒 ?먯껜媛 遺덇??????덉뒿?덈떎. ?댁쇅 吏꾩텧 ?쒖뿉??GDPR/CCPA ?곹빀?깆씠 遺?ы븯硫??쒖옣 吏꾩엯 ?먯껜媛 李⑤떒?⑸땲??',
        penalty: '怨쇱쭠湲?留ㅼ텧??3% ?댄븯 + ?쒖젙紐낅졊 + ?꾨컲?ъ떎 怨듯몴',
        lawyerOpinion: '媛쒖씤?뺣낫蹂댄샇踰???7議?????? ?????쒓났 ??"?쒓났諛쏅뒗 ?? ?쒓났 紐⑹쟻, ?쒓났 ??ぉ, 蹂댁쑀쨌?댁슜 湲곌컙"???뺣낫二쇱껜?먭쾶 ?뚮━怨??숈쓽瑜?諛쏅룄濡?洹쒖젙?섍퀬 ?덉뒿?덈떎.\n\n洹몃윭??洹?щ뒗 ?ㅻТ?곸쑝濡?PG??寃곗젣???, 諛곕떖?뚮옯?? 愿묎퀬 ?뚮옯??Meta, Google Ads) ?깆뿉 怨좉컼 ?뺣낫瑜??꾨떖?섍퀬 ?덉쑝硫댁꽌??泥섎━諛⑹묠???대? ?꾪? 紐낆떆?섏? ?딄퀬 ?덉뒿?덈떎. ?대뒗 "?????쒓났 ?ъ떎?????濡??댁꽍???ъ?媛 ?덉뼱, ?⑥닚 誘멸린?щ낫??以묓븳 ?됱젙???쒖옱媛 ?덉긽?⑸땲??\n\n?뱁엳 媛쒖씤?뺣낫蹂댄샇?꾩썝?뚮뒗 2024???댄썑 ?꾨옖李⑥씠利??낆쥌??????????쒓났 ?ㅽ깭 吏묒쨷 ?먭????ㅼ떆?섍퀬 ?덉뼱, ?꾪뿕?꾧? 留ㅼ슦 ?믪뒿?덈떎.',
        recommendation: '?ㅼ젣 ?????쒓났 ?꾪솴??議곗궗?섏뿬 ?쒓났諛쏅뒗 ?? 紐⑹쟻, ??ぉ, 蹂댁쑀湲곌컙?????뺥깭濡?紐낆떆?섏뿬???⑸땲??',
        aiFixed: '?먯젣3???쒓났 ?꾪솴??n\n| ?쒓났諛쏅뒗 ??| ?쒓났 紐⑹쟻 | ?쒓났 ??ぉ | 蹂댁쑀湲곌컙 |\n|---|---|---|---|\n| (二?KG?대땲?쒖뒪 | 寃곗젣 泥섎━ | ?대쫫, 移대뱶?뺣낫, 嫄곕옒湲덉븸 | 寃곗젣 ?꾨즺 ??5??|\n| 諛곕떖?섎?議?| 二쇰Ц 以묎퀎 | ?대쫫, ?곕씫泥? 二쇱냼 | 諛곕떖 ?꾨즺 ??30??|\n| Meta (Facebook) | 愿묎퀬 理쒖쟻??| ?대찓???댁떆媛?(?좏깮?숈쓽?먮쭔) | ?숈쓽 泥좏쉶 ??利됱떆 ??젣 |\n\n????寃쎌슦 ???????쒓났 ?놁쓬. ?좏깮 ?숈쓽 嫄곕? ??愿묎퀬 ?쒓났 ?쒖쇅.',
        revisionOpinion: '媛쒖씤?뺣낫蹂댄샇踰???7議곗뿉 ?곕씪 ?ㅼ젣 ?????쒓났 ?꾪솴?????뺥깭濡?紐낆떆?섏??듬땲?? ?쒓났諛쏅뒗 ?? 紐⑹쟻, ??ぉ, 蹂댁쑀湲곌컙??援ъ껜?곸쑝濡?湲곗옱?섏뿬 ?뺣낫二쇱껜????沅뚮━瑜?蹂댁옣?섏??듬땲?? ?뱁엳 愿묎퀬 紐⑹쟻 ?쒓났? ?좏깮 ?숈쓽?먯뿉 ?쒖젙?섍퀬, ?숈쓽 泥좏쉶 ??利됱떆 ??젣 ?섎Т瑜?紐낆떆?섏??듬땲??',
        legalBasis: ['媛쒖씤?뺣낫蹂댄샇踰???7議?(媛쒖씤?뺣낫???쒓났)', '媛쒖씤?뺣낫蹂댄샇踰???5議?(怨쇳깭猷?'],
    },
];

// ?? ??몺 1李?議곕Ц寃???????????????????????????????????????
function FirstReviewRow({ c, data, onChange, categories }: {
    c: Clause; data: Record<string, string>; onChange: (k: string, v: string) => void;
    categories: ScenarioCategory[];
}) {
    const col = R[c.level];
    const hasIssue = c.level !== 'OK';
    const scenarioCats = (CLAUSE_SCENARIO_MAP[c.num] || [])
        .map(id => categories.find(cat => cat.id === id && cat.enabled))
        .filter(Boolean) as ScenarioCategory[];

    return (
        <div style={{ borderBottom: '2px solid #e5e7eb', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontWeight: 800, fontSize: 11, background: col.tag, color: col.text, borderRadius: 4, padding: '2px 8px' }}>{c.num}</span>
                <span style={{ fontWeight: 900, fontSize: 13, color: '#111827' }}>{c.title}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: col.tag, color: col.text }}>{col.label}</span>
            </div>

            {hasIssue && (
                <>



                    {/* ?쒕굹由ъ삤 ?ㅻ챸 */}
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>???꾨컲 ???덉긽 ?쒕굹由ъ삤</div>
                    <EditableText
                        value={data[`${c.num}_scenario`] ?? c.scenario}
                        onChange={v => onChange(`${c.num}_scenario`, v)}
                        style={{ background: '#fef2f2', borderColor: '#fecaca', marginBottom: 12 }}
                    />

                    {/* ?덉긽 ?쒖옱 + ?섏젙 沅뚭퀬 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>?뮥 ?덉긽 ?쒖옱</div>
                            <EditableText
                                value={data[`${c.num}_penalty`] ?? c.penalty}
                                onChange={v => onChange(`${c.num}_penalty`, v)}
                                style={{ background: '#fef2f2', borderColor: '#fecaca', fontWeight: 800, color: '#991b1b' }}
                            />
                        </div>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>?뱦 ?섏젙 沅뚭퀬</div>
                            <EditableText
                                value={data[`${c.num}_recommendation`] ?? c.recommendation}
                                onChange={v => onChange(`${c.num}_recommendation`, v)}
                                style={{ background: '#f0f9ff', borderColor: '#bae6fd', color: '#0c4a6e' }}
                            />
                        </div>
                    </div>
                </>
            )}

        </div>
    );
}

// ?? ??몼 ?꾩껜?섏젙?꾨낯 ?????????????????????????????????????
function FullRevisionRow({ c, data, onChange }: {
    c: Clause; data: Record<string, string>; onChange: (k: string, v: string) => void;
}) {
    return (
        <div style={{ borderBottom: '2px solid #e5e7eb', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontWeight: 800, fontSize: 11, background: '#dcfce7', color: '#166534', borderRadius: 4, padding: '2px 8px' }}>?섏젙?꾨즺</span>
                <span style={{ fontWeight: 900, fontSize: 13, color: '#166534' }}>{c.num} ??{c.title}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#dcfce7', color: '#166534' }}>???섏젙</span>
            </div>

            {/* ???섏젙 ?꾨즺蹂?*/}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#166534', marginBottom: 4 }}>?뱞 ?섏젙 ?꾨즺蹂?/div>
            <EditableText
                value={data[`${c.num}_fixed`] ?? c.aiFixed}
                onChange={v => onChange(`${c.num}_fixed`, v)}
                style={{ borderColor: '#86efac', marginBottom: 12 }}
            />

            {/* ??蹂?몄궗 寃?좎쓽寃?*/}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>??蹂?몄궗 寃?좎쓽寃?/div>
            <EditableText
                value={data[`${c.num}_revOpinion`] ?? c.revisionOpinion}
                onChange={v => onChange(`${c.num}_revOpinion`, v)}
                style={{ background: '#fffbeb', borderColor: '#fde68a', marginBottom: 12 }}
            />

            {/* ???섏젙 洹쇨굅 */}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#1d4ed8', marginBottom: 4 }}>?뱥 ?섏젙 洹쇨굅</div>
            <div style={{ fontSize: 12, color: '#1e40af', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '8px 12px', lineHeight: 1.7 }}>
                {c.legalBasis.map((b, i) => <div key={i}>쨌 {b}</div>)}
            </div>

        </div>
    );
}

// ?? 硫붿씤 ??????????????????????????????????????????????????
export default function PrivacyReviewPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        }>
            <PrivacyReviewContent />
        </Suspense>
    );
}

function PrivacyReviewContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { loading, authorized } = useRequireAuth(['super_admin', 'admin', 'lawyer', 'sales']);
    const { settings: autoSettings } = useAutoSettings();
    const company = searchParams?.get('company') || '(二??먮윭??;
    const leadId = searchParams?.get('leadId') || undefined;
    const [tab, setTab] = useState<'first' | 'full'>('first');
    const [data, setData] = useState<Record<string, string>>({});
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [confirmedTab, setConfirmedTab] = useState<'first' | 'full' | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [confirmProgress, setConfirmProgress] = useState('');
    const [categories, setCategories] = useState<ScenarioCategory[]>(DEFAULT_SCENARIO_CATEGORIES);
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [requestingFiles, setRequestingFiles] = useState(false);
    const [docsList, setDocsList] = useState({ contract: false, rules: false, security: false, other: false });
    const [customReqMsg, setCustomReqMsg] = useState('');
    const [toastMsg, setToastMsg] = useState('');
    const [clauses, setClauses] = useState<Clause[]>(CLAUSES);
    const [fetching, setFetching] = useState(true);
    const t0 = useRef(Date.now());

    // ?? ?덇굅???곗씠?곕? ?꾪븳 踰뺤“臾??먮Ц ?대갚 (PDF ?댁슜 湲곕컲) ???????????????????????
    const getFallbackLawText = (lawRef: string = ''): string => {
        if (!lawRef) return '?????녿뒗 踰뺣졊 李몄“?낅땲??';
        if (lawRef.includes('짠15') || lawRef.includes('??5議?)) {
            return '媛쒖씤?뺣낫蹂댄샇踰???5議?媛쒖씤?뺣낫???섏쭛쨌?댁슜) ??媛쒖씤?뺣낫泥섎━?먮뒗 ?ㅼ쓬 媛??몄쓽 ?대뒓 ?섎굹???대떦?섎뒗 寃쎌슦?먮뒗 洹?紐⑹쟻???꾩슂??理쒖냼?쒖쓽 媛쒖씤?뺣낫瑜??섏쭛?????덉쑝硫? ?섏쭛??紐⑹쟻??踰붿쐞?먯꽌 ?댁슜?????덈떎. 1. ?뺣낫二쇱껜???숈쓽瑜?諛쏆? 寃쎌슦 ...';
        }
        if (lawRef.includes('짠16') || lawRef.includes('??6議?)) {
            return '媛쒖씤?뺣낫蹂댄샇踰???6議?媛쒖씤?뺣낫???섏쭛 ?쒗븳) ??媛쒖씤?뺣낫泥섎━?먮뒗 ??5議곗젣1??媛??몄쓽 ?대뒓 ?섎굹???대떦?섏뿬 媛쒖씤?뺣낫瑜??섏쭛?섎뒗 寃쎌슦?먮뒗 洹?紐⑹쟻???꾩슂??理쒖냼?쒖쓽 媛쒖씤?뺣낫瑜??섏쭛?섏뿬???쒕떎. ??寃쎌슦 理쒖냼?쒖쓽 媛쒖씤?뺣낫 ?섏쭛?대씪???낆쬆梨낆엫? 媛쒖씤?뺣낫泥섎━?먭? 遺?댄븳??';
        }
        if (lawRef.includes('짠17') || lawRef.includes('??7議?)) {
            return '媛쒖씤?뺣낫蹂댄샇踰???7議?媛쒖씤?뺣낫???쒓났) ??媛쒖씤?뺣낫泥섎━?먮뒗 ?ㅼ쓬 媛??몄쓽 ?대뒓 ?섎굹???대떦?섎뒗 寃쎌슦?먮뒗 ?뺣낫二쇱껜??媛쒖씤?뺣낫瑜????먯뿉寃??쒓났(怨듭쑀瑜??ы븿?쒕떎. ?댄븯 媛숇떎)?????덈떎. 1. ?뺣낫二쇱껜???숈쓽瑜?諛쏆? 寃쎌슦 ...';
        }
        if (lawRef.includes('짠21') || lawRef.includes('??1議?)) {
            return '媛쒖씤?뺣낫蹂댄샇踰???1議?媛쒖씤?뺣낫???뚭린) ??媛쒖씤?뺣낫泥섎━?먮뒗 蹂댁쑀湲곌컙??寃쎄낵, 媛쒖씤?뺣낫??泥섎━ 紐⑹쟻 ?ъ꽦 ??洹?媛쒖씤?뺣낫媛 遺덊븘?뷀븯寃??섏뿀???뚯뿉??吏泥??놁씠 洹?媛쒖씤?뺣낫瑜??뚭린?섏뿬???쒕떎. ?ㅻ쭔, ?ㅻⅨ 踰뺣졊???곕씪 蹂댁〈?섏뿬???섎뒗 寃쎌슦?먮뒗 洹몃윭?섏? ?꾨땲?섎떎.';
        }
        if (lawRef.includes('짠22') || lawRef.includes('??2議?)) {
            return '媛쒖씤?뺣낫蹂댄샇踰???2議??숈쓽瑜?諛쏅뒗 諛⑸쾿) ??媛쒖씤?뺣낫泥섎━?먮뒗 ?뺣낫二쇱껜?먭쾶 ?ы솕 ?먮뒗 ?쒕퉬?ㅻ? ?띾낫?섍굅???먮ℓ瑜?沅뚯쑀?섍린 ?꾪븯??媛쒖씤?뺣낫??泥섎━??????숈쓽瑜?諛쏆쑝?ㅻ뒗 ?뚯뿉???뺣낫二쇱껜媛 ?대? 紐낇솗?섍쾶 ?몄??????덈룄濡??뚮━怨??숈쓽瑜?諛쏆븘???쒕떎.';
        }
        if (lawRef.includes('짠29') || lawRef.includes('??9議?)) {
            return '媛쒖씤?뺣낫蹂댄샇踰???9議??덉쟾議곗튂?섎Т) 媛쒖씤?뺣낫泥섎━?먮뒗 媛쒖씤?뺣낫媛 遺꾩떎쨌?꾨궃쨌?좎텧쨌?꾩“쨌蹂議??먮뒗 ?쇱넀?섏? ?꾨땲?섎룄濡??대? 愿由ш퀎???섎┰, ?묒냽湲곕줉 蹂닿? ????듬졊?뱀쑝濡??뺥븯??諛붿뿉 ?곕씪 ?덉쟾???뺣낫???꾩슂??湲곗닠?겶룰?由ъ쟻 諛?臾쇰━??議곗튂瑜??섏뿬???쒕떎.';
        }
        if (lawRef.includes('짠3') || lawRef.includes('??議?)) {
            return '媛쒖씤?뺣낫蹂댄샇踰???議?媛쒖씤?뺣낫 蹂댄샇 ?먯튃) ??媛쒖씤?뺣낫泥섎━?먮뒗 媛쒖씤?뺣낫??泥섎━ 紐⑹쟻??紐낇솗?섍쾶 ?섏뿬???섍퀬, 洹?紐⑹쟻???꾩슂??理쒖냼?쒖쓽 媛쒖씤?뺣낫留뚯쓣 ?곷쾿?섍퀬 ?뺣떦?섍쾶 ?섏쭛?섏뿬???쒕떎.';
        }
        return `?대떦 議고빆(${lawRef})??援ъ껜?곸씤 ?쒖젙 ?댁슜? 媛쒖씤?뺣낫蹂댄샇踰??먮Ц??李멸퀬?섏떆湲?諛붾엻?덈떎.`;
    };

    useEffect(() => {
        setCategories(getScenarioCategories());
        
        if (leadId) {
            supabaseCompanyStore.getById(leadId).then((data: any) => {
                if (data && data.issues && data.issues.length > 0) {
                    const mapped = data.issues.map((iss: any, i: number) => {
                        const anyIss = iss;
                        const lawRef = iss.law || anyIss.lawRef || '';
                        const isMissing = anyIss.title === '媛쒖씤?뺣낫泥섎━諛⑹묠 ?꾨씫 (留ㅼ슦 ?ш컖)' || anyIss.title?.includes('諛⑹묠 ?꾨씫') || anyIss.title?.includes('諛⑹묠 遺??) || anyIss.originalText?.includes('?놁쓬 / 誘멸린??);
                        return {
                            num: `議고빆 ${i + 1}`,
                            title: anyIss.title || anyIss.lawTitle || iss.law || '?댁뒋',
                            original: anyIss.originalText || anyIss.originalContent || '',
                            riskSummary: isMissing ? '??媛쒖씤?뺣낫 蹂댄샇 議곗튂??"?먯떆??遺덈뒫" ?곹깭\n踰뺤젙 ?꾩닔 怨듦컻 臾몄꽌??泥섎━諛⑹묠??議댁옱?섏? ?딆븘, 怨좉컼? ?먯떊???곗씠?곌? ?대뼸寃??곗씠?붿? ??沅뚮━瑜??먯쿇 諛뺥깉?뱁뻽?듬땲?? ?대뒗 洹?ъ쓽 紐⑤뱺 ?곗씠???섏쭛 ?쒕룞??遺덈쾿?쇰줈 媛꾩＜?섍쾶 留뚮뱶???듭떖 ?꾨컲 ?곸젏?낅땲??' : (anyIss.riskDesc || anyIss.riskSummary || ''),
                            level: (anyIss.level || anyIss.riskLevel || 'HIGH') as any,
                            lawRef: lawRef,
                            lawText: anyIss.lawText || (isMissing ? '??0議?媛쒖씤?뺣낫 泥섎━諛⑹묠???섎┰ 諛?怨듦컻) ??媛쒖씤?뺣낫泥섎━?먮뒗 媛쒖씤?뺣낫瑜?泥섎━?섎뒗 寃쎌슦?먮뒗 媛쒖씤?뺣낫 泥섎━諛⑹묠???뺥븯?ъ빞 ?쒕떎. ??????뿉 ?곕Ⅸ 媛쒖씤?뺣낫 泥섎━諛⑹묠???섎┰?섍굅??蹂寃쏀븯??寃쎌슦?먮뒗 ?뺣낫二쇱껜媛 ?쎄쾶 ?뺤씤?????덈룄濡?怨듦컻?섏뿬???쒕떎.' : getFallbackLawText(lawRef)),
                            scenario: isMissing ? '?슚 [理쒖븙???쒕굹由ъ삤 ?꾧컻]\n??釉붾옓 而⑥뒋癒??먮뒗 寃쎌웳?ш? KISA??"媛쒖씤?뺣낫 臾대떒 ?섏쭛"?쇰줈 ?낆쓽???좉퀬.\n??洹쒖젣 ?밴뎅??議곗궗愿??諛⑹묠 ?꾨씫 ?뺤씤 ??"怨좎쓽?????濡?媛꾩＜?섏뿬 怨좉컯???꾩껜 媛먯궗濡??뺣?.\n??諛⑹뼱??踰뺤쟻 洹쇨굅媛 ???섎굹???놁뼱, 蹂댁쑀???꾩껜 怨좉컼 ?곗씠?곗뿉 鍮꾨??섎뒗 泥쒕Ц?숈쟻 怨쇱쭠湲?泥좏눜 諛??곸뾽 ?뺤? ?꾧린 吏곷㈃.' : (anyIss.scenario || ''),
                            penalty: isMissing ? '吏뺣쾶??怨쇱쭠湲??꾩껜 留ㅼ텧?≪쓽 理쒕? 3%) + 理쒓퀬 梨낆엫??吏뺤뿭/踰뚭툑??+ ?꾨컲 ?ъ떎 ?援?? 怨듯몴' : (anyIss.penalty || ''),
                            lawyerOpinion: anyIss.lawyerNote || anyIss.revisionOpinion || '',
                            recommendation: isMissing ? '[利됱떆 ?꾩엯 ?붾쭩] ?쒓났??IBS 湲닿툒 ?쒖젙 珥덉븞???뱀옣 蹂듭궗?섏뿬, 洹???뱀궗?댄듃 ?섎떒(Footer)??"媛쒖씤?뺣낫 泥섎━諛⑹묠"?대씪???대쫫?쇰줈 援듦퀬 紐낇솗???섏씠?쇰쭅?щ? ?듯빐 利됯컖 ?몄텧?섏떗?쒖삤.' : (anyIss.recommendation || iss.customDraft || ''),
                            aiFixed: anyIss.aiFixed || iss.customDraft || '',
                            revisionOpinion: isMissing ? '?ъ뾽???곸쐞?⑥뿉 ?덉뼱 媛??湲곗큹?곸씠怨??덈?濡??꾨씫?섏뼱?쒕뒗 ?????듭떖 踰뺤쟻 ?섎Т瑜??꾨컲?섍퀬 ?덈뒗 "留ㅼ슦 移섎챸?곸씤 ?곹솴"?낅땲?? 泥섎쾶 由ъ뒪??諛⑹뼱瑜??꾪빐 ?ㅻ뒛 ?뱀옣 ?쒖젙?덉쓣 留덈젴?댁빞 ?⑸땲??' : (anyIss.revisionOpinion || ''),
                            legalBasis: Array.isArray(anyIss.legalBasis) ? anyIss.legalBasis : (isMissing ? ['媛쒖씤?뺣낫 蹂댄샇踰???0議?(媛쒖씤?뺣낫 泥섎━諛⑹묠???섎┰ 諛?怨듦컻)', '媛쒖씤?뺣낫 蹂댄샇踰???5議?(怨쇳깭猷?'] : [anyIss.legalBasis || iss.law || '']),
                        } as Clause;
                    });
                    setClauses(mapped);
                } else {
                    setClauses([]);
                }
                setFetching(false);
            });
        } else {
            setFetching(false);
        }
    }, [leadId]);

    useEffect(() => {
        const id = setInterval(() => setElapsed(Math.floor((Date.now() - t0.current) / 1000)), 1000);
        return () => clearInterval(id);
    }, []);

    if (fetching || loading || !authorized) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: 14, color: '#6b7280' }}>濡쒕뵫 以?..</div></div>;

    const upd = (k: string, v: string) => setData(p => ({ ...p, [k]: v }));
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(elapsed % 60).padStart(2, '0');
    const timerCol = elapsed > 60 ? '#dc2626' : elapsed > 40 ? '#d97706' : '#16a34a';
    const highN = clauses.filter(c => c.level === 'HIGH').length;
    const medN = clauses.filter(c => c.level === 'MEDIUM').length;

    // ?꾩껜?섏젙?꾨낯 ???대┃ ??AI ?앹꽦 ?쒕??덉씠??    const handleFullTab = () => {
        setTab('full');
        if (!generated) {
            setGenerating(true);
            setTimeout(() => { setGenerating(false); setGenerated(true); }, 2000);
        }
    };

    const handleDownloadPDF = () => {
        window.print();
    };

    const handleSendRequest = () => {
        setRequestingFiles(true);
        setTimeout(() => {
            setRequestingFiles(false);
            setRequestModalOpen(false);
            setToastMsg('怨좉컼?ъ뿉 異붽? ?쒕쪟 ?붿껌??諛쒖넚?섏뿀?듬땲??);
            setDocsList({ contract: false, rules: false, security: false, other: false });
            setCustomReqMsg('');
            setTimeout(() => setToastMsg(''), 3000);
        }, 1500);
    };

    // ?? 1李?議곕Ц寃??而⑦럩 ????????????????????????????????????????
    // 蹂?몄궗 而⑦럩 = "議곕Ц 寃?좊맖" ?곹깭 湲곕줉 諛?AI ?ㅼ궗 蹂닿퀬???앹꽦 ???곸뾽? ?⑥뒪
    const handleFirstConfirm = async () => {
        setConfirming(true);
        setConfirmProgress('?댁뒋 ?곗씠???숆린??以?..');
        try {
            if (leadId) {
                console.log('[handleFirstConfirm] Updating Supabase row for lead:', leadId);
                
                const newIssues = clauses.filter(c => c.level !== 'OK').map(c => ({
                    level: c.level as 'HIGH' | 'MEDIUM' | 'LOW',
                    law: c.lawRef,
                    title: c.title,
                    originalText: c.original,
                    riskDesc: data[`${c.num}_risk`] ?? c.riskSummary,
                    customDraft: data[`${c.num}_fixed`] ?? c.aiFixed,
                    lawyerNote: data[`${c.num}_revOpinion`] ?? c.revisionOpinion ?? data[`${c.num}_opinion`] ?? c.lawyerOpinion,
                    scenario: c.scenario,
                    penalty: c.penalty,
                    recommendation: c.recommendation,
                    lawText: c.lawText,
                    reviewChecked: true,
                    aiDraftGenerated: true
                }));

                // 1. ?댁뒋 ?곗씠??癒쇱? ???                await supabaseCompanyStore.update(leadId, { 
                    issues: newIssues as any
                });

                // 2. ?몃? 留덊겕?ㅼ슫 ?ㅼ궗 蹂닿퀬???먮룞 ?앹꽦 API ?몄텧 (諛깃렇?쇱슫?? ?湲?
                setConfirmProgress('蹂닿퀬???묒꽦 以?..');
                console.log('[handleFirstConfirm] Calling report generation API...');
                
                let reportMarkdown = null;
                try {
                    const res = await fetch('/api/analyze/report', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ issues: newIssues, companyName: company })
                    });
                    
                    if (res.ok) {
                        const resData = await res.json();
                        reportMarkdown = resData.reportMarkdown;
                        console.log('[handleFirstConfirm] Report generation successful.');
                    } else {
                        console.error('[handleFirstConfirm] API returned error:', await res.text());
                    }
                } catch (reportErr) {
                    console.error('[handleFirstConfirm] API fetch error:', reportErr);
                }

                // 3. ?곹깭 ?낅뜲?댄듃 諛?蹂닿퀬?????(蹂닿퀬?쒓? ?놁뼱???곹깭??吏꾪뻾)
                setConfirmProgress('CRM 理쒖쥌 諛섏쁺 以?..');
                const updatePayload: any = {
                    lawyerConfirmed: true, 
                    lawyerConfirmedAt: new Date().toISOString(),
                    status: 'lawyer_confirmed',
                };
                if (reportMarkdown) {
                    updatePayload.audit_report = reportMarkdown;
                }
                
                await supabaseCompanyStore.update(leadId, updatePayload);
                console.log('[handleFirstConfirm] Successfully updated lawyerConfirmed, status, and audit_report.');

                if (autoSettings?.autoSendEmail) {
                    try {
                        const emailRes = await fetch('/api/email', {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ type: 'company_hook', leadId, customSubject: `[IBS 踰뺣쪧] ${company} 媛쒖씤?뺣낫泥섎━諛⑹묠 由ъ뒪??吏꾨떒 寃곌낵` }),
                        });
                        console.log('[handleFirstConfirm] autoSendEmail response:', emailRes.status);
                        await supabaseCompanyStore.update(leadId, { status: 'emailed', emailSentAt: new Date().toISOString() });
                    } catch(e) {
                         console.error('[handleFirstConfirm] Auto email send failed:', e);
                    }
                } else {
                    try {
                        const emailRes = await fetch('/api/email', {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ type: 'clause_review_done', leadId, company, highRiskCount: highN, medRiskCount: medN }),
                        });
                        console.log('[handleFirstConfirm] clause_review_done email response:', emailRes.status);
                    } catch(e) {
                        console.error('[handleFirstConfirm] clause_review_done email failed:', e);
                    }
                }
                // alert('由ы룷???앹꽦 諛?CRM 諛섏쁺???깃났?곸쑝濡??꾨즺?섏뿀?듬땲??');
                // ?ㅼ쓬 寃???湲?湲곗뾽 ?뺤씤
                const allCompanies = await supabaseCompanyStore.getAll();
                const nextPending = allCompanies.find((c: any) => 
                    ['assigned', 'reviewing'].includes(c.status) && c.id !== leadId
                );

                if (nextPending) {
                    router.push(`/lawyer/privacy-review?leadId=${nextPending.id}&company=${encodeURIComponent(nextPending.name)}`);
                } else {
                    router.push('/lawyer');
                }
            } else {
                setConfirmedTab('first');
            }
        } catch (error) {
            console.error('[handleFirstConfirm] Critical Error updating Supabase:', error);
            alert('?곗씠?곕쿋?댁뒪 諛섏쁺 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎. 媛쒕컻??肄섏넄???뺤씤?댁＜?몄슂.');
        } finally {
            setConfirming(false);
            setConfirmProgress('');
        }
    };

    // ?? ?꾩껜?섏젙?꾨낯 而⑦럩 ????????????????????????????????????????
    // 怨꾩빟 ?꾨즺 ??蹂?몄궗媛 理쒖쥌 ?꾨낯 而⑦럩 ??怨좉컼 HR 臾몄꽌?⑥쑝濡??먮룞 ?꾨떖
    const handleFullConfirm = async () => {
        setConfirming(true);
        try {
            if (leadId) {
                const newIssues = clauses.filter(c => c.level !== 'OK').map(c => ({
                    level: c.level as 'HIGH' | 'MEDIUM' | 'LOW',
                    law: c.lawRef,
                    title: c.title,
                    originalText: c.original,
                    riskDesc: data[`${c.num}_risk`] ?? c.riskSummary,
                    customDraft: data[`${c.num}_fixed`] ?? c.aiFixed,
                    lawyerNote: data[`${c.num}_revOpinion`] ?? c.revisionOpinion ?? data[`${c.num}_opinion`] ?? c.lawyerOpinion,
                    scenario: c.scenario,
                    penalty: c.penalty,
                    recommendation: c.recommendation,
                    lawText: c.lawText,
                    reviewChecked: true,
                    aiDraftGenerated: true
                }));

                await supabaseCompanyStore.update(leadId, { 
                    issues: newIssues as any
                });
            }

            const res = await fetch('/api/email', {
                method: 'POST', headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    type: 'full_revision_to_client',
                    leadId: leadId || 'lead_001',
                    company,
                    revisionData: data,
                    documentTitle: `${company} 媛쒖씤?뺣낫泥섎━諛⑹묠 ?섏젙?꾨낯`,
                    documentNo: `IBS-PR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
                }),
            });
            console.log('[handleFullConfirm] Email response:', res.status);
            setConfirmedTab('full');
        } catch(error) { 
            console.error('[handleFullConfirm] Error:', error);
            alert('?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎. ?ㅼ떆 ?쒕룄?댁＜?몄슂.'); 
        } finally {
            setConfirming(false);
        }
    };

    // ?? 而⑦럩 ?꾨즺 ?붾㈃ ???????????????????????????????????????????
    if (confirmedTab === 'first') return (
        <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', background: '#fff', borderRadius: 20, padding: '48px 64px', boxShadow: '0 4px 32px rgba(0,0,0,0.08)', maxWidth: 460 }}>
                <CheckCircle2 size={56} color="#16a34a" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#16a34a', margin: '0 0 6px' }}>1李?議곕Ц寃??而⑦럩 ?꾨즺</h2>
                <p style={{ color: '#374151', margin: '0 0 20px', fontWeight: 700, fontSize: 15 }}>{company}</p>
                {/* ?ㅼ쓬 ?④퀎 ?덈궡 ???곸뾽? ??븷 */}
                <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 8, letterSpacing: 0.5 }}>?ㅼ쓬 ?④퀎 (?곸뾽?)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>??/span>
                            <span style={{ fontSize: 12, color: '#374151' }}>蹂?몄궗 1李?議곕Ц寃???꾨즺 ??CRM 諛섏쁺??/span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
                            <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>?곸뾽? ???대찓??誘몃━蹂닿린 ?뺤씤</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</span>
                            <span style={{ fontSize: 12, color: '#374151' }}>?곸뾽? ??怨좉컼?먭쾶 ?대찓??諛쒖넚</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button onClick={() => { setConfirmedTab(null); setTab('full'); }} style={{ background: '#f8f9fc', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>?꾩껜?섏젙?꾨낯 蹂닿린</button>
                    <Link href="/lawyer"><button style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>蹂?몄궗 ??쒕낫????/button></Link>
                </div>
            </div>
        </div>
    );

    if (confirmedTab === 'full') return (
        <div style={{ minHeight: '100vh', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', background: '#fff', borderRadius: 20, padding: '48px 64px', boxShadow: '0 4px 32px rgba(0,0,0,0.08)', maxWidth: 460 }}>
                <FileText size={56} color="#2563eb" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1d4ed8', margin: '0 0 6px' }}>?섏젙?꾨낯 怨좉컼 ?꾨떖 ?꾨즺</h2>
                <p style={{ color: '#374151', margin: '0 0 20px', fontWeight: 700 }}>{company}</p>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
                    <div style={{ fontSize: 13, color: '#1d4ed8', fontWeight: 700, marginBottom: 6 }}>?뱾 怨좉컼 HR 臾몄꽌?⑥쑝濡??꾨떖??/div>
                    <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.8 }}>
                        쨌 {company} 媛쒖씤?뺣낫泥섎━諛⑹묠 ?섏젙?꾨낯<br />
                        쨌 蹂?몄궗 寃?좎쓽寃ъ꽌 ?ы븿<br />
                        쨌 怨좉컼 ??쒕낫??臾몄꽌?⑥뿉???뺤씤 媛??                    </div>
                </div>
                <Link href="/lawyer"><button style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>蹂?몄궗 ??쒕낫????/button></Link>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
            <style>{`
                @media print {
                    @page { size: A4; margin: 15mm; }
                    body, html { background: #fff !important; }
                    aside, nav, header:not(.print-header), footer, #sidebar, .sidebar { display: none !important; }
                    main, #__next, body > div, .main-content { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
                    .no-print { display: none !important; }
                    .print-row { page-break-inside: avoid; break-inside: avoid; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
            {/* ?? ?곷떒 ?ㅻ뜑 ?? */}
            <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 100, background: '#1e3a8a', borderBottom: '3px solid #2563eb', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link href="/lawyer"><button style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', color: '#e0e7ff', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: 13 }}><ArrowLeft size={13} /> 紐⑸줉</button></Link>
                    <div>
                        <span style={{ fontWeight: 900, color: '#fff', fontSize: 15 }}>{company}</span>
                        <span style={{ color: '#93c5fd', fontSize: 13, marginLeft: 10 }}>媛쒖씤?뺣낫泥섎━諛⑹묠 寃??/span>
                        <span style={{ color: '#fca5a5', fontSize: 12, marginLeft: 10 }}>?뵶 {highN}嫄?/span>
                        <span style={{ color: '#fcd34d', fontSize: 12, marginLeft: 6 }}>?윞 {medN}嫄?/span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 14px' }}>
                        <Clock size={13} color={timerCol} />
                        <span style={{ fontWeight: 900, color: timerCol, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{mm}:{ss}</span>
                    </div>
                    
                    <button onClick={handleDownloadPDF}
                        className="no-print"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 9, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <Download size={15} />
                        PDF ?ㅼ슫濡쒕뱶
                    </button>

                    {/* ??퀎 ?ㅻⅨ 而⑦럩 踰꾪듉 */}
                    {tab === 'first' ? (
                        <button onClick={handleFirstConfirm} disabled={confirming}
                            title="議곕Ц寃??寃곌낵瑜??곸뾽? CRM怨?怨좉컼 ?꾨씪?대쾭??由ы룷?몄뿉 ?먮룞 諛섏쁺?⑸땲??
                            style={{ display: 'flex', alignItems: 'center', gap: 7, background: confirming ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 24px', fontWeight: 900, fontSize: 14, cursor: confirming ? 'not-allowed' : 'pointer', boxShadow: '0 2px 12px rgba(22,163,74,0.4)' }}>
                            {confirming && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                            {!confirming && <CheckCircle2 size={16} />}
                            {confirming ? (confirmProgress || '諛섏쁺 以?..') : '1李?寃??而⑦럩'}
                        </button>
                    ) : (
                        <button onClick={handleFullConfirm} disabled={confirming}
                            title="?섏젙?꾨낯??怨좉컼 HR 臾몄꽌?⑥쑝濡??꾨떖?⑸땲??(怨꾩빟 ?꾨즺 ???ъ슜)"
                            style={{ display: 'flex', alignItems: 'center', gap: 7, background: confirming ? '#93c5fd' : '#1d4ed8', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 24px', fontWeight: 900, fontSize: 14, cursor: confirming ? 'not-allowed' : 'pointer', boxShadow: '0 2px 12px rgba(29,78,216,0.4)' }}>
                            <FileText size={16} />
                            {confirming ? '?꾨떖 以?..' : '?뱾 ?꾨낯 而⑦럩 ??怨좉컼 HR ?꾨떖'}
                        </button>
                    )}
                </div>
            </div>

            {/* ?? 而щ읆 ?ㅻ뜑 (醫? 怨좎젙 / ?? ?? ?? */}
            <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'sticky', top: 58, zIndex: 90 }}>
                <div style={{ padding: '10px 20px', background: '#1e40af', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#bfdbfe', letterSpacing: 1 }}>?뱰 ?먮Ц + 踰뺤“臾?/span>
                </div>
                <div style={{ display: 'flex' }}>
                    <button onClick={() => setTab('first')} style={{
                        flex: 1, padding: '10px 16px', fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        background: tab === 'first' ? 'linear-gradient(135deg, #16a34a, #15803d)' : '#1e40af',
                        color: tab === 'first' ? '#fff' : '#93c5fd',
                        borderBottom: tab === 'first' ? '3px solid #4ade80' : '3px solid transparent',
                    }}>
                        ?뱥 1李?議곕Ц寃??                    </button>
                    <button onClick={handleFullTab} style={{
                        flex: 1, padding: '10px 16px', fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        background: tab === 'full' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#1e40af',
                        color: tab === 'full' ? '#fff' : '#93c5fd',
                        borderBottom: tab === 'full' ? '3px solid #60a5fa' : '3px solid transparent',
                    }}>
                        ?뱞 ?꾩껜?섏젙?꾨낯
                    </button>
                </div>
            </div>

            {/* ?? 議곕Ц蹂???(醫뚯슦 ?뺣젹) ?? */}
            {tab === 'first' ? (
                <>
                    {/* 醫낇빀 寃?좎쓽寃?(?곗륫 泥??? */}
                    <div className="print-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '3px solid #d97706' }}>
                        <div style={{ padding: '16px 18px', background: '#fafafa', borderRight: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                                <Scale size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                                <div style={{ fontSize: 12, fontWeight: 700 }}>???먮Ц 議고빆蹂?寃??/div>
                                <div style={{ fontSize: 11, marginTop: 2 }}>?꾨옒?먯꽌 媛?議곕Ц???뺤씤?섏꽭??/div>
                            </div>
                        </div>
                        <div style={{ padding: '16px 18px', background: '#fffbeb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <span style={{ fontSize: 18 }}>??/span>
                                <span style={{ fontSize: 15, fontWeight: 900, color: '#92400e' }}>醫낇빀 寃?좎쓽寃?/span>
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: 20 }}>?꾨씪?대쾭??由ы룷??諛섏쁺</span>
                            </div>
                            <EditableText
                                value={data['summary_opinion'] ?? (
                                    clauses.length === 1 && (clauses[0].title === '媛쒖씤?뺣낫泥섎━諛⑹묠 ?꾨씫 (留ㅼ슦 ?ш컖)' || clauses[0].title?.includes('諛⑹묠 ?꾨씫') || clauses[0].title?.includes('諛⑹묠 遺??) || clauses[0].original?.includes('?놁쓬 / 誘멸린??))
                                    ? '[湲닿툒 踰뺣Т 寃???붾쭩] 洹?щ뒗 怨좉컼??媛쒖씤?뺣낫瑜??섏쭛쨌泥섎━?섍퀬 ?덉쓬?먮룄 遺덇뎄?섍퀬, ?대? 洹쒖젣?섎뒗 "媛쒖씤?뺣낫 泥섎━諛⑹묠" ?먯껜媛 ?꾨㈃ ?꾨씫?섏뼱 ?덉뒿?덈떎. ?대뒗 ?⑥닚???됱젙???덉감 ?꾨씫???꾨땶, 湲곗뾽??以踰?寃쎌쁺 ?섏?媛 ?꾪? ?녿뒗 寃껋쑝濡?媛꾩＜?섎뒗 理쒓퀬 ?섏???由ъ뒪?ъ엯?덈떎.\n\n????嫄댁쓽 ?댄궧 ?ш퀬???낆꽦 怨좉컼???쇱떛/?좉퀬留뚯쑝濡쒕룄 洹?ъ쓽 ?섏쭛 ?됱쐞 ?꾩껜媛 利됱떆 ?덈쾿?쇰줈 媛꾩＜?섎ŉ, ?대뼚??踰뺣━??諛⑹뼱沅뚮룄 ?됱궗?????놁뒿?덈떎. ??쒖씠???뺤궗怨좊컻, 留됰???吏뺣쾶??怨쇱쭠湲??寃? ?몃줎 蹂대룄濡??명븳 湲곗뾽 ?좊ː??異붾씫??留됯린 ?꾪빐 ?ㅻ뒛 ?뱀옣 KISA 媛?대뱶?쇱씤??遺?⑺븯??諛⑹묠 ?쒖젙 諛??곸슜???꾩닔?곸엯?덈떎.'
                                    : `洹?ъ쓽 媛쒖씤?뺣낫泥섎━諛⑹묠??寃?좏븳 寃곌낵, 媛쒖씤?뺣낫蹂댄샇踰뺤긽 ?쒖젙???꾩슂???ы빆 ${clauses.filter(c => c.level === 'HIGH').length + clauses.filter(c => c.level === 'MEDIUM').length}嫄댁씠 ?뺤씤?섏뿀?듬땲?? ?뱁엳 ?듭떖 ?꾩닔 湲곗옱?ы빆 ?꾨씫 ??怨좎쐞???ы빆 ${clauses.filter(c => c.level === 'HIGH').length}嫄댁? 媛쒖씤?뺣낫蹂댄샇?꾩썝???뺢린媛먯궗 ??利됱떆 ?쒖젙紐낅졊 諛?怨쇱쭠湲?遺怨???곸뿉 ?대떦?⑸땲?? 理쒓렐 ?洹쒕え 怨쇱쭠湲??щ?媛 ?댁뼱吏怨??덉뼱 議곗냽???쒖젙???꾩슂?⑸땲??`
                                )}
                                onChange={v => upd('summary_opinion', v)}
                                style={{ background: '#ffffff', borderColor: '#fde68a', fontSize: 13 }}
                                minRows={2}
                            />
                        </div>
                    </div>
                    {clauses.map((c, i) => {
                    const col = R[c.level];
                    const hasIssue = c.level !== 'OK';
                    return (
                        <div key={i} className="print-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #d1d5db' }}>
                            {/* 醫? ?먮Ц */}
                            <div style={{ padding: '20px', borderLeft: `4px solid ${col.border}`, borderRight: '1px solid #e5e7eb', background: hasIssue ? col.bg : '#fafafa', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* 1. ?꾨컲 湲곗? (踰뺣졊) */}
                                <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <div style={{ background: '#fef3c7', borderBottom: '1px solid #fde68a', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Scale size={15} color="#d97706" />
                                        <span style={{ fontWeight: 800, fontSize: 13, color: '#92400e' }}>?꾨컲 踰뺤“臾? {c.lawRef || '踰뺣졊 ?뺣낫 ?놁쓬'}</span>
                                    </div>
                                    <div style={{ padding: '14px 16px', fontSize: 12, color: '#44403c', lineHeight: 1.8, whiteSpace: 'pre-line', background: '#fffbeb' }}>
                                        {c.lawText || '踰뺤“臾??띿뒪?멸? ?꾨떖?섏? ?딆븯?듬땲??'}
                                    </div>
                                </div>
                                
                                {/* 2. ?뚯궗 ?먮Ц (鍮꾧탳 ??? */}
                                <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <div style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <FileText size={15} color="#475569" />
                                            <span style={{ fontWeight: 800, fontSize: 13, color: '#334155' }}>怨좉컼??諛⑹묠 ?먮Ц</span>
                                        </div>
                                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: col.tag, color: col.text, border: `1px solid ${col.border}` }}>
                                            {c.title || c.num}
                                        </span>
                                    </div>
                                    <div style={{ padding: '14px 16px', fontSize: 13, color: '#1e293b', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                                        {c.original || '?뚯궗 諛⑹묠 ?먮낯 ?곗씠?곌? ?꾨떖?섏? ?딆븯?듬땲??'}
                                    </div>
                                </div>

                                {/* 3. 吏꾨떒 ?붿빟 */}
                                {hasIssue && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: col.tag, border: `1px solid ${col.border}40`, borderRadius: 8, padding: '12px 16px' }}>
                                        <div style={{ fontSize: 16 }}>?렞</div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: col.text, marginBottom: 4 }}>?꾨컲 ?곸젏 ?붿빟</div>
                                            <div style={{ fontSize: 12, color: col.text, lineHeight: 1.6, fontWeight: 600 }}>{c.riskSummary}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* ?? 1李?議곕Ц寃??*/}
                            <div style={{ background: '#f9fafb' }}>
                                <FirstReviewRow c={c} data={data} onChange={upd} categories={categories} />
                            </div>
                        </div>
                    );
                })
                    }
                </>
            ) : generating ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    <div style={{ padding: '80px 20px', background: '#fafafa', borderRight: '1px solid #e5e7eb', textAlign: 'center', color: '#9ca3af' }}>
                        <Scale size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                        <div style={{ fontSize: 12, fontWeight: 700 }}>?먮Ц? 醫뚯륫??洹몃?濡??쒖떆?⑸땲??/div>
                    </div>
                    <div style={{ padding: '80px 40px', textAlign: 'center' }}>
                        <Loader2 size={40} color="#2563eb" style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                        <p style={{ fontSize: 16, fontWeight: 900, color: '#1d4ed8', marginBottom: 4 }}>AI ?섍껄???앹꽦 以?..</p>
                        <p style={{ fontSize: 13, color: '#6b7280' }}>蹂?몄궗 ?섎Ⅴ?뚮굹濡?踰뺣쪧 ?섍껄?쒕? ?묒꽦?섍퀬 ?덉뒿?덈떎</p>
                        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                    </div>
                </div>
            ) : (
                <>
                    {clauses.map((c, i) => {
                        const col = R[c.level];
                        const hasIssue = c.level !== 'OK';
                        return (
                            <div key={i} className="print-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #d1d5db' }}>
                                {/* 醫? ?먮Ц + 踰뺤“臾?(1李⑥“臾멸??좎? ?숈씪) */}
                                <div style={{ padding: '20px', borderLeft: `4px solid ${col.border}`, borderRight: '1px solid #e5e7eb', background: hasIssue ? col.bg : '#fafafa', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {/* 1. ?꾨컲 湲곗? (踰뺣졊) */}
                                    <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                        <div style={{ background: '#fef3c7', borderBottom: '1px solid #fde68a', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Scale size={15} color="#d97706" />
                                            <span style={{ fontWeight: 800, fontSize: 13, color: '#92400e' }}>?꾨컲 踰뺤“臾? {c.lawRef || '踰뺣졊 ?뺣낫 ?놁쓬'}</span>
                                        </div>
                                        <div style={{ padding: '14px 16px', fontSize: 12, color: '#44403c', lineHeight: 1.8, whiteSpace: 'pre-line', background: '#fffbeb' }}>
                                            {c.lawText || '踰뺤“臾??띿뒪?멸? ?꾨떖?섏? ?딆븯?듬땲??'}
                                        </div>
                                    </div>
                                    
                                    {/* 2. ?뚯궗 ?먮Ц (鍮꾧탳 ??? */}
                                    <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                        <div style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <FileText size={15} color="#475569" />
                                                <span style={{ fontWeight: 800, fontSize: 13, color: '#334155' }}>怨좉컼??諛⑹묠 ?먮Ц</span>
                                            </div>
                                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: col.tag, color: col.text, border: `1px solid ${col.border}` }}>
                                                {c.title || c.num}
                                            </span>
                                        </div>
                                        <div style={{ padding: '14px 16px', fontSize: 13, color: '#1e293b', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                                            {c.original || '?뚯궗 諛⑹묠 ?먮낯 ?곗씠?곌? ?꾨떖?섏? ?딆븯?듬땲??'}
                                        </div>
                                    </div>
                                </div>
                                {/* ?? ?섏젙?꾨낯 (?섍껄???ㅽ??? */}
                                <div style={{ background: '#f9fafb' }}>
                                    {i === 0 && (
                                        <div style={{ background: '#0f172a', padding: '14px 18px', color: '#fff' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: 15, fontWeight: 900, color: '#c9a84c' }}>?뽳툘 IBS 踰뺣쪧?щТ??/div>
                                                    <div style={{ fontSize: 10, color: '#94a3b8' }}>媛쒖씤?뺣낫蹂댄샇 ?꾨Ц 踰뺣쪧 ?섍껄??/div>
                                                </div>
                                                <div style={{ textAlign: 'right', fontSize: 10, color: '#94a3b8' }}>
                                                    <div>臾몄꽌踰덊샇: IBS-PR-{new Date().getFullYear()}-{String(Math.floor(Math.random() * 1000)).padStart(3, '0')}</div>
                                                    <div>?묒꽦?? {new Date().toLocaleDateString('ko-KR')}</div>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: 8, fontSize: 12, color: '#e2e8f0' }}>
                                                ?섏떊: <strong>{company}</strong> 洹以?                                            </div>
                                        </div>
                                    )}
                                    <FullRevisionRow c={c} data={data} onChange={upd} />
                                </div>
                            </div>
                        );
                    })}
                    {/* ?쒕챸? (?곗륫?먮쭔) */}
                    <div className="print-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                        <div style={{ background: '#fafafa', borderRight: '1px solid #e5e7eb' }} />
                        <div style={{ padding: '20px 18px', background: '#fff', borderTop: '2px solid #e5e7eb' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>?꾩? 媛숈씠 寃???섍껄???쒖텧?⑸땲??</div>
                                <div style={{ fontSize: 15, fontWeight: 900, color: '#1e293b', marginBottom: 2 }}>IBS 踰뺣쪧?щТ??/div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>?대떦 蹂?몄궗: 源?섑쁽</div>
                                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>??쒕??몄궗?묓쉶 ?깅줉 | 媛쒖씤?뺣낫愿由ъ궗(CPPG)</div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* 異붽? ?먮즺 ?붿껌 紐⑤떖 */}
            <AnimatePresence>
                {requestModalOpen && (
                    <div className="no-print" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setRequestModalOpen(false)}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            style={{ position: 'relative', width: 440, background: '#fff', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}
                        >
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FilePlus size={18} color="#2563eb" />
                                    異붽? ?먮즺 ?붿껌
                                </h3>
                                <button onClick={() => setRequestModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div style={{ padding: 24 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12 }}>?붿껌???꾨씫 ?쒕쪟 ?좏깮 (?ㅼ쨷 ?좏깮 媛??</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                                    {[
                                        { id: 'contract', label: '洹쇰줈怨꾩빟?? },
                                        { id: 'rules', label: '痍⑥뾽洹쒖튃' },
                                        { id: 'security', label: '蹂댁븞?쒖빟?? },
                                        { id: 'other', label: '湲고? 異붽? 臾몄꽌' },
                                    ].map(item => (
                                        <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1e293b', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={(docsList as any)[item.id]} onChange={e => setDocsList(p => ({ ...p, [item.id]: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#2563eb' }} />
                                            {item.label}
                                        </label>
                                    ))}
                                </div>
                                
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>異붽? ?붿껌 硫붿떆吏</div>
                                <textarea
                                    value={customReqMsg}
                                    onChange={e => setCustomReqMsg(e.target.value)}
                                    placeholder="怨좉컼?ъ뿉 ?꾨떖???곸꽭 ?붿껌?ы빆???낅젰?섏꽭??.."
                                    style={{ width: '100%', height: 100, padding: 12, border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, color: '#1e293b', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#f8fafc' }}>
                                <button onClick={() => setRequestModalOpen(false)} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>痍⑥냼</button>
                                <button
                                    onClick={handleSendRequest}
                                    disabled={requestingFiles}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', border: 'none', background: '#2563eb', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: requestingFiles ? 'not-allowed' : 'pointer' }}
                                >
                                    {requestingFiles ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <FilePlus size={16} />}
                                    {requestingFiles ? '諛쒖넚 以?..' : '?붿껌 諛쒖넚'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toast ?뚮┝ */}
            <AnimatePresence>
                {toastMsg && (
                    <motion.div
                        className="no-print"
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 50, x: '-50%' }}
                        style={{ position: 'fixed', bottom: 40, left: '50%', background: '#1e293b', color: '#fff', padding: '14px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, zIndex: 10000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        <CheckCircle2 size={18} color="#4ade80" />
                        {toastMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 異붽? ?먮즺 ?붿껌 FAB */}
            <button
                className="no-print"
                onClick={() => setRequestModalOpen(true)}
                style={{
                    position: 'fixed', right: 32, bottom: 32, zIndex: 9000,
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#0f172a', color: '#fff', border: 'none', borderRadius: 30,
                    padding: '14px 24px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.3)',
                    transition: 'transform 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <FilePlus size={18} />
                異붽? ?먮즺 ?붿껌
            </button>
        </div>
    );
}

'use client';
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useEffect, useState, useRef } from "react";
import { BlockNoteEditor, PartialBlock, defaultBlockSpecs } from "@blocknote/core";

// 이미지 블록을 제외한 커스텀 스펙 생성 (Supabase Egress 절감용)
const { image, ...customBlockSpecs } = defaultBlockSpecs;

interface Props {
    initialHTML: string;
    onChangeHTML: (html: string) => void;
    onBlur: () => void;
    isMarkdown?: boolean;
}

export default function BlockNoteEditorWrapper({ initialHTML, onChangeHTML, onBlur, isMarkdown }: Props) {
    const [initialBlocks, setInitialBlocks] = useState<PartialBlock[] | "loading">("loading");
    const containerRef = useRef<HTMLDivElement>(null);
    const lastOutputRef = useRef<string>(initialHTML);

    useEffect(() => {
        if (initialHTML === lastOutputRef.current && initialBlocks !== "loading") {
            return; // 에디터 내부에서 발생한 변화로 인한 업데이트면 무시 (커서 튐 방지)
        }
        lastOutputRef.current = initialHTML;

        let isMounted = true;
        async function load() {
            if (!initialHTML) {
                if (isMounted) setInitialBlocks([]);
                return;
            }
            const tempEditor = BlockNoteEditor.create({ blockSpecs: customBlockSpecs });
            const blocks = isMarkdown 
                ? await tempEditor.tryParseMarkdownToBlocks(initialHTML) 
                : await tempEditor.tryParseHTMLToBlocks(initialHTML);
            if (isMounted) setInitialBlocks(blocks);
        }
        load();
        return () => { isMounted = false; };
    }, [initialHTML]);

    const editor = useCreateBlockNote({
        blockSpecs: customBlockSpecs,
        // 로딩이 완료된 후에만 initialContent를 넘깁니다. 로딩 중일 때는 undefined로 넘기지 않기 위해 조건부 렌더링을 씁니다.
    });

    useEffect(() => {
        if (initialBlocks !== "loading" && editor) {
            editor.replaceBlocks(editor.document, initialBlocks);
            
            // 약간의 딜레이 후 에디터에 포커스 부여
            setTimeout(() => {
                editor.focus();
            }, 50);
        }
    }, [initialBlocks, editor]);

    // 외부 클릭 시에 onBlur 호출
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                // BlockNote 툴바, 팝업 등이 에디터 영역 바깥(React Portal 등)에 렌더링될 수 있으므로 예외 처리가 필요할 수 있습니다.
                // 팝업이 .bn-ui 클래스를 가지므로 체크합니다.
                const isPopup = (e.target as Element)?.closest('.bn-ui, .mantine-Popover-dropdown, .mantine-Modal-root');
                if (!isPopup) {
                    onBlur();
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onBlur]);

    return (
        <div ref={containerRef} style={{ background: '#fff', borderRadius: 4, padding: '10px 0', border: '1px solid #e2e8f0' }}>
            <BlockNoteView 
                editor={editor} 
                onChange={async () => {
                    const output = isMarkdown 
                        ? await editor.blocksToMarkdownLossy(editor.document) 
                        : await editor.blocksToHTMLLossy(editor.document);
                    lastOutputRef.current = output;
                    onChangeHTML(output);
                }}
                theme="light"
            />
        </div>
    );
}

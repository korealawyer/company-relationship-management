'use client';
import React, { useEffect, useMemo } from 'react';
import { BlockNoteEditor, PartialBlock } from '@blocknote/core';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';

interface Props {
    initialContent: string;
    onChange: (markdown: string) => void;
}

// 문자열 → BlockNote 초기 블록 변환 (간단한 줄 기반 파싱)
function textToBlocks(text: string): PartialBlock[] {
    if (!text.trim()) return [{ type: 'paragraph', content: '' }];
    return text.split('\n').map(line => ({
        type: 'paragraph' as const,
        content: line || '',
    }));
}

export default function BlockNoteEditorComponent({ initialContent, onChange }: Props) {
    const initialBlocks = useMemo(() => textToBlocks(initialContent), []);

    const editor = useCreateBlockNote({
        initialContent: initialBlocks,
    });

    // 에디터 내용 변경 시 마크다운으로 직렬화하여 부모에게 전달
    const handleChange = async () => {
        const md = await editor.blocksToMarkdownLossy(editor.document);
        onChange(md);
    };

    return (
        <div
            style={{
                background: '#f3f4f6',
                borderRadius: '12px',
                minHeight: '200px',
                fontSize: '14px',
            }}
        >
            <BlockNoteView
                editor={editor}
                onChange={handleChange}
                theme="light"
            />
        </div>
    );
}

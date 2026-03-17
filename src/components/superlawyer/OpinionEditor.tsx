'use client';
/**
 * OpinionEditor — BlockNote 기반 법률 의견서 에디터
 * 
 * Notion 스타일의 블록 에디터로 AI가 생성한 법률 의견서를
 * 인라인으로 수정할 수 있습니다.
 */

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { Block, BlockNoteEditor, PartialBlock } from '@blocknote/core';
import { useCallback, useEffect, useState } from 'react';

interface OpinionEditorProps {
  initialBlocks?: PartialBlock[];
  onChange?: (blocks: Block[]) => void;
  editable?: boolean;
}

export default function OpinionEditor({
  initialBlocks,
  onChange,
  editable = true,
}: OpinionEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: initialBlocks && initialBlocks.length > 0 
      ? initialBlocks 
      : undefined,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleChange = useCallback(() => {
    if (onChange) {
      onChange(editor.document);
    }
  }, [editor, onChange]);

  if (!isMounted) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '400px',
        background: 'var(--editor-bg, #1a1a2e)',
        borderRadius: '12px',
      }}>
        <div className="editor-loading">
          <div className="loading-spinner" />
          <p style={{ color: '#a0a0c0', marginTop: '12px' }}>에디터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="opinion-editor-wrapper">
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleChange}
        theme="dark"
      />
    </div>
  );
}

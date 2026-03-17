'use client';
/**
 * 수퍼로이어(SuperLawyer) 메인 페이지
 * 
 * 2컬럼 레이아웃:
 * - 좌측: 사실관계 입력 패널
 * - 우측: BlockNote 에디터 캔버스
 * - 상단: 툴바 (HWPX 다운로드 등)
 */

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import FactInputPanel, { FactInputData } from '@/components/superlawyer/FactInputPanel';
import ToolbarActions from '@/components/superlawyer/ToolbarActions';
import { DUMMY_OPINION_BLOCKS, DUMMY_METADATA } from '@/lib/superlawyer/dummy-opinion';
import { Block, PartialBlock } from '@blocknote/core';
import './superlawyer.css';

// BlockNote는 SSR에서 동작하지 않으므로 dynamic import
const OpinionEditor = dynamic(
  () => import('@/components/superlawyer/OpinionEditor'),
  { ssr: false }
);

export default function SuperLawyerPage() {
  const [editorBlocks, setEditorBlocks] = useState<Block[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [initialBlocks, setInitialBlocks] = useState<PartialBlock[]>([]);
  const [metadata, setMetadata] = useState(DUMMY_METADATA);

  /** AI 의견서 생성 (현재는 더미 데이터 로드) */
  const handleGenerate = useCallback(async (facts: FactInputData) => {
    setIsGenerating(true);

    // 실제로는 AI API 호출 → 응답을 BlockNote 블록으로 변환
    // PoC 단계에서는 더미 데이터를 사용
    await new Promise(resolve => setTimeout(resolve, 2000)); // 생성 시뮬레이션

    setMetadata({
      ...DUMMY_METADATA,
      clientName: facts.clientName || DUMMY_METADATA.clientName,
      opponentName: facts.opponentName || DUMMY_METADATA.opponentName,
    });

    setInitialBlocks(DUMMY_OPINION_BLOCKS as unknown as PartialBlock[]);
    setIsGenerated(true);
    setIsGenerating(false);
  }, []);

  /** BlockNote 에디터 변경 핸들러 */
  const handleEditorChange = useCallback((blocks: Block[]) => {
    setEditorBlocks(blocks);
  }, []);

  /** HWPX 다운로드 */
  const handleDownloadHwpx = useCallback(async () => {
    // 에디터 블록을 마크다운으로 변환 → API 호출
    const blocks = editorBlocks.length > 0 ? editorBlocks : DUMMY_OPINION_BLOCKS;
    
    // 블록 → 마크다운 간이 변환
    const markdown = (blocks as any[]).map((block: Record<string, unknown>) => {
      const content = block.content as Array<{ text?: string; styles?: { bold?: boolean; italic?: boolean } }> | undefined;
      const text = content?.map((c) => {
        let t = c.text || '';
        if (c.styles?.bold) t = `**${t}**`;
        if (c.styles?.italic) t = `*${t}*`;
        return t;
      }).join('') || '';

      const props = block.props as { level?: number } | undefined;
      switch (block.type) {
        case 'heading': {
          const hashes = '#'.repeat(props?.level || 1);
          return `${hashes} ${text}`;
        }
        case 'bulletListItem':
          return `- ${text}`;
        case 'numberedListItem':
          return `1. ${text}`;
        default:
          return text;
      }
    }).join('\n');

    const response = await fetch('/api/superlawyer/generate-hwpx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: markdown,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error('HWPX 생성 실패');
    }

    // 파일 다운로드
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `법률의견서_${metadata.caseNumber}_${metadata.date.replace(/\./g, '-')}.hwpx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, [editorBlocks, metadata]);

  /** 새 문서 */
  const handleReset = useCallback(() => {
    setIsGenerated(false);
    setInitialBlocks([]);
    setEditorBlocks([]);
    setMetadata(DUMMY_METADATA);
  }, []);

  return (
    <div className="superlawyer-root">
      {/* 배경 글로우 효과 */}
      <div className="sl-bg-glow sl-bg-glow-1" />
      <div className="sl-bg-glow sl-bg-glow-2" />

      {/* 상단 툴바 */}
      <ToolbarActions
        onDownloadHwpx={handleDownloadHwpx}
        onReset={isGenerated ? handleReset : undefined}
        documentTitle={isGenerated ? `${metadata.caseTitle} — 법률 의견서` : '수퍼로이어 AI'}
      />

      {/* 메인 콘텐츠 */}
      <div className="superlawyer-main">
        {/* 좌측: 사실관계 입력 */}
        <aside className={`fact-panel-container ${isGenerated ? 'fact-panel-collapsed' : ''}`}>
          <FactInputPanel
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </aside>

        {/* 우측: 에디터 캔버스 */}
        <main className={`editor-container ${isGenerated ? 'editor-expanded' : 'editor-placeholder'}`}>
          {isGenerated ? (
            <OpinionEditor
              initialBlocks={initialBlocks}
              onChange={handleEditorChange}
              editable={true}
            />
          ) : (
            <div className="editor-empty-state">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3>수퍼로이어 AI</h3>
              <p>사실관계를 입력하면 AI가 법률 의견서 초안을 작성합니다.</p>
              <p className="empty-subtitle">작성된 의견서는 Notion 스타일 에디터에서 자유롭게 수정한 뒤,<br/>완벽한 규격의 HWPX 파일로 다운로드할 수 있습니다.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

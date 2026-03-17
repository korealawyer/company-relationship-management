'use client';
/**
 * ToolbarActions — 수퍼로이어 상단 툴바
 * 
 * HWPX 다운로드, PDF 미리보기 등 문서 관련 액션 버튼
 */

import { useState } from 'react';

interface ToolbarActionsProps {
  onDownloadHwpx: () => Promise<void>;
  onReset?: () => void;
  documentTitle?: string;
}

export default function ToolbarActions({
  onDownloadHwpx,
  onReset,
  documentTitle = '법률 의견서',
}: ToolbarActionsProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownloadHwpx();
    } catch (error) {
      console.error('HWPX 다운로드 실패:', error);
      alert('HWPX 파일 다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="toolbar-actions">
      <div className="toolbar-left">
        <div className="toolbar-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <span className="toolbar-title">SuperLawyer</span>
        </div>
        <span className="toolbar-divider">|</span>
        <span className="toolbar-doc-title">{documentTitle}</span>
      </div>

      <div className="toolbar-right">
        {onReset && (
          <button
            className="toolbar-btn toolbar-btn-secondary"
            onClick={onReset}
            title="새 문서"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            새 문서
          </button>
        )}

        <button
          className="toolbar-btn toolbar-btn-primary"
          onClick={handleDownload}
          disabled={isDownloading}
          title="HWPX 다운로드"
        >
          {isDownloading ? (
            <>
              <span className="btn-spinner" />
              생성중...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              HWPX 다운로드
            </>
          )}
        </button>
      </div>
    </div>
  );
}

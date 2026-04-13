'use client';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

const BlockNoteEditorWrapper = dynamic(() => import('./BlockNoteEditorWrapper'), { ssr: false });

interface Props {
    value: string;
    onChange: (v: string) => void;
    style?: React.CSSProperties;
    minRows?: number;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, style, minRows = 3, placeholder }: Props) {
    const [editing, setEditing] = useState(false);

    if (editing) {
        return (
            <div style={{ ...style, border: '2px solid #2563eb', borderRadius: 6, minHeight: minRows * 24 }}>
                <BlockNoteEditorWrapper 
                    initialHTML={value} 
                    onChangeHTML={onChange}
                    onBlur={() => setEditing(false)}
                />
            </div>
        );
    }

    return (
        <div
            onClick={() => setEditing(true)}
            title="클릭하여 편집기 열기"
            style={{
                cursor: 'pointer', fontSize: 13, lineHeight: 1.8, color: '#1e293b',
                padding: '10px 14px', borderRadius: 6, border: '1px solid #e5e7eb',
                background: '#ffffff', transition: 'all 0.15s',
                fontFamily: "'Noto Sans KR','Apple SD Gothic Neo',sans-serif",
                minHeight: minRows * 24,
                ...style,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#93c5fd'; (e.currentTarget as HTMLDivElement).style.background = '#f8faff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLDivElement).style.background = '#ffffff'; }}
        >
            {value ? (
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-a:text-blue-600 focus:outline-none">
                    <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
                        {value}
                    </ReactMarkdown>
                </div>
            ) : (
                <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>{placeholder || '클릭하여 내용을 입력하세요... (에디터 열림)'}</span>
            )}
        </div>
    );
}

'use client';
import React, { useState, useRef, useEffect } from 'react';

interface EditableTextProps {
    value: string;
    onChange: (v: string) => void;
    style?: React.CSSProperties;
    minRows?: number;
    placeholder?: string;
}

export default function EditableText({ value, onChange, style, minRows = 3, placeholder }: EditableTextProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { 
        if (!editing) {
            setDraft(value); 
        }
    }, [value, editing]);
    useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.style.height = 'auto'; ref.current.style.height = ref.current.scrollHeight + 'px'; } }, [editing]);

    if (editing) {
        return (
            <textarea
                ref={ref}
                value={draft}
                onChange={e => { setDraft(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                onBlur={() => { setEditing(false); onChange(draft); }}
                onKeyDown={e => { if (e.key === 'Escape') { setEditing(false); setDraft(value); } }}
                rows={minRows}
                placeholder={placeholder}
                style={{
                    width: '100%', resize: 'none', outline: 'none', fontFamily: 'inherit',
                    fontSize: 13, lineHeight: 1.8, color: '#1e293b', padding: '10px 14px',
                    borderRadius: 6, border: '2px solid #2563eb', background: '#eff6ff',
                    boxSizing: 'border-box', ...style,
                }}
            />
        );
    }

    return (
        <div
            onClick={() => setEditing(true)}
            title="클릭하여 수정"
            style={{
                cursor: 'pointer', fontSize: 13, lineHeight: 1.8, color: '#1e293b',
                padding: '10px 14px', borderRadius: 6, border: '1px solid #e5e7eb',
                background: '#ffffff', whiteSpace: 'pre-line', transition: 'all 0.15s',
                fontFamily: "'Noto Sans KR','Apple SD Gothic Neo',sans-serif",
                ...style,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#93c5fd'; (e.currentTarget as HTMLDivElement).style.background = '#f8faff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLDivElement).style.background = '#ffffff'; }}
        >
            {value || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>{placeholder || '클릭하여 입력...'}</span>}
        </div>
    );
}

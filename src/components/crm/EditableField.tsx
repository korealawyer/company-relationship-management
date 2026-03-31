import React, { useState, useEffect } from 'react';

export default function EditableField({ value, onChange, placeholder = '-' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    const [val, setVal] = useState(value);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => { 
        if (!isFocused) {
            setVal(value); 
        }
    }, [value, isFocused]);

    return (
        <input 
            value={val} 
            onChange={e => setVal(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => { 
                setIsFocused(false);
                if(val !== value) onChange(val); 
            }}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            placeholder={placeholder}
            className="w-full bg-transparent border-b border-transparent hover:border-blue-300 focus:border-blue-300 focus:outline-none transition-colors p-0 m-0"
            style={{ color: 'inherit', fontWeight: 'inherit', fontSize: 'inherit' }}
        />
    );
}

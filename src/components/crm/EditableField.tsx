import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Check } from 'lucide-react';

export default function EditableField({ value, onChange, placeholder = '-' }: { value: string; onChange: (v: string) => void | Promise<void>; placeholder?: string }) {
    const [val, setVal] = useState(value || '');
    const [isFocused, setIsFocused] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [savedJustNow, setSavedJustNow] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const prevValueRef = useRef(value);

    useEffect(() => { 
        if (value !== prevValueRef.current) {
            if (!isFocused) {
                setVal(value || '');
                prevValueRef.current = value;
            }
        }
    }, [value, isFocused]);

    const triggerChange = async (newVal: string) => {
        if (newVal !== (value || '')) {
            setIsSaving(true);
            try {
                await onChange(newVal);
                setSavedJustNow(true);
                setTimeout(() => setSavedJustNow(false), 2000);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setVal(newVal);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            triggerChange(newVal);
        }, 1500);
    };

    const handleBlur = () => {
        setIsFocused(false);
        if (timerRef.current) clearTimeout(timerRef.current);
        triggerChange(val);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <div className="relative flex items-center">
            <input 
                value={val} 
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={handleBlur}
                onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                placeholder={placeholder}
                className={`w-full bg-transparent border-b ${isFocused ? 'border-blue-300' : 'border-transparent'} hover:border-blue-300 focus:outline-none transition-colors p-0 m-0 pr-5`}
                style={{ color: 'inherit', fontWeight: 'inherit', fontSize: 'inherit' }}
            />
            {isSaving && (
                <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-0" />
            )}
            {!isSaving && savedJustNow && (
                <Check className="w-3.5 h-3.5 text-green-500 absolute right-0 transition-opacity duration-500 opacity-100" />
            )}
        </div>
    );
}

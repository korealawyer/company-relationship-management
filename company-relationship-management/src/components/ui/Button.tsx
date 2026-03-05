'use client';

import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'premium' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    loading?: boolean;
    children: React.ReactNode;
}

export function Button({
    variant = 'premium',
    size = 'md',
    loading = false,
    children,
    className,
    disabled,
    ...props
}: ButtonProps) {
    const sizeClasses = {
        sm: 'px-4 py-2 text-sm rounded-lg',
        md: 'px-5 py-2.5 text-sm rounded-lg',
        lg: 'px-7 py-3.5 text-base rounded-xl',
        xl: 'px-9 py-4 text-lg rounded-xl',
    };

    const variantStyles: Record<string, React.CSSProperties> = {
        premium: {
            background: 'linear-gradient(135deg, #e8c87a 0%, #c9a84c 60%, #a8872c 100%)',
            color: '#04091a',
            boxShadow: '0 4px 20px rgba(201,168,76,0.4)',
        },
        outline: {
            background: 'transparent',
            color: '#c9a84c',
            border: '1.5px solid rgba(201,168,76,0.5)',
        },
        ghost: {
            background: 'rgba(201,168,76,0.08)',
            color: 'rgba(201,168,76,0.9)',
        },
        danger: {
            background: 'rgba(239,68,68,0.15)',
            color: '#f87171',
            border: '1px solid rgba(239,68,68,0.3)',
        },
    };

    return (
        <button
            className={clsx(
                'inline-flex items-center justify-center font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none',
                sizeClasses[size],
                className,
            )}
            style={variantStyles[variant]}
            disabled={disabled || loading}
            onMouseEnter={(e) => {
                if (disabled || loading) return;
                if (variant === 'premium') {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(201,168,76,0.6)';
                } else if (variant === 'outline') {
                    e.currentTarget.style.background = 'rgba(201,168,76,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(201,168,76,0.8)';
                } else if (variant === 'ghost') {
                    e.currentTarget.style.background = 'rgba(201,168,76,0.16)';
                }
            }}
            onMouseLeave={(e) => {
                const s = variantStyles[variant];
                e.currentTarget.style.transform = '';
                Object.assign(e.currentTarget.style, {
                    background: s.background as string,
                    boxShadow: (s.boxShadow as string) ?? '',
                    borderColor: '',
                });
            }}
            {...props}
        >
            {loading ? (
                <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    처리 중...
                </span>
            ) : children}
        </button>
    );
}

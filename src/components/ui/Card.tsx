'use client';

import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    gold?: boolean;
    light?: boolean; // 라이트 테마용
    hover?: boolean;
    padding?: 'sm' | 'md' | 'lg';
    style?: React.CSSProperties;
}

export function Card({ children, className, gold = false, light = false, hover = true, padding = 'md', style, ...props }: CardProps) {
    const paddingClasses = { sm: 'p-4', md: 'p-6', lg: 'p-8' };

    const lightStyle = {
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    };

    const darkStyle = {
        background: gold ? 'rgba(201,168,76,0.07)' : 'rgba(13,27,62,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: gold ? '1px solid rgba(201,168,76,0.35)' : '1px solid rgba(201,168,76,0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
    };

    return (
        <div
            {...props}
            className={clsx(
                'rounded-2xl transition-all duration-300',
                paddingClasses[padding],
                hover && 'cursor-pointer',
                className,
            )}
            style={{ ...(light ? lightStyle : darkStyle), ...style }}
            onMouseEnter={hover ? (e) => {
                if (light) {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderColor = '#d1d5db';
                } else {
                    e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)';
                    e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.5), 0 0 20px rgba(201,168,76,0.08)';
                }
            } : undefined}
            onMouseLeave={hover ? (e) => {
                if (light) {
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                } else {
                    e.currentTarget.style.borderColor = gold ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.15)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35)';
                }
            } : undefined}
        >
            {children}
        </div>
    );
}

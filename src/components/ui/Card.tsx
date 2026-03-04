'use client';

import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    gold?: boolean;
    hover?: boolean;
    padding?: 'sm' | 'md' | 'lg';
    style?: React.CSSProperties;
}

export function Card({ children, className, gold = false, hover = true, padding = 'md', style }: CardProps) {
    const paddingClasses = { sm: 'p-4', md: 'p-6', lg: 'p-8' };

    return (
        <div
            className={clsx(
                'rounded-2xl transition-all duration-300',
                paddingClasses[padding],
                hover && 'cursor-pointer',
                className,
            )}
            style={{
                background: gold ? 'rgba(201,168,76,0.07)' : 'rgba(13,27,62,0.8)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: gold
                    ? '1px solid rgba(201,168,76,0.35)'
                    : '1px solid rgba(201,168,76,0.15)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                ...style,
            }}
            onMouseEnter={hover ? (e) => {
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)';
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.5), 0 0 20px rgba(201,168,76,0.08)';
            } : undefined}
            onMouseLeave={hover ? (e) => {
                e.currentTarget.style.borderColor = gold ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.15)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35)';
            } : undefined}
        >
            {children}
        </div>
    );
}

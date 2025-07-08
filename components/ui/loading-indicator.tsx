'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingIndicatorProps {
    className?: string
    size?: 'sm' | 'md' | 'lg'
    variant?: 'spinner' | 'dots' | 'pulse'
    isLoading?: boolean
}

export function LoadingIndicator({
    className,
    size = 'sm',
    variant = 'spinner',
    isLoading = true
}: LoadingIndicatorProps) {
    if (!isLoading) return null

    const sizeClasses = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5'
    }

    if (variant === 'spinner') {
        return (
            <Loader2
                className={cn(
                    'animate-spin text-muted-foreground',
                    sizeClasses[size],
                    className
                )}
                role="status"
                aria-label="Loading"
            />
        )
    }

    if (variant === 'dots') {
        return (
            <div
                className={cn('flex space-x-1', className)}
                role="status"
                aria-label="Loading"
            >
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className={cn(
                            'rounded-full bg-current animate-pulse',
                            size === 'sm' ? 'h-1 w-1' : size === 'md' ? 'h-1.5 w-1.5' : 'h-2 w-2'
                        )}
                        style={{
                            animationDelay: `${i * 0.15}s`,
                            animationDuration: '1s'
                        }}
                    />
                ))}
            </div>
        )
    }

    if (variant === 'pulse') {
        return (
            <div
                className={cn(
                    'rounded bg-current animate-pulse opacity-50',
                    sizeClasses[size],
                    className
                )}
                role="status"
                aria-label="Loading"
            />
        )
    }

    return null
}

// Convenience wrapper for links
export function LinkWithLoading({
    children,
    className,
    indicatorProps,
    ...props
}: {
    children: React.ReactNode
    className?: string
    indicatorProps?: LoadingIndicatorProps
} & React.ComponentProps<'div'>) {
    return (
        <div className={cn('flex items-center gap-1', className)} {...props}>
            {children}
            <LoadingIndicator {...indicatorProps} />
        </div>
    )
} 
'use client'

import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeTogglePro() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Completely hidden until mounted - no skeleton, no placeholder
    if (!mounted) {
        return <div className="w-9 h-9" /> // Invisible spacer to maintain layout
    }

    const toggleTheme = () => {
        // Save to cookie immediately for server-side consistency
        const newTheme = theme === 'light' ? 'dark' : 'light'
        document.cookie = `theme=${newTheme}; expires=${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()}; path=/; SameSite=Lax`
        setTheme(newTheme)
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative h-9 w-9 rounded-md border-0 bg-transparent"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
            {/* CSS-only icon switching - no JavaScript transitions */}
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-none dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-none dark:rotate-0 dark:scale-100" />
        </Button>
    )
}

// Alternative: Completely CSS-based toggle (zero JavaScript for animations)
export function ThemeToggleCSS() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    if (!mounted) return null // Completely hidden

    return (
        <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="theme-toggle"
            aria-label="Toggle theme"
        >
            <style jsx>{`
        .theme-toggle {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          border: none;
          background: transparent;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .theme-toggle:hover {
          background: rgba(0, 0, 0, 0.1);
        }
        
        :global(.dark) .theme-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .theme-toggle::before {
          content: '☀️';
          font-size: 16px;
          opacity: 1;
          transition: none;
        }
        
        :global(.dark) .theme-toggle::before {
          content: '🌙';
        }
      `}</style>
        </button>
    )
} 
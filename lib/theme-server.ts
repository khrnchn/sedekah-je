import { cookies } from 'next/headers'

export async function getServerTheme() {
    const cookieStore = await cookies()
    const theme = cookieStore.get('theme')?.value

    if (theme === 'dark' || theme === 'light') {
        return theme
    }

    // Default to light for SSR consistency
    return 'light'
}

export function setThemeCookie(theme: 'light' | 'dark') {
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1) // 1 year

    return `theme=${theme}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
} 
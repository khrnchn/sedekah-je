import Script from "next/script";

export function ThemeScript() {
	const themeScript = `
        (function() {
            function getThemePreference() {
                if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
                    return localStorage.getItem('theme')
                }
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            }
            
            const theme = getThemePreference()
            document.documentElement.classList.toggle('dark', theme === 'dark')
            document.documentElement.style.colorScheme = theme
        })()
    `;

	return (
		<Script
			id="theme-script"
			strategy="beforeInteractive"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: Required for theme initialization before hydration
			dangerouslySetInnerHTML={{
				__html: themeScript,
			}}
		/>
	);
}

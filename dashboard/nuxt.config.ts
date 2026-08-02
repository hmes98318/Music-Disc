import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    // Only enable devtools in development; never ship the inspector to production
    devtools: { enabled: process.env['NODE_ENV'] !== 'production' },

    // SPA mode — no server-side rendering; served as static files by Express
    ssr: false,

    css: ['~/assets/css/main.css'],

    vite: {
        plugins: [tailwindcss()],
    },

    modules: ['@pinia/nuxt', '@nuxt/icon', '@nuxtjs/i18n'],

    i18n: {
        locales: [
            { code: 'en-US', file: 'en-US.json', name: 'English' },
            { code: 'ko-KR', file: 'ko-KR.json', name: '한국어' },
            { code: 'ru-RU', file: 'ru-RU.json', name: 'Русский' },
            { code: 'sr-RS', file: 'sr-RS.json', name: 'Српски' },
            { code: 'tr-TR', file: 'tr-TR.json', name: 'Türkçe' },
            { code: 'zh-TW', file: 'zh-TW.json', name: '繁體中文' },
        ],
        lazy: true,
        langDir: 'locales',
        defaultLocale: 'en-US',
        strategy: 'no_prefix',
        detectBrowserLanguage: {
            useCookie: true,
            cookieKey: 'i18n_redirected',
            redirectOn: 'root',
        },
    },

    app: {
        head: {
            title: 'Music Disc Dashboard',
            meta: [{ charset: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
            link: [
                {
                    rel: 'icon',
                    type: 'image/x-icon',
                    href: '/favicon.ico',
                },
                // Google Fonts — Nunito (headline substitute) + Inter (body)
                { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
                { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
                {
                    rel: 'stylesheet',
                    href: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;700;800&family=Inter:wght@400;500&display=swap',
                },
            ],
        },
    },

    nitro: {
        // Output pre-rendered static files to dashboard/.output/public
        preset: 'static',
    },

    // Proxy API requests to the Express server during development.
    // Set NUXT_API_BASE to override the default (e.g. in Docker or CI).
    routeRules: {
        '/api/**': { proxy: `${process.env['NUXT_API_BASE'] ?? 'http://localhost:33333'}/api/**` },
    },
});

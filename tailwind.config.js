import plugin from 'tailwindcss/plugin'
import {
    DESKTOP_QUERY,
    LG_QUERY,
    MOBILE_QUERY,
    NAV_DESKTOP_QUERY,
    TABLET_PORTRAIT_QUERY,
} from './src/breakpoints.js'

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            // Overrides only `md` and `lg`; `sm`, `xl` and `2xl` keep their
            // defaults. `sm:` (640px) is intentionally left alone — it now sits
            // above the mobile layout's 480px ceiling, so it no longer matches a
            // phone at all: it applies to tablet portrait and desktop only.
            screens: {
                md: { raw: DESKTOP_QUERY },
                lg: { raw: LG_QUERY },
            },
            colors: {
                // Brand palette — mirrors the CSS custom properties in index.css.
                navy: '#1C1F2A',
                mist: '#E2EAF2',
                gold: '#ECD898',
                deep: '#13294B',
            },
            keyframes: {
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(42px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                'slide-up': 'slideUp 0.95s ease-out forwards',
            },
        },
    },
    plugins: [
        // `md` is a `raw` screen, so Tailwind has no min-width to invert and
        // generates no `max-md` variant — the `max-md:` utilities would be
        // dropped from the stylesheet without a word of warning. Register it
        // explicitly against the complement query.
        plugin(({ addVariant }) => {
            addVariant('max-md', `@media ${MOBILE_QUERY}`)
            // `tablet:` targets iPad portrait only. It exists because the mobile
            // type scale is authored for a 430px canvas while tablet lays out on
            // a 560px one, so mobile sizes render ~23% smaller in proportion
            // there (430/560). Use it to restore the intended proportions.
            addVariant('tablet', `@media ${TABLET_PORTRAIT_QUERY}`)
            // `navdesk:` is `md:` plus tablet portrait. Navbar-only — it is what
            // keeps the desktop pill on an iPad while the page below it stays
            // mobile. Do not reach for it elsewhere.
            addVariant('navdesk', `@media ${NAV_DESKTOP_QUERY}`)
        }),
    ],
}

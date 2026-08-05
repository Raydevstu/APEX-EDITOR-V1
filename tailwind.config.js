/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        surfaceRaised: 'var(--surface-raised)',
        surfaceHover: 'var(--surface-hover)',
        surfaceActive: 'var(--surface-active)',
        surfaceTinted: 'var(--surface-tinted)',
        hairline: 'var(--hairline)',
        border: 'var(--border)',
        borderStrong: 'var(--border-strong)',
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          faint: 'var(--text-faint)',
          onAccent: 'var(--text-on-accent)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          active: 'var(--accent-active)',
          soft: 'var(--accent-soft)',
          softHover: 'var(--accent-soft-hover)',
          softBorder: 'var(--accent-soft-border)',
          contrast: 'var(--accent-contrast)',
        },
        success: { DEFAULT: 'var(--success)', soft: 'var(--success-soft)' },
        warning: { DEFAULT: 'var(--warning)', soft: 'var(--warning-soft)' },
        danger: { DEFAULT: 'var(--danger)', soft: 'var(--danger-soft)' },
        cm: {
          bg: 'var(--cm-bg)',
          gutter: 'var(--cm-gutter)',
        },
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono Variable', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],      // 11px — metadata, captions
        xs: ['0.75rem', { lineHeight: '1.125rem' }],       // 12px — labels
        sm: ['0.8125rem', { lineHeight: '1.375rem' }],     // 13px — body UI
        base: ['0.875rem', { lineHeight: '1.5rem' }],      // 14px — default UI
        lg: ['1rem', { lineHeight: '1.5rem' }],            // 16px — section titles
        xl: ['1.125rem', { lineHeight: '1.625rem' }],      // 18px — panel titles
        '2xl': ['1.25rem', { lineHeight: '1.75rem' }],     // 20px — app title
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0.6', transform: 'translateX(100%)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in var(--dur-200) var(--ease-out) both',
        'scale-in': 'scale-in var(--dur-200) var(--ease-out) both',
        'slide-in-right': 'slide-in-right var(--dur-300) var(--ease-out) both',
        'slide-in-up': 'slide-in-up var(--dur-250) var(--ease-out) both',
      },
      zIndex: {
        drawer: '20',
        modal: '30',
        palette: '40',
        toast: '50',
      },
    },
  },
  plugins: [],
}

import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

export default {
  darkMode: 'class',
  content: [
    './app/**/*.{vue,js,ts,jsx,tsx}',
    './nuxt.config.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        line: 'var(--line)',
        accent: 'var(--accent)',
        'accent-ink': 'var(--accent-ink)',
        primary: 'var(--primary)',
        'primary-ink': 'var(--primary-ink)',
        secondary: 'var(--secondary)',
        'secondary-ink': 'var(--secondary-ink)',
        success: 'var(--success)',
        'success-ink': 'var(--success-ink)',
        warning: 'var(--warning)',
        'warning-ink': 'var(--warning-ink)',
        danger: 'var(--danger)',
        'danger-ink': 'var(--danger-ink)',
        ok: 'var(--ok)',
        warn: 'var(--warn)',
        bad: 'var(--bad)',
        mark: 'var(--mark)',
        'on-tone': 'var(--on-tone)',
        // Feature tokens
        feature: 'var(--feature)',
        'feature-soft': 'var(--feature-soft)',
        'feature-ink': 'var(--feature-ink)',
        // Named palette
        'c-green':  'var(--c-green)',
        'c-blue':   'var(--c-blue)',
        'c-yellow': 'var(--c-yellow)',
        'c-pink':   'var(--c-pink)',
        'c-orange': 'var(--c-orange)',
        'c-violet': 'var(--c-violet)',
        'c-coral':  'var(--c-coral)',
        'c-cyan':   'var(--c-cyan)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      borderWidth: {
        DEFAULT: 'var(--bw)',
        brut: 'var(--bw)',
        '3': '3px',
      },
      borderColor: {
        DEFAULT: 'var(--line)',
        line: 'var(--line)',
        ink: 'var(--ink)',
      },
      boxShadow: {
        DEFAULT: 'var(--shadow)',
        brut: 'var(--shadow)',
        'brut-sm': 'var(--shadow-sm)',
        'brut-lg': 'var(--shadow-lg)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        brut: 'var(--radius)',
        'brut-lg': 'var(--radius-lg)',
      },
    },
  },
  plugins: [
    plugin(function({ addUtilities, theme }) {
      const newUtilities = {
        '.border-2x': {
          borderWidth: `calc(${theme('borderWidth.DEFAULT')} * 2)`,
        },
        '.focus-ring': {
          outline: 'none',
          boxShadow: `0 0 0 2px ${theme('colors.accent')}, 0 0 0 4px ${theme('colors.accent-ink')}`,
        },
        '.text-acc-grad': {
          backgroundImage: `linear-gradient(to right, ${theme('colors.accent')}, ${theme('colors.accent-ink')})`,
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        '.bg-neo-grid': {
          backgroundImage: "url('/assets/bg/neo-brutal/grid-light.svg')",
          backgroundSize: 'cover',
        },
        '.bg-neo-grid-dark': {
          backgroundImage: "url('/assets/bg/neo-brutal/grid-dark.svg')",
          backgroundSize: 'cover',
        },
        '.bg-neo-diagonal': {
          backgroundImage: "url('/assets/bg/neo-brutal/diagonal-light.svg')",
          backgroundSize: 'cover',
        },
        '.bg-neo-diagonal-dark': {
          backgroundImage: "url('/assets/bg/neo-brutal/diagonal-dark.svg')",
          backgroundSize: 'cover',
        },
      };
      addUtilities(newUtilities, { variants: ['responsive', 'hover', 'focus'] });
    }),
  ],
} satisfies Config;

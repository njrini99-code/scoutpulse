import type { Config } from 'tailwindcss';

/**
 * ScoutPulse Design System
 * ========================
 * 
 * Brand Colors (pulse.*)
 * ----------------------
 * - pulse.green   : Primary brand accent (logo green) - buttons, links, active states
 * - pulse.mint    : Light accent - success states, highlights, hover backgrounds
 * - pulse.dark    : Deep green - gradients, overlays
 * - pulse.deeper  : Almost-black green - dark backgrounds, footers
 * - pulse.surface : Dark card/panel backgrounds
 * - pulse.border  : Subtle borders and dividers
 * 
 * Semantic Colors
 * ---------------
 * - background/foreground : Page-level bg and text
 * - card/card-foreground  : Card surfaces
 * - primary/secondary     : Action colors (primary = pulse.green)
 * - muted                 : Subdued UI elements
 * - accent                : Highlighting and focus states
 * 
 * Border Radius Scale
 * -------------------
 * - sm: 0.375rem (6px)   - Small elements (badges, tags)
 * - md: 0.5rem (8px)     - Buttons, inputs
 * - lg: 0.75rem (12px)   - Cards, panels
 * - xl: 1rem (16px)      - Large cards, modals
 * - 2xl: 1.25rem (20px)  - Hero sections
 * - 3xl: 1.5rem (24px)   - Feature cards
 * 
 * Box Shadows
 * -----------
 * - card       : Subtle elevation for cards
 * - card-hover : Elevated state on hover
 * - glow       : Brand-colored glow effect
 * - glow-lg    : Stronger glow for emphasis
 */

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─────────────────────────────────────────────────────────────────────
      // Typography
      // ─────────────────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },

      // ─────────────────────────────────────────────────────────────────────
      // Colors: ScoutPulse Brand Palette
      // ─────────────────────────────────────────────────────────────────────
      colors: {
        // Brand colors - use these directly: bg-pulse-green, text-pulse-mint, etc.
        pulse: {
          green: '#00C27A',           // Primary brand green (logo color)
          mint: '#B8F8D0',            // Light mint for accents/highlights
          dark: '#003B2A',            // Deep green for gradients
          deeper: '#001A12',          // Almost-black green
          surface: '#050816',         // Dark surface for cards
          border: 'rgba(255,255,255,0.08)', // Subtle border
        },

        // Semantic colors (CSS variable-driven for theme switching)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },

      // ─────────────────────────────────────────────────────────────────────
      // Border Radius Scale
      // ─────────────────────────────────────────────────────────────────────
      borderRadius: {
        sm: '0.375rem',    // 6px  - badges, tags
        md: '0.5rem',      // 8px  - buttons, inputs
        lg: '0.75rem',     // 12px - cards, panels (default)
        xl: '1rem',        // 16px - large cards, modals
        '2xl': '1.25rem',  // 20px - hero sections
        '3xl': '1.5rem',   // 24px - feature cards
      },

      // ─────────────────────────────────────────────────────────────────────
      // Box Shadows
      // ─────────────────────────────────────────────────────────────────────
      boxShadow: {
        // Card shadows - subtle, not harsh
        'card': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'card-dark': '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
        'card-dark-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
        
        // Brand glow effects
        'glow': '0 0 20px rgba(0, 194, 122, 0.25)',
        'glow-lg': '0 0 40px rgba(0, 194, 122, 0.35)',
        'glow-xl': '0 0 60px rgba(0, 194, 122, 0.4)',
        
        // Inner glow for inputs/focus
        'inner-glow': 'inset 0 0 12px rgba(0, 194, 122, 0.15)',
        
        // Elevated shadow for modals/popovers
        'elevated': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },

      // ─────────────────────────────────────────────────────────────────────
      // Background Images & Gradients
      // ─────────────────────────────────────────────────────────────────────
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        // Brand gradients
        'pulse-gradient': 'linear-gradient(135deg, #00C27A 0%, #003B2A 100%)',
        'pulse-gradient-soft': 'linear-gradient(135deg, rgba(0, 194, 122, 0.15) 0%, rgba(0, 59, 42, 0.15) 100%)',
        'pulse-radial': 'radial-gradient(ellipse at center, rgba(0, 194, 122, 0.15) 0%, transparent 70%)',
        'pulse-line': 'linear-gradient(90deg, transparent, rgba(0, 194, 122, 0.5), transparent)',
        // Surface gradients
        'surface-gradient': 'linear-gradient(180deg, #050816 0%, #0a0f1f 100%)',
      },

      // ─────────────────────────────────────────────────────────────────────
      // Animations & Keyframes
      // ─────────────────────────────────────────────────────────────────────
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 194, 122, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 194, 122, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'bounce-in': {
          '0%': { opacity: '0', transform: 'scale(0.3) translateY(20px)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        'neon-pulse': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.2)' },
        },
        'pulse-line-sweep': {
          '0%': { left: '-100%' },
          '50%, 100%': { left: '100%' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'gradient': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'blob': {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'bounce-in': 'bounce-in 0.6s ease-out',
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
        'gradient': 'gradient 8s linear infinite',
        'blob': 'blob 7s infinite',
      },

      // ─────────────────────────────────────────────────────────────────────
      // Transitions
      // ─────────────────────────────────────────────────────────────────────
      transitionTimingFunction: {
        'bounce-in-out': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;

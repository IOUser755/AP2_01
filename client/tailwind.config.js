import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f6f8fc',
          100: '#e8f0fe',
          200: '#d2e3fc',
          300: '#aecbfa',
          400: '#8ab4f8',
          500: '#5c97f6',
          600: '#1a73e8',
          700: '#1967d2',
          800: '#174ea6',
          900: '#0c3c8c',
        },
        primary: {
          50: '#f6f8fc',
          100: '#e8f0fe',
          200: '#d2e3fc',
          300: '#aecbfa',
          400: '#8ab4f8',
          500: '#5c97f6',
          600: '#1a73e8',
          700: '#1967d2',
          800: '#174ea6',
          900: '#0c3c8c',
        },
        neutral: {
          50: '#f8f9fb',
          100: '#eef1f6',
          200: '#dfe3eb',
          300: '#c9cfda',
          400: '#a0a8b5',
          500: '#737a87',
          600: '#545b68',
          700: '#3f4552',
          800: '#2c313d',
          900: '#1f232d',
        },
        accent: {
          yellow: '#fbbc04',
          green: '#34a853',
          red: '#ea4335',
          blue: '#4285f4',
        },
        success: {
          50: '#e6f4ea',
          100: '#c4e6cd',
          200: '#a3d9b1',
          300: '#7ecc91',
          400: '#4fbf6f',
          500: '#34a853',
          600: '#2d8c47',
          700: '#23703a',
          800: '#1a562d',
          900: '#133f21',
        },
        warning: {
          50: '#fef7e0',
          100: '#fde7aa',
          200: '#fbd47a',
          300: '#f9c14a',
          400: '#f7b019',
          500: '#f29900',
          600: '#d98200',
          700: '#b76b00',
          800: '#945400',
          900: '#744100',
        },
        error: {
          50: '#fdeaea',
          100: '#f8c7c5',
          200: '#f2a29f',
          300: '#eb7c78',
          400: '#e55a55',
          500: '#d93025',
          600: '#b9251c',
          700: '#991b14',
          800: '#78140f',
          900: '#5b0d0a',
        },
        surface: {
          50: '#ffffff',
          100: '#f5f7fb',
        },
      },
      fontFamily: {
        sans: ['"Open Sans"', '"Google Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Google Sans"', '"Open Sans"', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'brand-soft': '0 24px 48px -32px rgba(26, 115, 232, 0.45)',
        'brand-ring': '0 0 0 1px rgba(26, 115, 232, 0.18)',
      },
      borderRadius: {
        '2xl': '1.25rem',
      },
      spacing: {
        18: '4.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [forms, typography],
};

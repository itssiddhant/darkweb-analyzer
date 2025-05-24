// tailwind.config.js
module.exports = {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
      extend: {
        colors: {
          dark: {
            100: '#d1d5db',
            200: '#9ca3af',
            300: '#6b7280',
            400: '#4b5563',
            500: '#374151',
            600: '#1f2937',
            700: '#111827',
            800: '#0f172a',
            900: '#0b0f19',
          },
          accent: {
            blue: '#3b82f6',
            red: '#ef4444',
            green: '#10b981',
            yellow: '#f59e0b',
            purple: '#8b5cf6',
          },
        },
        fontFamily: {
          sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
          mono: ['Fira Code', 'monospace'],
        },
        boxShadow: {
          'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        }
      },
    },
    plugins: [require('@tailwindcss/forms')],
  }
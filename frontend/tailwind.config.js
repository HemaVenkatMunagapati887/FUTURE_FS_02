/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crm: {
          dark: '#0b0f19',     // Rich deep obsidian background
          card: '#151c2c',     // Dark slate-blue surface container
          cardHover: '#1e293b',// Hover card highlight
          border: '#242f44',   // Slate border borders
          primary: '#5f5af6',  // Sleek violet primary indicator
          primaryHover: '#4d46e5',
          success: '#10b981',  // Emerald for 'Converted' / active states
          warning: '#f59e0b',  // Amber for 'Interested' / 'Follow-up'
          info: '#3b82f6',     // Bright blue for 'Contacted' / info states
          danger: '#ef4444',   // Coral red for 'Rejected' states
          text: '#f1f5f9',     // Main readable white text
          textMuted: '#6b7c96',// Subtext grayish-blue
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 15px rgba(95, 90, 246, 0.4)',
      }
    },
  },
  plugins: [],
}

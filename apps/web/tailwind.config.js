/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        heading: ["var(--font-outfit)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        unify: {
          brand: "#5052C9",
          hover: "#4143A7",
          light: "#7779D8",
          tint: "#E5E4EE",
          canvas: "#EDEBE5",
          surface: "#F8F7F3",
          header: "#EFEEE9",
          input: "#FBFAF7",
          text: "#24283A",
          muted: "#464B5E",
          border: "#A8A69E",
          borderAlt: "#9E9C93",
          divider: "#BDBAB0",
          focus: "#5B5CE2",
          aiBorder: "#9EA1D2",
          aiFrom: "#EEF0FA",
          aiTo: "#E5E4EE",
          darkText: "#292D40",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        'unify-card': '20px',
        'unify-btn': '11px',
        'unify-btn-sec': '12px',
        'unify-input': '11px',
        'unify-ai': '16px',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'unify-card': '0 2px 12px rgba(35,39,55,0.06)',
        'unify-btn': '0 2px 10px rgba(80,82,201,0.22)',
        'unify-dropdown': '0 8px 24px rgba(35,39,55,0.12)',
      }
    },
  },
  plugins: [],
};

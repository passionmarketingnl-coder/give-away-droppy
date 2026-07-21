/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
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
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand palette Huisstijl 2.0
        droppi: {
          blue: "hsl(var(--droppi-blue))",
          pink: "hsl(var(--droppi-pink))",
          green: "hsl(var(--droppi-green))",
          navy: "hsl(var(--droppi-navy))",
          mist: "hsl(var(--droppi-mist))",
        },
        // Backwards-compat aliases zodat bestaande StatusBadge / PostCard / etc.
        // classes blijven werken zonder aanpassen.
        droppy: {
          blue: "hsl(var(--droppy-blue))",
          "blue-dark": "hsl(var(--droppy-blue-dark))",
          green: "hsl(var(--droppy-green))",
          light: "hsl(var(--droppy-light))",
          navy: "hsl(var(--droppy-navy))",
          gold: "hsl(var(--droppy-gold))",
          success: "hsl(var(--droppy-success))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      fontFamily: {
        // Body default (Poppins). Weights beschikbaar via expliciete family
        // (bijv. font-poppins-600) omdat RN fonts per weight geladen worden.
        sans: ["Poppins_400Regular", "system-ui", "sans-serif"],
        // Headings (Yanone Kaffeesatz).
        heading: ["YanoneKaffeesatz_700Bold", "system-ui", "sans-serif"],
        // Expliciete weights waar nodig:
        "poppins-400": ["Poppins_400Regular"],
        "poppins-500": ["Poppins_500Medium"],
        "poppins-600": ["Poppins_600SemiBold"],
        "poppins-700": ["Poppins_700Bold"],
        "yanone-500": ["YanoneKaffeesatz_500Medium"],
        "yanone-600": ["YanoneKaffeesatz_600SemiBold"],
        "yanone-700": ["YanoneKaffeesatz_700Bold"],
      },
    },
  },
  plugins: [],
};

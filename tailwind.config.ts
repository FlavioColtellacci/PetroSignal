import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",
        outline: "var(--outline)",
        "outline-variant": "var(--outline-variant)",
        surface: {
          dim: "var(--surface-dim)",
          bright: "var(--surface-bright)",
          lowest: "var(--surface-container-lowest)",
          low: "var(--surface-container-low)",
          DEFAULT: "var(--surface-container)",
          high: "var(--surface-container-high)",
          highest: "var(--surface-container-highest)",
        },
      },
      borderRadius: {
        none: "0px",
      },
      fontFamily: {
        sans: ["var(--font-work-sans)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
        heading: ["var(--font-work-sans)", "sans-serif"],
      },
      spacing: {
        grid: "var(--ui-grid-unit)",
        container: "var(--ui-container-padding)",
        gutter: "var(--ui-gutter)",
        compact: "var(--ui-stack-compact)",
        stack: "var(--ui-stack-default)",
      },
    },
  },
  plugins: [],
};
export default config;

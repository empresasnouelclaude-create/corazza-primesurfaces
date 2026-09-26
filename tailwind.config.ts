import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Paleta oficial de Corazza Prime Surfaces (manual de identidad
        // visual v1.0). Valores fijos, no personalizables.
        corazza: {
          charcoal: "#3A2B20",
          taupe: "#7E6A52",
          beige: "#B89C82",
          cream: "#DACFB6",
          white: "#F9F5ED",
        },
      },
      fontFamily: {
        // Cormorant Garamond para el logo/titulos con caracter, Montserrat
        // para todo lo funcional (navegacion, botones, texto de cuerpo) --
        // ver src/app/layout.tsx.
        "corazza-serif": ["var(--font-corazza-cormorant)", "Georgia", "serif"],
        "corazza-sans": ["var(--font-corazza-montserrat)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

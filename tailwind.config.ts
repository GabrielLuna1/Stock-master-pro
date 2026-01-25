import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}", // Garanta que o caminho src/app esteja aqui
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#D32F2F',    // Vermelho institucional
          darkRed: '#9A1B1B', // Para hover
          white: '#FFFFFF',
          gray: '#F8F9FA'     // Fundo das seções
        }
      }
    },
  },
  plugins: [],
};
export default config;
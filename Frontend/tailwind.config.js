/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        fernweh: {
          white: "#ffffff",
          forest: "#1e3f20",
          deep: "#132914",
          leaf: "#2f5d31",
          ochre: "#dda15e",
          gold: "#dda15e",
          charcoal: "#252525",
          sand: "#f7f4ef",
          paper: "#ffffff"
        }
      },
      boxShadow: {
        safari: "0 22px 60px rgba(37, 37, 37, 0.12)"
      }
    }
  },
  plugins: []
};

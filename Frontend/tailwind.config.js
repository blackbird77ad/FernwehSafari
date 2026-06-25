/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        travellex: {
          white: "#ffffff",
          forest: "#0b1320",
          deep: "#070d16",
          leaf: "#047857",
          lagoon: "#0e7490",
          copper: "#b87333",
          gold: "#c8a24a",
          charcoal: "#15171a",
          sand: "#f5f7f8",
          paper: "#ffffff"
        }
      },
      boxShadow: {
        safari: "0 22px 60px rgba(11, 19, 32, 0.12)"
      }
    }
  },
  plugins: []
};

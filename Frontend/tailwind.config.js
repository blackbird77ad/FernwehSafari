/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        fernweh: {
          forest: "#184d3c",
          deep: "#0e3228",
          leaf: "#4f8a4c",
          lagoon: "#0f8c88",
          clay: "#b85f39",
          gold: "#e2b34e",
          sand: "#f2dfb6",
          paper: "#fbfaf6"
        }
      },
      boxShadow: {
        safari: "0 22px 60px rgba(20, 37, 31, 0.14)"
      }
    }
  },
  plugins: []
};

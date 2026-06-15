/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",         // <-- Quitamos el /src
    "./components/**/*.{js,ts,jsx,tsx,mdx}",  // <-- Quitamos el /src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
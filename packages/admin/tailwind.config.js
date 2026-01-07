/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        body: ['Body', 'system-ui', '-apple-system', 'sans-serif'],
        label: ['Label', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

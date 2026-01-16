/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}'
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        display: ['Rubik-Regular'],
        'display-medium': ['Rubik-Medium'],
        'display-semibold': ['Rubik-SemiBold'],
        'display-bold': ['Rubik-Bold']
      }
    }
  },
  plugins: []
}

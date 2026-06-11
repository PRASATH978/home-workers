/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        bg:      '#000000',
        card:    '#121212',
        glass:   'rgba(255,255,255,0.05)',
        input:   '#1a1a1a',
        border:  '#262626',

        // Instagram brand
        insta: {
          purple: '#833ab4',
          pink:   '#c13584',
          red:    '#fd1d1d',
          orange: '#fcb045',
          blue:   '#405de6',
        },

        // Text
        white:   '#ffffff',
        gray1:   '#efefef',
        gray2:   '#a8a8a8',
        gray3:   '#737373',
        gray4:   '#363636',

        // Status
        success: '#00ba7c',
        error:   '#ed4956',
        warn:    '#ffad08',
        info:    '#0095f6',
      },
    },
  },
  plugins: [],
}

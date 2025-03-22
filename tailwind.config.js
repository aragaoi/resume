/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          primary: 'rgb(101, 195, 200)', // Cupcake primary
          'primary-content': 'rgb(255, 255, 255)',
          secondary: 'rgb(239, 159, 188)', // Cupcake secondary
          'secondary-content': 'rgb(255, 255, 255)',
          accent: 'rgb(171, 233, 193)', // Cupcake accent
          'accent-content': 'rgb(31, 41, 55)',
          neutral: 'rgb(227, 213, 202)', // Cupcake neutral
          'neutral-content': 'rgb(41, 19, 52)',
          'base-100': 'rgb(255, 255, 255)', // Cupcake base-100
          'base-200': 'rgb(250, 247, 245)', // Cupcake base-200
          'base-300': 'rgb(243, 240, 238)', // Cupcake base-300
          'base-content': 'rgb(41, 19, 52)', // Cupcake base-content
        },
        dark: {
          primary: 'rgb(121, 62, 249)', // Dark theme primary
          'primary-content': 'rgb(255, 255, 255)',
          secondary: 'rgb(240, 0, 184)', // Dark theme secondary
          'secondary-content': 'rgb(255, 255, 255)',
          accent: 'rgb(55, 205, 190)', // Dark theme accent
          'accent-content': 'rgb(255, 255, 255)',
          neutral: 'rgb(42, 46, 55)', // Dark theme neutral
          'neutral-content': 'rgb(255, 255, 255)',
          'base-100': 'rgb(42, 46, 55)', // Dark theme base-100
          'base-200': 'rgb(22, 24, 29)', // Dark theme base-200
          'base-300': 'rgb(15, 17, 21)', // Dark theme base-300
          'base-content': 'rgb(255, 255, 255)', // Dark theme base-content
        },
        print: {
          primary: 'rgb(67, 56, 202)', // Deep indigo
          'primary-content': 'rgb(255, 255, 255)',
          secondary: 'rgb(190, 24, 93)', // Deep pink
          'secondary-content': 'rgb(255, 255, 255)',
          accent: 'rgb(4, 120, 87)', // Deep green
          'accent-content': 'rgb(255, 255, 255)',
          neutral: 'rgb(229, 231, 235)', // Light gray
          'neutral-content': 'rgb(17, 24, 39)',
          'base-100': 'rgb(255, 255, 255)', // White
          'base-200': 'rgb(249, 250, 251)', // Very light gray
          'base-300': 'rgb(243, 244, 246)', // Light gray
          'base-content': 'rgb(17, 24, 39)', // Very dark gray
          info: 'rgb(29, 78, 216)', // Deep blue
          'info-content': 'rgb(255, 255, 255)',
          success: 'rgb(21, 128, 61)', // Deep green
          'success-content': 'rgb(255, 255, 255)',
          warning: 'rgb(161, 98, 7)', // Deep amber
          'warning-content': 'rgb(255, 255, 255)',
          error: 'rgb(185, 28, 28)', // Deep red
          'error-content': 'rgb(255, 255, 255)',
        },
      },
    ],
  },
};

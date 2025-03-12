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
          primary: '#65c3c8', // Cupcake primary
          'primary-content': '#ffffff',
          secondary: '#ef9fbc', // Cupcake secondary
          'secondary-content': '#ffffff',
          accent: '#abe9c1', // Cupcake accent
          'accent-content': '#1f2937',
          neutral: '#e3d5ca', // Cupcake neutral
          'neutral-content': '#291334',
          'base-100': '#ffffff', // Cupcake base-100
          'base-200': '#faf7f5', // Cupcake base-200
          'base-300': '#f3f0ee', // Cupcake base-300
          'base-content': '#291334', // Cupcake base-content
        },
        dark: {
          primary: '#793ef9', // Dark theme primary
          'primary-content': '#ffffff',
          secondary: '#f000b8', // Dark theme secondary
          'secondary-content': '#ffffff',
          accent: '#37cdbe', // Dark theme accent
          'accent-content': '#ffffff',
          neutral: '#2a2e37', // Dark theme neutral
          'neutral-content': '#ffffff',
          'base-100': '#2a2e37', // Dark theme base-100
          'base-200': '#16181d', // Dark theme base-200
          'base-300': '#0f1115', // Dark theme base-300
          'base-content': '#ffffff', // Dark theme base-content
        },
      },
    ],
  },
};
